'use client'

import React, { Suspense, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Poppins } from 'next/font/google'
import { doc as firestoreDoc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const getDocumentBlocks = (documento) => {
  if ((documento?.blocos || []).length > 0) return documento.blocos
  if (documento?.tipo && documento?.conteudo) return [{ tipo: documento.tipo, conteudo: documento.conteudo }]
  return []
}

const toEmbedUrl = (url = '') => {
  if (!url) return ''
  if (url.includes('watch?v=')) return url.replace('watch?v=', 'embed/')
  if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'www.youtube.com/embed/')
  return url
}

function Header({ userData, equipeId, logout }) {
  return (
    <header className="flex flex-col items-center justify-around gap-6 px-4 pb-5 pt-5 lg:flex-row">
      <div><Image src="/logo.svg" width={100} height={100} alt="Logo" /></div>
      <nav>
        <ul className="flex flex-wrap justify-center gap-4 text-sm md:gap-6 md:text-base">
          <li className="transition-colors hover:text-[#82181A] hover:underline">
            <a href={userData?.tipo === 'professor' ? '/home-professor' : '/home'}>Home</a>
          </li>
          <li className="transition-colors hover:text-[#82181A] hover:underline">
            <a href={`/sala-de-equipe?equipeId=${equipeId}`}>Sala de Prova</a>
          </li>
          <li className="transition-colors hover:text-[#82181A] hover:underline"><a href="/calendario">Calendário</a></li>
          <li className="transition-colors hover:text-[#82181A] hover:underline"><a href="/contato">Contato</a></li>
          <li className="transition-colors hover:text-[#82181A] hover:underline"><a href="/regulamento">Regulamento</a></li>
        </ul>
      </nav>
      <button
        type="button"
        onClick={logout}
        className="cursor-pointer whitespace-nowrap border-[3px] border-[#82181A] px-6 py-2 font-medium text-[#82181A] transition-colors hover:bg-[#82181A] hover:text-white"
      >
        Sair
      </button>
    </header>
  )
}

function InstagramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334" />
    </svg>
  )
}

function TiktokIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
      <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z" />
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A100 100 0 0 1 7.858 2zM6.4 5.209v4.818l4.157-2.408z" />
    </svg>
  )
}

function Footer() {
  return (
    <footer className="w-full pb-10 pt-12 md:pt-10">
      <div className="mx-auto max-w-7xl px-6 py-5">
        <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
          <div className="flex flex-col items-center gap-4 lg:items-start">
            <img src="/logo.svg" alt="DHPB" className="h-14 w-auto object-contain" />
            <div className="flex items-center gap-4 text-black">
              <a href="https://www.instagram.com/oficialdhpb/" target="_blank" rel="noopener noreferrer" className="transition-transform duration-300 hover:text-[#82181A]">
                <InstagramIcon />
              </a>
              <a href="https://www.tiktok.com/@oficialdhpb" target="_blank" rel="noopener noreferrer" className="transition-transform duration-300 hover:text-[#82181A]">
                <TiktokIcon />
              </a>
              <a href="#" className="transition-transform duration-300 hover:text-[#82181A]">
                <YoutubeIcon />
              </a>
            </div>
          </div>

          <div className="hidden h-20 w-px bg-black lg:block" />

          <div className="flex flex-col items-center gap-2">
            <span className="text-base font-semibold text-black">Realização:</span>
            <img src="/ifpb-logo.svg" alt="IFPB" className="h-10 w-auto object-contain" />
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-base font-semibold text-black">Apoio:</span>
            <div className="flex flex-wrap items-center justify-center gap-5">
              <img src="/anpuhpb.svg" alt="ANPUH" className="h-10 w-auto object-contain" />
              <img src="/comite-logo.svg" alt="Comitê" className="h-10 w-auto object-contain" />
              <img src="/logo-gov.svg" alt="Governo" className="h-14 w-auto object-contain" />
            </div>
          </div>

          <div className="hidden h-20 w-px bg-black lg:block" />

          <div className="flex flex-col items-center gap-2">
            <span className="text-base font-semibold text-black">Powered by:</span>
            <div className="flex items-center gap-4">
              <img src="/kodeo-logo.svg" alt="Kodeo" className="h-10 w-auto object-contain" />
              <img src="/comite-logo.svg" alt="Comitê" className="h-10 w-auto object-contain" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

function QuestionArrow({ href, direction }) {
  const disabled = !href
  const triangleClass = direction === 'left'
    ? 'border-y-[7px] border-y-transparent border-r-[10px] border-r-black'
    : 'border-y-[7px] border-y-transparent border-l-[10px] border-l-black'

  const arrow = (
    <span className={`flex h-7 w-7 items-center justify-center bg-[#FBEAEA] transition-colors ${disabled ? 'opacity-35' : 'hover:bg-[#F7DADA]'}`}>
      <span className={`block h-0 w-0 ${triangleClass}`} />
    </span>
  )

  if (disabled) return <span aria-hidden="true">{arrow}</span>

  return (
    <Link href={href} aria-label={direction === 'left' ? 'Questão anterior' : 'Próxima questão'}>
      {arrow}
    </Link>
  )
}

function DocumentBlock({ bloco, title, preview = false }) {
  if (!bloco?.conteudo) {
    return (
      <div className={`${preview ? 'min-h-[170px]' : 'min-h-[260px]'} flex items-center justify-center bg-white/40 px-6 text-center text-sm text-neutral-500`}>
        Documento sem conteúdo cadastrado.
      </div>
    )
  }

  if (bloco.tipo === 'imagem') {
    return (
      <img
        src={bloco.conteudo}
        alt={title || 'Documento'}
        className={`mx-auto w-full object-contain ${preview ? 'max-h-[320px] max-w-[640px]' : 'max-h-[720px] max-w-[820px]'}`}
      />
    )
  }

  if (bloco.tipo === 'pdf') {
    return (
      <embed
        src={bloco.conteudo}
        type="application/pdf"
        className={`mx-auto w-full rounded-sm bg-white ${preview ? 'h-[320px] max-w-[640px]' : 'h-[72vh] max-w-[920px]'}`}
      />
    )
  }

  if (bloco.tipo === 'video' || bloco.tipo === 'musica') {
    return (
      <div className={`mx-auto aspect-video w-full overflow-hidden bg-black ${preview ? 'max-w-[640px]' : 'max-w-[820px]'}`}>
        <iframe
          src={toEmbedUrl(bloco.conteudo)}
          title={title || 'Documento em vídeo'}
          className="h-full w-full"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <div className={`mx-auto bg-white/45 p-5 text-left leading-relaxed text-neutral-800 ${preview ? 'max-h-[220px] max-w-[640px] overflow-hidden text-sm' : 'max-w-[820px] text-base'}`}>
      <div dangerouslySetInnerHTML={{ __html: bloco.conteudo }} />
    </div>
  )
}

function DocumentPreviewCard({ documento, index, onOpen }) {
  const blocks = getDocumentBlocks(documento)
  const imageBlock = blocks.find((bloco) => bloco.tipo === 'imagem')
  const previewBlock = imageBlock || blocks[0]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
      className="group relative mx-auto block w-full max-w-[1160px] cursor-pointer rounded-[14px] bg-[#F9E6E6] px-5 py-7 text-left outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#82181A] sm:px-8 md:min-h-[360px]"
    >
      <span className="absolute left-5 top-5 text-xs font-semibold text-[#9B2426] sm:left-6">
        Documento {String(index + 1).padStart(3, '0')}
      </span>

      <div className="mx-auto w-full max-w-[760px] pt-2">
        {documento.titulo && (
          <h2 className="text-[1.8rem] font-semibold leading-tight text-[#82181A] md:text-[2.35rem]">
            {documento.titulo}
          </h2>
        )}
        {documento.subtitulo && (
          <p className="mt-1 text-[1.25rem] font-medium italic leading-tight text-[#82181A] md:text-[1.65rem]">
            {documento.subtitulo}
          </p>
        )}

        <div className="mt-5 overflow-hidden">
          {previewBlock ? (
            <DocumentBlock bloco={previewBlock} title={documento.titulo} preview />
          ) : (
            <div className="flex min-h-[210px] items-center justify-center bg-white/35 text-sm text-neutral-500">
              Documento sem prévia.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DocumentModal({ documento, index, onClose }) {
  if (!documento) return null

  const blocks = getDocumentBlocks(documento)
  const keywords = documento.palavrasChave || []
  const hasAbout = documento.titulo || documento.subtitulo || documento.origem || documento.disponivelEm || documento.creditos || keywords.length > 0

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/35 px-3 py-5 sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-label={documento.titulo ? `Documento ${documento.titulo}` : `Documento ${index + 1}`}
      onClick={onClose}
    >
      <div className="mx-auto min-h-full w-full max-w-[1220px]">
        <div
          className="relative rounded-[14px] bg-[#F9E6E6] px-5 py-8 shadow-2xl sm:px-9 md:px-14 md:py-12"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/75 text-2xl leading-none text-[#82181A] transition-colors hover:bg-white"
            aria-label="Fechar documento"
          >
            &times;
          </button>

          <span className="text-xs font-semibold text-[#9B2426]">
            Documento {String(index + 1).padStart(3, '0')}
          </span>

          <div className="mx-auto mt-2 w-full max-w-[840px]">
            {documento.titulo && (
              <h2 className="text-[2rem] font-semibold leading-tight text-[#82181A] md:text-[2.6rem]">
                {documento.titulo}
              </h2>
            )}
            {documento.subtitulo && (
              <p className="mt-2 text-[1.3rem] font-medium italic text-[#82181A] md:text-[1.75rem]">
                {documento.subtitulo}
              </p>
            )}

            <div className="mt-6 space-y-7">
              {blocks.length > 0 ? (
                blocks.map((bloco, blocoIndex) => (
                  <DocumentBlock
                    key={bloco.id || `${bloco.tipo}-${blocoIndex}`}
                    bloco={bloco}
                    title={documento.titulo}
                  />
                ))
              ) : (
                <div className="flex min-h-[260px] items-center justify-center bg-white/35 text-sm text-neutral-500">
                  Este documento não possui conteúdo cadastrado.
                </div>
              )}
            </div>

            {hasAbout && (
              <section className="mt-10 text-[#3D3D3D]">
                <h3 className="text-[1.65rem] font-semibold text-[#9B2426] md:text-[2rem]">
                  Sobre esse documento
                </h3>

                <div className="mt-6 max-w-[700px] space-y-1 text-[1rem] leading-relaxed md:text-[1.1rem]">
                  {documento.titulo && <p><span className="font-semibold">Título:</span> {documento.titulo}.</p>}
                  {documento.subtitulo && <p><span className="font-semibold">Tipo de documento:</span> {documento.subtitulo}</p>}
                  {documento.origem && <p><span className="font-semibold">Origem:</span> {documento.origem}</p>}
                  {documento.disponivelEm && <p><span className="font-semibold">Disponível em:</span> {documento.disponivelEm}</p>}
                  {documento.creditos && <p><span className="font-semibold">Créditos:</span> {documento.creditos}</p>}
                </div>

                {keywords.length > 0 && (
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span className="font-serif text-base text-[#3D3D3D]">Palavras-chave:</span>
                    {keywords.filter(Boolean).map((keyword) => (
                      <span key={keyword} className="bg-[#FFB8B8] px-5 py-3 text-sm font-medium uppercase text-[#3D2525]">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function QuestaoContent() {
  const { authUser, userData, loading, logout } = useAuth()
  const router = useRouter()
  const sp = useSearchParams()
  const questaoId = sp.get('questaoId')
  const faseId = sp.get('faseId')
  const edicaoId = sp.get('edicaoId')
  const equipeId = sp.get('equipeId')

  const [questao, setQuestao] = useState(null)
  const [fase, setFase] = useState(null)
  const [selectedAlt, setSelectedAlt] = useState(null)
  const [respostaStatus, setRespostaStatus] = useState('pendente')
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [activeDocumentIndex, setActiveDocumentIndex] = useState(null)

  useEffect(() => {
    if (!loading && !authUser) router.push('/login')
  }, [loading, authUser, router])

  useEffect(() => {
    if (!authUser) return

    const carregar = async () => {
      try {
        if (!questaoId || !faseId || !edicaoId) {
          setErro('Dados da questão incompletos.')
          return
        }

        const [qSnap, fSnap, rSnap] = await Promise.all([
          getDoc(firestoreDoc(db, 'edicoes', edicaoId, 'fases', faseId, 'questoes', questaoId)),
          getDoc(firestoreDoc(db, 'edicoes', edicaoId, 'fases', faseId)),
          equipeId ? getDoc(firestoreDoc(db, 'equipes', equipeId, 'respostas', questaoId)) : Promise.resolve(null),
        ])

        if (!qSnap.exists()) {
          setErro('Questão não encontrada.')
          return
        }

        setQuestao({ id: qSnap.id, ...qSnap.data() })
        if (fSnap.exists()) setFase({ id: fSnap.id, ...fSnap.data() })
        if (rSnap?.exists()) {
          setSelectedAlt(rSnap.data().alternativa)
          setRespostaStatus(rSnap.data().status || 'pendente')
        }
      } catch (e) {
        setErro(e.message)
      } finally {
        setCarregando(false)
      }
    }

    carregar()
  }, [authUser, questaoId, faseId, edicaoId, equipeId])

  useEffect(() => {
    if (!faseId || !edicaoId || !authUser) return

    const unsub = onSnapshot(firestoreDoc(db, 'edicoes', edicaoId, 'fases', faseId), (snap) => {
      if (!snap.exists()) return

      const st = snap.data().status
      if (st !== 'aberta' && st !== 'correcao') {
        router.push(userData?.tipo === 'professor' ? '/home-professor' : '/home')
      }
    })

    return () => unsub()
  }, [authUser, faseId, edicaoId, router, userData])

  useEffect(() => {
    if (!mensagem) return

    const timer = setTimeout(() => setMensagem(''), 3000)
    return () => clearTimeout(timer)
  }, [mensagem])

  useEffect(() => {
    if (activeDocumentIndex === null) return

    const originalOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setActiveDocumentIndex(null)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeDocumentIndex])

  const handleSelectAlt = (altKey) => {
    if (respostaStatus !== 'entregue' && fase?.status !== 'correcao') {
      setSelectedAlt(altKey)
    }
  }

  const handleSalvar = async (novoStatus) => {
    if (!selectedAlt) {
      alert('Selecione uma alternativa.')
      return
    }

    if (respostaStatus === 'entregue') {
      alert('Questão já entregue.')
      return
    }

    try {
      const peso = questao.alternativas?.find((a) => a.letra === selectedAlt)?.peso || 0
      await setDoc(firestoreDoc(db, 'equipes', equipeId, 'respostas', questaoId), {
        alternativa: selectedAlt,
        status: novoStatus,
        peso,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: userData?.nome || authUser.email,
      })

      setRespostaStatus(novoStatus)
      setMensagem(novoStatus === 'entregue' ? 'Questão entregue!' : 'Rascunho salvo!')
    } catch {
      setMensagem('Não foi possível salvar agora.')
    }
  }

  const qNumero = questao?.numero || 0
  const qPrevId = sp.get('prevId') || ''
  const qNextId = sp.get('nextId') || ''
  const prevHref = qPrevId ? `/questao?questaoId=${qPrevId}&faseId=${faseId}&edicaoId=${edicaoId}&equipeId=${equipeId}` : ''
  const nextHref = qNextId ? `/questao?questaoId=${qNextId}&faseId=${faseId}&edicaoId=${edicaoId}&equipeId=${equipeId}` : ''
  const activeDocument = activeDocumentIndex !== null ? questao?.documentos?.[activeDocumentIndex] : null
  const lockedQuestion = respostaStatus === 'entregue' || fase?.status === 'correcao'

  if (loading || carregando || !authUser) {
    return (
      <div className={`${poppins.className} flex min-h-screen w-full items-center justify-center`}>
        <p className="text-lg text-[#82181A]">Carregando...</p>
      </div>
    )
  }

  if (erro) {
    return (
      <div className={`${poppins.className} flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4`}>
        <p className="mb-4 text-xl font-bold text-red-600">{erro}</p>
        <Link href={`/resumo-fase?faseId=${faseId}&edicaoId=${edicaoId}&equipeId=${equipeId}`} className="text-blue-600 hover:underline">
          Voltar
        </Link>
      </div>
    )
  }

  if (!questao) return null

  return (
    <div className={poppins.className}>
      <div className="min-h-screen w-full bg-white text-black">
        <Header userData={userData} equipeId={equipeId} logout={logout} />

        <section className="pb-20">
          <div className="mx-auto grid max-w-[720px] grid-cols-[44px_1fr_44px] items-center px-4 pt-12 md:pt-[4.5rem]">
            <div className="justify-self-start">
              <QuestionArrow href={prevHref} direction="left" />
            </div>
            <div className="text-center">
              <h1 className="text-[1.85rem] font-semibold leading-none text-[#82181A] md:text-[2.25rem]">
                {qNumero} / Questão
              </h1>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-[#82181A]/60">
                {respostaStatus === 'entregue' ? 'Entregue' : respostaStatus === 'rascunho' ? 'Rascunho' : 'Pendente'}
              </p>
            </div>
            <div className="justify-self-end">
              <QuestionArrow href={nextHref} direction="right" />
            </div>
          </div>

          {questao.documentos?.length > 0 && (
            <div className="mt-14 space-y-12 px-4 md:mt-[4.5rem] md:px-10">
              {questao.documentos.map((documento, index) => (
                <DocumentPreviewCard
                  key={documento.id || `${documento.titulo || 'documento'}-${index}`}
                  documento={documento}
                  index={index}
                  onOpen={() => setActiveDocumentIndex(index)}
                />
              ))}
            </div>
          )}

          <div className="mx-auto max-w-[760px] px-5 pt-14 text-left md:pt-20">
            <div
              className="text-[1rem] font-medium leading-relaxed text-[#2F2F2F] [&_p]:mb-4"
              dangerouslySetInnerHTML={{ __html: questao.instrucao }}
            />
          </div>

          <div className="mx-auto mt-12 max-w-[760px] px-4">
            <div>
              {questao.alternativas?.map((alt, index) => {
                const selecionada = selectedAlt === alt.letra
                const rowBase = index % 2 === 0 ? 'bg-[#F4F4F4]' : 'bg-[#ECECEC]'
                const rowState = lockedQuestion
                  ? selecionada ? 'bg-[#E8F8EC] ring-1 ring-[#55A967]' : 'opacity-65'
                  : selecionada ? 'bg-[#F9DADA] ring-1 ring-[#82181A]' : `${rowBase} hover:bg-[#F5E3E3]`

                return (
                  <button
                    key={alt.letra}
                    type="button"
                    disabled={lockedQuestion}
                    onClick={() => handleSelectAlt(alt.letra)}
                    className={`grid w-full grid-cols-[40px_1fr] gap-4 px-4 py-3 text-left text-[0.98rem] leading-snug text-[#333] transition-colors ${rowState} ${lockedQuestion ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <span className="pt-[1px] text-right font-medium">{alt.letra})</span>
                    <span>{alt.texto}</span>
                  </button>
                )
              })}
            </div>

            {respostaStatus !== 'entregue' && fase?.status !== 'correcao' && (
              <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-24">
                <button
                  type="button"
                  onClick={() => handleSalvar('rascunho')}
                  className="min-w-[190px] rounded-full bg-[#FFD0D0] px-6 py-3 text-sm font-medium uppercase text-[#2F2F2F] transition-colors hover:bg-[#FFC0C0]"
                >
                  Salvar rascunho
                </button>
                <button
                  type="button"
                  onClick={() => { if (confirm('Tem certeza? Não será possível alterar depois.')) handleSalvar('entregue') }}
                  className="min-w-[210px] rounded-full bg-[#FF9D9D] px-6 py-3 text-sm font-medium uppercase text-[#2F2F2F] transition-colors hover:bg-[#FF8B8B]"
                >
                  Entregar questão
                </button>
              </div>
            )}

            {mensagem && (
              <div className="mx-auto mt-8 max-w-md rounded-lg bg-green-100 p-4 text-center font-medium text-green-800">
                {mensagem}
              </div>
            )}

            {(fase?.status === 'finalizada' || fase?.status === 'correcao') && questao?.comentario && (
              <div className="mt-8 rounded-r-2xl border-l-4 border-green-500 bg-green-50 p-6">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-700">Comentário da questão</p>
                <div className="text-sm text-neutral-700" dangerouslySetInnerHTML={{ __html: questao.comentario }} />
              </div>
            )}

            <div className="mt-12 flex justify-center">
              <Link
                href={`/resumo-fase?faseId=${faseId}&edicaoId=${edicaoId}&equipeId=${equipeId}`}
                className="text-sm font-medium text-neutral-500 transition-colors hover:text-[#82181A] hover:underline"
              >
                Voltar para lista de questões
              </Link>
            </div>
          </div>

          <DocumentModal
            documento={activeDocument}
            index={activeDocumentIndex || 0}
            onClose={() => setActiveDocumentIndex(null)}
          />
        </section>

        <Footer />
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className={`${poppins.className} flex min-h-screen w-full items-center justify-center`}><p className="text-lg text-[#82181A]">Carregando...</p></div>}>
      <QuestaoContent />
    </Suspense>
  )
}
