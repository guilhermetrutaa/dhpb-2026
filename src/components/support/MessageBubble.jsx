'use client'

import { AUTORES, formatarDataHora } from '@/lib/support/constants'

const MessageBubble = ({ mensagem }) => {
  const doUsuario = mensagem.autorTipo === AUTORES.USUARIO
  const isIa = mensagem.autorTipo === AUTORES.IA

  return (
    <div className={`flex flex-col ${doUsuario ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words animate-support-in ${
          doUsuario
            ? 'bg-[#82181A] text-white rounded-2xl rounded-br-md'
            : isIa
            ? 'bg-neutral-100 text-neutral-900 rounded-2xl rounded-bl-md border border-neutral-200/60'
            : 'bg-[#f3ede8] text-neutral-900 rounded-2xl rounded-bl-md border border-[#82181A]/20'
        }`}
      >
        {mensagem.conteudo}
      </div>
      <span className="text-[10px] text-neutral-400 mt-1 px-1">
        {doUsuario ? 'Você' : 'Atendimento DHPB'} · {formatarDataHora(mensagem.enviadoEm)}
      </span>
    </div>
  )
}

export default MessageBubble
