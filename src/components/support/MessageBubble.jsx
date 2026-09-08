'use client'

import { AUTORES, formatarDataHora } from '@/lib/support/constants'
import { useState } from 'react'

const ImagemMensagem = ({ url }) => {
  const [ampliada, setAmpliada] = useState(false)
  return (
    <>
      <img
        src={url}
        alt="Imagem enviada"
        onClick={() => setAmpliada(true)}
        className="max-w-[220px] max-h-48 rounded-xl object-cover cursor-zoom-in border border-neutral-200/60 shadow-sm"
      />
      {ampliada && (
        <div
          className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setAmpliada(false)}
        >
          <img
            src={url}
            alt="Imagem ampliada"
            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
          />
          <button
            onClick={() => setAmpliada(false)}
            className="absolute top-4 right-4 text-white bg-black/40 rounded-full w-9 h-9 flex items-center justify-center text-lg hover:bg-black/70 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </>
  )
}

const MessageBubble = ({ mensagem }) => {
  const doUsuario = mensagem.autorTipo === AUTORES.USUARIO
  const isIa = mensagem.autorTipo === AUTORES.IA

  const conteudo = mensagem.conteudo || ''
  const isImagem = conteudo.startsWith('[imagem]')
  const urlImagem = isImagem ? conteudo.replace('[imagem]', '') : null

  return (
    <div className={`flex flex-col ${doUsuario ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed break-words animate-support-in ${
          doUsuario
            ? 'bg-[#82181A] text-white rounded-2xl rounded-br-md'
            : isIa
            ? 'bg-neutral-100 text-neutral-900 rounded-2xl rounded-bl-md border border-neutral-200/60'
            : 'bg-[#f3ede8] text-neutral-900 rounded-2xl rounded-bl-md border border-[#82181A]/20'
        } ${isImagem ? 'p-1.5' : ''}`}
      >
        {isImagem ? (
          <ImagemMensagem url={urlImagem} />
        ) : (
          <span className="whitespace-pre-wrap">{conteudo}</span>
        )}
      </div>
      <span className="text-[10px] text-neutral-400 mt-1 px-1">
        {doUsuario ? 'Você' : 'Atendimento DHPB'} · {formatarDataHora(mensagem.enviadoEm)}
      </span>
    </div>
  )
}

export default MessageBubble
