'use client'

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { Poppins } from 'next/font/google'
import { doc, getDoc, increment, runTransaction } from 'firebase/firestore'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import {
  FOTOS,
  INSTRUCAO,
  PDF_DRIVE_URL,
  calcularPontosTarefa,
  fotoSrc,
  todasImagensEmRascunho,
} from './config'

const TravelMap = dynamic(() => import('./TravelMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#F7F7F7] font-semibold text-[#82181A]">
      Carregando mapa...
    </div>
  ),
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

function isLocalDevHost() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
}

const STORAGE_PREFIX = 'dhpb-tarefa-viagem-no-tempo'

function storageKey(faseId) {
  return `${STORAGE_PREFIX}:${faseId || 'preview'}`
}

function lerProgressoLocal(faseId) {
  try {
    const raw = window.localStorage.getItem(storageKey(faseId))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function gravarProgressoLocal(faseId, payload) {
  try {
    window.localStorage.setItem(storageKey(faseId), JSON.stringify(payload))
  } catch {
    /* ignore quota */
  }
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
      <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334" />
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
              <img src="/comite-logo.svg" alt="Comitê" className="h-10 w-auto object-contain" />
              <img src="/logo-nuhcl.svg" alt="NUHCL" className="h-10 w-auto object-contain" />
              <img src="/logo-ufcg.svg" alt="HISTORIA-UFCG" className="h-12 w-auto object-contain" />
              <img src="/logo-ndh.svg" alt="NDH" className="h-13 w-auto object-contain" />
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

function formatAudit(iso, nome, entregue) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const dia = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const quem = nome || 'um integrante'
  return entregue
    ? `Tarefa entregue por ${quem}, dia ${dia} às ${hora}`
    : `Última alteração por ${quem}, dia ${dia} às ${hora}`
}

async function persistirResposta({
  equipeId,
  faseId,
  status,
  imagens,
  pontosTarefa,
  respostaPesoAnterior,
  atualizadoPor,
  pesoFase,
}) {
  const respostaId = `tarefa_${faseId}`
  const respostaRef = doc(db, 'equipes', equipeId, 'respostas', respostaId)
  const equipeRef = doc(db, 'equipes', equipeId)
  const pontuacaoRef = doc(db, 'equipes', equipeId, 'pontuacoes', faseId)

  const novoPeso = status === 'entregue' ? pontosTarefa : 0
  const delta = novoPeso - respostaPesoAnterior
  const deltaDi = Math.round(delta * pesoFase * 100) / 100

  const respostaObj = {
    status,
    peso: pontosTarefa,
    faseId,
    tipo: 'tarefa',
    imagens,
    atualizadoEm: new Date().toISOString(),
    atualizadoPor,
  }

  await runTransaction(db, async (transaction) => {
    const rSnap = await transaction.get(respostaRef)
    if (rSnap.exists() && rSnap.data().status === 'entregue') {
      throw new Error('Tarefa já entregue por outro membro.')
    }

    transaction.set(respostaRef, respostaObj, { merge: true })

    if (delta !== 0) {
      transaction.set(pontuacaoRef, {
        ni: increment(delta),
        di: increment(deltaDi),
      }, { merge: true })

      transaction.update(equipeRef, {
        df: increment(deltaDi),
        [`respostas.${respostaId}`]: respostaObj,
        [`respostas.tarefa`]: respostaObj,
        [`pontuacoes.${faseId}.ni`]: increment(delta),
        [`pontuacoes.${faseId}.di`]: increment(deltaDi),
      })
    } else {
      transaction.update(equipeRef, {
        [`respostas.${respostaId}`]: respostaObj,
        [`respostas.tarefa`]: respostaObj,
      })
    }
  })

  return { novoPeso, respostaObj }
}

function TarefaContent() {
  const { authUser, userData, loading, logout } = useAuth()
  const router = useRouter()
  const sp = useSearchParams()
  const equipeId = sp.get('equipeId')
  const faseId = sp.get('faseId')
  const edicaoId = sp.get('edicaoId')

  const [fase, setFase] = useState(null)
  const [imagens, setImagens] = useState({})
  const [status, setStatus] = useState('pendente')
  const [respostaPesoAnterior, setRespostaPesoAnterior] = useState(0)
  const [atualizadoEm, setAtualizadoEm] = useState('')
  const [atualizadoPor, setAtualizadoPor] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [localPreview, setLocalPreview] = useState(false)
  const [questoes, setQuestoes] = useState([])
  const [rodadaAtual, setRodadaAtual] = useState(0)
  const [anoSelecionado, setAnoSelecionado] = useState(1950)
  const [localSelecionado, setLocalSelecionado] = useState(null)
  const [imagemOk, setImagemOk] = useState(true)
  const [isImageFullscreen, setIsImageFullscreen] = useState(false)
  const [isPainelFullscreen, setIsPainelFullscreen] = useState(false)
  const [imageZoom, setImageZoom] = useState(1)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const imageStageRef = useRef(null)
  const fullscreenStageRef = useRef(null)
  const imageRef = useRef(null)
  const startDragPos = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(1)

  zoomRef.current = imageZoom

  const resumoHref = `/resumo-fase?faseId=${faseId || ''}&edicaoId=${edicaoId || ''}&equipeId=${equipeId || ''}`
  const locked = status === 'entregue' || fase?.status === 'correcao'
  const titulo = fase?.tarefa?.titulo || 'Tarefa'
  const fotoAtual = FOTOS[rodadaAtual]
  const rascunhosCompletos = todasImagensEmRascunho(imagens)

  const hrefQuestao = (q, idx) => {
    if (!q?.id || !faseId || !edicaoId) return ''
    const prevId = idx > 0 ? questoes[idx - 1]?.id || '' : ''
    const nextId = idx < questoes.length - 1 ? questoes[idx + 1]?.id || '' : ''
    return `/questao?questaoId=${q.id}&faseId=${faseId}&edicaoId=${edicaoId}&equipeId=${equipeId || ''}&prevId=${prevId}&nextId=${nextId}`
  }

  const setaEsquerdaHref = questoes.length > 0 ? hrefQuestao(questoes[questoes.length - 1], questoes.length - 1) : ''
  const setaDireitaHref = questoes.length > 0 ? hrefQuestao(questoes[0], 0) : ''

  const progressWidth = useMemo(() => ((rodadaAtual + 1) / FOTOS.length) * 100, [rodadaAtual])

  const loadRound = (index, nextImagens = imagens) => {
    const salva = nextImagens[String(FOTOS[index].id)]
    setAnoSelecionado(salva?.ano || 1950)
    setLocalSelecionado(salva?.lat != null && salva?.lng != null ? { lat: salva.lat, lng: salva.lng } : null)
    setImageZoom(1)
    setImagePosition({ x: 0, y: 0 })
    setImagemOk(true)
  }

  const goToRound = (index, nextImagens = imagens) => {
    if (index < 0 || index >= FOTOS.length) return
    setRodadaAtual(index)
    loadRound(index, nextImagens)
  }

  useEffect(() => {
    if (!isLocalDevHost()) return
    setLocalPreview(true)
    setCarregando(false)
    setFase((atual) => atual || { tarefa: { titulo: 'Viagem no Tempo', pontuacao: 20 }, peso: 0, status: 'aberta' })
    const salvo = lerProgressoLocal(faseId)
    if (!salvo) return
    const nextImagens = salvo.imagens || {}
    setImagens(nextImagens)
    setStatus(salvo.status || 'pendente')
    setRespostaPesoAnterior(salvo.status === 'entregue' ? (salvo.peso || 0) : 0)
    setAtualizadoEm(salvo.atualizadoEm || '')
    setAtualizadoPor(salvo.atualizadoPor || '')
    const primeira = nextImagens['1']
    if (primeira?.ano) setAnoSelecionado(primeira.ano)
    if (primeira?.lat != null && primeira?.lng != null) setLocalSelecionado({ lat: primeira.lat, lng: primeira.lng })
  }, [faseId])

  useEffect(() => {
    if (!edicaoId || !faseId) return
    const carregarQuestoes = async () => {
      try {
        const faseSnap = await getDoc(doc(db, 'edicoes', edicaoId, 'fases', faseId))
        if (!faseSnap.exists()) return
        const data = faseSnap.data()
        setFase((atual) => ({
          ...(atual || {}),
          ...data,
          id: faseSnap.id,
          tarefa: data.tarefa || atual?.tarefa || { titulo: 'Tarefa', pontuacao: 20 },
        }))
        const lista = [...(data.questoesIndex || data.questoes || [])].sort((a, b) => (a.numero || 0) - (b.numero || 0))
        setQuestoes(lista.filter((q) => q.id))
      } catch {
        /* regras podem bloquear na prévia sem login */
      }
    }
    carregarQuestoes()
  }, [edicaoId, faseId])

  useEffect(() => {
    if (isLocalDevHost()) return
    if (!loading && !authUser) router.push('/login')
  }, [loading, authUser, router])

  useEffect(() => {
    if (isLocalDevHost()) return
    if (!loading && authUser && (!equipeId || !faseId || !edicaoId)) {
      setErro('Faltam equipeId, faseId ou edicaoId. Volte pelo resumo da fase.')
      setCarregando(false)
    }
  }, [localPreview, loading, authUser, equipeId, faseId, edicaoId])

  useEffect(() => {
    if (localPreview || !authUser || !equipeId || !faseId || !edicaoId) return

    const carregar = async () => {
      try {
        const equipeSnap = await getDoc(doc(db, 'equipes', equipeId))
        if (!equipeSnap.exists()) {
          router.push(userData?.tipo === 'professor' ? '/home-professor' : '/home')
          return
        }
        const equipe = equipeSnap.data()
        const membroAtivo = (equipe.membros || []).some((m) => m.uid === authUser.uid && m.status === 'ativo')
        if (!membroAtivo) {
          router.push(userData?.tipo === 'professor' ? '/home-professor' : '/home')
          return
        }

        const faseSnap = await getDoc(doc(db, 'edicoes', edicaoId, 'fases', faseId))
        if (!faseSnap.exists()) {
          setErro('Fase não encontrada.')
          setCarregando(false)
          return
        }
        const faseData = { id: faseSnap.id, ...faseSnap.data() }
        if (faseData.status !== 'aberta' && faseData.status !== 'correcao') {
          router.push(userData?.tipo === 'professor' ? '/home-professor' : '/home')
          return
        }
        setFase(faseData)

        const respostaId = `tarefa_${faseId}`
        const rSnap = await getDoc(doc(db, 'equipes', equipeId, 'respostas', respostaId))
        if (rSnap.exists()) {
          const r = rSnap.data()
          const nextImagens = r.imagens || {}
          setImagens(nextImagens)
          setStatus(r.status || 'pendente')
          setRespostaPesoAnterior(r.status === 'entregue' ? (r.peso || 0) : 0)
          setAtualizadoEm(r.atualizadoEm || '')
          setAtualizadoPor(r.atualizadoPor || '')
          const primeira = nextImagens['1']
          if (primeira?.ano) setAnoSelecionado(primeira.ano)
          if (primeira?.lat != null && primeira?.lng != null) {
            setLocalSelecionado({ lat: primeira.lat, lng: primeira.lng })
          }
        }
      } catch (err) {
        setErro(err?.message || 'Não foi possível carregar a tarefa.')
      } finally {
        setCarregando(false)
      }
    }

    carregar()
  }, [localPreview, authUser, equipeId, faseId, edicaoId, router, userData])

  useEffect(() => {
    const stages = [imageStageRef.current, fullscreenStageRef.current].filter(Boolean)
    if (stages.length === 0) return

    const onWheel = (event) => {
      event.preventDefault()
      const next = event.deltaY > 0 ? zoomRef.current - 0.1 : zoomRef.current + 0.1
      const clamped = Math.max(1, Math.min(next, 5))
      setImageZoom(clamped)
      if (clamped === 1) setImagePosition({ x: 0, y: 0 })
    }

    stages.forEach((el) => el.addEventListener('wheel', onWheel, { passive: false }))
    return () => {
      stages.forEach((el) => el.removeEventListener('wheel', onWheel))
    }
  }, [isImageFullscreen, status, fotoAtual])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape') return
      if (isImageFullscreen) {
        setIsImageFullscreen(false)
        return
      }
      if (isPainelFullscreen) setIsPainelFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isImageFullscreen, isPainelFullscreen])

  useEffect(() => {
    if (!isPainelFullscreen && !isImageFullscreen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isPainelFullscreen, isImageFullscreen])

  const handleZoomChange = (newZoom) => {
    const clampedZoom = Math.max(1, Math.min(newZoom, 5))
    setImageZoom(clampedZoom)
    if (clampedZoom === 1) setImagePosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (event) => {
    if (imageZoom <= 1) return
    event.preventDefault()
    setIsDragging(true)
    startDragPos.current = {
      x: event.clientX - imagePosition.x,
      y: event.clientY - imagePosition.y,
    }
  }

  const handleMouseMove = (event) => {
    if (!isDragging || imageZoom <= 1) return
    event.preventDefault()
    const imageEl = imageRef.current
    const newX = event.clientX - startDragPos.current.x
    const newY = event.clientY - startDragPos.current.y
    if (!imageEl) {
      setImagePosition({ x: newX, y: newY })
      return
    }
    const maxX = (imageEl.offsetWidth * imageZoom - imageEl.offsetWidth) / 2
    const maxY = (imageEl.offsetHeight * imageZoom - imageEl.offsetHeight) / 2
    setImagePosition({
      x: Math.max(-maxX, Math.min(maxX, newX)),
      y: Math.max(-maxY, Math.min(maxY, newY)),
    })
  }

  const handleMouseUp = () => setIsDragging(false)

  const imageTransform = `scale(${imageZoom}) translate(${imagePosition.x / imageZoom}px, ${imagePosition.y / imageZoom}px)`

  const salvar = async (novoStatus, proximasImagens = imagens) => {
    if (locked && novoStatus === 'rascunho') return
    if (status === 'entregue') {
      setMensagem('Tarefa já entregue.')
      return
    }
    if (novoStatus === 'entregue' && !todasImagensEmRascunho(proximasImagens)) {
      setMensagem('As imagens precisam estar salvas em rascunho uma por uma.')
      return
    }

    const pontosTarefa = calcularPontosTarefa(proximasImagens, fase?.tarefa?.pontuacao || 20)
    setSalvando(true)
    setMensagem('')

    if (localPreview) {
      const agora = new Date().toISOString()
      const payload = {
        imagens: proximasImagens,
        status: novoStatus,
        peso: pontosTarefa,
        atualizadoEm: agora,
        atualizadoPor: 'prévia local',
      }
      gravarProgressoLocal(faseId, payload)
      setImagens(proximasImagens)
      setStatus(novoStatus)
      setRespostaPesoAnterior(novoStatus === 'entregue' ? pontosTarefa : 0)
      setAtualizadoEm(agora)
      setAtualizadoPor('prévia local')
      setMensagem(novoStatus === 'entregue' ? 'Tarefa entregue (só nesta prévia).' : 'Rascunho da imagem salvo (só nesta prévia).')
      setSalvando(false)
      return
    }

    try {
      const { novoPeso, respostaObj } = await persistirResposta({
        equipeId,
        faseId,
        status: novoStatus,
        imagens: proximasImagens,
        pontosTarefa,
        respostaPesoAnterior,
        atualizadoPor: userData?.nome || authUser.email,
        pesoFase: fase?.peso || 0,
      })
      setImagens(proximasImagens)
      setStatus(novoStatus)
      setRespostaPesoAnterior(novoPeso)
      setAtualizadoEm(respostaObj.atualizadoEm)
      setAtualizadoPor(respostaObj.atualizadoPor)
      setMensagem(novoStatus === 'entregue' ? 'Tarefa entregue!' : 'Rascunho da imagem salvo.')
    } catch (err) {
      setMensagem(err?.message || 'Não foi possível salvar agora.')
    } finally {
      setSalvando(false)
    }
  }

  const salvarRascunhoImagem = () => {
    if (locked) return
    if (!localSelecionado || !anoSelecionado) {
      setMensagem('Selecione um ano e marque um local no mapa antes de salvar.')
      return
    }
    const id = String(fotoAtual.id)
    const proximas = {
      ...imagens,
      [id]: {
        ano: anoSelecionado,
        lat: localSelecionado.lat,
        lng: localSelecionado.lng,
        status: 'rascunho',
      },
    }
    salvar('rascunho', proximas)
  }

  const entregarTarefa = () => {
    if (locked) return
    if (!todasImagensEmRascunho(imagens)) {
      setMensagem('As imagens precisam estar salvas em rascunho uma por uma.')
      return
    }
    if (!window.confirm('Tem certeza? Não será possível alterar depois.')) return
    salvar('entregue', imagens)
  }

  if (!localPreview && (loading || carregando || !authUser)) {
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
        <Link href={equipeId && faseId && edicaoId ? resumoHref : '/home'} className="text-blue-600 hover:underline">
          Voltar
        </Link>
      </div>
    )
  }

  if (status === 'entregue') {
    return (
      <div className={poppins.className}>
        <div className="min-h-screen w-full bg-white text-black">
          <Header userData={userData} equipeId={equipeId} logout={localPreview ? () => {} : logout} />
          <section className="flex flex-col items-center px-5 py-20 text-center">
            <h1 className="text-3xl font-medium text-[#82181A] md:text-4xl">Tarefa entregue</h1>
            <p className="mt-4 max-w-lg text-base text-neutral-700">
              As respostas foram registradas e não podem mais ser alteradas.
            </p>
            {atualizadoEm && (
              <p className="mt-3 text-sm text-neutral-500">{formatAudit(atualizadoEm, atualizadoPor, true)}</p>
            )}
            <Link
              href={resumoHref}
              className="mt-10 cursor-pointer bg-[#82181A] px-8 py-3 font-medium text-white transition-colors hover:bg-[#631214]"
            >
              Voltar para o resumo da fase
            </Link>
          </section>
          <Footer />
        </div>
      </div>
    )
  }

  return (
    <div className={poppins.className}>
      <div className="min-h-screen w-full bg-white text-black">
        <Header userData={userData} equipeId={equipeId} logout={localPreview ? () => {} : logout} />

        {localPreview && (
          <p className="bg-[#82181A] px-4 py-2 text-center text-sm text-white">
            Prévia local — sem login e sem Firestore. Em produção o acesso continua autenticado.
          </p>
        )}

        <section className="pb-20">
          <div className="mx-auto grid max-w-[720px] grid-cols-[44px_1fr_44px] items-center px-4 pt-12 md:pt-[4.5rem]">
            <div className="justify-self-start">
              {setaEsquerdaHref ? (
                <Link href={setaEsquerdaHref} className="flex h-10 w-10 items-center justify-center" aria-label="Questão anterior">
                  <span className="border-y-[7px] border-y-transparent border-r-[10px] border-r-black" />
                </Link>
              ) : (
                <span className="flex h-10 w-10 items-center justify-center opacity-25" aria-hidden>
                  <span className="border-y-[7px] border-y-transparent border-r-[10px] border-r-black" />
                </span>
              )}
            </div>
            <div className="text-center">
              <h1 className="text-[1.85rem] font-light leading-none text-[#82181A] md:text-[2.25rem]">
                {titulo}
              </h1>
            </div>
            <div className="justify-self-end">
              {setaDireitaHref ? (
                <Link href={setaDireitaHref} className="flex h-10 w-10 items-center justify-center" aria-label="Primeira questão">
                  <span className="border-y-[7px] border-y-transparent border-l-[10px] border-l-black" />
                </Link>
              ) : (
                <span className="flex h-10 w-10 items-center justify-center opacity-25" aria-hidden>
                  <span className="border-y-[7px] border-y-transparent border-l-[10px] border-l-black" />
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-center px-4">
            {PDF_DRIVE_URL ? (
              <a
                href={PDF_DRIVE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer rounded-full border-[3px] border-[#82181A] px-6 py-2 text-sm font-medium text-[#82181A] transition-colors hover:bg-[#82181A] hover:text-white"
              >
                Baixar PDF da tarefa
              </a>
            ) : (
              <span className="rounded-full border-[3px] border-neutral-300 px-6 py-2 text-sm font-medium text-neutral-400">
                Baixar PDF da tarefa
              </span>
            )}
          </div>

          <div className="mx-auto max-w-3xl whitespace-pre-line px-5 pt-10 text-justify text-[1rem] font-medium leading-relaxed text-[#2F2F2F] md:pt-14">
            {INSTRUCAO}
          </div>

          <div className="mx-auto mt-10 max-w-7xl px-4">
            {isPainelFullscreen && (
              <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md" aria-hidden />
            )}

            <div className={isPainelFullscreen ? 'fixed inset-0 z-50 overflow-y-auto p-4 md:p-8' : ''}>
              {isPainelFullscreen && (
                <button
                  type="button"
                  onClick={() => setIsPainelFullscreen(false)}
                  className="fixed top-4 right-4 z-[55] cursor-pointer bg-black/60 px-3 py-1 text-4xl leading-none text-white hover:text-red-200"
                  aria-label="Sair da tela cheia"
                >
                  ×
                </button>
              )}

              <div className={`mb-6 border border-neutral-200 bg-[#F7F7F7] p-4 md:p-5 ${isPainelFullscreen ? 'mx-auto max-w-7xl' : ''}`}>
                <div className="mb-3 h-2.5 w-full bg-red-100">
                  <div className="h-2.5 bg-[#82181A] transition-all duration-500" style={{ width: `${progressWidth}%` }} />
                </div>
                <div className="mb-4 text-center text-sm font-semibold">
                  Fotografia {rodadaAtual + 1} de {FOTOS.length}
                  {status === 'rascunho' ? ' · Status da tarefa: Rascunho' : ''}
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToRound(rodadaAtual - 1)}
                    disabled={rodadaAtual === 0}
                    className="cursor-pointer bg-[#82181A] px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    Anterior
                  </button>
                  {FOTOS.map((foto, index) => {
                    const salva = imagens[String(foto.id)]
                    return (
                      <button
                        key={foto.id}
                        type="button"
                        onClick={() => goToRound(index)}
                        className={`h-9 w-9 cursor-pointer border-2 text-sm font-bold ${index === rodadaAtual ? 'ring-2 ring-[#82181A] ring-offset-2' : ''} ${
                          salva?.status === 'rascunho'
                            ? 'border-yellow-500 bg-yellow-500 text-black'
                            : 'border-[#82181A] bg-white text-[#82181A]'
                        }`}
                        title={`Imagem ${index + 1}`}
                      >
                        {index + 1}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => goToRound(rodadaAtual + 1)}
                    disabled={rodadaAtual >= FOTOS.length - 1}
                    className="cursor-pointer bg-[#82181A] px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    Próxima
                  </button>
                </div>
              </div>

              <div className={`mb-6 border border-neutral-200 bg-white p-4 md:p-6 ${isPainelFullscreen ? 'mx-auto max-w-7xl' : ''}`}>
                <div className="mb-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsPainelFullscreen((aberto) => !aberto)}
                    className="cursor-pointer border border-[#82181A] px-3 py-1.5 text-xs font-bold uppercase text-[#82181A] hover:bg-[#82181A] hover:text-white"
                  >
                    {isPainelFullscreen ? 'Sair da tela cheia' : 'Expandir'}
                  </button>
                </div>
                <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="relative" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                    <div ref={imageStageRef} className={`flex w-full items-center justify-center overflow-hidden bg-neutral-900 overscroll-contain ${isPainelFullscreen ? 'min-h-[42vh] md:min-h-[52vh]' : 'min-h-[280px] md:min-h-[360px]'}`}>
                      {imagemOk ? (
                        <div
                          ref={imageRef}
                          className={`flex h-full w-full items-center justify-center ${imageZoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
                          onMouseDown={handleMouseDown}
                        >
                          <img
                            src={fotoSrc(fotoAtual.id)}
                            alt={`Fotografia histórica ${rodadaAtual + 1}`}
                            className={`max-w-full object-contain ${isPainelFullscreen ? 'max-h-[52vh] md:max-h-[60vh]' : 'max-h-[360px] md:max-h-[420px]'}`}
                            style={{ transform: imageTransform, transition: isDragging ? 'none' : 'transform 0.1s ease-out' }}
                            onError={() => setImagemOk(false)}
                          />
                        </div>
                      ) : (
                        <p className="px-4 text-center text-sm text-white/80">
                          Coloque {fotoAtual.id}.webp em /public/tarefas/viagem-no-tempo/
                        </p>
                      )}
                    </div>
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <button type="button" onClick={() => handleZoomChange(imageZoom - 0.2)} className="h-8 w-8 cursor-pointer bg-black/65 text-lg font-bold text-white hover:bg-black/85" title="Diminuir zoom">-</button>
                      <button type="button" onClick={() => handleZoomChange(imageZoom + 0.2)} className="h-8 w-8 cursor-pointer bg-black/65 text-lg font-bold text-white hover:bg-black/85" title="Aumentar zoom">+</button>
                      <button type="button" onClick={() => setIsImageFullscreen(true)} className="h-8 cursor-pointer bg-black/65 px-3 text-xs font-bold text-white hover:bg-black/85" title="Tela cheia">Tela cheia</button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    <div className={`relative w-full overflow-hidden shadow-lg ${isPainelFullscreen ? 'h-[42vh] min-h-[320px]' : 'h-[320px]'}`}>
                      <TravelMap
                        key={rodadaAtual}
                        layoutTick={isPainelFullscreen}
                        markerPosition={localSelecionado}
                        setMarker={locked ? () => {} : setLocalSelecionado}
                        readOnly={locked}
                      />
                    </div>
                    <div>
                      <h2 className="mb-3 text-xl font-bold text-[#82181A]">Ano selecionado</h2>
                      <input
                        type="range"
                        min="1500"
                        max="2025"
                        value={anoSelecionado || 1950}
                        onChange={(event) => setAnoSelecionado(parseInt(event.target.value, 10))}
                        className="w-full accent-[#82181A]"
                        disabled={locked}
                      />
                      <p className="mt-2 text-4xl font-bold text-[#82181A]">{anoSelecionado}</p>
                    </div>
                  </div>
                </div>
              </div>

              {!locked && (
                <div className="mt-8 flex flex-col items-center justify-center gap-4 px-4 sm:flex-row sm:gap-24">
                  <button
                    type="button"
                    disabled={salvando}
                    onClick={salvarRascunhoImagem}
                    className="min-w-[190px] cursor-pointer border-2 border-[#8A7007] bg-[#C5A00A] px-6 py-3 text-sm font-medium uppercase text-white transition-colors hover:bg-[#B08F09] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Salvar rascunho da imagem
                  </button>
                  <button
                    type="button"
                    disabled={salvando}
                    onClick={entregarTarefa}
                    className={`min-w-[210px] cursor-pointer border-2 px-6 py-3 text-sm font-medium uppercase text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      rascunhosCompletos
                        ? 'border-[#0F4D00] bg-[#197400] hover:bg-[#156300]'
                        : 'border-neutral-400 bg-neutral-400'
                    }`}
                  >
                    Entregar tarefa
                  </button>
                </div>
              )}

              {mensagem && (
                <div className={`mx-auto mt-8 max-w-md rounded-lg p-4 text-center font-medium ${
                  mensagem.includes('precisam') || mensagem.includes('Selecione') || mensagem.includes('Não foi')
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {mensagem}
                </div>
              )}
            </div>

            <div className="mt-10 space-y-2 px-4 text-center text-sm text-neutral-500">
              {atualizadoEm && status === 'rascunho' && (
                <p>{formatAudit(atualizadoEm, atualizadoPor, false)}</p>
              )}
            </div>

            <div className="mt-12 flex justify-center">
              <Link href={resumoHref} className="text-sm font-medium text-neutral-500 transition-colors hover:text-[#82181A] hover:underline">
                Voltar para lista de questões
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>

      {isImageFullscreen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
          <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/20 p-2">
              <button type="button" onClick={() => handleZoomChange(imageZoom - 0.2)} className="h-9 w-9 cursor-pointer bg-black/60 text-2xl font-bold text-white hover:bg-black/85">-</button>
              <span className="min-w-12 text-center font-semibold text-white">{Math.round(imageZoom * 100)}%</span>
              <button type="button" onClick={() => handleZoomChange(imageZoom + 0.2)} className="h-9 w-9 cursor-pointer bg-black/60 text-2xl font-bold text-white hover:bg-black/85">+</button>
            </div>
            <button type="button" onClick={() => setIsImageFullscreen(false)} className="cursor-pointer text-4xl text-white hover:text-red-400" aria-label="Fechar tela cheia">
              ×
            </button>
          </div>
          <div ref={fullscreenStageRef} className="h-full w-full overflow-hidden overscroll-contain">
            <div
              ref={imageRef}
              className={`flex h-full w-full items-center justify-center ${imageZoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
              onMouseDown={handleMouseDown}
            >
              <img
                src={fotoSrc(fotoAtual.id)}
                alt={`Fotografia histórica ${rodadaAtual + 1} em tela cheia`}
                style={{ transform: imageTransform, objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className={`${poppins.className} flex min-h-screen w-full items-center justify-center`}><p className="text-lg text-[#82181A]">Carregando...</p></div>}>
      <TarefaContent />
    </Suspense>
  )
}
