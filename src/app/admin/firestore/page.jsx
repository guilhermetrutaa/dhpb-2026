'use client'

import React, { useState, useEffect } from 'react'
import { Poppins } from 'next/font/google'
import { useRouter } from 'next/navigation'
import { collection, doc, getDoc, getDocs, query, where, deleteDoc, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

function extrairEquipeId(raw) {
  const t = String(raw || '').trim()
  if (!t) return { id: '', extraidoDeUrl: false }

  const qsMatch = t.match(/[?&]equipeId=([^&#]+)/i)
  if (qsMatch) {
    try {
      return { id: decodeURIComponent(qsMatch[1]).trim(), extraidoDeUrl: true }
    } catch {
      return { id: qsMatch[1].trim(), extraidoDeUrl: true }
    }
  }

  return { id: t, extraidoDeUrl: false }
}

function idFirestoreValido(id) {
  if (!id || id.includes('/') || id.includes('..')) return false
  return true
}

function normalizarEspacos(raw) {
  return String(raw || '').trim().replace(/\s+/g, ' ')
}

function parseNomeCompleto(raw) {
  const partes = normalizarEspacos(raw).split(/\s+/).filter(Boolean)
  if (partes.length < 2) return null
  return { nome: partes[0], sobrenome: partes.slice(1).join(' ') }
}

function normalizarNome(nome) {
  const mapa = { '4':'a','3':'e','1':'i','0':'o','5':'s','8':'b','7':'t','2':'z','6':'g','9':'q' }
  const acentos = { 'á':'a','à':'a','â':'a','ã':'a','ä':'a','é':'e','è':'e','ê':'e','ë':'e','í':'i','ì':'i','î':'i','ï':'i','ó':'o','ò':'o','ô':'o','õ':'o','ö':'o','ú':'u','ù':'u','û':'u','ü':'u','ç':'c','ñ':'n' }
  let s = String(nome || '').toLowerCase().trim()
  let r = ''
  for (const ch of s) {
    if (acentos[ch]) { r += acentos[ch]; continue }
    if (ch >= 'a' && ch <= 'z') { r += ch; continue }
    if (ch >= '0' && ch <= '9') { r += mapa[ch] || ''; continue }
  }
  return r
}

export default function FirestoreAdminPage() {
  const [autenticado, setAutenticado] = useState(false)
  const [verificando, setVerificando] = useState(true)
  const router = useRouter()

  const [aba, setAba] = useState('equipes') // 'equipes' ou 'usuarios'

  // Busca Equipes
  const [equipeQuery, setEquipeQuery] = useState('')
  const [equipeResultados, setEquipeResultados] = useState([])
  const [buscandoEquipes, setBuscandoEquipes] = useState(false)
  const [equipeMensagem, setEquipeMensagem] = useState('')

  // Busca Usuários
  const [usuarioQuery, setUsuarioQuery] = useState('')
  const [usuarioResultado, setUsuarioResultado] = useState(null)
  const [usuarioCandidatos, setUsuarioCandidatos] = useState([])
  const [membroIndexResultados, setMembroIndexResultados] = useState([])
  const [participacoesResultados, setParticipacoesResultados] = useState([])
  const [buscandoUsuario, setBuscandoUsuario] = useState(false)
  const [usuarioMensagem, setUsuarioMensagem] = useState('')

  useEffect(() => {
    const admin = localStorage.getItem('admin-authenticated')
    if (admin !== 'true') router.push('/admin')
    else { setAutenticado(true); setVerificando(false) }
  }, [router])

  const buscarEquipes = async (e) => {
    e.preventDefault()
    const termo = equipeQuery.trim()
    if (!termo) return
    setBuscandoEquipes(true)
    setEquipeResultados([])
    setEquipeMensagem('')

    try {
      const resultados = []
      const { id, extraidoDeUrl } = extrairEquipeId(termo)
      let mensagem = ''

      if (idFirestoreValido(id)) {
        try {
          const docSnap = await getDoc(doc(db, 'equipes', id))
          if (docSnap.exists()) {
            resultados.push({ id: docSnap.id, ...docSnap.data() })
          }
        } catch (err) {
          console.error('Falha no getDoc da equipe:', err)
        }
      } else if (extraidoDeUrl) {
        mensagem = 'ID inválido na URL (equipeId ausente ou contém caracteres não permitidos).'
      }

      if (resultados.length === 0 && !extraidoDeUrl) {
        const termoNorm = normalizarNome(termo)
        if (termoNorm) {
          const qNorm = query(
            collection(db, 'equipes'),
            where('nomeNormalized', '>=', termoNorm),
            where('nomeNormalized', '<=', termoNorm + '\uf8ff'),
            limit(15)
          )
          const snapNorm = await getDocs(qNorm)
          snapNorm.forEach((d) => {
            resultados.push({ id: d.id, ...d.data() })
          })
        }

        if (resultados.length === 0) {
          const q = query(collection(db, 'equipes'), where('nomeLower', '==', termo.toLowerCase()))
          const querySnapshot = await getDocs(q)
          querySnapshot.forEach((d) => {
            resultados.push({ id: d.id, ...d.data() })
          })
        }
      }

      setEquipeResultados(resultados)
      if (resultados.length === 0 && !mensagem) {
        mensagem = extraidoDeUrl
          ? `Nenhuma equipe encontrada para o ID extraído (${id}).`
          : 'Nenhuma equipe encontrada para esta busca.'
      }
      setEquipeMensagem(mensagem)
    } catch (err) {
      alert('Erro ao buscar equipes: ' + err.message)
    }
    setBuscandoEquipes(false)
  }

  const excluirEquipeProfundamente = async (equipe) => {
    if (!window.confirm(`ATENÇÃO: Você está prestes a excluir a equipe "${equipe.nome}".\n\nIsso irá:\n1. Deletar a equipe.\n2. Deletar os arquivos membro-index de todos os integrantes.\n3. Deletar as participações desses usuários.\n\nEsta ação é IRREVERSÍVEL. Tem certeza?`)) return
    
    try {
      const edicaoId = equipe.edicaoId
      let indexExcluidos = 0
      let participacoesExcluidas = 0

      // 1. Excluir dependências dos membros
      if (equipe.membros && Array.isArray(equipe.membros)) {
        for (const membro of equipe.membros) {
          // A. Deletar membro-index
          if (membro.email) {
            const emailBase = btoa(membro.email.trim().toLowerCase()).replace(/=+$/, '')
            const miKey = `${emailBase}_${edicaoId}`
            await deleteDoc(doc(db, 'membro-index', miKey)).catch(() => {})
            indexExcluidos++
          }
          // B. Deletar participacao
          if (membro.uid) {
            await deleteDoc(doc(db, 'users', membro.uid, 'participacoes', edicaoId)).catch(() => {})
            participacoesExcluidas++
          }
        }
      }

      // 2. Excluir a equipe em si
      await deleteDoc(doc(db, 'equipes', equipe.id))

      alert(`Equipe excluída com sucesso!\n\nForam apagados:\n- 1 Documento de Equipe\n- ${indexExcluidos} Documentos membro-index\n- ${participacoesExcluidas} Registros de participação`)
      
      // Limpar resultados
      setEquipeResultados(prev => prev.filter(eq => eq.id !== equipe.id))
      
    } catch (err) {
      alert("Erro ao excluir profundamente: " + err.message)
    }
  }

  const carregarDetalhesUsuario = async (user) => {
    setUsuarioResultado(user)
    setParticipacoesResultados([])
    setMembroIndexResultados([])

    const partSnap = await getDocs(collection(db, 'users', user.id, 'participacoes'))
    const partArr = []
    partSnap.forEach(d => partArr.push({ id: d.id, ...d.data() }))
    setParticipacoesResultados(partArr)

    const emailQuery = (user.email || '').trim().toLowerCase()
    if (!emailQuery) return

    const edicoesSnap = await getDocs(collection(db, 'edicoes'))
    const miEncontrados = []
    const emailBase = btoa(emailQuery).replace(/=+$/, '')

    for (const edDoc of edicoesSnap.docs) {
      const miKey = `${emailBase}_${edDoc.id}`
      const miSnap = await getDoc(doc(db, 'membro-index', miKey))
      if (miSnap.exists()) {
        miEncontrados.push({ id: miSnap.id, edicaoId: edDoc.id, ...miSnap.data() })
      }
    }
    setMembroIndexResultados(miEncontrados)
  }

  const buscarUsuario = async (e) => {
    e.preventDefault()
    const termo = normalizarEspacos(usuarioQuery)
    if (!termo) return

    setUsuarioMensagem('')
    setUsuarioResultado(null)
    setUsuarioCandidatos([])
    setMembroIndexResultados([])
    setParticipacoesResultados([])

    if (!termo.includes('@')) {
      const parsed = parseNomeCompleto(termo)
      if (!parsed) {
        setUsuarioMensagem('Digite o nome completo (nome e sobrenome, como no cadastro) ou um e-mail.')
        return
      }
    }

    setBuscandoUsuario(true)

    try {
      if (termo.includes('@')) {
        const emailQuery = termo.toLowerCase()
        const qUser = query(collection(db, 'users'), where('email', '==', emailQuery))
        const userSnap = await getDocs(qUser)

        if (!userSnap.empty) {
          const userDoc = userSnap.docs[0]
          await carregarDetalhesUsuario({ id: userDoc.id, ...userDoc.data() })
        } else {
          setUsuarioMensagem("Usuário não encontrado na coleção 'users'. Procurando apenas no membro-index...")
          const edicoesSnap = await getDocs(collection(db, 'edicoes'))
          const miEncontrados = []
          const emailBase = btoa(emailQuery).replace(/=+$/, '')
          for (const edDoc of edicoesSnap.docs) {
            const miKey = `${emailBase}_${edDoc.id}`
            const miSnap = await getDoc(doc(db, 'membro-index', miKey))
            if (miSnap.exists()) {
              miEncontrados.push({ id: miSnap.id, edicaoId: edDoc.id, ...miSnap.data() })
            }
          }
          setMembroIndexResultados(miEncontrados)
        }
      } else {
        const { nome, sobrenome } = parseNomeCompleto(termo)
        const qUser = query(
          collection(db, 'users'),
          where('nome', '==', nome),
          where('sobrenome', '==', sobrenome),
          limit(15)
        )
        const userSnap = await getDocs(qUser)
        const candidatos = userSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setUsuarioCandidatos(candidatos)

        if (candidatos.length === 0) {
          setUsuarioMensagem('Nenhuma pessoa encontrada com esse nome e sobrenome (igualdade exata, como no cadastro).')
        } else if (candidatos.length === 1) {
          await carregarDetalhesUsuario(candidatos[0])
        } else {
          setUsuarioMensagem(`${candidatos.length} pessoas com o mesmo nome. Selecione uma para ver os detalhes.`)
        }
      }
    } catch (err) {
      if (err.code === 'failed-precondition') {
        const link = (err.message && err.message.match(/https:\/\/\S+/)) ? err.message.match(/https:\/\/\S+/)[0] : null
        setUsuarioMensagem(link
          ? `Índice composto necessário no Firestore (users: nome + sobrenome). Abra o link do Firebase para criar: ${link}`
          : 'Índice composto necessário no Firestore (coleção users, campos nome ASC e sobrenome ASC). Crie no Console e tente de novo.')
      } else {
        alert('Erro ao buscar usuário: ' + err.message)
      }
    }
    setBuscandoUsuario(false)
  }

  const selecionarCandidato = async (user) => {
    setBuscandoUsuario(true)
    setUsuarioMensagem('')
    try {
      await carregarDetalhesUsuario(user)
    } catch (err) {
      alert('Erro ao carregar detalhes: ' + err.message)
    }
    setBuscandoUsuario(false)
  }

  const excluirMembroIndex = async (id) => {
    if (!window.confirm(`Deletar o registro de membro-index "${id}"? Isso fará com que o sistema não saiba que este e-mail já está em uma equipe (pode gerar duplicidade se ele for adicionado de novo).`)) return
    try {
      await deleteDoc(doc(db, 'membro-index', id))
      setMembroIndexResultados(prev => prev.filter(m => m.id !== id))
      alert('Excluído com sucesso.')
    } catch (err) {
      alert('Erro ao excluir: ' + err.message)
    }
  }

  const excluirParticipacao = async (edicaoId) => {
    if (!usuarioResultado) return
    if (!window.confirm(`Deletar a participação deste usuário na edição ${edicaoId}? Ele perderá o acesso à sala de equipe dessa edição.`)) return
    try {
      await deleteDoc(doc(db, 'users', usuarioResultado.id, 'participacoes', edicaoId))
      setParticipacoesResultados(prev => prev.filter(p => p.id !== edicaoId))
      alert('Participação excluída.')
    } catch (err) {
      alert('Erro ao excluir: ' + err.message)
    }
  }

  if (verificando) return <div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Verificando...</p></div>

  return (
    <div className={`${poppins.className} min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 text-[#000]`}>
      <header className='bg-white shadow-sm border-b border-neutral-200'>
        <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div>
              <h1 className='text-lg font-bold text-[#82181A]'>Ferramentas de Suporte (Firestore)</h1>
              <p className='text-xs text-neutral-400'>Acesso rápido e econômico ao banco de dados</p>
            </div>
          </div>
          <button onClick={() => router.push('/admin/dashboard')} className='border border-neutral-300 text-neutral-500 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition-all cursor-pointer'>
            Voltar ao Dashboard
          </button>
        </div>
      </header>

      <div className='max-w-5xl mx-auto px-6 py-8'>
        {/* Toggle Abas */}
        <div className='flex gap-2 mb-8 bg-white p-1 rounded-xl shadow-sm border border-neutral-200 inline-flex'>
          <button onClick={() => setAba('equipes')} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${aba === 'equipes' ? 'bg-[#82181A] text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100'}`}>Buscar Equipes</button>
          <button onClick={() => setAba('usuarios')} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${aba === 'usuarios' ? 'bg-[#82181A] text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100'}`}>Buscar Usuário</button>
        </div>

        {/* ABA: EQUIPES */}
        {aba === 'equipes' && (
          <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-6'>
            <form onSubmit={buscarEquipes} className='flex flex-col sm:flex-row gap-3'>
              <input type="text" placeholder="ID, URL de montagem-equipe ou parte do nome (sem acento)..." value={equipeQuery} onChange={(e) => setEquipeQuery(e.target.value)}
                className="flex-1 rounded-xl border border-neutral-300 px-5 py-3.5 text-sm outline-none focus:border-[#82181A] transition-all" />
              <button type="submit" disabled={buscandoEquipes} className='bg-[#82181A] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[#631214] transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap'>
                {buscandoEquipes ? 'Buscando...' : 'Buscar Equipe'}
              </button>
            </form>

            <div className='space-y-4'>
              {equipeResultados.length === 0 && !buscandoEquipes && equipeMensagem && (
                <p className='text-neutral-500 text-sm'>{equipeMensagem}</p>
              )}
              {equipeResultados.map(eq => (
                <div key={eq.id} className='border border-neutral-200 rounded-xl p-5 space-y-4 bg-neutral-50'>
                  <div className='flex justify-between items-start flex-wrap gap-4'>
                    <div>
                      <h3 className='font-bold text-lg text-neutral-800'>{eq.nome} <span className='text-xs font-normal text-neutral-500 bg-neutral-200 px-2 py-1 rounded-md ml-2'>{eq.id}</span></h3>
                      <p className='text-sm text-neutral-600 mt-1'>{eq.escola} — {eq.modalidade}</p>
                      <p className='text-xs text-neutral-500 mt-1'>Criada por: {eq.criadorNome} ({eq.criadorUid})</p>
                      <a
                        href={`/montagem-equipe?equipeId=${eq.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className='inline-block mt-2 text-sm font-semibold text-[#82181A] hover:underline'
                      >
                        Abrir montagem
                      </a>
                    </div>
                    <button onClick={() => excluirEquipeProfundamente(eq)} className='bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors cursor-pointer border border-red-200'>
                      Excluir Equipe Profundamente
                    </button>
                  </div>

                  <div className='pt-3 border-t border-neutral-200'>
                    <p className='text-sm font-semibold text-neutral-700 mb-2'>Membros Ativos ({eq.membros?.length || 0}):</p>
                    <div className='grid gap-2 grid-cols-1 sm:grid-cols-2'>
                      {(eq.membros || []).map((m, idx) => (
                        <div key={idx} className='bg-white border border-neutral-200 p-3 rounded-lg text-xs'>
                          <p className='font-semibold'>{m.nome}</p>
                          <p className='text-neutral-500'>{m.email}</p>
                          <p className='text-neutral-400 mt-1 capitalize'>Papel: {m.papel} | Status: {m.status}</p>
                          <p className='text-[10px] text-neutral-400 mt-1 break-all'>UID: {m.uid}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {eq.orientadorUids && eq.orientadorUids.length > 0 && (
                    <div className='pt-3 border-t border-neutral-200'>
                       <p className='text-xs font-semibold text-neutral-700'>Orientadores registrados (orientadorUids):</p>
                       <p className='text-[10px] text-neutral-500 break-all'>{eq.orientadorUids.join(', ')}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: USUARIOS */}
        {aba === 'usuarios' && (
          <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-6'>
            <form onSubmit={buscarUsuario} className='flex flex-col sm:flex-row gap-3'>
              <input type="text" placeholder="E-mail exato ou nome completo (como no cadastro)..." value={usuarioQuery} onChange={(e) => setUsuarioQuery(e.target.value)}
                className="flex-1 rounded-xl border border-neutral-300 px-5 py-3.5 text-sm outline-none focus:border-[#82181A] transition-all" />
              <button type="submit" disabled={buscandoUsuario} className='bg-[#82181A] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[#631214] transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap'>
                {buscandoUsuario ? 'Buscando...' : 'Buscar'}
              </button>
            </form>
            {usuarioMensagem && (
              <p className='text-sm text-neutral-600'>{usuarioMensagem}</p>
            )}

            {usuarioCandidatos.length > 1 && (
              <div className='space-y-2'>
                <p className='text-sm font-semibold text-neutral-700'>Resultados</p>
                {usuarioCandidatos.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selecionarCandidato(u)}
                    className={`w-full text-left bg-white border rounded-lg p-3 text-sm hover:border-[#82181A] transition-colors cursor-pointer ${usuarioResultado?.id === u.id ? 'border-[#82181A]' : 'border-neutral-200'}`}
                  >
                    <p className='font-semibold'>{u.nome} {u.sobrenome}</p>
                    <p className='text-neutral-500 text-xs'>{u.email} · {u.tipo}</p>
                  </button>
                ))}
              </div>
            )}

            <div className='grid gap-6 grid-cols-1 md:grid-cols-2'>
              {/* Painel do Usuario */}
              <div className='border border-neutral-200 rounded-xl p-5 bg-neutral-50 space-y-4'>
                <h3 className='font-bold text-neutral-800 border-b border-neutral-200 pb-2'>Dados do Usuário</h3>
                {usuarioResultado ? (
                  <div className='text-sm space-y-2 text-neutral-700'>
                    <p><strong>Nome:</strong> {usuarioResultado.nome} {usuarioResultado.sobrenome}</p>
                    <p><strong>Email:</strong> {usuarioResultado.email}</p>
                    <p><strong>UID:</strong> {usuarioResultado.id}</p>
                    <p><strong>Tipo:</strong> <span className='capitalize'>{usuarioResultado.tipo}</span></p>
                    <p><strong>Documento Status:</strong> {usuarioResultado.documentoStatus || 'N/A'}</p>
                    <p><strong>Telefone:</strong> {usuarioResultado.telefone || 'N/A'}</p>
                    <p><strong>Escola:</strong> {usuarioResultado.escola || 'N/A'}</p>
                  </div>
                ) : (
                  <p className='text-sm text-neutral-400'>Nenhum perfil selecionado.</p>
                )}
              </div>

              {/* Painel de Participacoes */}
              <div className='border border-neutral-200 rounded-xl p-5 bg-neutral-50 space-y-4'>
                <h3 className='font-bold text-neutral-800 border-b border-neutral-200 pb-2'>Participações (Equipes conectadas)</h3>
                {participacoesResultados.length === 0 ? (
                  <p className='text-sm text-neutral-400'>Nenhuma participação registrada.</p>
                ) : (
                  <div className='space-y-3'>
                    {participacoesResultados.map(p => (
                      <div key={p.id} className='bg-white p-3 rounded-lg border border-neutral-200 text-xs flex justify-between items-center'>
                        <div>
                          <p><strong>Edição:</strong> {p.id}</p>
                          <p><strong>Equipe ID:</strong> {p.equipeId}</p>
                          <p><strong>Papel:</strong> {p.papel}</p>
                          {p.equipeId && (
                            <a href={`/montagem-equipe?equipeId=${p.equipeId}`} target="_blank" rel="noopener noreferrer" className='text-[#82181A] font-semibold hover:underline'>
                              Abrir montagem
                            </a>
                          )}
                        </div>
                        <button onClick={() => excluirParticipacao(p.id)} className='text-red-600 hover:bg-red-50 p-2 rounded-md font-semibold cursor-pointer'>
                          Excluir
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Painel de Membro-Index */}
              <div className='border border-neutral-200 rounded-xl p-5 bg-neutral-50 space-y-4 md:col-span-2'>
                <h3 className='font-bold text-neutral-800 border-b border-neutral-200 pb-2'>Índices de Membro (membro-index)</h3>
                <p className='text-xs text-neutral-500'>Isso é o que impede o usuário de entrar em outra equipe na mesma edição.</p>
                {membroIndexResultados.length === 0 ? (
                  <p className='text-sm text-neutral-400'>Nenhum registro de membro-index encontrado.</p>
                ) : (
                  <div className='grid gap-3 grid-cols-1 sm:grid-cols-2'>
                    {membroIndexResultados.map(mi => (
                      <div key={mi.id} className='bg-white p-3 rounded-lg border border-neutral-200 text-xs flex justify-between items-center'>
                        <div className='break-all'>
                          <p><strong>Edição:</strong> {mi.edicaoId}</p>
                          <p><strong>Equipe ID:</strong> {mi.equipeId}</p>
                          <p><strong>ID do Registro:</strong> {mi.id}</p>
                        </div>
                        <button onClick={() => excluirMembroIndex(mi.id)} className='text-red-600 hover:bg-red-50 p-2 rounded-md font-semibold cursor-pointer ml-2'>
                          Excluir Index
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
