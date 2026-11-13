'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { Poppins } from 'next/font/google'
import { useRouter } from 'next/navigation'
import { collection, query, where, getDocs, doc, orderBy, updateDoc, writeBatch, limit, deleteField } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { htmlTamanhos, indiceTamanhos } from '@/lib/tamanhosCamisa'
import { planejarConvocacao, VAGAS_FINAL } from '@/lib/convocacaoFinal'
import Image from 'next/image'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })
const EQUIPE_EXCLUIDA_RANKING_ID = 'LhT2fV3JvyQhZU8PrSFl'

function normalizarNomeEquipe(nome) {
  const mapa = { '4': 'a', '3': 'e', '1': 'i', '0': 'o', '5': 's', '8': 'b', '7': 't', '2': 'z', '6': 'g', '9': 'q' }
  const acentos = { 'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e', 'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i', 'ó': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u', 'ç': 'c', 'ñ': 'n' }
  let r = ''
  for (const ch of String(nome || '').toLowerCase().trim()) {
    if (acentos[ch]) r += acentos[ch]
    else if (ch >= 'a' && ch <= 'z') r += ch
    else if (ch >= '0' && ch <= '9') r += mapa[ch] || ''
  }
  return r
}

function arquivoPdf(file) {
  const nome = (file.name || '').toLowerCase()
  return file.type === 'application/pdf' || nome.endsWith('.pdf')
}

function arquivoWord(file) {
  const nome = (file.name || '').toLowerCase()
  return nome.endsWith('.doc') || nome.endsWith('.docx')
}

function FinalContent() {
  const router = useRouter()
  const [autenticado, setAutenticado] = useState(false)
  const [edicoes, setEdicoes] = useState([])
  const [edicaoId, setEdicaoId] = useState('')
  const [manualUrl, setManualUrl] = useState('')
  const [autorizacaoUrl, setAutorizacaoUrl] = useState('')
  const [publicado, setPublicado] = useState(false)
  const [enviando, setEnviando] = useState('')
  const [publicando, setPublicando] = useState(false)
  const [equipes, setEquipes] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [msg, setMsg] = useState('')
  const [plano, setPlano] = useState(null)
  const [preparando, setPreparando] = useState(false)
  const [gravando, setGravando] = useState(false)
  const [busca, setBusca] = useState('')
  const [achadas, setAchadas] = useState([])
  const [buscandoEq, setBuscandoEq] = useState(false)
  const [movendoId, setMovendoId] = useState('')

  useEffect(() => {
    const admin = localStorage.getItem('admin-authenticated')
    if (admin !== 'true') router.push('/admin')
    else { setAutenticado(true); carregarEdicoes() }
  }, [router])

  const carregarEdicoes = async () => {
    const snap = await getDocs(query(collection(db, 'edicoes'), orderBy('createdAt', 'desc')))
    setEdicoes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const carregarDados = async (edId) => {
    if (!edId) return
    setCarregando(true)
    setMsg('')
    try {
      const ed = edicoes.find(e => e.id === edId)
      setManualUrl(ed?.manualFinalistaUrl || '')
      setAutorizacaoUrl(ed?.autorizacaoViagemUrl || '')
      setPublicado(ed?.resultadoFinalPublicado === true)
      const eSnap = await getDocs(query(
        collection(db, 'equipes'),
        where('edicaoId', '==', edId),
        where('aprovadoAte', '==', 'fase_final')
      ))
      const equipesData = eSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      equipesData.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
      setEquipes(equipesData)
    } catch (e) {
      setMsg('Erro ao carregar finalistas: ' + e.message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { if (edicaoId) carregarDados(edicaoId) }, [edicaoId])

  const enviarArquivo = async (e, { field, pasta, aceita, erroTipo, okMsg, setUrl }) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !edicaoId || enviando) return
    if (!aceita(file)) { setMsg(erroTipo); return }
    setEnviando(field)
    setMsg('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)
      formData.append('folder', pasta)
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
        { method: 'POST', body: formData }
      )
      if (!res.ok) throw new Error('Falha no upload')
      const data = await res.json()
      await updateDoc(doc(db, 'edicoes', edicaoId), { [field]: data.secure_url })
      setUrl(data.secure_url)
      setEdicoes((prev) => prev.map((ed) => ed.id === edicaoId ? { ...ed, [field]: data.secure_url } : ed))
      setMsg(okMsg)
    } catch (err) {
      setMsg('Erro ao enviar o arquivo: ' + (err?.message || 'desconhecido'))
    } finally {
      setEnviando('')
    }
  }

  const handlePublicar = async (valor) => {
    if (!edicaoId || publicando) return
    setPublicando(true)
    setMsg('')
    try {
      await updateDoc(doc(db, 'edicoes', edicaoId), { resultadoFinalPublicado: valor })
      setPublicado(valor)
      setEdicoes((prev) => prev.map((ed) => ed.id === edicaoId ? { ...ed, resultadoFinalPublicado: valor } : ed))
      setMsg(valor ? 'Resultado publicado. As equipes passam a ver o encaminhamento.' : 'Resultado oculto. Nenhuma equipe vê o encaminhamento.')
    } catch (err) {
      setMsg('Erro ao atualizar a publicação: ' + (err?.message || 'desconhecido'))
    } finally {
      setPublicando(false)
    }
  }

  const confirmadas = equipes.filter(eq => eq.presencaFinalConfirmada).length
  const tamanhosConhecidos = indiceTamanhos(equipes)

  const prepararConvocacao = async () => {
    if (!edicaoId || preparando) return
    setPreparando(true)
    setPlano(null)
    setMsg('')
    try {
      const [fSnap, eSnap] = await Promise.all([
        getDocs(query(collection(db, 'edicoes', edicaoId, 'fases'), orderBy('dataInicio', 'asc'))),
        getDocs(query(collection(db, 'equipes'), where('edicaoId', '==', edicaoId))),
      ])
      const faseIds = fSnap.docs.map((d) => d.id)
      const lista = eSnap.docs.filter((d) => d.id !== EQUIPE_EXCLUIDA_RANKING_ID).map((d) => {
        const team = { id: d.id, ...d.data() }
        const pontuacao = {}
        for (const id of faseIds) pontuacao[id] = { ni: team.pontuacoes?.[id]?.ni || 0 }
        return { ...team, pontuacao, df: team.df || 0 }
      })
      setPlano(planejarConvocacao(lista, faseIds, VAGAS_FINAL))
    } catch (e) {
      setMsg('Erro ao preparar a lista: ' + e.message)
    } finally {
      setPreparando(false)
    }
  }

  const gravarConvocacao = async () => {
    if (!plano || gravando) return
    const segue = window.confirm(`Tirar ${plano.saem.length} equipe(s) da final e convocar ${plano.sobem.length} da fase 4. Isso muda aprovadoAte e não desfaz sozinho.`)
    if (!segue) return
    setGravando(true)
    setMsg('')
    try {
      const ops = [
        ...plano.saem.map((eq) => ({ id: eq.id, aprovadoAte: 'fase4' })),
        ...plano.sobem.map((eq) => ({ id: eq.id, aprovadoAte: 'fase_final', convocacaoExtra: true })),
      ]
      for (let i = 0; i < ops.length; i += 400) {
        const batch = writeBatch(db)
        ops.slice(i, i + 400).forEach((op) => batch.update(doc(db, 'equipes', op.id), op.convocacaoExtra ? { aprovadoAte: op.aprovadoAte, convocacaoExtra: true } : { aprovadoAte: op.aprovadoAte }))
        await batch.commit()
      }
      setMsg(`${plano.saem.length} saíram da final. ${plano.sobem.length} foram convocadas.`)
      setPlano(null)
      carregarDados(edicaoId)
    } catch (e) {
      setMsg('Erro ao gravar a convocação: ' + e.message)
    } finally {
      setGravando(false)
    }
  }

  const tirarDaFinal = async (eq) => {
    if (movendoId) return
    if (!window.confirm(`Tirar ${eq.nome} da final? A equipe deixa de aparecer como finalista.`)) return
    setMovendoId(eq.id)
    setMsg('')
    try {
      await updateDoc(doc(db, 'equipes', eq.id), { aprovadoAte: 'fase4' })
      setMsg(`${eq.nome} saiu da final.`)
      carregarDados(edicaoId)
    } catch (e) {
      setMsg('Erro ao tirar da final: ' + e.message)
    } finally {
      setMovendoId('')
    }
  }

  const buscarParaAdicionar = async (e) => {
    e.preventDefault()
    const termo = normalizarNomeEquipe(busca)
    if (!termo || !edicaoId) return
    setBuscandoEq(true)
    setMsg('')
    try {
      const snap = await getDocs(query(
        collection(db, 'equipes'),
        where('nomeNormalized', '>=', termo),
        where('nomeNormalized', '<=', termo + '\uf8ff'),
        limit(15)
      ))
      const lista = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((eq) => eq.edicaoId === edicaoId && eq.aprovadoAte !== 'fase_final' && eq.id !== EQUIPE_EXCLUIDA_RANKING_ID)
      setAchadas(lista)
      if (lista.length === 0) setMsg('Nenhuma equipe desta edição com esse nome fora da final.')
    } catch (err) {
      setMsg('Erro na busca: ' + err.message)
    } finally {
      setBuscandoEq(false)
    }
  }

  const colocarNaFinal = async (eq) => {
    if (movendoId) return
    if (!window.confirm(`Colocar ${eq.nome} na final? A confirmação de presença abre em 13/11 às 8:00. O formulário de camisa só aparece depois que a equipe confirmar.`)) return
    setMovendoId(eq.id)
    setMsg('')
    try {
      await updateDoc(doc(db, 'equipes', eq.id), {
        aprovadoAte: 'fase_final',
        convocacaoExtra: true,
        presencaFinalConfirmada: deleteField(),
        presencaFinalConfirmadaEm: deleteField(),
        presencaFinalConfirmadaPor: deleteField(),
      })
      setAchadas((prev) => prev.filter((item) => item.id !== eq.id))
      setMsg(`${eq.nome} entrou na final. O botão de presença abre em 13/11 às 8:00.`)
      carregarDados(edicaoId)
    } catch (err) {
      setMsg('Erro ao colocar na final: ' + err.message)
    } finally {
      setMovendoId('')
    }
  }

  const baixarTamanhos = () => {
    const blob = new Blob([htmlTamanhos(equipes)], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tamanhos-camisa-final.html'
    a.click()
    URL.revokeObjectURL(url)
    setMsg('Arquivo tamanhos-camisa-final.html baixado. Abra no navegador.')
  }

  if (!autenticado) return null

  return (
    <div className={poppins.className}>
      <div className='min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 text-[#000]'>
        <header className='bg-white shadow-sm border-b border-neutral-200'>
          <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Image src="/logo.svg" width={44} height={44} alt="Logo" />
              <h1 className='text-lg font-bold text-[#82181A]'>Final — Manual e Presenças</h1>
            </div>
            <button onClick={() => router.push('/admin/dashboard')} className='border border-neutral-300 text-neutral-500 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition-all cursor-pointer'>Voltar</button>
          </div>
        </header>

        <main className='max-w-7xl mx-auto px-6 py-8 space-y-6'>
          <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6'>
            <label className='text-sm font-semibold text-neutral-500 mb-2 block'>Selecione a Edição</label>
            <select value={edicaoId} onChange={(e) => setEdicaoId(e.target.value)} className='w-full md:w-96 rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]'>
              <option value="">— Selecione —</option>
              {edicoes.map((ed) => <option key={ed.id} value={ed.id}>{ed.nome}</option>)}
            </select>
          </div>

          {edicaoId && (
            <>
              <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-3'>
                <h2 className='text-sm font-bold text-[#82181A] uppercase tracking-wide'>Publicação do resultado</h2>
                <p className='text-sm text-neutral-600'>
                  {publicado ? 'As equipes estão vendo o encaminhamento da final.' : 'Oculto. Nenhuma equipe vê FINALISTA nem a mensagem de não classificação.'}
                </p>
                <button
                  type='button'
                  onClick={() => handlePublicar(!publicado)}
                  disabled={publicando}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all disabled:opacity-50 ${publicado ? 'border border-[#82181A] text-[#82181A] hover:bg-red-50' : 'bg-[#82181A] text-white hover:bg-[#631214]'}`}
                >
                  {publicando ? 'Salvando...' : publicado ? 'Ocultar resultado' : 'Publicar resultado da final'}
                </button>
              </div>

              <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-4'>
                <h2 className='text-sm font-bold text-[#82181A] uppercase tracking-wide'>Lista de espera — fechar {VAGAS_FINAL}</h2>
                <p className='text-sm text-neutral-600'>Quem não confirmou presença sai da final. Entram as próximas equipes da fase 4, pela ordem do ranking, até completar {VAGAS_FINAL}. Nada é gravado antes da confirmação.</p>
                <button type='button' onClick={prepararConvocacao} disabled={preparando || gravando} className='px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer bg-[#82181A] text-white hover:bg-[#631214] disabled:opacity-50'>
                  {preparando ? 'Preparando...' : 'Preparar lista'}
                </button>
                {plano && (
                  <div className='space-y-3 text-sm'>
                    <p>Confirmadas que ficam: <strong>{plano.ficam.length}</strong>. Faltam <strong>{plano.faltam}</strong>. A lista de espera tem <strong>{plano.sobem.length}</strong>.</p>
                    <div>
                      <p className='font-semibold text-red-700'>Saem ({plano.saem.length})</p>
                      <ul className='mt-1 max-h-40 overflow-y-auto text-neutral-600'>
                        {plano.saem.length === 0 ? <li>Nenhuma.</li> : plano.saem.map((eq) => <li key={eq.id}>{eq.nome} — {eq.escola}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className='font-semibold text-green-700'>Entram ({plano.sobem.length})</p>
                      <ul className='mt-1 max-h-40 overflow-y-auto text-neutral-600'>
                        {plano.sobem.length === 0 ? <li>Nenhuma.</li> : plano.sobem.map((eq) => <li key={eq.id}>{eq.nome} — {eq.escola}</li>)}
                      </ul>
                    </div>
                    <button type='button' onClick={gravarConvocacao} disabled={gravando || (plano.saem.length === 0 && plano.sobem.length === 0)} className='px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer border border-[#82181A] text-[#82181A] hover:bg-red-50 disabled:opacity-50'>
                      {gravando ? 'Gravando...' : 'Gravar convocação'}
                    </button>
                  </div>
                )}
              </div>

              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-4'>
                  <h2 className='text-sm font-bold text-[#82181A] uppercase tracking-wide'>Manual do finalista (PDF)</h2>
                  {manualUrl && (
                    <p className='text-sm text-neutral-600'>
                      Manual atual:{' '}
                      <a href={manualUrl} target="_blank" rel="noopener noreferrer" className='text-blue-600 font-semibold hover:underline'>abrir PDF</a>
                    </p>
                  )}
                  <label className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all ${enviando ? 'bg-neutral-200 text-neutral-400' : 'bg-[#82181A] text-white hover:bg-[#631214]'}`}>
                    {enviando === 'manualFinalistaUrl' ? 'Enviando...' : manualUrl ? 'Substituir manual' : 'Enviar manual'}
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={(e) => enviarArquivo(e, {
                        field: 'manualFinalistaUrl',
                        pasta: 'dhpb/manuais',
                        aceita: arquivoPdf,
                        erroTipo: 'Envie um arquivo PDF.',
                        okMsg: 'Manual do finalista atualizado com sucesso!',
                        setUrl: setManualUrl,
                      })}
                      disabled={!!enviando}
                      className='hidden'
                    />
                  </label>
                </div>

                <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-4'>
                  <h2 className='text-sm font-bold text-[#82181A] uppercase tracking-wide'>Autorização de viagem (Word)</h2>
                  <p className='text-sm text-neutral-600'>Aparece na sala só depois que a equipe confirma a presença.</p>
                  {autorizacaoUrl && (
                    <p className='text-sm text-neutral-600'>
                      Arquivo atual:{' '}
                      <a href={autorizacaoUrl} target="_blank" rel="noopener noreferrer" className='text-blue-600 font-semibold hover:underline'>abrir Word</a>
                    </p>
                  )}
                  <label className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all ${enviando ? 'bg-neutral-200 text-neutral-400' : 'bg-[#82181A] text-white hover:bg-[#631214]'}`}>
                    {enviando === 'autorizacaoViagemUrl' ? 'Enviando...' : autorizacaoUrl ? 'Substituir autorização' : 'Enviar autorização'}
                    <input
                      type="file"
                      accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => enviarArquivo(e, {
                        field: 'autorizacaoViagemUrl',
                        pasta: 'dhpb/final',
                        aceita: arquivoWord,
                        erroTipo: 'Envie um arquivo Word (.doc ou .docx).',
                        okMsg: 'Autorização de viagem atualizada com sucesso!',
                        setUrl: setAutorizacaoUrl,
                      })}
                      disabled={!!enviando}
                      className='hidden'
                    />
                  </label>
                </div>
              </div>

              <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-4'>
                <h2 className='text-sm font-bold text-[#82181A] uppercase tracking-wide'>Adicionar equipe à final</h2>
                <p className='text-sm text-neutral-600'>A confirmação de presença abre em 13/11 às 8:00. O formulário de camisa só aparece depois que a equipe confirmar.</p>
                <form onSubmit={buscarParaAdicionar} className='flex flex-col sm:flex-row gap-3'>
                  <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder='Nome da equipe' className='flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]' />
                  <button type='submit' disabled={buscandoEq} className='px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer bg-[#82181A] text-white hover:bg-[#631214] disabled:opacity-50'>{buscandoEq ? 'Buscando...' : 'Buscar'}</button>
                </form>
                {achadas.length > 0 && (
                  <ul className='divide-y divide-neutral-100 border border-neutral-200 rounded-xl'>
                    {achadas.map((eq) => (
                      <li key={eq.id} className='flex items-center justify-between gap-3 px-4 py-3'>
                        <div>
                          <p className='font-semibold'>{eq.nome}</p>
                          <p className='text-sm text-neutral-500'>{eq.escola}</p>
                        </div>
                        <button type='button' onClick={() => colocarNaFinal(eq)} disabled={!!movendoId} className='text-xs bg-[#82181A] text-white px-3 py-2 rounded-full font-semibold cursor-pointer hover:bg-[#631214] disabled:opacity-50'>Colocar na final</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden'>
                <div className='p-6 border-b border-neutral-100 flex items-center justify-between gap-3 flex-wrap'>
                  <h2 className='text-sm font-bold text-[#82181A] uppercase tracking-wide'>Finalistas ({equipes.length})</h2>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <span className='text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold'>{confirmadas} com presença confirmada</span>
                    <button type='button' onClick={baixarTamanhos} className='text-xs bg-[#82181A] text-white px-3 py-1 rounded-full font-semibold cursor-pointer hover:bg-[#631214]'>Baixar tamanhos</button>
                  </div>
                </div>
                {msg && <p className='px-6 py-3 text-sm font-medium text-neutral-700'>{msg}</p>}
                {carregando ? (
                  <p className='text-center text-neutral-400 py-10'>Carregando...</p>
                ) : equipes.length === 0 ? (
                  <p className='text-center text-neutral-400 py-10'>Nenhuma equipe finalista nesta edição.</p>
                ) : (
                  <div className='divide-y divide-neutral-100'>
                    {equipes.map((eq) => (
                      <div key={eq.id} className='p-6'>
                        <div className='flex items-start justify-between gap-4'>
                          <div>
                            <p className='font-bold text-base'>{eq.nome}</p>
                            <p className='text-sm text-neutral-500'>{eq.escola}</p>
                          </div>
                          <div className='flex flex-wrap justify-end gap-2'>
                            {eq.presencaFinalConfirmada ? (
                              <span className='text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold whitespace-nowrap'>Presença confirmada</span>
                            ) : (
                              <span className='text-xs bg-neutral-100 text-neutral-400 px-3 py-1 rounded-full font-semibold whitespace-nowrap'>Pendente</span>
                            )}
                            {eq.convocacaoExtra && !eq.presencaFinalConfirmada && (
                              <span className='text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-semibold whitespace-nowrap'>Presença abre 13/11 às 8:00</span>
                            )}
                            {eq.presencaFinalConfirmada && (
                              eq.tamanhosCamisa
                                ? <span className='text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold whitespace-nowrap'>Tamanhos enviados</span>
                                : <span className='text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-semibold whitespace-nowrap'>Tamanhos pendentes</span>
                            )}
                          </div>
                        </div>
                        <ul className='mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-neutral-600'>
                          {(eq.membros || []).filter(m => m.status === 'ativo').map((m, i) => {
                            const tamanho = tamanhosConhecidos[m.uid]
                            return (
                              <li key={m.uid || i}>
                                {m.nome}{m.email ? <span className='text-neutral-500'> · {m.email}</span> : null} <span className='text-neutral-400'>— {m.papel?.replace(/_/g, ' ')}</span>
                                {tamanho ? <span className='font-semibold text-[#82181A]'> · {tamanho}</span> : null}
                              </li>
                            )
                          })}
                        </ul>
                        <button type='button' onClick={() => tirarDaFinal(eq)} disabled={!!movendoId} className='mt-4 text-xs border border-red-300 text-red-700 px-3 py-2 rounded-full font-semibold cursor-pointer hover:bg-red-50 disabled:opacity-50'>Tirar da final</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Carregando...</p></div>}>
      <FinalContent />
    </Suspense>
  )
}
