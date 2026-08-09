'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth'
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
import { supportAuth, supportDb, requestNotificationToken } from '@/lib/support/firebase'
import {
  AUTORES,
  MENSAGEM_ATENDENTE_48H,
  MENSAGEM_ERRO_IA,
  MENSAGEM_PEDIR_CONTATO,
  STATUS_CHAMADO,
} from '@/lib/support/constants'
import { buscarRespostasRapidas, encontrarRespostaRapida } from '@/lib/support/respostasRapidas'

const CHAMADOS_ATIVOS = [
  STATUS_CHAMADO.NOVO,
  STATUS_CHAMADO.AGUARDANDO_ATENDENTE,
  STATUS_CHAMADO.EM_ATENDIMENTO,
  STATUS_CHAMADO.AGUARDANDO_USUARIO,
]

const EMAIL_REGEX = /[^\s@]+@[^\s@]+\.[^\s@]+/

let promessaSessao = null

const normalizar = (texto = '') =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[º°]/g, 'o')
    .replace(/ª/g, 'a')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const mensagemErroSuporte = (erro) => {
  if (erro?.code === 'auth/operation-not-allowed') {
    return 'O login anônimo do Firebase do suporte está desativado. Ative Authentication > Sign-in method > Anonymous no projeto de suporte.'
  }
  if (erro?.code === 'permission-denied') {
    return 'As regras do Firestore do suporte bloquearam o atendimento anônimo.'
  }
  return erro?.message || 'Falha ao iniciar o atendimento.'
}

const textoPareceNome = (texto = '') => {
  const limpo = texto
    .replace(EMAIL_REGEX, '')
    .replace(/\b(meu nome e|meu nome é|me chamo|sou|nome|email|e-mail)\b/gi, ' ')
    .replace(/[^a-zA-ZÀ-ÿ\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const n = normalizar(limpo)
  if (limpo.length < 3 || limpo.length > 80) return false
  if (['oi', 'oii', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite'].includes(n)) return false
  if (/\b(erro|problema|senha|conta|login|entrar|inscricao|inscrição|equipe|site|atendente|suporte|ajuda|nao|não|consigo)\b/i.test(limpo)) return false

  const partes = limpo.split(' ').filter(Boolean)
  return partes.length >= 2 && partes.length <= 5
}

const extrairContato = (texto = '') => {
  const email = texto.match(EMAIL_REGEX)?.[0]?.trim().toLowerCase() || ''
  const candidatoNome = texto
    .replace(EMAIL_REGEX, '')
    .replace(/\b(meu nome e|meu nome é|me chamo|sou|nome|email|e-mail)\b/gi, ' ')
    .replace(/[,:;|()<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return {
    email,
    nome: textoPareceNome(candidatoNome) ? candidatoNome.slice(0, 80) : '',
  }
}

const detectarTransferenciaDireta = (texto = '') => {
  const t = normalizar(texto)

  if (/\b(atendente|humano|pessoa|suporte|telegram)\b/.test(t)) {
    return { categoria: 'outros', prioridade: 'media', resumo: 'Usuário pediu atendimento humano.' }
  }

  if (/\b(ano passado|edicao passada|edicao anterior|3o dhpb|3 dhpb|terceiro dhpb|conta antiga)\b/.test(t)) {
    return { categoria: 'acesso', prioridade: 'media', resumo: 'Usuário relata dificuldade com conta antiga do 3º DHPB/edição passada.' }
  }

  if (/\b(nao consigo|erro|bug|travou|falha|problema)\b/.test(t) && /\b(conta|login|entrar|senha|cadastro|inscricao|equipe|documento|comprovante|fase|prova|questao|tarefa)\b/.test(t)) {
    const prioridade = /\b(fase|prova|questao|tarefa)\b/.test(t) ? 'alta' : 'media'
    const categoria = /\b(senha|login|conta|entrar)\b/.test(t)
      ? 'acesso'
      : /\b(equipe|membro|aluno|professor)\b/.test(t)
      ? 'equipes'
      : /\b(fase|prova|questao|tarefa)\b/.test(t)
      ? 'fases'
      : 'tecnico'
    return { categoria, prioridade, resumo: `Usuário relatou problema: ${texto.slice(0, 180)}` }
  }

  if (/\b(trocar|alterar|excluir|remover|corrigir|verificar|aprovar|reprovar)\b/.test(t) && /\b(equipe|membro|aluno|professor|cadastro|documento|comprovante|escola)\b/.test(t)) {
    return { categoria: 'equipes', prioridade: 'media', resumo: `Usuário solicitou ação administrativa: ${texto.slice(0, 180)}` }
  }

  return null
}

const respostaAutomaticaTransferencia = (texto, info) => {
  const t = normalizar(texto)

  if (/\b(ano passado|edicao passada|edicao anterior|3o dhpb|3 dhpb|terceiro dhpb|conta antiga)\b/.test(t)) {
    return `O site foi resetado para o 4º DHPB. Contas do 3º DHPB/ano passado não continuam válidas nesta edição, então alunos e professores precisam criar uma nova conta. Também encaminhei seu caso para a equipe de suporte. ${MENSAGEM_ATENDENTE_48H}`
  }

  if (info?.resumo === 'Usuário pediu atendimento humano.') return MENSAGEM_ATENDENTE_48H

  return `Entendi o problema e encaminhei para a equipe de suporte do DHPB. ${MENSAGEM_ATENDENTE_48H}`
}

const autenticarSuporte = async () => {
  if (promessaSessao) return promessaSessao

  promessaSessao = (async () => {
    const usuario = supportAuth.currentUser || (await signInAnonymously(supportAuth)).user
    return { role: 'usuario', email: '', nome: '', uid: usuario.uid }
  })().finally(() => {
    setTimeout(() => {
      promessaSessao = null
    }, 1000)
  })

  return promessaSessao
}

export const useSupportChat = ({ isChatOpen = false } = {}) => {
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
      setColeta('contato')
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
      if (atual.nome) nomeRef.current = atual.nome
      setEncerrado(encerradoAnterior)
      setColeta(!encerradoAnterior && (!atual.nome || !atual.email) ? 'contato' : null)

      // Solicita permissão e salva o token de notificação
      requestNotificationToken().then((token) => {
        if (token && atual.id) {
          updateDoc(doc(supportDb, 'chamados', atual.id), { fcmToken: token }).catch(() => {})
        }
      })

      const respostas = await buscarRespostasRapidas()
      setSugestoes(respostas.filter((r) => r.sugestao).map((r) => r.pergunta || r.titulo).filter(Boolean))
      setCarregando(false)
    } catch (e) {
      setErro(mensagemErroSuporte(e))
      setCarregando(false)
    }
  }, [])

  const inicializarBackground = useCallback(() => {
    if (!supportAuth || !supportDb) return
    // Aguarda o firebase carregar a sessão salva
    const unsub = onAuthStateChanged(supportAuth, async (usuario) => {
      unsub() // escuta só a primeira resolução
      if (usuario) {
        try {
          const q = query(
            collection(supportDb, 'chamados'),
            where('uid', '==', usuario.uid),
            orderBy('criadoEm', 'desc'),
            limit(1)
          )
          const snap = await getDocs(q)
          const ultimo = snap.docs[0]
          if (ultimo && CHAMADOS_ATIVOS.includes(ultimo.data().status)) {
            setChamado({ id: ultimo.id, ...ultimo.data() })
          }
        } catch (e) {
          console.error('[support] background init falhou', e)
        }
      }
    })
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
    if (!chamadoId || !mensagens.length || !isChatOpen) return
    const temNaoLida = mensagens.some((m) => m.autorTipo !== AUTORES.USUARIO && !m.lida)
    if (temNaoLida && naoLidasUsuario > 0) {
      updateDoc(doc(supportDb, 'chamados', chamadoId), { naoLidasUsuario: 0 }).catch(() => {})
    }
  }, [mensagens, chamadoId, naoLidasUsuario, isChatOpen])

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

  const transferirParaHumano = async (infoIA, mensagemConfirmacao = MENSAGEM_ATENDENTE_48H) => {
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
    setChamado((prev) => prev ? { ...prev, status: STATUS_CHAMADO.AGUARDANDO_ATENDENTE, modo: 'humano' } : prev)
    await gravarMensagem(AUTORES.IA, mensagemConfirmacao, { fonte: 'transferencia_humano' })

    const res = await fetch('/api/support/notify-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        chamadoId: chamado.id,
        resumo: infoIA.resumo || '',
        categoria: infoIA.categoria || 'outros',
        prioridade: infoIA.prioridade || 'media',
        nome: chamado.nome || '',
        email: chamado.email || '',
        dataHora,
      }),
    })
    if (!res.ok) {
      const corpo = await res.text().catch(() => '')
      console.error('[support/notify-telegram]', res.status, corpo)
    }
  }

  const registrarContato = async (contato) => {
    const atualizacao = { atualizadoEm: serverTimestamp() }
    if (contato.nome) atualizacao.nome = contato.nome
    if (contato.email) atualizacao.email = contato.email

    await updateDoc(doc(supportDb, 'chamados', chamado.id), atualizacao)
    setChamado((prev) => prev ? { ...prev, ...(contato.nome ? { nome: contato.nome } : {}), ...(contato.email ? { email: contato.email } : {}) } : prev)
    if (contato.nome) nomeRef.current = contato.nome
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

      if (coleta === 'contato') {
        const contato = extrairContato(conteudo)
        if (!contato.nome && !contato.email) {
          await gravarMensagem(AUTORES.IA, MENSAGEM_PEDIR_CONTATO)
          return
        }

        await registrarContato(contato)
        const nomeAtual = contato.nome || chamado.nome || ''
        const emailAtual = contato.email || chamado.email || ''

        if (!nomeAtual) {
          setColeta('nome')
          await gravarMensagem(AUTORES.IA, 'Recebi seu e-mail. Agora me diga seu nome completo, por favor.')
          return
        }

        if (!emailAtual) {
          setColeta('email')
          await gravarMensagem(AUTORES.IA, `Muito prazer, ${nomeAtual}! Agora me diga seu e-mail para registro, por favor.`)
          return
        }

        setColeta(null)
        await gravarMensagem(AUTORES.IA, `Perfeito, ${nomeAtual}! Como posso ajudar?`)
        return
      }

      if (coleta === 'nome') {
        const contato = extrairContato(conteudo)
        if (!contato.nome) {
          await gravarMensagem(AUTORES.IA, 'Não consegui identificar seu nome completo. Pode enviar nome e sobrenome, por favor?')
          return
        }
        await registrarContato({ nome: contato.nome })
        setColeta(null)
        await gravarMensagem(AUTORES.IA, `Perfeito, ${contato.nome}! Como posso ajudar?`)
        return
      }

      if (coleta === 'email') {
        const email = conteudo.match(EMAIL_REGEX)?.[0]?.trim().toLowerCase() || ''
        if (!email) {
          await gravarMensagem(AUTORES.IA, 'Hmm, esse e-mail não parece válido. Pode conferir e enviar de novo?')
          return
        }
        await registrarContato({ email })
        setColeta(null)
        await gravarMensagem(AUTORES.IA, `Perfeito, ${nomeRef.current || 'tudo certo'}! Como posso ajudar?`)
        return
      }

      if (chamado.modo === 'humano') {
        await updateDoc(doc(supportDb, 'chamados', chamado.id), {
          naoLidasAdmin: (chamado.naoLidasAdmin || 0) + 1,
          ...([STATUS_CHAMADO.AGUARDANDO_USUARIO, STATUS_CHAMADO.NOVO].includes(chamado.status)
            ? { status: STATUS_CHAMADO.EM_ATENDIMENTO }
            : {}),
        })
        if (chamado.atendenteTelegramId) {
          fetch('/api/support/notify-telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tipo: 'nova_mensagem_usuario',
              chamadoId: chamado.id,
              telegramId: chamado.atendenteTelegramId,
              atendenteMsgId: chamado.atendenteMsgId || null,
              mensagem: conteudo,
              nome: chamado.nome || 'Usuário',
            }),
          }).catch(() => {})
        }
        return
      }

      const transferenciaDireta = detectarTransferenciaDireta(conteudo)
      if (transferenciaDireta) {
        await transferirParaHumano(transferenciaDireta, respostaAutomaticaTransferencia(conteudo, transferenciaDireta))
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
    } catch (e) {
      console.error('[support/chat]', e)
      setErro('Não foi possível enviar. Tente novamente.')
    } finally {
      setDigitando(false)
      enviandoRef.current = false
    }
  }

  return { sessao, chamado, mensagens, carregando, digitando, erro, sugestoes, coleta, encerrado, inicializar, inicializarBackground, iniciarNovoAtendimento, enviarMensagem, encerrarSessao, naoLidasUsuario: chamado?.naoLidasUsuario || 0 }
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
