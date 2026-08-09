'use client'

import { useEffect, useState } from 'react'
import { Poppins } from 'next/font/google'
import { usePathname } from 'next/navigation'
import ChatWindow from './ChatWindow'
import { suporteConfigurado, requestNotificationToken } from '@/lib/support/firebase'
import { useSupportChat } from '@/hooks/useSupportChat'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

const IconeHeadset = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-5 h-5" viewBox="0 0 16 16">
    <path d="M8 1a5 5 0 0 0-5 5v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a6 6 0 1 1 12 0v6a2.5 2.5 0 0 1-2.5 2.5H9.366a1 1 0 0 1-.866.5h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 .866.5H11.5A1.5 1.5 0 0 0 13 12h-1a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1V6a5 5 0 0 0-5-5" />
  </svg>
)

const SupportWidget = () => {
  const [aberto, setAberto] = useState(false)
  const [visivel, setVisivel] = useState(false)
  const pathname = usePathname()
  const chat = useSupportChat({ isChatOpen: aberto })
  const { naoLidasUsuario, inicializarBackground } = chat

  useEffect(() => {
    const t = setTimeout(() => {
      setVisivel(true)
      // Pede permissão logo na abertura do site se suportado
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        requestNotificationToken().catch(() => {})
      }
    }, 600)
    
    // Inicializa a escuta em background silenciosamente
    inicializarBackground?.()
    return () => clearTimeout(t)
  }, [inicializarBackground])

  if (pathname?.startsWith('/admin')) return null
  if (!suporteConfigurado) return null

  return (
    <>
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label={aberto ? 'Fechar suporte' : 'Fale com o suporte'}
        className={`${poppins.className} fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2.5 bg-[#82181A] text-white pl-3 pr-5 py-2.5 rounded-full shadow-lg shadow-[#000]/30 hover:bg-[#631214] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer ${
          visivel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <span className="relative w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform duration-300">
          <IconeHeadset />
          {!aberto && naoLidasUsuario > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-[#82181A]">
              {naoLidasUsuario > 9 ? '9+' : naoLidasUsuario}
            </span>
          )}
        </span>
        <span className="text-sm font-semibold whitespace-nowrap">
          {aberto ? 'Fechar atendimento' : 'Fale com o suporte'}
        </span>
      </button>
      {aberto && <ChatWindow chat={chat} onFechar={() => setAberto(false)} />}
    </>
  )
}

export default SupportWidget
