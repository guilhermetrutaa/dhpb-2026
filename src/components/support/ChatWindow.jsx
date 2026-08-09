'use client'

import { useEffect, useRef, useState } from 'react'
import { Poppins } from 'next/font/google'
import { useSupportChat } from '@/hooks/useSupportChat'
import {
  AUTORES,
  MENSAGEM_ATENDENTE_48H,
  MENSAGEM_BEM_VINDO,
  STATUS_CHAMADO,
  STATUS_LABELS,
  SUGESTOES_INICIAIS,
} from '@/lib/support/constants'
import { requestNotificationToken } from '@/lib/support/firebase'
import MessageBubble from './MessageBubble'

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
  const { sessao, chamado, mensagens, carregando, digitando, erro, sugestoes, coleta, encerrado, inicializar, iniciarNovoAtendimento, enviarMensagem } = chat
  const [texto, setTexto] = useState('')
  const [permissao, setPermissao] = useState('granted') // default para não piscar
  const fimRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissao(Notification.permission)
    }
  }, [])

  useEffect(() => {
    if (sessao || carregando) return
    inicializar()
  }, [sessao, carregando, inicializar])

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens.length, digitando, carregando])

  const enviar = async () => {
    const t = texto.trim()
    if (!t) return
    setTexto('')
    await enviarMensagem(t)
  }

  const emAtendimentoHumano =
    chamado?.modo === 'humano' &&
    (chamado.status === STATUS_CHAMADO.EM_ATENDIMENTO || chamado.status === STATUS_CHAMADO.AGUARDANDO_USUARIO)

  const statusTexto = !chamado
    ? 'Conectando...'
    : chamado.modo === 'humano'
    ? chamado.status === STATUS_CHAMADO.AGUARDANDO_ATENDENTE
      ? 'Aguardando atendente...'
      : emAtendimentoHumano
      ? 'Atendente online'
      : STATUS_LABELS[chamado.status]
    : 'Online agora'

  const sugestoesExibidas = sugestoes.length > 0 ? sugestoes : SUGESTOES_INICIAIS
  const mensagensExibidas =
    mensagens.length === 0
      ? [{ id: 'boas-vindas', autorTipo: AUTORES.IA, conteudo: MENSAGEM_BEM_VINDO, enviadoEm: null }]
      : mensagens

  return (
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
        <button onClick={onFechar} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
      </header>

      {/* Banner de Permissão de Notificação */}
      {permissao !== 'granted' && (
        <div className="bg-amber-50 px-4 py-3 border-b border-amber-200 text-[12px] text-amber-900 leading-snug flex flex-col gap-2 shrink-0">
          <p>
            Ative as notificações para ser avisado sobre a resposta da nossa equipe e receber novidades do site, como abertura de fases e aprovações!
          </p>
          {permissao === 'default' ? (
            <button
              onClick={async () => {
                const p = await Notification.requestPermission()
                setPermissao(p)
                if (p === 'granted') requestNotificationToken().catch(() => {})
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-1.5 px-3 rounded text-[11px] self-start transition-colors"
            >
              Ativar Notificações
            </button>
          ) : (
            <p className="font-semibold text-amber-700">
              Notificações bloqueadas. Habilite nas configurações do seu navegador (clique no cadeado da barra de endereço).
            </p>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-neutral-50/50">
        {carregando ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#82181A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {chamado?.modo === 'humano' && chamado.status === STATUS_CHAMADO.AGUARDANDO_ATENDENTE && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-xl">
                {MENSAGEM_ATENDENTE_48H}
              </div>
            )}
            {encerrado && (
              <div className="bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs px-4 py-3 rounded-xl">
                Este atendimento foi encerrado e o histórico foi salvo. Precisa de mais ajuda?
                <button
                  onClick={iniciarNovoAtendimento}
                  className="block mt-2 bg-[#82181A] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#631214] transition-colors cursor-pointer"
                >
                  Iniciar novo atendimento
                </button>
              </div>
            )}
            {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl">{erro}</div>}
            {mensagensExibidas.map((m) => (
              <MessageBubble key={m.id} mensagem={m} />
            ))}
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
  )
}

export default ChatWindow
