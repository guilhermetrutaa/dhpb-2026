'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Poppins } from 'next/font/google'
import { useParams, useRouter } from 'next/navigation'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import Image from 'next/image'
import { supportDb } from '@/lib/support/firebase'
import { obterNomeAtendente, definirNomeAtendente } from '@/lib/support/nomeAtendente'
import {
  AUTORES,
  CATEGORIAS,
  PRIORIDADE_COLORS,
  STATUS_CHAMADO,
  STATUS_COLORS,
  STATUS_LABELS,
  formatarDataHora,
  formatarTempo,
} from '@/lib/support/constants'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

const CATEGORIA_LABELS = {}
CATEGORIAS.forEach((c) => { CATEGORIA_LABELS[c.id] = c.label })

const Page = () => {
  const params = useParams()
  const chamadoId = params.id
  const router = useRouter()
  const [nomeAtendente, setNomeAtendente] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [chamado, setChamado] = useState(null)
  const [mensagens, setMensagens] = useState([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [agora, setAgora] = useState(() => Date.now())
  const fimRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setNomeAtendente(obterNomeAtendente())
    }, 0)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!chamadoId) return
    let unsubChamado = () => {}
    let unsubMsg = () => {}
    unsubChamado = onSnapshot(
      doc(supportDb, 'chamados', chamadoId),
      (snap) => {
        if (!snap.exists()) { setChamado(null); setCarregando(false); return }
        const dados = { id: snap.id, ...snap.data() }
        setChamado(dados)
        setCarregando(false)
        if (dados.naoLidasAdmin > 0) {
          updateDoc(doc(supportDb, 'chamados', chamadoId), { naoLidasAdmin: 0 }).catch(() => {})
        }
      },
      () => setCarregando(false)
    )
    unsubMsg = onSnapshot(
      query(collection(supportDb, 'chamados', chamadoId, 'mensagens'), orderBy('enviadoEm', 'asc')),
      (snap) => setMensagens(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => {}
    )
    return () => { unsubChamado(); unsubMsg() }
  }, [chamadoId])

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens.length])

  const atualizarStatus = useCallback(async (status, extra = {}) => {
    if (!chamadoId) return
    await updateDoc(doc(supportDb, 'chamados', chamadoId), { status, atualizadoEm: serverTimestamp(), ...extra }).catch(() => {})
  }, [chamadoId])

  const assumirAtendimento = async () => {
    await atualizarStatus(STATUS_CHAMADO.EM_ATENDIMENTO, {
      assumidoPor: nomeAtendente || 'Atendente',
      assumidoEm: serverTimestamp(),
      naoLidasAdmin: 0,
    })
  }

  const enviar = async () => {
    const conteudo = texto.trim()
    if (!conteudo || !chamadoId || enviando) return
    setEnviando(true)
    try {
      await addDoc(collection(supportDb, 'chamados', chamadoId, 'mensagens'), {
        autorTipo: AUTORES.ADMIN,
        autorNome: nomeAtendente || 'Equipe DHPB',
        conteudo,
        enviadoEm: serverTimestamp(),
        lida: false,
      })
      await updateDoc(doc(supportDb, 'chamados', chamadoId), {
        status: STATUS_CHAMADO.AGUARDANDO_USUARIO,
        naoLidasUsuario: (chamado?.naoLidasUsuario || 0) + 1,
        ultimaMensagem: conteudo.slice(0, 160),
        ultimaMensagemAutor: AUTORES.ADMIN,
        ultimaMensagemEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      })
      setTexto('')
      
    } catch {}
    setEnviando(false)
  }

  const copiarLink = () => {
    const url = `${window.location.origin}/admin/suporte/chamados/${chamadoId}`
    navigator.clipboard?.writeText(url).catch(() => {})
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const excluirChamado = async () => {
    if (!window.confirm('Excluir este chamado permanentemente do Firestore?')) return
    if (!window.confirm('Tem certeza? Esta ação NÃO pode ser desfeita.')) return
    try {
      const msgs = await getDocs(collection(supportDb, 'chamados', chamadoId, 'mensagens'))
      await Promise.all(msgs.docs.map((d) => deleteDoc(d.ref)))
      await deleteDoc(doc(supportDb, 'chamados', chamadoId))
      router.push('/admin/suporte')
    } catch {
      window.alert('Erro ao excluir o chamado.')
    }
  }

  const trocarNome = () => {
    const novo = window.prompt('Seu nome (aparece como atendente):', nomeAtendente || '')
    if (novo === null) return
    definirNomeAtendente(novo)
    setNomeAtendente(novo.trim())
  }

  const tempoEspera = !chamado
    ? null
    : chamado.status === STATUS_CHAMADO.AGUARDANDO_ATENDENTE
    ? formatarTempo(agora - (chamado.transferidoEm?.toDate?.()?.getTime?.() || chamado.criadoEm?.toDate?.()?.getTime?.() || agora))
    : null

  const tempoAtendimento = !chamado
    ? null
    : [STATUS_CHAMADO.EM_ATENDIMENTO, STATUS_CHAMADO.AGUARDANDO_USUARIO].includes(chamado.status)
    ? formatarTempo(agora - (chamado.assumidoEm?.toDate?.()?.getTime?.() || chamado.criadoEm?.toDate?.()?.getTime?.() || agora))
    : null

  return (
    <div className={poppins.className}>
      <div className='min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 text-[#000]'>
        <header className='bg-white shadow-sm border-b border-neutral-200'>
          <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Image src="/logo.svg" width={44} height={44} alt="Logo" />
              <div>
                <h1 className='text-lg font-bold text-[#82181A]'>Atendimento</h1>
                <p className='text-xs text-neutral-400'>Chamado #{chamadoId?.slice(0, 8) || '—'}</p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <button onClick={trocarNome} title="Editar nome do atendente"
                className='flex items-center gap-2 border border-neutral-300 text-neutral-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-all cursor-pointer'>
                <span className='w-2 h-2 rounded-full bg-green-500' />
                {nomeAtendente || 'Definir nome'}
              </button>
              <button onClick={() => router.push('/admin/suporte')} className='border border-[#82181A] text-[#82181A] px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#82181A] hover:text-white transition-all cursor-pointer'>Chamados</button>
            </div>
          </div>
        </header>

        <main className='max-w-6xl mx-auto px-6 py-6'>
          {carregando ? (
            <p className='text-neutral-400 text-sm text-center py-10'>Carregando chamado...</p>
          ) : !chamado ? (
            <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-10 text-center'>
              <p className='text-neutral-500 text-sm'>Chamado não encontrado.</p>
              <button onClick={() => router.push('/admin/suporte')} className='mt-4 bg-[#82181A] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#631214] transition-all cursor-pointer'>Voltar para chamados</button>
            </div>
          ) : (
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              <div className='lg:col-span-2 space-y-4'>
                <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <p className='font-bold text-sm'>{chamado.nome || 'Usuário'}</p>
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[chamado.status] || 'bg-neutral-100 text-neutral-500'}`}>
                        {STATUS_LABELS[chamado.status] || chamado.status}
                      </span>
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${PRIORIDADE_COLORS[chamado.prioridade] || ''}`}>
                        Prioridade {chamado.prioridade || '—'}
                      </span>
                    </div>
                    <p className='text-xs text-neutral-500 mt-1'>{chamado.email || 'Sem e-mail'}</p>
                  </div>
                  <div className='flex gap-2 flex-wrap'>
                    {chamado.status === STATUS_CHAMADO.AGUARDANDO_ATENDENTE && (
                      <button onClick={assumirAtendimento} className='bg-[#82181A] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#631214] transition-all cursor-pointer'>
                        Assumir atendimento
                      </button>
                    )}
                    {[STATUS_CHAMADO.EM_ATENDIMENTO, STATUS_CHAMADO.AGUARDANDO_USUARIO, STATUS_CHAMADO.AGUARDANDO_ATENDENTE].includes(chamado.status) && (
                      <button onClick={() => atualizarStatus(STATUS_CHAMADO.RESOLVIDO, { resolvidoEm: serverTimestamp() })}
                        className='border border-green-300 text-green-700 text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-green-50 transition-all cursor-pointer'>
                        Resolver
                      </button>
                    )}
                    {[STATUS_CHAMADO.RESOLVIDO, STATUS_CHAMADO.ARQUIVADO].includes(chamado.status) && (
                      <button onClick={() => atualizarStatus(STATUS_CHAMADO.EM_ATENDIMENTO)}
                        className='border border-neutral-300 text-neutral-600 text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-neutral-100 transition-all cursor-pointer'>
                        Reabrir
                      </button>
                    )}
                    {chamado.status !== STATUS_CHAMADO.ARQUIVADO && (
                      <button onClick={() => atualizarStatus(STATUS_CHAMADO.ARQUIVADO)}
                        className='border border-neutral-300 text-neutral-500 text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-neutral-100 transition-all cursor-pointer'>
                        Arquivar
                      </button>
                    )}
                    <button onClick={excluirChamado}
                      className='border border-red-200 text-red-600 text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-red-50 transition-all cursor-pointer'>
                      Excluir
                    </button>
                    <button onClick={copiarLink} title="Copiar link do chamado"
                      className='border border-neutral-300 text-neutral-600 text-xs font-semibold px-3 py-2.5 rounded-xl hover:bg-neutral-100 transition-all cursor-pointer'>
                      {copiado ? '✓ Copiado' : 'Copiar link'}
                    </button>
                  </div>
                </div>

                <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 flex flex-col h-[520px]'>
                  <div className='flex-1 overflow-y-auto px-4 py-4 space-y-3'>
                    {mensagens.length === 0 ? (
                      <p className='text-neutral-400 text-sm text-center py-10'>Nenhuma mensagem neste chamado.</p>
                    ) : (
                      mensagens.map((m) => {
                        const doUsuario = m.autorTipo === AUTORES.USUARIO
                        const isIa = m.autorTipo === AUTORES.IA
                        return (
                          <div key={m.id} className={`flex flex-col ${doUsuario ? 'items-end' : 'items-start'}`}>
                            <div
                              className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words rounded-2xl ${
                                doUsuario
                                  ? 'bg-[#82181A] text-white rounded-br-md'
                                  : isIa
                                  ? 'bg-neutral-100 text-neutral-900 rounded-bl-md border border-neutral-200/60'
                                  : 'bg-[#f3ede8] text-neutral-900 rounded-bl-md border border-[#82181A]/20'
                              }`}
                            >
                              {m.conteudo}
                            </div>
                            <span className='text-[10px] text-neutral-400 mt-1 px-1'>
                              {doUsuario ? chamado.nome || 'Usuário' : isIa ? 'Atendimento DHPB' : m.autorNome || 'Equipe DHPB'} · {formatarDataHora(m.enviadoEm)}
                            </span>
                          </div>
                        )
                      })
                    )}
                    <div ref={fimRef} />
                  </div>
                  <div className='border-t border-neutral-200 p-3 bg-white rounded-b-2xl'>
                    <div className='flex items-end gap-2'>
                      <textarea
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
                        rows={1}
                        placeholder="Responder ao usuário..."
                        className="flex-1 resize-none rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A] max-h-28"
                      />
                      <button
                        onClick={enviar}
                        disabled={!texto.trim() || enviando}
                        className='bg-[#82181A] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-[#631214] transition-all disabled:opacity-40 cursor-pointer'
                      >
                        {enviando ? '...' : 'Enviar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 space-y-3'>
                  <h3 className='font-bold text-sm text-[#82181A] border-b border-neutral-100 pb-2'>Dados do chamado</h3>
                  <div className='text-xs space-y-2 text-neutral-600'>
                    <p><span className='font-semibold text-neutral-800'>ID:</span> <code className='break-all'>{chamado.id}</code></p>
                    <p><span className='font-semibold text-neutral-800'>Categoria:</span> {CATEGORIA_LABELS[chamado.categoria] || chamado.categoria || '—'}</p>
                    <p><span className='font-semibold text-neutral-800'>Prioridade:</span> {chamado.prioridade || '—'}</p>
                    <p><span className='font-semibold text-neutral-800'>Criado em:</span> {formatarDataHora(chamado.criadoEm)}</p>
                    <p><span className='font-semibold text-neutral-800'>Transferido:</span> {formatarDataHora(chamado.transferidoEm)}</p>
                    <p><span className='font-semibold text-neutral-800'>Assumido por:</span> {chamado.assumidoPor || '—'} {chamado.assumidoEm ? `(${formatarDataHora(chamado.assumidoEm)})` : ''}</p>
                    {tempoEspera && <p><span className='font-semibold text-neutral-800'>Tempo de espera:</span> <span className='text-amber-700 font-medium'>⏳ {tempoEspera}</span></p>}
                    {tempoAtendimento && <p><span className='font-semibold text-neutral-800'>Tempo de atendimento:</span> <span className='text-green-700 font-medium'>⏱ {tempoAtendimento}</span></p>}
                  </div>
                </div>

                <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 space-y-3'>
                  <h3 className='font-bold text-sm text-[#82181A] border-b border-neutral-100 pb-2'>Resumo (gerado pela IA)</h3>
                  <p className='text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap'>{chamado.resumo || 'Sem resumo gerado.'}</p>
                </div>

                <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 space-y-3'>
                  <h3 className='font-bold text-sm text-[#82181A] border-b border-neutral-100 pb-2'>Ações administrativas</h3>
                  <p className='text-[11px] text-neutral-500 leading-relaxed'>
                    Solicitações como excluir equipe, corrigir cadastro, recuperar acesso ou alterar integrantes devem ser
                    resolvidas manualmente nos módulos existentes do painel (Dashboard, Documentos, Ranking, Questões).
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Page
