'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Poppins } from 'next/font/google'
import { useRouter } from 'next/navigation'
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, orderBy, query, where, getDocs, getDocsFromServer, getCountFromServer, limit, startAfter, documentId, writeBatch, setDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '@/lib/firebase'
import Image from 'next/image'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

function mapEquipeDoc(d, edMap) {
  const data = d.data()
  return { ...data, id: d.id, edicaoNome: edMap[data.edicaoId] || '—' }
}

function dedupeEquipes(list) {
  const seen = new Set()
  return list.filter((eq) => {
    if (seen.has(eq.id)) return false
    seen.add(eq.id)
    return true
  })
}

function TabEquipes() {
  const [equipes, setEquipes] = useState([])
  const [edicoes, setEdicoes] = useState([])
  const [totalServidor, setTotalServidor] = useState(null)
  const [totalParticular, setTotalParticular] = useState(null)
  const [totalMunicipal, setTotalMunicipal] = useState(null)
  const [totalEstadual, setTotalEstadual] = useState(null)
  const [totalFederal, setTotalFederal] = useState(null)
  const [totalPublicaGenerica, setTotalPublicaGenerica] = useState(null)
  const [totalCompletas, setTotalCompletas] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [mostrarFerramentas, setMostrarFerramentas] = useState(false)

  const [lastVisible, setLastVisible] = useState(null)
  const [temMais, setTemMais] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      const [edSnap, countSnap, particularSnap, municipalSnap, estadualSnap, federalSnap, publicaSnap, completasSnap] = await Promise.all([
        getDocsFromServer(collection(db, 'edicoes')),
        getCountFromServer(collection(db, 'equipes')),
        getCountFromServer(query(collection(db, 'equipes'), where('tipoEscola', '==', 'particular'))),
        getCountFromServer(query(collection(db, 'equipes'), where('tipoEscola', '==', 'municipal'))),
        getCountFromServer(query(collection(db, 'equipes'), where('tipoEscola', '==', 'estadual'))),
        getCountFromServer(query(collection(db, 'equipes'), where('tipoEscola', '==', 'federal'))),
        getCountFromServer(query(collection(db, 'equipes'), where('tipoEscola', '==', 'publica'))),
        getCountFromServer(query(collection(db, 'equipes'), where('isCompleta', '==', true))),
      ])
      const edMap = {}
      edSnap.docs.forEach((d) => { edMap[d.id] = d.data().nome || '—' })
      setEdicoes(edSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setTotalServidor(countSnap.data().count)
      setTotalParticular(particularSnap.data().count)
      setTotalMunicipal(municipalSnap.data().count)
      setTotalEstadual(estadualSnap.data().count)
      setTotalFederal(federalSnap.data().count)
      setTotalPublicaGenerica(publicaSnap.data().count)
      setTotalCompletas(completasSnap.data().count)

      const q = query(collection(db, 'equipes'), orderBy(documentId()), limit(50))
      const eSnap = await getDocsFromServer(q)
      setEquipes(eSnap.docs.map((d) => mapEquipeDoc(d, edMap)))
      setLastVisible(eSnap.docs[eSnap.docs.length - 1] || null)
      setTemMais(eSnap.docs.length === 50)
      setCarregando(false)
    }
    carregar()
  }, [])

  const carregarMais = async () => {
    if (!lastVisible) return
    const edMap = {}
    edicoes.forEach((ed) => { edMap[ed.id] = ed.nome })
    const q = query(collection(db, 'equipes'), orderBy(documentId()), startAfter(lastVisible), limit(50))
    const eSnap = await getDocsFromServer(q)
    setEquipes((prev) => dedupeEquipes([...prev, ...eSnap.docs.map((d) => mapEquipeDoc(d, edMap))]))
    setLastVisible(eSnap.docs[eSnap.docs.length - 1] || null)
    setTemMais(eSnap.docs.length === 50)
  }

  const handleReconsolidarMembroIndex = async () => {
    if (!window.confirm(
      'Esta operação vai ler TODAS as equipes (~600 leituras) e criar/corrigir os documentos membro-index faltando.\n\n' +
      'Execute UMA vez para corrigir usuários que ficaram sem acesso à equipe.\n\nConfirmar?'
    )) return
    setCarregando(true)
    let verificados = 0
    let criados = 0
    let pulados = 0
    try {
      const snap = await getDocsFromServer(collection(db, 'equipes'))
      // Monta a lista de membro-index que DEVERIAM existir
      const paraGravar = []
      for (const equipeDoc of snap.docs) {
        const equipe = equipeDoc.data()
        const edicaoId = equipe.edicaoId
        if (!edicaoId) continue
        const membrosAtivos = (equipe.membros || []).filter(
          (m) => m.status === 'ativo' && m.email && m.uid
        )
        for (const membro of membrosAtivos) {
          verificados++
          // Professores orientadores podem estar em múltiplas equipes — pular
          if (membro.papel === 'professor_orientador') { pulados++; continue }
          const emailNorm = membro.email.trim().toLowerCase()
          const miKey = btoa(emailNorm).replace(/=+$/, '') + '_' + edicaoId
          paraGravar.push({
            key: miKey,
            data: { equipeId: equipeDoc.id, papel: membro.papel || 'aluno', uid: membro.uid },
          })
          criados++
        }
      }
      // Grava em lotes de 450 (limite do Firestore é 500)
      const LOTE = 450
      for (let i = 0; i < paraGravar.length; i += LOTE) {
        const batch = writeBatch(db)
        paraGravar.slice(i, i + LOTE).forEach((item) => {
          batch.set(doc(db, 'membro-index', item.key), item.data, { merge: true })
        })
        await batch.commit()
      }
      alert(
        `✅ Reconsolidação concluída!\n\n` +
        `Membros verificados: ${verificados}\n` +
        `Membro-index criados/atualizados: ${criados}\n` +
        `Professores orientadores pulados: ${pulados} (podem estar em múltiplas equipes)`
      )
    } catch (err) {
      alert('Erro na reconsolidação: ' + err.message)
    }
    setCarregando(false)
  }

  const handleCorrigirDuplicadas = async () => {
    if (!window.confirm('Custo de ~2.000 leituras. Isto irá varrer todas as equipes e renomear as duplicadas. Tem certeza?')) return
    setCarregando(true)
    try {
      const snap = await getDocsFromServer(collection(db, 'equipes'))
      const map = {}
      snap.docs.forEach(d => {
        const data = d.data()
        const key = `${data.edicaoId}_${data.nomeLower}`
        if (!map[key]) map[key] = []
        map[key].push({ id: d.id, createdAt: new Date(data.createdAt || 0).getTime(), nome: data.nome })
      })

      let corrigidas = 0
      for (const key in map) {
        if (map[key].length > 1) {
          map[key].sort((a, b) => a.createdAt - b.createdAt) // Mais antigas primeiro
          for (let i = 1; i < map[key].length; i++) {
            const eq = map[key][i]
            const novoNome = `${eq.nome} ${i}`
            await updateDoc(doc(db, 'equipes', eq.id), {
              nome: novoNome,
              nomeLower: novoNome.toLowerCase()
            })
            corrigidas++
          }
        }
      }
      alert(`Feito! ${corrigidas} equipes duplicadas foram renomeadas. Atualize a página.`)
    } catch (err) {
      alert('Erro: ' + err.message)
    }
    window.location.reload()
  }

  const handleMigrarOrientadores = async (simular = true) => {
    if (!window.confirm(simular ? 'Custo de ~2.000 leituras. Isto irá varrer todas as equipes e simular a adição de orientadorUids. Tem certeza?' : 'Isto fará gravações reais no banco para todas as equipes que precisam do orientadorUids. Tem certeza absoluta?')) return
    setCarregando(true)
    try {
      const snap = await getDocsFromServer(collection(db, 'equipes'))
      let precisamUpdate = 0
      let total = snap.docs.length

      for (const d of snap.docs) {
        const data = d.data()
        const orientadoresEncontrados = (data.membros || [])
          .filter(m => m.papel === 'professor_orientador' && m.status === 'ativo')
          .map(m => m.uid)

        const orientadorUidsAtual = data.orientadorUids || []

        // Verifica se falta algum uid que está em membros[] mas não em orientadorUids[]
        const uidsFaltando = orientadoresEncontrados.filter(uid => !orientadorUidsAtual.includes(uid))

        if (uidsFaltando.length > 0) {
          precisamUpdate++
          if (!simular) {
            const novoArray = [...orientadorUidsAtual, ...uidsFaltando]
            await updateDoc(doc(db, 'equipes', d.id), { orientadorUids: novoArray })
          }
        }
      }

      if (simular) {
        alert(`SIMULAÇÃO CONCLUÍDA:\n\nTotal de equipes verificadas: ${total}\nEquipes precisando de atualização: ${precisamUpdate}\n\nNenhuma gravação foi feita. Se os números parecerem corretos, você pode fazer a migração real.`)
        // Adicionando um estado (temporário/escondido na interface) que habilita o botão real
        setMostraBotaoReal(true)
      } else {
        alert(`MIGRAÇÃO CONCLUÍDA!\n\n${precisamUpdate} equipes foram atualizadas com sucesso.`)
        setMostraBotaoReal(false)
      }
    } catch (err) {
      alert('Erro: ' + err.message)
    }
    setCarregando(false)
  }

  const [mostraBotaoReal, setMostraBotaoReal] = useState(false)

  const handleRecalcularCompletas = async () => {
    if (!window.confirm('Custo de ~650 leituras e gravações. O sistema fará a contagem exata e atualizará todas as equipes com a tag de completa. Tem certeza?')) return
    setCarregando(true)
    try {
      const snap = await getDocsFromServer(collection(db, 'equipes'))
      const paraAtualizar = []

      for (const d of snap.docs) {
        const data = d.data()
        const membrosAtivos = (data.membros || []).filter(m => m.status === 'ativo')
        const profs = membrosAtivos.filter(m => m.papel === 'professor_orientador').length
        const resps = membrosAtivos.filter(m => m.papel === 'responsavel').length
        const alunos = membrosAtivos.filter(m => m.papel === 'aluno').length

        const isCompleta = (profs === 1 && resps === 1 && alunos === 2)

        if (data.isCompleta !== isCompleta) {
          paraAtualizar.push({ id: d.id, isCompleta })
        }
      }

      const LOTE = 450
      for (let i = 0; i < paraAtualizar.length; i += LOTE) {
        const batch = writeBatch(db)
        paraAtualizar.slice(i, i + LOTE).forEach((item) => {
          batch.update(doc(db, 'equipes', item.id), { isCompleta: item.isCompleta })
        })
        await batch.commit()
      }
      alert(`Feito! ${paraAtualizar.length} equipes precisaram de atualização de status.`)
      window.location.reload()
    } catch (err) {
      alert('Erro: ' + err.message)
      setCarregando(false)
    }
  }

  const handleShareGlayds = () => {
    if (totalServidor === null) return
    const pub = totalServidor - (totalParticular || 0)
    const publica = totalPublicaGenerica || 0
    const msg = `*Relação de Equipes - DHPB*\n\n` +
      `Total Bruto: ${totalServidor}\n` +
      `Equipes Completas: ${totalCompletas || 0}\n\n` +
      `Públicas: ${pub}\n` +
      `Privadas: ${totalParticular || 0}\n\n` +
      `*Detalhes Escolas Públicas:*\n` +
      `Municipal: ${totalMunicipal || 0}\n` +
      `Estadual: ${totalEstadual || 0}\n` +
      `Federal: ${totalFederal || 0}\n`

    const url = `https://wa.me/558399600143?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  const handleShareEscolasList = async (tipo) => {
    try {
      setCarregando(true)
      const snap = await getDocs(query(collection(db, 'equipes'), where('tipoEscola', '==', tipo)))
      const escolasCount = {}
      snap.docs.forEach(d => {
        const escola = d.data().escola
        if (escola) {
          const nome = escola.trim()
          escolasCount[nome] = (escolasCount[nome] || 0) + 1
        }
      })

      const lista = Object.entries(escolasCount).sort((a, b) => a[0].localeCompare(b[0]))
      const tipoNome = tipo === 'municipal' ? 'Municipais' : tipo === 'estadual' ? 'Estaduais' : 'Federais'

      const msg = `*Relação de Escolas ${tipoNome} Cadastradas - DHPB*\n\n` +
        `Total: ${lista.length} escolas ${tipo.toLowerCase()}s\n\n` +
        lista.map(([e, count]) => `${e} - ${count} equipe(s)`).join('\n')

      const url = `https://wa.me/558399600143?text=${encodeURIComponent(msg)}`
      window.open(url, '_blank')
    } catch (err) {
      alert(`Erro ao buscar escolas ${tipo}: ` + err.message)
    } finally {
      setCarregando(false)
    }
  }

  if (carregando) return <p className='text-neutral-400 text-sm text-center py-10'>Carregando...</p>
  if (equipes.length === 0) return <p className='text-neutral-400 text-sm text-center py-10'>Nenhuma equipe cadastrada.</p>

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between gap-3 flex-wrap'>
        {totalServidor !== null && (
          <p className='text-xs text-neutral-500 flex justify-center items-center gap-2'>
            {equipes.length} exibida(s) · {totalServidor} no servidor
            {totalParticular !== null && (
              <span className='ml-1'>
                <span className='text-blue-600 font-medium'>{totalServidor - totalParticular} públicas</span>
                {' ('}
                <span className='text-neutral-500 font-medium' title='Pública geral, Municipal, Estadual, Federal'>
                  {totalMunicipal}M · {totalEstadual}E · {totalFederal}F
                </span>
                {') · '}
                <span className='text-purple-600 font-medium'>{totalParticular} privadas</span>
                {' · '}
                <span className='text-emerald-600 font-medium'>{totalCompletas} completas</span>
              </span>
            )}

            <button
              onClick={() => handleShareEscolasList('municipal')}
              className='flex items-center gap-1 text-xs bg-[#25D366] text-white px-3 py-1.5 rounded-md hover:bg-[#128C7E] transition-colors cursor-pointer font-bold shadow-sm'
              title='Enviar lista de escolas municipais no WhatsApp'
            >
              Lista de Municipais
            </button>
            <button
              onClick={() => handleShareEscolasList('estadual')}
              className='flex items-center gap-1 text-xs bg-[#25D366] text-white px-3 py-1.5 rounded-md hover:bg-[#128C7E] transition-colors cursor-pointer font-bold shadow-sm'
              title='Enviar lista de escolas estaduais no WhatsApp'
            >
              Lista de Estaduais
            </button>
            <button
              onClick={() => handleShareEscolasList('federal')}
              className='flex items-center gap-1 text-xs bg-[#25D366] text-white px-3 py-1.5 rounded-md hover:bg-[#128C7E] transition-colors cursor-pointer font-bold shadow-sm'
              title='Enviar lista de escolas federais no WhatsApp'
            >
              Lista de Federais
            </button>
            <button
              onClick={handleShareGlayds}
              className='flex items-center gap-1 text-xs bg-[#25D366] text-white px-3 py-1.5 rounded-md hover:bg-[#128C7E] transition-colors cursor-pointer font-bold shadow-sm'
              title='Enviar relatório para Glayds no WhatsApp'
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
              Compartilhar com Glayds
            </button>
          </p>
        )}
        <div className='flex items-center gap-2 ml-auto flex-wrap justify-end'>

          <button
            onClick={handleReconsolidarMembroIndex}

            className='text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-md hover:bg-emerald-200 transition-colors cursor-pointer font-bold border border-emerald-300'
            title='Cria membro-index faltando para usuários que perderam acesso à equipe. Execute uma vez.'
          >
            🔧 Reconsolidar membro-index
          </button>
          <button
            onClick={() => setMostrarFerramentas((v) => !v)}
            className='text-xs bg-neutral-100 text-neutral-500 px-3 py-1.5 rounded-md hover:bg-neutral-200 transition-colors cursor-pointer font-semibold border border-neutral-300'
          >
            {mostrarFerramentas ? '▲' : '▼'} Ferramentas de manutenção
          </button>
        </div>
        {mostrarFerramentas && (
          <div className='mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2'>
            <p className='font-bold'>⚠️ Atenção: estas operações varrrem TODAS as equipes e têm custo alto (~600+ leituras). Use somente quando necessário.</p>
            <div className='flex gap-2 flex-wrap'>
              <button onClick={() => handleMigrarOrientadores(true)} className='bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition-colors cursor-pointer font-bold'>
                Simular Migração (orientadorUids)
              </button>
              {mostraBotaoReal && (
                <button onClick={() => handleMigrarOrientadores(false)} className='bg-orange-100 text-orange-700 px-3 py-1 rounded-md hover:bg-orange-200 transition-colors cursor-pointer font-bold border border-orange-300'>
                  CONFIRMAR MIGRAÇÃO REAL
                </button>
              )}
              <button onClick={handleRecalcularCompletas} className='bg-emerald-100 text-emerald-700 px-3 py-1 rounded-md hover:bg-emerald-200 transition-colors cursor-pointer font-bold'>
                Recalcular Equipes Completas
              </button>
              <button onClick={handleCorrigirDuplicadas} className='bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200 transition-colors cursor-pointer font-bold'>
                Corrigir Equipes Duplicadas
              </button>
            </div>
          </div>
        )}
      </div>
      {equipes.map((eq) => (
        <div key={eq.id} className='bg-white rounded-xl border border-neutral-200 p-4'>
          <button onClick={() => setExpanded(expanded === eq.id ? null : eq.id)}
            className='w-full flex items-center justify-between cursor-pointer'>
            <div className='text-left'>
              <p className='font-semibold text-sm'>{eq.nome}</p>
              <p className='text-xs text-neutral-400'>{eq.edicaoNome} — {eq.escola || '—'}</p>
            </div>
            <svg className={`w-4 h-4 text-neutral-400 transition-transform ${expanded === eq.id ? 'rotate-180' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
            </svg>
          </button>
          {expanded === eq.id && (
            <div className='mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500 space-y-1'>
              <p><span className='font-medium text-neutral-700'>ID:</span> {eq.id}</p>
              <p><span className='font-medium text-neutral-700'>Criador:</span> {eq.criadorNome} ({eq.criadorEmail})</p>
              <p><span className='font-medium text-neutral-700'>Escola:</span> {eq.escola}</p>
              <p><span className='font-medium text-neutral-700'>Modalidade:</span> {eq.modalidade}</p>
              <p><span className='font-medium text-neutral-700'>Tipo:</span> {eq.tipoEscola}</p>
              <p><span className='font-medium text-neutral-700'>Membros:</span> {(eq.membros || []).length}</p>
              {eq.aprovadoAte && <p><span className='font-medium text-neutral-700'>Aprovado até:</span> {eq.aprovadoAte}</p>}
            </div>
          )}
        </div>
      ))}
      {temMais && (
        <button onClick={carregarMais} className='w-full py-3 mt-4 border border-neutral-300 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-50 cursor-pointer'>
          Carregar mais equipes
        </button>
      )}
    </div>
  )
}

function TabUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)

  const [lastVisible, setLastVisible] = useState(null)
  const [temMais, setTemMais] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      const q = query(collection(db, 'users'), limit(50))
      const snap = await getDocs(q)
      setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLastVisible(snap.docs[snap.docs.length - 1])
      setTemMais(snap.docs.length === 50)
      setCarregando(false)
    }
    carregar()
  }, [])

  const carregarMais = async () => {
    if (!lastVisible) return
    const q = query(collection(db, 'users'), startAfter(lastVisible), limit(50))
    const snap = await getDocs(q)
    setUsuarios((prev) => [...prev, ...snap.docs.map((d) => ({ id: d.id, ...d.data() }))])
    setLastVisible(snap.docs[snap.docs.length - 1])
    setTemMais(snap.docs.length === 50)
  }

  if (carregando) return <p className='text-neutral-400 text-sm text-center py-10'>Carregando...</p>

  return (
    <div className='overflow-x-auto text-[#000]'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='bg-neutral-50 text-neutral-500 uppercase text-xs'>
            <th className='text-left px-4 py-3 font-medium'>Nome</th>
            <th className='text-left px-4 py-3 font-medium'>Email</th>
            <th className='text-left px-4 py-3 font-medium'>Tipo</th>
            <th className='text-left px-4 py-3 font-medium'>Documento</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.length === 0 ? (
            <tr><td colSpan={4} className='text-center py-10 text-neutral-400'>Nenhum usuário.</td></tr>
          ) : (
            usuarios.map((u) => (
              <tr key={u.id} className='border-t border-neutral-100'>
                <td className='px-4 py-3 font-medium'>{u.nome} {u.sobrenome}</td>
                <td className='px-4 py-3 text-neutral-500'>{u.email}</td>
                <td className='px-4 py-3 capitalize'>{u.tipo || '—'}</td>
                <td className='px-4 py-3'>
                  {u.tipo === 'professor' ? (
                    u.documentoStatus === 'aprovado' ? <span className='text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold'>Aprovado</span>
                      : u.documentoStatus === 'recusado' ? <span className='text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold'>Recusado</span>
                        : u.documentoURL ? <span className='text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold'>Pendente</span>
                          : <span className='text-[10px] bg-neutral-100 text-neutral-400 px-2 py-0.5 rounded-full font-semibold'>Não enviado</span>
                  ) : <span className='text-neutral-400'>—</span>}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {temMais && (
        <button onClick={carregarMais} className='w-full py-3 mt-4 border border-neutral-300 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-50 cursor-pointer'>
          Carregar mais usuários
        </button>
      )}
    </div>
  )
}

function TabEscolas() {
  const [escolas, setEscolas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState('')

  const [lastVisible, setLastVisible] = useState(null)
  const [temMais, setTemMais] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      const q = query(collection(db, 'escolas'), orderBy('nome', 'asc'), limit(50))
      const snap = await getDocs(q)
      setEscolas(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLastVisible(snap.docs[snap.docs.length - 1])
      setTemMais(snap.docs.length === 50)
      setCarregando(false)
    }
    carregar()
  }, [])

  const carregarMais = async () => {
    if (!lastVisible) return
    const q = query(collection(db, 'escolas'), orderBy('nome', 'asc'), startAfter(lastVisible), limit(50))
    const snap = await getDocs(q)
    setEscolas((prev) => [...prev, ...snap.docs.map((d) => ({ id: d.id, ...d.data() }))])
    setLastVisible(snap.docs[snap.docs.length - 1])
    setTemMais(snap.docs.length === 50)
  }

  const filtradas = filtro ? escolas.filter((e) => e.nome?.toLowerCase().includes(filtro.toLowerCase())) : escolas

  if (carregando) return <p className='text-neutral-400 text-sm text-center py-10'>Carregando...</p>

  return (
    <div className='space-y-4 text-[#000]'>
      <input type="text" placeholder="Buscar escola..." value={filtro} onChange={(e) => setFiltro(e.target.value)}
        className='w-full md:w-96 rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]' />
      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='bg-neutral-50 text-neutral-500 uppercase text-xs'>
              <th className='text-left px-4 py-3 font-medium'>Nome</th>
              <th className='text-left px-4 py-3 font-medium'>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              <tr><td colSpan={2} className='text-center py-10 text-neutral-400'>Nenhuma escola encontrada.</td></tr>
            ) : (
              filtradas.map((e) => (
                <tr key={e.id} className='border-t border-neutral-100'>
                  <td className='px-4 py-3 font-medium'>{e.nome}</td>
                  <td className='px-4 py-3 capitalize'>{e.tipo || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {temMais && (
          <button onClick={carregarMais} className='w-full py-3 mt-4 border border-neutral-300 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-50 cursor-pointer'>
            Carregar mais escolas
          </button>
        )}
      </div>
    </div>
  )
}

const Page = () => {
  const [autenticado, setAutenticado] = useState(false)
  const [verificando, setVerificando] = useState(true)
  const [aba, setAba] = useState('edicoes')
  const [novoNome, setNovoNome] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [criando, setCriando] = useState(false)
  const [edicoes, setEdicoes] = useState([])
  const [edicaoAberta, setEdicaoAberta] = useState(null)
  const [fases, setFases] = useState({})
  const [faseForm, setFaseForm] = useState({ nome: '', dataInicio: '', dataFim: '', peso: '', notaMaxima: '' })
  const router = useRouter()

  useEffect(() => {
    const admin = localStorage.getItem('admin-authenticated')
    if (admin !== 'true') router.push('/admin')
    else { setAutenticado(true); setVerificando(false) }
  }, [router])

  const carregarEdicoes = useCallback(async () => {
    if (!autenticado) return
    const q = query(collection(db, 'edicoes'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    setEdicoes(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  }, [autenticado])

  useEffect(() => { carregarEdicoes() }, [carregarEdicoes])

  const carregarFases = async (edId) => {
    try {
      const snap = await getDocs(query(collection(db, 'edicoes', edId, 'fases'), orderBy('dataInicio', 'asc')))
      setFases((prev) => ({ ...prev, [edId]: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }))
    } catch { }
  }

  const abrirEdicao = (edId) => {
    if (edicaoAberta === edId) { setEdicaoAberta(null); return }
    setEdicaoAberta(edId)
    if (!fases[edId]) carregarFases(edId)
  }

  const criarEdicao = async (e) => {
    e.preventDefault(); setErro(''); setSucesso('')
    if (!novoNome.trim()) { setErro('Digite um nome.'); return }
    setCriando(true)
    try {
      await addDoc(collection(db, 'edicoes'), { nome: novoNome.trim(), createdAt: serverTimestamp() })
      setNovoNome(''); setSucesso('Edição criada!'); await carregarEdicoes()
      setTimeout(() => setSucesso(''), 3000)
    } catch { setErro('Erro ao criar.') }
    finally { setCriando(false) }
  }

  const deletarEdicao = async (edId, e) => {
    e.stopPropagation()
    if (!window.confirm('Tem certeza que deseja excluir esta edição? Todas as fases serão removidas. Esta ação não pode ser desfeita.')) return
    try {
      const fasesSnap = await getDocs(collection(db, 'edicoes', edId, 'fases'))
      await Promise.all(fasesSnap.docs.map((f) => deleteDoc(doc(db, 'edicoes', edId, 'fases', f.id))))
      await deleteDoc(doc(db, 'edicoes', edId))
      setFases((prev) => { const n = { ...prev }; delete n[edId]; return n })
      await carregarEdicoes()
    } catch {
      setErro('Erro ao excluir edição.')
    }
  }

  const criarFase = async (edId) => {
    setErro('')
    if (!faseForm.nome.trim() || !faseForm.dataInicio || !faseForm.dataFim) { setErro('Preencha todos os campos.'); return }
    try {
      await addDoc(collection(db, 'edicoes', edId, 'fases'), {
        nome: faseForm.nome.trim(), dataInicio: faseForm.dataInicio, dataFim: faseForm.dataFim,
        status: 'pendente', peso: parseFloat(faseForm.peso) || 0, notaMaxima: parseFloat(faseForm.notaMaxima) || 0,
        createdAt: serverTimestamp(),
      })
      setFaseForm({ nome: '', dataInicio: '', dataFim: '', peso: '', notaMaxima: '' })
      carregarFases(edId)
    } catch { setErro('Erro ao criar fase.') }
  }

  const atualizarStatus = async (edId, faseId, status) => {
    try { await updateDoc(doc(db, 'edicoes', edId, 'fases', faseId), { status }); carregarFases(edId) } catch { }
  }

  const deletarFase = async (edId, faseId) => {
    try { await deleteDoc(doc(db, 'edicoes', edId, 'fases', faseId)); carregarFases(edId) } catch { }
  }

  const salvarPdfUrl = async (edId, faseId, url) => {
    try { await updateDoc(doc(db, 'edicoes', edId, 'fases', faseId), { provaPdfUrl: url }); carregarFases(edId) } catch { }
  }

  const handleSair = async () => {
    try { await signOut(auth) } catch { }
    localStorage.removeItem('admin-authenticated')
    router.push('/admin')
  }

  const abas = [
    { id: 'edicoes', label: 'Edições', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { id: 'equipes', label: 'Equipes', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'usuarios', label: 'Usuários', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'escolas', label: 'Escolas', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  ]

  if (verificando) {
    return <div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Verificando...</p></div>
  }

  return (
    <div className={poppins.className}>
      <div className='min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 text-[#000]'>
        <header className='bg-white shadow-sm border-b border-neutral-200'>
          <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Image src="/logo.svg" width={44} height={44} alt="Logo" />
              <div>
                <h1 className='text-lg font-bold text-[#82181A]'>Painel Administrativo</h1>
                <p className='text-xs text-neutral-400'>Gerencie todo o sistema</p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <button onClick={() => router.push('/admin/documentos')} className='border border-[#82181A] text-[#82181A] px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#82181A] hover:text-white transition-all cursor-pointer'>Documentos</button>
              <button onClick={() => router.push('/admin/questionarios')} className='border border-[#82181A] text-[#82181A] px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#82181A] hover:text-white transition-all cursor-pointer'>Questionários</button>
              <button onClick={() => router.push('/admin/ranking')} className='border border-[#82181A] text-[#82181A] px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#82181A] hover:text-white transition-all cursor-pointer'>Ranking</button>
              <button onClick={() => router.push('/admin/medalhas')} className='border border-[#82181A] text-[#82181A] px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#82181A] hover:text-white transition-all cursor-pointer'>Medalhas</button>
              <button onClick={() => router.push('/admin/notificacoes')} className='border border-[#82181A] text-[#82181A] px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#82181A] hover:text-white transition-all cursor-pointer'>Notificações</button>
              <button onClick={() => router.push('/admin/suporte')} className='bg-[#82181A] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#631214] transition-all cursor-pointer'>Suporte</button>
              <button onClick={() => router.push('/admin/firestore')} className='border border-orange-500 text-orange-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-orange-500 hover:text-white transition-all cursor-pointer'>Firestore</button>
              <button onClick={handleSair} className='border border-neutral-300 text-neutral-500 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition-all cursor-pointer'>Sair</button>
            </div>
          </div>
        </header>

        <div className='max-w-6xl mx-auto px-6 pt-6'>
          <div className='flex gap-1 bg-white rounded-xl shadow-sm border border-neutral-200 p-1 overflow-x-auto'>
            {abas.map((a) => (
              <button key={a.id} onClick={() => setAba(a.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${aba === a.id ? 'bg-[#82181A] text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100'}`}>
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={a.icon} /></svg>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <main className='max-w-6xl mx-auto px-6 py-6'>
          <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6'>
            {aba === 'edicoes' && (
              <div className='space-y-6'>
                <div className='flex items-center gap-3 pb-4 border-b border-neutral-100'>
                  <h2 className='text-lg font-bold text-[#82181A]'>Gerenciar Edições</h2>
                  <span className='text-xs bg-[#82181A]/10 text-[#82181A] px-3 py-1 rounded-full font-medium'>{edicoes.length}</span>
                </div>

                <form onSubmit={criarEdicao} className='flex flex-col sm:flex-row gap-3'>
                  <input type="text" placeholder="Ex: 5° Desafio em História da Paraíba" value={novoNome} onChange={(e) => setNovoNome(e.target.value)}
                    className="flex-1 rounded-xl border border-neutral-300 px-5 py-3.5 text-sm outline-none focus:border-[#82181A] transition-all" />
                  <button type="submit" disabled={criando}
                    className='bg-[#82181A] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[#631214] transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap'>
                    {criando ? 'Criando...' : 'Criar Edição'}
                  </button>
                </form>
                {erro && <p className="text-red-600 text-sm">{erro}</p>}
                {sucesso && <p className="text-green-600 text-sm">{sucesso}</p>}

                <div className='space-y-3 pt-2'>
                  {edicoes.length === 0 ? (
                    <p className='text-neutral-400 text-sm text-center py-8'>Nenhuma edição ainda.</p>
                  ) : (
                    edicoes.map((ed) => (
                      <div key={ed.id} className='border border-neutral-200 rounded-xl overflow-hidden'>
                        <div onClick={() => abrirEdicao(ed.id)}
                          className='w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors cursor-pointer'>
                          <div className='flex items-center gap-3'>
                            <div className='w-9 h-9 rounded-xl bg-[#82181A]/10 flex items-center justify-center font-bold text-[#82181A]'>{ed.nome?.charAt(0) || '?'}</div>
                            <div className='text-left'>
                              <p className='font-semibold text-sm'>{ed.nome}</p>
                              <p className='text-[10px] text-neutral-400'>{fases[ed.id]?.length || 0} fase(s)</p>
                            </div>
                          </div>
                          <div className='flex items-center gap-2'>
                            <button onClick={(e) => deletarEdicao(ed.id, e)}
                              className='p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer' title='Excluir edição'>
                              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                              </svg>
                            </button>
                            <svg className={`w-4 h-4 text-neutral-400 transition-transform ${edicaoAberta === ed.id ? 'rotate-180' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                            </svg>
                          </div>
                        </div>

                        {edicaoAberta === ed.id && (
                          <div className='border-t border-neutral-100 bg-neutral-50/50 p-4 space-y-4'>
                            <div className='grid grid-cols-1 sm:grid-cols-6 gap-2'>
                              <input type="text" placeholder="Nome" value={faseForm.nome} onChange={(e) => setFaseForm({ ...faseForm, nome: e.target.value })}
                                className="rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]" />
                              <input type="date" value={faseForm.dataInicio} onChange={(e) => setFaseForm({ ...faseForm, dataInicio: e.target.value })}
                                className="rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]" />
                              <input type="date" value={faseForm.dataFim} onChange={(e) => setFaseForm({ ...faseForm, dataFim: e.target.value })}
                                className="rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]" />
                              <input type="number" placeholder="Peso" value={faseForm.peso} onChange={(e) => setFaseForm({ ...faseForm, peso: e.target.value })}
                                className="rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]" />
                              <input type="number" placeholder="Nota Máx" value={faseForm.notaMaxima} onChange={(e) => setFaseForm({ ...faseForm, notaMaxima: e.target.value })}
                                className="rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]" />
                              <button onClick={() => criarFase(ed.id)}
                                className='bg-[#82181A] text-white font-semibold rounded-xl hover:bg-[#631214] transition-all cursor-pointer'>+ Fase</button>
                            </div>

                            {(!fases[ed.id] || fases[ed.id].length === 0) ? (
                              <p className='text-xs text-neutral-400'>Nenhuma fase cadastrada.</p>
                            ) : (
                              <div className='space-y-2'>
                                {fases[ed.id].map((f, fIdx) => {
                                  const stNome = f.status === 'aberta' ? 'Aberta' : f.status === 'finalizada' ? 'Finalizada' : f.status === 'correcao' ? 'Correção' : 'Pendente'
                                  const stColor = f.status === 'aberta' ? 'bg-green-100 text-green-700' : f.status === 'correcao' ? 'bg-blue-100 text-blue-700' : f.status === 'finalizada' ? 'bg-neutral-200 text-neutral-600' : 'bg-amber-100 text-amber-700'
                                  const faseAnterior = fIdx > 0 ? fases[ed.id][fIdx - 1] : null
                                  const podeAbrir = !faseAnterior || faseAnterior.status === 'finalizada' || faseAnterior.status === 'correcao'
                                  return (
                                    <div key={f.id} className='bg-white rounded-xl border border-neutral-200 p-3 space-y-2'>
                                      <div className='flex items-center justify-between'>
                                        <div>
                                          <p className='font-semibold text-sm'>{f.nome}</p>
                                          <p className='text-[10px] text-neutral-400'>{f.dataInicio?.split('-').reverse().join('/')} — {f.dataFim?.split('-').reverse().join('/')} {f.peso > 0 ? `| Peso ${f.peso} | Máx ${f.notaMaxima}` : ''}</p>
                                        </div>
                                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${stColor}`}>{stNome}</span>
                                      </div>
                                      <div className='flex items-center gap-2 pt-1 border-t border-neutral-100 flex-wrap'>
                                        <button onClick={() => router.push(`/admin/questoes?faseId=${f.id}&edicaoId=${ed.id}`)}
                                          className='text-xs font-semibold text-blue-600 hover:underline cursor-pointer'>Questões</button>
                                        <span className='text-neutral-300'>|</span>
                                        {f.status === 'pendente' && (
                                          <button onClick={() => { if (!podeAbrir) { alert('Finalize a fase anterior primeiro.'); return }; atualizarStatus(ed.id, f.id, 'aberta') }}
                                            className={`text-xs font-semibold cursor-pointer ${podeAbrir ? 'text-green-600 hover:underline' : 'text-neutral-300 cursor-not-allowed'}`}>{podeAbrir ? 'Abrir' : 'Bloqueado'}</button>
                                        )}
                                        {f.status === 'aberta' && (
                                          <><button onClick={() => atualizarStatus(ed.id, f.id, 'pendente')}
                                            className='text-xs font-semibold text-red-600 hover:underline cursor-pointer'>Fechar</button>
                                            <span className='text-neutral-300'>|</span>
                                            <button onClick={() => atualizarStatus(ed.id, f.id, 'finalizada')}
                                              className='text-xs font-semibold text-neutral-600 hover:underline cursor-pointer'>Finalizar</button></>
                                        )}
                                        {f.status === 'finalizada' && (
                                          <button onClick={() => atualizarStatus(ed.id, f.id, 'correcao')}
                                            className='text-xs font-semibold text-blue-600 hover:underline cursor-pointer'>Abrir para Correção</button>
                                        )}
                                        {f.status === 'correcao' && (
                                          <button onClick={() => atualizarStatus(ed.id, f.id, 'finalizada')}
                                            className='text-xs font-semibold text-red-600 hover:underline cursor-pointer'>Fechar Correção</button>
                                        )}
                                        {f.status === 'pendente' && <><span className='text-neutral-300'>|</span>
                                          <button onClick={() => deletarFase(ed.id, f.id)}
                                            className='text-xs font-semibold text-red-600 hover:underline cursor-pointer'>Excluir</button></>}
                                      </div>
                                      <div className='flex items-center gap-2 pt-2 border-t border-neutral-100'>
                                        <input type="text" placeholder="URL da prova em PDF (Google Drive, etc)" defaultValue={f.provaPdfUrl || ''}
                                          id={`pdf-${f.id}`} className='flex-1 rounded-lg border border-neutral-300 p-2 text-xs outline-none focus:border-[#82181A]' />
                                        <button onClick={() => {
                                          const url = document.getElementById(`pdf-${f.id}`).value
                                          salvarPdfUrl(ed.id, f.id, url)
                                        }}
                                          className='text-xs font-semibold text-blue-600 hover:underline cursor-pointer'>Salvar</button>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {aba === 'equipes' && (
              <div>
                <div className='flex items-center gap-3 pb-4 border-b border-neutral-100'>
                  <h2 className='text-lg font-bold text-[#82181A]'>Equipes</h2>
                </div>
                <div className='pt-4'><TabEquipes /></div>
              </div>
            )}

            {aba === 'usuarios' && (
              <div>
                <div className='flex items-center gap-3 pb-4 border-b border-neutral-100'>
                  <h2 className='text-lg font-bold text-[#82181A]'>Usuários</h2>
                </div>
                <div className='pt-4'><TabUsuarios /></div>
              </div>
            )}

            {aba === 'escolas' && (
              <div>
                <div className='flex items-center gap-3 pb-4 border-b border-neutral-100'>
                  <h2 className='text-lg font-bold text-[#82181A]'>Escolas</h2>
                </div>
                <div className='pt-4'><TabEscolas /></div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Page
