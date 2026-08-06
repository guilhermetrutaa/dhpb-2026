'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { supportAuth, supportDb } from '@/lib/support/firebase'
import { auth } from '@/lib/firebase'
import { AUTORES, MENSAGEM_ERRO_IA, STATUS_CHAMADO } from '@/lib/support/constants'
import { buscarRespostasRapidas, encontrarRespostaRapida } from '@/lib/support/respostasRapidas'

const CHAMADOS_ATIVOS = [
  STATUS_CHAMADO.NOVO,
  STATUS_CHAMADO.AGUARDANDO_ATENDENTE,
  STATUS_CHAMADO.EM_ATENDIMENTO,
  STATUS_CHAMADO.AGUARDANDO_USUARIO,
]

let promessaSessao = null

const autenticarSuporte = async () => {
  if (!auth.currentUser) throw new Error('Não autenticado no DHPB')

  if (promessaSessao) return promessaSessao

  promessaSessao = (async () => {
    const tokenId = await auth.currentUser.getIdToken(true)
    const res = await fetch('/api/support/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId }),
    })
    if (!res.ok) throw new Error('Falha ao autenticar no suporte')
    const { customToken, role, email } = await res.json()
    await signInWithCustomToken(supportAuth, customToken)
    return { role, email, nome: '' }
  })().finally(() => {
    setTimeout(() => {
      promessaSessao = null
    }, 1000)
  })

  return promessaSessao
}

export const useSupportChat = () => {
  const [sessao, setSessao] = useState(null)
  const [chamado, setChamado] = useState(null)
  const [mensagens, setMensagens] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [digitando, setDigitando] = useState(false)
  const [erro, setErro] = useState('')
  const [sugestoes, setSugestoes] = useState([])
  const [coleta, setColeta] = useState(null)
  const [encerrado, setEncerrado] = useState(false)
  const enviandoRef = useRef(false)
  const nomeRef = useRef('')

  const encerrarSessao = async () => {
    try {
      await signOut(supportAuth)
    } catch {}
    setSessao(null)
    setChamado(null)
    setMensagens([])
  }

  const criarNovoChamado = async (usuario) => {
    const ref = await addDoc(collection(supportDb, 'chamados'), {
      uid: usuario.uid,
      nome: '',
      email: '',
      status: STATUS_CHAMADO.NOVO,
      modo: 'ia',
      categoria: 'outros',
      prioridade: 'media',
      resumo: '',
      assunto: '',
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
      naoLidasAdmin: 0,
      naoLidasUsuario: 0,
    })
    return {
      id: ref.id,
      uid: usuario.uid,
      nome: '',
      email: '',
      status: STATUS_CHAMADO.NOVO,
      modo: 'ia',
    }
  }

  const iniciarNovoAtendimento = async () => {
    if (!supportDb || !supportAuth?.currentUser) return
    try {
      const novo = await criarNovoChamado(supportAuth.currentUser)
      setChamado(novo)
      setEncerrado(false)
      setMensagens([])
      setColeta('nome')
      setErro('')
    } catch {
      setErro('Não foi possível iniciar um novo atendimento.')
    }
  }

  const inicializar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    if (!supportAuth || !supportDb) {
      setErro('O chat de suporte ainda não está configurado.')
      setCarregando(false)
      return
    }
    try {
      const info = await autenticarSuporte()
      setSessao(info)

      const usuario = supportAuth.currentUser
      const q = query(
        collection(supportDb, 'chamados'),
        where('uid', '==', usuario.uid),
        orderBy('criadoEm', 'desc'),
        limit(5)
      )
      const snap = await getDocs(q)
      const ativo = snap.docs.find((d) => CHAMADOS_ATIVOS.includes(d.data().status)) || null
      const ultimo = snap.docs[0] || null
      let atual = null
      let encerradoAnterior = false

      if (ativo) {
        atual = { id: ativo.id, ...ativo.data() }
      } else if (ultimo) {
        atual = { id: ultimo.id, ...ultimo.data() }
        encerradoAnterior = true
      } else {
        atual = await criarNovoChamado(usuario)
      }

      setChamado(atual)
      setEncerrado(encerradoAnterior)
      setColeta(!encerradoAnterior && !atual.nome ? 'nome' : null)
      const respostas = await buscarRespostasRapidas()
      setSugestoes(respostas.filter((r) => r.sugestao).map((r) => r.pergunta || r.titulo).filter(Boolean))
      setCarregando(false)
    } catch (e) {
      setErro(e.message || 'Falha ao iniciar o atendimento.')
      setCarregando(false)
    }
  }, [])

  const chamadoId = chamado?.id
  const naoLidasUsuario = chamado?.naoLidasUsuario

  useEffect(() => {
    if (!chamadoId) return
    const unsubMsg = onSnapshot(
      query(collection(supportDb, 'chamados', chamadoId, 'mensagens'), orderBy('enviadoEm', 'asc')),
      (snap) => {
        const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setMensagens(lista)
      },
      () => {}
    )

    const unsubChamado = onSnapshot(
      doc(supportDb, 'chamados', chamadoId),
      (snap) => {
        if (snap.exists()) setChamado((prev) => ({ ...prev, ...snap.data() }))
      },
      () => {}
    )

    return () => {
      unsubMsg()
      unsubChamado()
    }
  }, [chamadoId])

  useEffect(() => {
    if (!chamadoId || !mensagens.length) return
    const temNaoLida = mensagens.some((m) => m.autorTipo !== AUTORES.USUARIO && !m.lida)
    if (temNaoLida && naoLidasUsuario > 0) {
      updateDoc(doc(supportDb, 'chamados', chamadoId), { naoLidasUsuario: 0 }).catch(() => {})
    }
  }, [mensagens, chamadoId, naoLidasUsuario])

  const gravarMensagem = async (autorTipo, conteudo, extra = {}) => {
    const ref = await addDoc(collection(supportDb, 'chamados', chamado.id, 'mensagens'), {
      autorTipo,
      autorNome: autorTipo === AUTORES.USUARIO ? chamado.nome || 'Usuário' : autorTipo === AUTORES.ADMIN ? 'Atendente' : 'Assistente DHPB',
      conteudo,
      enviadoEm: serverTimestamp(),
      lida: false,
      ...extra,
    })
    await updateDoc(doc(supportDb, 'chamados', chamado.id), {
      ultimaMensagem: String(conteudo).slice(0, 160),
      ultimaMensagemAutor: autorTipo,
      ultimaMensagemEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    })
    return ref
  }

  const transferirParaHumano = async (infoIA) => {
    const dataHora = new Date().toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
    await updateDoc(doc(supportDb, 'chamados', chamado.id), {
      status: STATUS_CHAMADO.AGUARDANDO_ATENDENTE,
      modo: 'humano',
      resumo: infoIA.resumo || '',
      categoria: infoIA.categoria || 'outros',
      prioridade: infoIA.prioridade || 'media',
      transferidoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
      naoLidasAdmin: 1,
    })

    fetch('/api/support/notify-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chamadoId: chamado.id,
        resumo: infoIA.resumo || '',
        categoria: infoIA.categoria || 'outros',
        prioridade: infoIA.prioridade || 'media',
        nome: chamado.nome || '',
        email: chamado.email || '',
        dataHora,
      }),
    }).catch(() => {})
  }

  const enviarMensagem = async (texto) => {
    const conteudo = (texto || '').trim()
    if (!conteudo || !chamado || enviandoRef.current) return
    if (encerrado) {
      setErro('Este atendimento foi encerrado. Inicie um novo atendimento para continuar.')
      return
    }
    enviandoRef.current = true
    setErro('')

    try {
      await gravarMensagem(AUTORES.USUARIO, conteudo)

      if (coleta === 'nome') {
        const nome = conteudo.slice(0, 80)
        nomeRef.current = nome
        await updateDoc(doc(supportDb, 'chamados', chamado.id), {
          nome,
          atualizadoEm: serverTimestamp(),
        })
        setColeta('email')
        await gravarMensagem(AUTORES.IA, `Muito prazer, ${nome}! Qual é o seu e-mail para registro?`)
        return
      }

      if (coleta === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(conteudo)) {
          await gravarMensagem(AUTORES.IA, 'Hmm, esse e-mail não parece válido. Pode conferir e enviar de novo?')
          return
        }
        await updateDoc(doc(supportDb, 'chamados', chamado.id), {
          email: conteudo,
          atualizadoEm: serverTimestamp(),
        })
        setColeta(null)
        await gravarMensagem(
          AUTORES.IA,
          `Perfeito, ${nomeRef.current || 'tudo certo'}! Registramos seu atendimento. Como posso ajudar?`
        )
        return
      }

      if (chamado.modo === 'humano') {
        await updateDoc(doc(supportDb, 'chamados', chamado.id), {
          naoLidasAdmin: (chamado.naoLidasAdmin || 0) + 1,
          ...([STATUS_CHAMADO.AGUARDANDO_USUARIO, STATUS_CHAMADO.NOVO].includes(chamado.status)
            ? { status: STATUS_CHAMADO.EM_ATENDIMENTO }
            : {}),
        })
        return
      }

      const respostas = await buscarRespostasRapidas()
      const rapida = encontrarRespostaRapida(conteudo, respostas)
      let respostaIA = rapida ? { resposta: rapida.resposta, transferir: false } : null

      if (!respostaIA) {
        setDigitando(true)
        const historico = mensagens.slice(-6).map((m) => ({
          role: m.autorTipo === AUTORES.USUARIO ? 'user' : 'assistant',
          content: m.conteudo,
        }))
        const res = await fetch('/api/support/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mensagem: conteudo, historico }),
        })
        if (!res.ok) {
          await gravarMensagem(AUTORES.IA, MENSAGEM_ERRO_IA, { fonte: 'erro' })
          return
        }
        respostaIA = await res.json()
      }

      await gravarMensagem(AUTORES.IA, respostaIA.resposta, {
        fonte: rapida ? 'resposta_rapida' : 'ia',
      })

      if (respostaIA.transferir) {
        await transferirParaHumano(respostaIA)
      }
    } catch {
      setErro('Não foi possível enviar. Tente novamente.')
    } finally {
      setDigitando(false)
      enviandoRef.current = false
    }
  }

  return { sessao, chamado, mensagens, carregando, digitando, erro, sugestoes, coleta, encerrado, inicializar, iniciarNovoAtendimento, enviarMensagem, encerrarSessao }
}

export const getSupportSession = async () => {
  const usuario = await new Promise((resolve) => {
    const unsub = onAuthStateChanged(supportAuth, (u) => {
      unsub()
      resolve(u)
    })
  })
  return usuario
}
