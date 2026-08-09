import { NextResponse } from 'next/server'
import {
  getToken,
  getProjectId,
  fsGet,
  fsUpdateComTimestamp,
  fsAddComTimestamp,
  fsUpdateComIncremento,
} from '@/lib/support/server/firestore-rest'

export const runtime = 'nodejs'

const WEBHOOK_VERSION = '2026-08-09-v1-rest-api'

const escaparHtml = (texto = '') =>
  String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

// ─── Telegram API ─────────────────────────────────────────────────────────────
const callTelegram = async (metodo, corpo) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    console.error('[webhook-telegram] TELEGRAM_BOT_TOKEN não configurado')
    return { ok: false }
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/${metodo}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    })
    const body = await res.text().catch(() => '')
    if (!res.ok) console.error('[webhook-telegram] telegram error', metodo, res.status, body)
    return { ok: res.ok, status: res.status, body }
  } catch (e) {
    console.error('[webhook-telegram] telegram fetch error', e)
    return { ok: false }
  }
}

// Responde o callback_query IMEDIATAMENTE para o botão parar de "carregar"
const responderCallback = (callbackId, texto = '', alerta = false) =>
  callTelegram('answerCallbackQuery', {
    callback_query_id: callbackId,
    text: texto,
    show_alert: alerta,
    cache_time: 0,
  }).catch(() => null)

// ─── Assumir Atendimento ──────────────────────────────────────────────────────
const assumirAtendimento = async (cb) => {
  const chamadoId = String(cb.data || '').replace('assumir_', '').trim()
  const telegramId = String(cb.from?.id || '')
  const nomeAtendente = cb.from?.first_name || cb.from?.username || 'Atendente'

  if (!chamadoId || !telegramId) {
    await responderCallback(cb.id, 'Dados inválidos.', true)
    return NextResponse.json({ ok: true, erro: 'callback invalido' })
  }

  // Responde o Telegram IMEDIATAMENTE antes de qualquer operação pesada
  await responderCallback(cb.id, '⏳ Assumindo atendimento...')

  try {
    const token = await getToken()
    const projectId = getProjectId()
    const docPath = `chamados/${chamadoId}`

    // Verifica se o chamado existe
    const snap = await fsGet(projectId, docPath, token)
    if (!snap.exists) {
      if (cb.message) {
        await callTelegram('sendMessage', {
          chat_id: cb.message.chat.id,
          text: '❌ Chamado não encontrado. Pode ter sido removido.',
        })
      }
      return NextResponse.json({ ok: true, erro: 'Chamado nao encontrado' })
    }

    // Verifica se já foi assumido por outro atendente
    const dados = snap.data
    if (
      dados.status === 'em_atendimento' &&
      dados.atendenteTelegramId &&
      dados.atendenteTelegramId !== telegramId
    ) {
      if (cb.message) {
        await callTelegram('sendMessage', {
          chat_id: cb.message.chat.id,
          text: `⚠️ Este chamado já foi assumido por ${escaparHtml(dados.atendenteNome || 'outro atendente')}.`,
          parse_mode: 'HTML',
        })
      }
      return NextResponse.json({ ok: true, aviso: 'Chamado já assumido' })
    }

    // Atualiza o chamado
    await fsUpdateComTimestamp(
      projectId,
      docPath,
      {
        status: 'em_atendimento',
        atendenteTelegramId: telegramId,
        atendenteNome: nomeAtendente,
      },
      ['atualizadoEm'],
      token
    )

    // Adiciona mensagem de sistema
    await fsAddComTimestamp(
      projectId,
      `chamados/${chamadoId}/mensagens`,
      {
        autorTipo: 'admin',
        autorNome: nomeAtendente,
        conteudo: `${nomeAtendente} assumiu o atendimento.`,
        lida: true,
        sistema: true,
      },
      ['enviadoEm'],
      token
    )

    // Edita a mensagem no grupo
    if (cb.message) {
      const textoOriginal = cb.message.text || cb.message.caption || 'Atendimento solicitado'
      await callTelegram('editMessageText', {
        chat_id: cb.message.chat.id,
        message_id: cb.message.message_id,
        text: `${escaparHtml(textoOriginal)}\n\n✅ <b>Assumido por ${escaparHtml(nomeAtendente)}</b>`,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      })
    }

    // Envia mensagem no privado do atendente
    const privado = await callTelegram('sendMessage', {
      chat_id: telegramId,
      text: `✅ Você assumiu o chamado <code>${escaparHtml(chamadoId)}</code>.\n\nTudo que o usuário enviar aparecerá aqui. Para responder, use <b>Responder/Reply</b> na mensagem do usuário.`,
      parse_mode: 'HTML',
    })

    if (!privado.ok) {
      if (cb.message) {
        await callTelegram('sendMessage', {
          chat_id: cb.message.chat.id,
          text: `${nomeAtendente} assumiu o atendimento, mas o bot não conseguiu enviar mensagem no privado. Abra uma conversa com o bot e clique em Iniciar.`,
        })
      }
      return NextResponse.json({ ok: true, aviso: 'Privado do atendente indisponivel' })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook-telegram] falha ao assumir atendimento', err)
    if (cb.message) {
      await callTelegram('sendMessage', {
        chat_id: cb.message.chat.id,
        text: `❌ Erro ao assumir atendimento: ${escaparHtml(err?.message || String(err))}`,
      })
    }
    return NextResponse.json({ ok: true, erro: String(err?.message) })
  }
}

// ─── Responder usuário pelo Reply no Telegram ─────────────────────────────────
const responderUsuarioPeloReply = async (msg) => {
  const replyText = msg.reply_to_message?.text || ''
  const texto = msg.text || ''
  const match = replyText.match(/ID:\s*([a-zA-Z0-9_-]+)\)/)

  if (!match?.[1] || !texto.trim()) return NextResponse.json({ ok: true })

  const chamadoId = match[1]
  const nomeAtendente = msg.from?.first_name || msg.from?.username || 'Atendente'

  try {
    const token = await getToken()
    const projectId = getProjectId()

    // Adiciona mensagem do admin
    await fsAddComTimestamp(
      projectId,
      `chamados/${chamadoId}/mensagens`,
      {
        autorTipo: 'admin',
        autorNome: nomeAtendente,
        conteudo: texto.trim(),
        lida: false,
      },
      ['enviadoEm'],
      token
    )

    // Atualiza chamado com increment em naoLidasUsuario + timestamps
    await fsUpdateComIncremento(
      projectId,
      `chamados/${chamadoId}`,
      {
        status: 'aguardando_usuario',
        ultimaMensagem: texto.trim().slice(0, 160),
        ultimaMensagemAutor: 'admin',
      },
      [['naoLidasUsuario', 1]],
      ['ultimaMensagemEm', 'atualizadoEm'],
      token
    )
  } catch (err) {
    console.error('[webhook-telegram] erro ao responder usuario pelo reply', err)
  }

  return NextResponse.json({ ok: true })
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))

    if (body.callback_query) {
      const cb = body.callback_query
      const data = cb.data || ''
      if (data.startsWith('assumir_')) return assumirAtendimento(cb)
      await responderCallback(cb.id)
      return NextResponse.json({ ok: true })
    }

    if (body.message?.reply_to_message) {
      return responderUsuarioPeloReply(body.message)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook-telegram]', err)
    return NextResponse.json({ erro: 'Falha interna do webhook' }, { status: 500 })
  }
}

// ─── GET (diagnóstico) ────────────────────────────────────────────────────────
export async function GET() {
  return NextResponse.json({
    ok: true,
    rota: 'support/webhook-telegram',
    version: WEBHOOK_VERSION,
    engine: 'firestore-rest-api',
    env: {
      telegramBotToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      telegramChatId: Boolean(process.env.TELEGRAM_CHAT_ID),
      supportServiceAccount: Boolean(process.env.SUPPORT_SERVICE_ACCOUNT),
      supportServiceAccountBase64: Boolean(process.env.SUPPORT_SERVICE_ACCOUNT_BASE64),
    },
  })
}
