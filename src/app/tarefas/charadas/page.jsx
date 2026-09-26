'use client'

import React, { Suspense, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Poppins } from 'next/font/google'
import { doc, getDoc, increment, runTransaction } from 'firebase/firestore'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import {
  CAPACIDADES,
  DVD_ABERTO_SRC,
  DVD_ANIM,
  DVD_FECHADO_SRC,
  DVD_GEO,
  ENIGMAS,
  ICONE_SRC,
  INSTRUCAO,
  MIDIA_SRC,
  PDF_DRIVE_URL,
  PRATELEIRA_SRC,
  alocacaoCompleta,
  calcularPontosTarefa,
  idsAlocados,
  prateleirasVazias,
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

const STORAGE_PREFIX = 'dhpb-tarefa-charadas'

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

function normalizarPrateleiras(raw) {
  const base = prateleirasVazias()
  if (!raw) return base
  return {
    1: [...(raw[1] || raw['1'] || [])],
    2: [...(raw[2] || raw['2'] || [])],
    3: [...(raw[3] || raw['3'] || [])],
  }
}

function retirar(prateleiras, id) {
  const next = normalizarPrateleiras(prateleiras)
  next[1] = next[1].filter((item) => item !== id)
  next[2] = next[2].filter((item) => item !== id)
  next[3] = next[3].filter((item) => item !== id)
  return next
}

/** Faixa útil de cada nível do SVG da estante (% do frame 1122x1402 do Figma). */
const NIVEIS = {
  1: 'top-[8.5%] h-[13%]',
  2: 'top-[32%] h-[17%]',
  3: 'top-[54%] h-[20%]',
}

function mensagemCapacidade(bloco) {
  const teto = CAPACIDADES[bloco]
  return `Não pode haver mais de ${teto} enigmas nesta prateleira.`
}

async function persistirResposta({
  equipeId,
  faseId,
  status,
  prateleiras,
  enigmas,
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
    prateleiras,
    enigmas,
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

/**
 * Caixa de DVD que abre sozinha: a base mostra a bandeja com o CD e a tampa
 * gira 180° em torno da lombada real (DVD_GEO.eixoX). Frente = capa fechada,
 * verso = painel interno com o papel pautado e o texto da charada.
 */
function IconeEnigma({ id, index, comando, ativo, alocado, onClick }) {
  const { eixoX, folha, faceFrente, faceVerso, papel } = DVD_GEO
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Enigma ${id}: ${comando}`}
      className={`dvd-tile relative block w-full cursor-pointer transition-opacity duration-300 ${alocado ? 'opacity-35' : ''}`}
      style={{
        '--dvd-eixo': eixoX,
        '--dvd-dur': `${DVD_ANIM.duracaoMs}ms`,
        '--dvd-delay': `${DVD_ANIM.delayMs + index * DVD_ANIM.staggerMs}ms`,
      }}
    >
      <span className="dvd-palco block">
        <img src={DVD_ABERTO_SRC} alt="" className="dvd-base" draggable={false} />
        <span
          className="dvd-capa"
          style={{ left: eixoX, top: folha.topo, width: folha.largura, height: folha.altura }}
        >
          <span
            className="dvd-face"
            style={{
              backgroundImage: `url(${DVD_FECHADO_SRC})`,
              backgroundSize: faceFrente.size,
              backgroundPosition: faceFrente.position,
            }}
          />
          <span
            className="dvd-face dvd-face-verso"
            style={{
              backgroundImage: `url(${DVD_ABERTO_SRC})`,
              backgroundSize: faceVerso.size,
              backgroundPosition: faceVerso.position,
            }}
          >
            <span
              className="absolute line-clamp-[7] overflow-hidden text-left font-medium leading-[1.35] text-[#3B2A1E] [overflow-wrap:anywhere]"
              style={{
                left: papel.left,
                right: papel.right,
                top: papel.top,
                bottom: papel.bottom,
                paddingLeft: '15%',
                paddingRight: '6%',
                paddingTop: '6%',
                /* proporcional ao tile: o texto acompanha a escala do desenho */
                fontSize: '4.4cqw',
              }}
            >
              {comando}
            </span>
          </span>
        </span>
        {ativo && (
          <span className="pointer-events-none absolute inset-0 ring-[3px] ring-inset ring-[#82181A]" />
        )}
      </span>
    </button>
  )
}

function TarefaContent() {
  const { authUser, userData, loading, logout } = useAuth()
  const router = useRouter()
  const sp = useSearchParams()
  const equipeId = sp.get('equipeId')
  const faseId = sp.get('faseId')
  const edicaoId = sp.get('edicaoId')

  const [fase, setFase] = useState(null)
  const [prateleiras, setPrateleiras] = useState(prateleirasVazias)
  const [enigmas, setEnigmas] = useState({})
  const [status, setStatus] = useState('pendente')
  const [respostaPesoAnterior, setRespostaPesoAnterior] = useState(0)
  const [atualizadoEm, setAtualizadoEm] = useState('')
  const [atualizadoPor, setAtualizadoPor] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [alertaCapacidade, setAlertaCapacidade] = useState('')
  const [blocoAlerta, setBlocoAlerta] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [localPreview, setLocalPreview] = useState(false)
  const [questoes, setQuestoes] = useState([])
  const [selecionadoId, setSelecionadoId] = useState(null)
  const [detalheId, setDetalheId] = useState(null)

  const resumoHref = `/resumo-fase?faseId=${faseId || ''}&edicaoId=${edicaoId || ''}&equipeId=${equipeId || ''}`
  const locked = status === 'entregue' || fase?.status === 'correcao'
  const titulo = fase?.tarefa?.titulo || 'Tarefa'
  const alocados = idsAlocados(prateleiras)
  const completa = alocacaoCompleta(prateleiras)
  const detalhe = ENIGMAS.find((item) => item.id === detalheId)

  const hrefQuestao = (q, idx) => {
    if (!q?.id || !faseId || !edicaoId) return ''
    const prevId = idx > 0 ? questoes[idx - 1]?.id || '' : ''
    const nextId = idx < questoes.length - 1 ? questoes[idx + 1]?.id || '' : ''
    return `/questao?questaoId=${q.id}&faseId=${faseId}&edicaoId=${edicaoId}&equipeId=${equipeId || ''}&prevId=${prevId}&nextId=${nextId}`
  }

  const setaEsquerdaHref = questoes.length > 0 ? hrefQuestao(questoes[questoes.length - 1], questoes.length - 1) : ''
  const setaDireitaHref = questoes.length > 0 ? hrefQuestao(questoes[0], 0) : ''

  const aplicarSalvo = (salvo) => {
    setPrateleiras(normalizarPrateleiras(salvo.prateleiras))
    setEnigmas(salvo.enigmas || {})
    setStatus(salvo.status || 'pendente')
    setRespostaPesoAnterior(salvo.status === 'entregue' ? (salvo.peso || 0) : 0)
    setAtualizadoEm(salvo.atualizadoEm || '')
    setAtualizadoPor(salvo.atualizadoPor || '')
  }

  useEffect(() => {
    if (!isLocalDevHost()) return
    setLocalPreview(true)
    setCarregando(false)
    setFase((atual) => atual || { tarefa: { titulo: 'Charadas da locadora', pontuacao: 20 }, peso: 0, status: 'aberta' })
    const salvo = lerProgressoLocal(faseId)
    if (salvo) aplicarSalvo(salvo)
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
        /* prévia sem login */
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
        if (rSnap.exists()) aplicarSalvo(rSnap.data())
      } catch (err) {
        setErro(err?.message || 'Não foi possível carregar a tarefa.')
      } finally {
        setCarregando(false)
      }
    }

    carregar()
  }, [localPreview, authUser, equipeId, faseId, edicaoId, router, userData])

  useEffect(() => {
    if (!detalheId) return
    const onKey = (event) => {
      if (event.key === 'Escape') setDetalheId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detalheId])

  const abrirEnigma = (id) => {
    setSelecionadoId(id)
    setDetalheId(id)
    setAlertaCapacidade('')
    setBlocoAlerta(null)
  }

  const escolherOpcao = (letra) => {
    if (locked || !detalheId) return
    setEnigmas((atual) => ({
      ...atual,
      [detalheId]: { opcao: letra },
    }))
  }

  const colocarNaPrateleira = (bloco) => {
    if (locked) return
    if (!selecionadoId) {
      setMensagem('Clique primeiro em um enigma.')
      return
    }
    const limpo = retirar(prateleiras, selecionadoId)
    const fila = limpo[bloco]
    if (fila.length >= CAPACIDADES[bloco]) {
      setAlertaCapacidade(mensagemCapacidade(bloco))
      setBlocoAlerta(bloco)
      return
    }
    setPrateleiras({ ...limpo, [bloco]: [...fila, selecionadoId] })
    setAlertaCapacidade('')
    setBlocoAlerta(null)
    setSelecionadoId(null)
    setMensagem('')
  }

  const removerDaPrateleira = (id) => {
    if (locked) return
    setPrateleiras(retirar(prateleiras, id))
    setAlertaCapacidade('')
    setBlocoAlerta(null)
  }

  const salvar = async (novoStatus) => {
    if (locked && novoStatus === 'rascunho') return
    if (status === 'entregue') {
      setMensagem('Tarefa já entregue.')
      return
    }
    if (novoStatus === 'entregue' && !alocacaoCompleta(prateleiras)) {
      setMensagem('Coloque os 20 enigmas nas prateleiras (7, 7 e 6) antes de entregar.')
      return
    }

    const pontosTarefa = calcularPontosTarefa(prateleiras, fase?.tarefa?.pontuacao || 20)
    setSalvando(true)
    setMensagem('')

    if (localPreview) {
      const agora = new Date().toISOString()
      const payload = {
        prateleiras,
        enigmas,
        status: novoStatus,
        peso: pontosTarefa,
        atualizadoEm: agora,
        atualizadoPor: 'prévia local',
      }
      gravarProgressoLocal(faseId, payload)
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
        prateleiras,
        enigmas,
        pontosTarefa,
        respostaPesoAnterior,
        atualizadoPor: userData?.nome || authUser.email,
        pesoFase: fase?.peso || 0,
      })
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

  const entregarTarefa = () => {
    if (locked) return
    if (!alocacaoCompleta(prateleiras)) {
      setMensagem('Coloque os 20 enigmas nas prateleiras (7, 7 e 6) antes de entregar.')
      return
    }
    if (!window.confirm('Tem certeza? Não será possível alterar depois.')) return
    salvar('entregue')
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

          <div className="mx-auto mt-10 max-w-5xl px-4">
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-1.5 border-2 border-[#3B2A1E] bg-[#E9E1D3] p-2 sm:grid-cols-2 sm:gap-3 sm:p-4 lg:grid-cols-3">
              {ENIGMAS.map((enigma, index) => (
                <IconeEnigma
                  key={enigma.id}
                  id={enigma.id}
                  index={index}
                  comando={enigma.comando}
                  ativo={selecionadoId === enigma.id}
                  alocado={alocados.has(enigma.id)}
                  onClick={() => abrirEnigma(enigma.id)}
                />
              ))}
            </div>

            <div className="mx-auto mt-12 max-w-2xl">
              <div className="mx-auto w-fit border-[3px] border-[#3B2A1E] bg-[#E9E1D3] px-10 py-1.5 text-lg font-semibold uppercase tracking-[0.25em] text-[#3B2A1E] shadow-[3px_3px_0_#3B2A1E]">
                Paraíba
              </div>
              <div className="relative mt-3 aspect-[1122/1402] w-full">
                <img src={PRATELEIRA_SRC} alt="" className="absolute inset-0 h-full w-full" />
                {[1, 2, 3].map((bloco) => {
                  const fila = prateleiras[bloco]
                  const teto = CAPACIDADES[bloco]
                  return (
                    <button
                      key={bloco}
                      type="button"
                      onClick={() => colocarNaPrateleira(bloco)}
                      disabled={locked}
                      className={`absolute left-[9%] right-[9%] ${NIVEIS[bloco]} cursor-pointer transition-colors hover:bg-[#3B2A1E]/10 disabled:cursor-default ${
                        blocoAlerta === bloco ? 'outline outline-2 outline-red-600' : ''
                      }`}
                      aria-label={`Prateleira ${bloco}, até ${teto} enigmas`}
                    >
                      <span className="absolute left-0 top-0 -translate-y-[115%] bg-[#E9E1D3] px-1.5 text-[10px] font-medium uppercase tracking-wider text-[#3B2A1E]">
                        Bloco {bloco} · {fila.length}/{teto}
                      </span>
                      <div
                        className="grid h-full items-end gap-[1.5%]"
                        style={{ gridTemplateColumns: `repeat(${teto}, minmax(0, 1fr))` }}
                      >
                        {Array.from({ length: teto }, (_, i) => {
                          const id = fila[i]
                          if (!id) {
                            return (
                              <span
                                key={`vazio-${i}`}
                                className="aspect-[3/4] border-2 border-dashed border-[#3B2A1E]/40 bg-[#E9E1D3]/25"
                              />
                            )
                          }
                          return (
                            <span key={id} className="relative block aspect-[3/4]">
                              <img
                                src={ICONE_SRC}
                                alt={`Enigma ${id}`}
                                className={`h-full w-full border-2 border-[#3B2A1E] object-cover ${selecionadoId === id ? 'ring-2 ring-[#82181A]' : ''}`}
                              />
                              {!locked && (
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    removerDaPrateleira(id)
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                      event.preventDefault()
                                      event.stopPropagation()
                                      removerDaPrateleira(id)
                                    }
                                  }}
                                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center bg-[#82181A] text-[10px] leading-none text-white"
                                  aria-label={`Tirar ${id} da prateleira`}
                                >
                                  ×
                                </span>
                              )}
                            </span>
                          )
                        })}
                      </div>
                    </button>
                  )
                })}
              </div>
              {alertaCapacidade && (
                <p className="mt-3 text-center text-sm font-medium text-red-700">{alertaCapacidade}</p>
              )}
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 px-4">
            <button
              type="button"
              disabled={salvando || locked}
              onClick={() => salvar('rascunho')}
              className="min-w-[190px] cursor-pointer border-2 border-[#8A7007] bg-[#C5A00A] px-6 py-3 text-sm font-medium uppercase text-white transition-colors hover:bg-[#B08F09] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Salvar rascunho
            </button>
            <button
              type="button"
              disabled={salvando || (status !== 'entregue' && (!completa || locked))}
              onClick={entregarTarefa}
              className={`min-w-[210px] cursor-pointer border-2 px-6 py-3 text-sm font-medium uppercase text-white transition-colors disabled:cursor-not-allowed ${
                status === 'entregue'
                  ? 'border-[#0F4D00] bg-[#197400]'
                  : completa
                    ? 'border-[#0F4D00] bg-[#197400] hover:bg-[#156300]'
                    : 'border-neutral-400 bg-neutral-400'
              }`}
            >
              Entregar tarefa
            </button>
          </div>

          {mensagem && (
            <div className={`mx-auto mt-8 max-w-md rounded-lg p-4 text-center font-medium ${
              mensagem.includes('Coloque') || mensagem.includes('Clique') || mensagem.includes('Não foi') || mensagem.includes('já entregue')
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'
            }`}
            >
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

      {detalhe && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) setDetalheId(null)
          }}
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto">
            <div className="relative border-[3px] border-[#3B2A1E] bg-[#E9E1D3] px-10 py-4 text-center text-base font-medium text-[#3B2A1E] shadow-[4px_4px_0_#3B2A1E] md:text-lg">
              {detalhe.comando}
              <button
                type="button"
                onClick={() => setDetalheId(null)}
                className="absolute right-2 top-1 cursor-pointer text-3xl leading-none text-[#82181A]"
                aria-label="Fechar detalhamento"
              >
                ×
              </button>
            </div>
            <div className="relative mt-5 border-[3px] border-[#3B2A1E] bg-[#D9CCB8] shadow-[4px_4px_0_#3B2A1E]">
              <img src={MIDIA_SRC[detalhe.tipoMidia]} alt="" className="block aspect-video w-full object-cover" />
              <div className="absolute inset-0 grid grid-cols-2">
                {['A', 'B'].map((letra) => {
                  const texto = letra === 'A' ? detalhe.opcaoA : detalhe.opcaoB
                  const marcada = enigmas[detalhe.id]?.opcao === letra
                  return (
                    <button
                      key={letra}
                      type="button"
                      disabled={locked}
                      onClick={() => escolherOpcao(letra)}
                      aria-pressed={marcada}
                      className={`group flex cursor-pointer items-center justify-center p-3 transition-colors disabled:cursor-default ${
                        marcada ? 'bg-[#82181A]/25 ring-4 ring-inset ring-[#82181A]' : 'hover:bg-[#3B2A1E]/10'
                      }`}
                    >
                      <span
                        className={`max-w-[90%] border-2 px-3 py-2 text-xs font-medium sm:text-sm ${
                          marcada
                            ? 'border-[#82181A] bg-[#82181A] text-white'
                            : 'border-[#3B2A1E] bg-[#E9E1D3]/95 text-[#3B2A1E]'
                        }`}
                      >
                        <span className="font-semibold">Opção {letra}.</span> {texto}
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
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-[#82181A]">Carregando...</div>}>
      <TarefaContent />
    </Suspense>
  )
}
