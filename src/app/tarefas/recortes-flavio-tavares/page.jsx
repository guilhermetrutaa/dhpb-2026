'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Poppins } from 'next/font/google'
import { doc, getDoc, increment, runTransaction } from 'firebase/firestore'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import {
  FRASES,
  FUNDO_SRC,
  IMAGEM_SRC,
  INSTRUCAO,
  PDF_DRIVE_URL,
  PONTOS,
  calcularPontosTarefa,
  frasePorLetra,
  recorteSrc,
} from './config'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

function isLocalDevHost() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
}

const STORAGE_PREFIX = 'dhpb-tarefa-migalhas-flavio-tavares'

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

function pinClass(letra, status, letraSalva) {
  if (status === 'entregue' && letra && letra === letraSalva) return 'bg-[#2F7A4A]'
  if (letra && letra === letraSalva && status === 'rascunho') return 'bg-[#C5A00A]'
  if (letra) return 'bg-[#4A4A4A]'
  return 'bg-[#8A8A8A]'
}

function cardClass(letra, status, letraSalva) {
  if (status === 'entregue' && letra && letra === letraSalva) return 'bg-[#CCFFE6]'
  if (letra && letra === letraSalva && status === 'rascunho') return 'bg-[#C5A00A] text-white'
  if (letra) return 'bg-[#4A4A4A] text-white'
  return 'bg-[#F7F7F7]'
}

async function persistirResposta({
  equipeId,
  faseId,
  status,
  associacoes,
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
    associacoes,
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
  const [associacoes, setAssociacoes] = useState({})
  const [associacoesSalvas, setAssociacoesSalvas] = useState({})
  const [status, setStatus] = useState('pendente')
  const [respostaPesoAnterior, setRespostaPesoAnterior] = useState(0)
  const [atualizadoEm, setAtualizadoEm] = useState('')
  const [atualizadoPor, setAtualizadoPor] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [modalPonto, setModalPonto] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [recorteOk, setRecorteOk] = useState(true)
  const [imagemOk, setImagemOk] = useState(true)
  const [localPreview, setLocalPreview] = useState(false)
  const [questoes, setQuestoes] = useState([])

  const resumoHref = `/resumo-fase?faseId=${faseId || ''}&edicaoId=${edicaoId || ''}&equipeId=${equipeId || ''}`
  const locked = status === 'entregue' || fase?.status === 'correcao'
  const titulo = fase?.tarefa?.titulo || 'Tarefa'

  const hrefQuestao = (q, idx) => {
    if (!q?.id || !faseId || !edicaoId) return ''
    const prevId = idx > 0 ? questoes[idx - 1]?.id || '' : ''
    const nextId = idx < questoes.length - 1 ? questoes[idx + 1]?.id || '' : ''
    return `/questao?questaoId=${q.id}&faseId=${faseId}&edicaoId=${edicaoId}&equipeId=${equipeId || ''}&prevId=${prevId}&nextId=${nextId}`
  }

  const setaEsquerdaHref = questoes.length > 0 ? hrefQuestao(questoes[questoes.length - 1], questoes.length - 1) : ''
  const setaDireitaHref = questoes.length > 0 ? hrefQuestao(questoes[0], 0) : ''

  useEffect(() => {
    if (!isLocalDevHost()) return
    setLocalPreview(true)
    setCarregando(false)
    setFase((atual) => atual || { tarefa: { titulo: 'Tarefa', pontuacao: 20 }, peso: 0, status: 'aberta' })
    const salvo = lerProgressoLocal(faseId)
    if (!salvo) return
    setAssociacoes(salvo.associacoes || {})
    setAssociacoesSalvas(salvo.associacoes || {})
    setStatus(salvo.status || 'pendente')
    setRespostaPesoAnterior(salvo.status === 'entregue' ? (salvo.peso || 0) : 0)
    setAtualizadoEm(salvo.atualizadoEm || '')
    setAtualizadoPor(salvo.atualizadoPor || '')
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
          setAssociacoes(r.associacoes || {})
          setAssociacoesSalvas(r.associacoes || {})
          setStatus(r.status || 'pendente')
          setRespostaPesoAnterior(r.status === 'entregue' ? (r.peso || 0) : 0)
          setAtualizadoEm(r.atualizadoEm || '')
          setAtualizadoPor(r.atualizadoPor || '')
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
    if (modalPonto == null) return
    const originalOverflow = document.body.style.overflow
    const onKey = (event) => {
      if (event.key === 'Escape') setModalPonto(null)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [modalPonto])

  const letrasUsadas = useMemo(() => {
    const usadas = new Set()
    Object.entries(associacoes).forEach(([id, letra]) => {
      if (letra && String(id) !== String(modalPonto)) usadas.add(letra)
    })
    return usadas
  }, [associacoes, modalPonto])

  const completas = PONTOS.every((p) => associacoes[String(p.id)])

  const salvar = async (novoStatus, proximasAssociacoes = associacoes) => {
    if (locked && novoStatus === 'rascunho') return
    if (status === 'entregue') {
      setMensagem('Tarefa já entregue.')
      return
    }
    if (novoStatus === 'entregue' && !completas) {
      setMensagem('Associe os 20 números antes de entregar.')
      return
    }

    const pontosTarefa = calcularPontosTarefa(proximasAssociacoes, fase?.tarefa?.pontuacao || 20)
    setSalvando(true)
    setMensagem('')

    if (localPreview) {
      const agora = new Date().toISOString()
      const payload = {
        associacoes: proximasAssociacoes,
        status: novoStatus,
        peso: pontosTarefa,
        atualizadoEm: agora,
        atualizadoPor: 'prévia local',
      }
      gravarProgressoLocal(faseId, payload)
      setAssociacoes(proximasAssociacoes)
      setAssociacoesSalvas(proximasAssociacoes)
      setStatus(novoStatus)
      setRespostaPesoAnterior(novoStatus === 'entregue' ? pontosTarefa : 0)
      setAtualizadoEm(agora)
      setAtualizadoPor('prévia local')
      setMensagem(novoStatus === 'entregue' ? 'Tarefa entregue (só nesta prévia).' : 'Rascunho salvo (só nesta prévia).')
      setSalvando(false)
      return
    }

    try {
      const { novoPeso, respostaObj } = await persistirResposta({
        equipeId,
        faseId,
        status: novoStatus,
        associacoes: proximasAssociacoes,
        pontosTarefa,
        respostaPesoAnterior,
        atualizadoPor: userData?.nome || authUser.email,
        pesoFase: fase?.peso || 0,
      })
      setAssociacoes(proximasAssociacoes)
      setAssociacoesSalvas(proximasAssociacoes)
      setStatus(novoStatus)
      setRespostaPesoAnterior(novoPeso)
      setAtualizadoEm(respostaObj.atualizadoEm)
      setAtualizadoPor(respostaObj.atualizadoPor)
      setMensagem(novoStatus === 'entregue' ? 'Tarefa entregue!' : 'Rascunho salvo.')
    } catch (err) {
      setMensagem(err?.message || 'Não foi possível salvar agora.')
    } finally {
      setSalvando(false)
    }
  }

  const abrirPonto = (id) => {
    if (locked) return
    setZoomLevel(1)
    setRecorteOk(true)
    setModalPonto(id)
  }

  const escolherFrase = (letra) => {
    if (locked || modalPonto == null) return
    if (letrasUsadas.has(letra)) return
    setAssociacoes((prev) => ({ ...prev, [String(modalPonto)]: letra }))
  }

  const irPontoModal = (direcao) => {
    const idx = PONTOS.findIndex((p) => p.id === modalPonto)
    if (idx < 0) return
    const proximo = PONTOS[(idx + direcao + PONTOS.length) % PONTOS.length]
    setZoomLevel(1)
    setRecorteOk(true)
    setModalPonto(proximo.id)
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
                Baixar Gabarito da tarefa
              </a>
            ) : (
              <span className="rounded-full border-[3px] border-neutral-300 px-6 py-2 text-sm font-medium text-neutral-400">
                Baixar Gabarito da tarefa
              </span>
            )}
          </div>

          <div className="mx-auto max-w-3xl whitespace-pre-line px-5 pt-10 text-justify text-[1rem] font-medium leading-relaxed text-[#2F2F2F] md:pt-14">
            {INSTRUCAO}
          </div>

          <div className="relative mx-auto mt-10 max-w-5xl overflow-x-auto px-4">
            <div className="relative mx-auto inline-block min-w-[720px] md:min-w-0 md:w-full">
              {imagemOk ? (
                <img
                  src={IMAGEM_SRC}
                  alt="Imagem central da tarefa"
                  className="w-full max-w-5xl border-2 border-gray-300 bg-[#F7F7F7]"
                  onError={() => setImagemOk(false)}
                />
              ) : (
                <div className="flex aspect-[4/3] w-full max-w-5xl items-center justify-center border-2 border-dashed border-neutral-300 bg-[#F7F7F7] text-sm text-neutral-500">
                  Coloque imagem-central.jpg em /public/tarefas/migalhas-flavio-tavares/
                </div>
              )}

              {PONTOS.map((ponto) => {
                const letra = associacoes[String(ponto.id)]
                return (
                  <button
                    key={ponto.id}
                    type="button"
                    disabled={locked}
                    onClick={() => abrirPonto(ponto.id)}
                    className={`absolute flex min-w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold text-white transition-transform ${pinClass(letra, status, associacoesSalvas[String(ponto.id)])} ${locked ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
                    style={{ top: ponto.top, left: ponto.left }}
                  >
                    {letra ? `${ponto.id} ${letra}` : ponto.id}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
            {PONTOS.map((ponto) => {
              const letra = associacoes[String(ponto.id)]
              return (
                <button
                  key={ponto.id}
                  type="button"
                  disabled={locked}
                  onClick={() => abrirPonto(ponto.id)}
                  className={`min-h-[86px] p-3 text-left transition-colors ${cardClass(letra, status, associacoesSalvas[String(ponto.id)])} ${locked ? 'cursor-default' : 'cursor-pointer hover:opacity-90'}`}
                >
                  <p className="text-base font-medium">
                    {letra ? `${ponto.id} - ${letra}` : ponto.id}
                  </p>
                  <p className={`mt-1 line-clamp-3 text-sm ${letra && status !== 'entregue' ? 'text-white/90' : 'text-[#333]'}`}>
                    {letra ? frasePorLetra(letra) : 'Selecione uma opção'}
                  </p>
                </button>
              )
            })}
          </div>

          {!locked && (
            <div className="mt-12 flex flex-col items-center justify-center gap-4 px-4 sm:flex-row sm:gap-24">
              <button
                type="button"
                disabled={salvando}
                onClick={() => salvar('rascunho')}
                className="min-w-[190px] cursor-pointer rounded-none border-2 border-[#8A7007] bg-[#C5A00A] px-6 py-3 text-sm font-medium uppercase text-white transition-colors hover:bg-[#B08F09] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Salvar rascunho
              </button>
              <button
                type="button"
                disabled={!completas || salvando}
                onClick={() => {
                  if (window.confirm('Tem certeza? Não será possível alterar depois.')) {
                    salvar('entregue')
                  }
                }}
                className="min-w-[210px] cursor-pointer rounded-none border-2 border-[#0F4D00] bg-[#197400] px-6 py-3 text-sm font-medium uppercase text-white transition-colors hover:bg-[#156300] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Entregar tarefa
              </button>
            </div>
          )}

          {mensagem && (
            <div className="mx-auto mt-8 max-w-md rounded-lg bg-green-100 p-4 text-center font-medium text-green-800">
              {mensagem}
            </div>
          )}

          <div className="mt-10 space-y-2 px-4 text-center text-sm text-neutral-500">
            {atualizadoEm && status === 'rascunho' && (
              <p>{formatAudit(atualizadoEm, atualizadoPor, false)}</p>
            )}
            {atualizadoEm && status === 'entregue' && (
              <p>{formatAudit(atualizadoEm, atualizadoPor, true)}</p>
            )}
          </div>

          <div className="mt-12 flex justify-center">
            <Link href={resumoHref} className="text-sm font-medium text-neutral-500 transition-colors hover:text-[#82181A] hover:underline">
              Voltar para lista de questões
            </Link>
          </div>
        </section>

        <Footer />
      </div>

      {modalPonto != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#5A5A5A] p-3 text-[#000] md:p-6">
          <div className="flex h-[96vh] w-[96vw] max-w-[1600px] flex-col overflow-hidden bg-white shadow-2xl lg:flex-row">
            <div
              className="relative flex min-h-[42vh] flex-[1.6] items-center justify-center overflow-hidden bg-cover bg-center lg:min-h-0"
              style={{ backgroundImage: `url(${FUNDO_SRC})` }}
            >
              <button
                type="button"
                onClick={() => setModalPonto(null)}
                className="absolute right-3 top-3 z-10 cursor-pointer bg-black/50 px-3 py-1 text-xl text-white hover:bg-black/70 lg:hidden"
                aria-label="Fechar"
              >
                ×
              </button>
              {recorteOk ? (
                <img
                  src={recorteSrc(modalPonto)}
                  alt={`Recorte do ponto ${modalPonto}`}
                  className="absolute inset-0 h-full w-full object-contain transition-transform duration-200 ease-in-out"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
                  onError={() => setRecorteOk(false)}
                />
              ) : (
                <p className="relative z-10 px-4 text-center text-sm text-white/80">Recorte pendente em /recortes/{modalPonto}.svg</p>
              )}
              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded bg-black/45 px-3 py-2">
                <button type="button" onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.1))} className="cursor-pointer bg-white/90 px-3 py-1 text-sm">−</button>
                <input type="range" min="0.5" max="3" step="0.1" value={zoomLevel} onChange={(event) => setZoomLevel(parseFloat(event.target.value))} className="w-36 accent-[#82181A] md:w-48" />
                <button type="button" onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.1))} className="cursor-pointer bg-white/90 px-3 py-1 text-sm">+</button>
              </div>
            </div>

            <div className="flex min-h-0 w-full flex-1 flex-col bg-white lg:max-w-[420px]">
              <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
                <button type="button" onClick={() => irPontoModal(-1)} className="cursor-pointer px-2 text-lg text-neutral-600 hover:text-[#82181A]" aria-label="Recorte anterior">
                  ‹
                </button>
                <h3 className="text-lg font-medium text-neutral-800">Recorte {modalPonto}</h3>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => irPontoModal(1)} className="cursor-pointer px-2 text-lg text-neutral-600 hover:text-[#82181A]" aria-label="Próximo recorte">
                    ›
                  </button>
                  <button type="button" onClick={() => setModalPonto(null)} className="cursor-pointer px-2 text-xl text-neutral-500 hover:text-[#82181A]" aria-label="Fechar">
                    ×
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {FRASES.map((frase, index) => {
                  const selecionada = associacoes[String(modalPonto)] === frase.id
                  const salva = associacoesSalvas[String(modalPonto)] === frase.id
                  const ocupada = letrasUsadas.has(frase.id)
                  const zebra = index % 2 === 0 ? 'bg-white' : 'bg-[#F3F3F3]'
                  let estado = zebra
                  let radio = 'border-neutral-400'
                  let radioDot = ''
                  if (selecionada && status === 'entregue' && salva) {
                    estado = 'bg-[#CCFFE6] text-[#1A3D22]'
                    radio = 'border-[#2F7A4A]'
                    radioDot = 'bg-[#2F7A4A]'
                  } else if (selecionada && status === 'rascunho' && salva) {
                    estado = 'bg-[#C5A00A] text-white'
                    radio = 'border-white'
                    radioDot = 'bg-white'
                  } else if (selecionada) {
                    estado = 'bg-[#4A4A4A] text-white'
                    radio = 'border-white'
                    radioDot = 'bg-white'
                  }
                  return (
                    <button
                      key={frase.id}
                      type="button"
                      disabled={ocupada || salvando}
                      onClick={() => escolherFrase(frase.id)}
                      className={`flex w-full items-start gap-3 px-4 py-3.5 text-left text-sm leading-snug transition-colors ${estado} ${ocupada ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:brightness-95'}`}
                    >
                      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${radio}`}>
                        {selecionada && <span className={`h-2 w-2 rounded-full ${radioDot}`} />}
                      </span>
                      <span>
                        <span className="font-semibold">{frase.id} — </span>
                        {frase.texto}
                      </span>
                    </button>
                  )
                })}
              </div>
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
