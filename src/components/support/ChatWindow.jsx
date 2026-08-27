'use client'

import { useEffect, useRef, useState } from 'react'
import { Poppins } from 'next/font/google'
import { useSupportChat } from '@/hooks/useSupportChat'
import {
  AUTORES,
  AVALIACOES_CSAT,
  MENSAGEM_BEM_VINDO,
  STATUS_CHAMADO,
  STATUS_LABELS,
  SUGESTOES_INICIAIS,
  estaNoHorarioAtendimento,
} from '@/lib/support/constants'
import { requestNotificationToken } from '@/lib/support/firebase'
import MessageBubble from './MessageBubble'
import ModalTutorialIos from './ModalTutorialIos'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

const IconeEnviar = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
  </svg>
)

const IconeHeadset = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-5 h-5" viewBox="0 0 16 16">
    <path d="M8 1a5 5 0 0 0-5 5v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a6 6 0 1 1 12 0v6a2.5 2.5 0 0 1-2.5 2.5H9.366a1 1 0 0 1-.866.5h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 .866.5H11.5A1.5 1.5 0 0 0 13 12h-1a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1V6a5 5 0 0 0-5-5" />
  </svg>
)

const IndicadorDigitando = () => (
  <div className="flex items-center gap-1.5 px-4 py-3 bg-white rounded-2xl rounded-bl-md border border-neutral-200 w-fit shadow-sm">
    <span className="w-1.5 h-1.5 rounded-full bg-[#82181A] animate-support-bounce" />
    <span className="w-1.5 h-1.5 rounded-full bg-[#82181A] animate-support-bounce [animation-delay:0.15s]" />
    <span className="w-1.5 h-1.5 rounded-full bg-[#82181A] animate-support-bounce [animation-delay:0.3s]" />
    <span className="text-[11px] text-neutral-500 ml-1">digitando...</span>
  </div>
)

const ChatWindow = ({ chat, onFechar }) => {
  const {
    sessao,
    chamado,
    mensagens,
    carregando,
    digitando,
    erro,
    sugestoes,
    coleta,
    encerrado,
    posicaoFila,
    enviarAvaliacao,
    inicializar,
    iniciarNovoAtendimento,
    enviarMensagem,
  } = chat

  const [texto, setTexto] = useState('')
  const [tempoFila, setTempoFila] = useState(0)
  const [permissao, setPermissao] = useState(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  )
  const [modalIosAberto, setModalIosAberto] = useState(false)
  const [notaSelecionada, setNotaSelecionada] = useState(null)
  const [justificativa, setJustificativa] = useState('')
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false)
  const fimRef = useRef(null)

  useEffect(() => {
    if (chamado?.status !== STATUS_CHAMADO.AGUARDANDO_ATENDENTE || !chamado?.transferidoEm) {
      setTempoFila(0)
      return
    }
    const calc = () => {
      const ts = chamado.transferidoEm
      const ms = Date.now() - (ts.toMillis ? ts.toMillis() : new Date(ts).getTime())
      setTempoFila(Math.floor(ms / 1000))
    }
    calc()
    const t = setInterval(calc, 5000)
    return () => clearInterval(t)
  }, [chamado?.status, chamado?.transferidoEm])

  useEffect(() => {
    if (sessao || carregando) return
    inicializar()
  }, [sessao, carregando, inicializar])

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens.length, digitando, carregando, encerrado, chamado?.status])

  const enviar = async () => {
    const t = texto.trim()
    if (!t) return
    setTexto('')
    await enviarMensagem(t)
  }

  const tratarCliqueNotificacao = async () => {
    const isIos =
      typeof navigator !== 'undefined' &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches)

    if (isIos && !isStandalone) {
      setModalIosAberto(true)
      return
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const p = await Notification.requestPermission()
        setPermissao(p)
        if (p === 'granted') {
          await requestNotificationToken().catch(() => {})
        }
      } catch {
        setModalIosAberto(true)
      }
    } else {
      setModalIosAberto(true)
    }
  }

  const emAtendimentoHumano =
    chamado?.modo === 'humano' &&
    (chamado.status === STATUS_CHAMADO.EM_ATENDIMENTO || chamado.status === STATUS_CHAMADO.AGUARDANDO_USUARIO)

  const statusTexto = !chamado
    ? 'Conectando...'
    : chamado.modo === 'humano'
    ? chamado.status === STATUS_CHAMADO.AGUARDANDO_ATENDENTE
      ? `Fila de espera (#${posicaoFila || 1})`
      : emAtendimentoHumano
      ? 'Atendente online'
      : STATUS_LABELS[chamado.status]
    : 'Online agora'

  const sugestoesExibidas = sugestoes.length > 0 ? sugestoes : SUGESTOES_INICIAIS
  const mensagensExibidas =
    mensagens.length === 0
      ? [{ id: 'boas-vindas', autorTipo: AUTORES.IA, conteudo: MENSAGEM_BEM_VINDO, enviadoEm: null }]
      : mensagens

  const noHorario = estaNoHorarioAtendimento()

  return (
    <>
      <div
        className={`${poppins.className} fixed z-50 bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[400px] h-[600px] max-h-[calc(100dvh-7.5rem)] bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col animate-support-pop`}
        role="dialog"
        aria-label="Chat de suporte DHPB"
      >
        <header className="bg-[#82181A] text-white px-5 py-4 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <IconeHeadset />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm leading-tight">Atendimento DHPB</h2>
            <p className="text-[11px] text-white/80 flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full inline-block ${
                  chamado?.modo === 'humano' && !emAtendimentoHumano && chamado.status !== STATUS_CHAMADO.AGUARDANDO_ATENDENTE
                    ? 'bg-amber-300'
                    : 'bg-green-300'
                }`}
              />
              {statusTexto}
            </p>
          </div>
          <button
            onClick={onFechar}
            aria-label="Fechar suporte"
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-neutral-50/50">
          {carregando ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#82181A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl">{erro}</div>}
              {mensagensExibidas.map((m) => (
                <MessageBubble key={m.id} mensagem={m} />
              ))}

              {/* Bolha de status: Fila de espera e Horário */}
              {chamado?.modo === 'humano' && chamado.status === STATUS_CHAMADO.AGUARDANDO_ATENDENTE && (
                <div className="flex flex-col items-start">
                  <div className="max-w-[90%] px-4 py-3 text-sm leading-relaxed bg-neutral-100 text-neutral-900 rounded-2xl rounded-bl-md border border-neutral-200/60 flex flex-col gap-2.5 animate-support-in">
                    <div className="flex items-start gap-2.5">
                      {!noHorario ? (
                        <span className="text-lg shrink-0">⏰</span>
                      ) : (
                        <div className="w-4 h-4 mt-0.5 border-2 border-[#82181A] border-t-transparent rounded-full animate-spin shrink-0" />
                      )}
                      <div className="flex-1 space-y-1">
                        {!noHorario ? (
                          <p className="font-medium text-xs leading-relaxed text-neutral-800">
                            Nosso atendimento com atendentes humanos funciona das <b>09:00 às 18:00</b>. Sua solicitação já foi registrada e está na fila.
                          </p>
                        ) : tempoFila >= 600 ? (
                          <p className="text-xs leading-relaxed text-neutral-800">
                            Nosso sistema está mais cheio do que parece, mas não saia da tela! Em breve alguém falará com você. 🙏
                          </p>
                        ) : (
                          <p className="text-xs leading-relaxed text-neutral-800">
                            Buscando um atendente disponível...
                          </p>
                        )}
                        <p className="text-[11px] font-semibold text-[#82181A] bg-[#82181A]/10 px-2.5 py-1 rounded-lg w-fit">
                          📍 Você é o {posicaoFila || 1}º na fila de espera
                        </p>
                      </div>
                    </div>

                    {permissao !== 'granted' && (
                      <div className="pt-2 border-t border-neutral-200/80 flex flex-col gap-1.5">
                        <p className="text-[11px] text-neutral-600 leading-snug">
                          Ative as notificações para receber o aviso no celular quando um atendente responder:
                        </p>
                        <button
                          onClick={tratarCliqueNotificacao}
                          className="bg-[#82181A] hover:bg-[#631214] text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm shadow-[#82181A]/20 flex items-center gap-1.5 self-start"
                        >
                          <span>🔔</span>
                          <span>Ativar Notificações</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-1 px-1">Atendimento DHPB · agora</span>
                </div>
              )}

              {/* Bolha de encerramento + Avaliação CSAT */}
              {encerrado && (
                <div className="flex flex-col items-start">
                  <div className="max-w-[90%] px-4 py-3 text-sm leading-relaxed bg-neutral-100 text-neutral-900 rounded-2xl rounded-bl-md border border-neutral-200/60 flex flex-col gap-3 animate-support-in">
                    <p className="font-medium text-xs text-neutral-800">
                      Este atendimento foi encerrado e o histórico foi salvo.
                    </p>

                    {chamado?.avaliacao !== undefined ? (
                      <div className="p-3 bg-white rounded-xl border border-neutral-200 text-xs text-neutral-700">
                        <p className="font-semibold text-green-700 flex items-center gap-1">
                          <span>✅</span>
                          <span>Atendimento avaliado ({chamado.avaliacao}/5)</span>
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">Obrigado pelo seu feedback! 🌟</p>
                      </div>
                    ) : (
                      <div className="p-3 bg-white rounded-xl border border-neutral-200 flex flex-col gap-2">
                        <p className="text-xs font-semibold text-neutral-800">
                          Como você avalia nosso atendimento?
                        </p>
                        <div className="grid grid-cols-6 gap-1">
                          {AVALIACOES_CSAT.map((item) => (
                            <button
                              key={item.nota}
                              onClick={() => setNotaSelecionada(item.nota)}
                              className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all cursor-pointer ${
                                notaSelecionada === item.nota
                                  ? 'bg-[#82181A] text-white border-[#82181A] scale-105 shadow-sm'
                                  : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                              }`}
                              title={`${item.nota} - ${item.label}`}
                            >
                              <span className="text-base">{item.emoji}</span>
                              <span className="text-[10px] font-bold mt-0.5">{item.nota}</span>
                            </button>
                          ))}
                        </div>

                        {notaSelecionada !== null && (
                          <div className="mt-1 space-y-2">
                            <p className="text-[11px] font-medium text-neutral-600">
                              Nota {notaSelecionada}: {AVALIACOES_CSAT.find((a) => a.nota === notaSelecionada)?.label}
                            </p>

                            {notaSelecionada <= 2 && (
                              <textarea
                                value={justificativa}
                                onChange={(e) => setJustificativa(e.target.value)}
                                placeholder="Por favor, nos conte o que aconteceu para que possamos melhorar... (obrigatório)"
                                rows={2}
                                className="w-full text-xs p-2 rounded-lg border border-neutral-300 focus:border-[#82181A] outline-none resize-none"
                              />
                            )}

                            <button
                              disabled={enviandoAvaliacao || (notaSelecionada <= 2 && !justificativa.trim())}
                              onClick={async () => {
                                setEnviandoAvaliacao(true)
                                await enviarAvaliacao(notaSelecionada, justificativa)
                                setEnviandoAvaliacao(false)
                              }}
                              className="w-full bg-[#82181A] hover:bg-[#631214] text-white text-xs font-semibold py-2 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                            >
                              {enviandoAvaliacao ? 'Enviando...' : 'Enviar Avaliação'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={iniciarNovoAtendimento}
                      className="bg-white border border-[#82181A] text-[#82181A] text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#82181A] hover:text-white transition-colors cursor-pointer self-start"
                    >
                      Iniciar novo atendimento
                    </button>
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-1 px-1">Atendimento DHPB · agora</span>
                </div>
              )}

              {digitando && <IndicadorDigitando />}
              {mensagens.length === 0 && !coleta && sugestoesExibidas.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {sugestoesExibidas.slice(0, 4).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => enviarMensagem(s)}
                      className="text-xs border border-[#82181A]/30 text-[#82181A] bg-white px-3 py-2 rounded-full hover:bg-[#82181A] hover:text-white transition-colors cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div ref={fimRef} />
            </>
          )}
        </div>

        {!carregando && !encerrado && (
          <footer className="border-t border-neutral-200 p-3 bg-white shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    enviar()
                  }
                }}
                rows={1}
                placeholder="Digite sua mensagem..."
                aria-label="Mensagem"
                className="flex-1 resize-none text-[#000] rounded-2xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A] max-h-28"
              />
              <button
                onClick={enviar}
                disabled={!texto.trim()}
                aria-label="Enviar mensagem"
                className="w-10 h-10 shrink-0 rounded-xl bg-[#82181A] text-white flex items-center justify-center hover:bg-[#631214] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <IconeEnviar />
              </button>
            </div>
          </footer>
        )}
      </div>

      <ModalTutorialIos aberto={modalIosAberto} onFechar={() => setModalIosAberto(false)} />
    </>
  )
}

export default ChatWindow

