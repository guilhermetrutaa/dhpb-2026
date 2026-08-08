import { NextResponse } from 'next/server'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getSupportAdminApp } from '@/lib/support/server/firebase-admin'

export const runtime = 'nodejs'

const WEBHOOK_VERSION = '2026-08-08-v3-fix-imports'

const escaparHtml = (texto = '') =>
  String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const callTelegram = async (metodo, corpo) => {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.error('[webhook-telegram] TELEGRAM_BOT_TOKEN nao configurado')
    return { ok: false, status: 500, body: 'TELEGRAM_BOT_TOKEN ausente' }
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${metodo}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    })
    const resposta = await res.text().catch(() => '')
    if (!res.ok) {
      console.error('[webhook-telegram] erro api telegram', metodo, res.status, resposta)
    }
    return { ok: res.ok, status: res.status, body: resposta }
  } catch (e) {
    console.error('[webhook-telegram] erro api telegram', e)
    return { ok: false, status: 500, body: e?.message || String(e) }
  }
}

// Responde o callback query do Telegram imediatamente para evitar "carregando"
const responderCallback = (callbackId, texto = '', alerta = false) =>
  callTelegram('answerCallbackQuery', {
    callback_query_id: callbackId,
    text: texto,
    show_alert: alerta,
    cache_time: 0,
  }).catch(() => null)

const assumirAtendimento = async (cb) => {
  const chamadoId = String(cb.data || '').replace('assumir_', '').trim()
  const telegramId = String(cb.from?.id || '')
  const nomeAtendente = cb.from?.first_name || cb.from?.username || 'Atendente'

  if (!chamadoId || !telegramId) {
    // Responde imediatamente para o Telegram não ficar esperando
    await responderCallback(cb.id, 'Dados inválidos.', true)
    return NextResponse.json({ ok: true, erro: 'callback invalido' })
  }

  // Responde o callback IMEDIATAMENTE para o Telegram parar de "carregar"
  // Isso deve ser feito antes de qualquer operação async pesada
  await responderCallback(cb.id, '⏳ Assumindo atendimento...')

  try {
    const db = getFirestore(getSupportAdminApp())
    const chamadoRef = db.collection('chamados').doc(chamadoId)
    const chamadoSnap = await chamadoRef.get()

    if (!chamadoSnap.exists) {
      if (cb.message) {
        await callTelegram('sendMessage', {
          chat_id: cb.message.chat.id,
          text: '❌ Chamado não encontrado. Pode ter sido removido.',
        })
      }
      return NextResponse.json({ ok: true, erro: 'Chamado nao encontrado' })
    }

    const dadosChamado = chamadoSnap.data()

    // Verifica se já foi assumido por outro atendente
    if (dadosChamado.status === 'em_atendimento' && dadosChamado.atendenteTelegramId && dadosChamado.atendenteTelegramId !== telegramId) {
      if (cb.message) {
        await callTelegram('sendMessage', {
          chat_id: cb.message.chat.id,
          text: `⚠️ Este chamado já foi assumido por ${escaparHtml(dadosChamado.atendenteNome || 'outro atendente')}.`,
          parse_mode: 'HTML',
        })
      }
      return NextResponse.json({ ok: true, aviso: 'Chamado já assumido' })
    }

    await chamadoRef.update({
      status: 'em_atendimento',
      atendenteTelegramId: telegramId,
      atendenteNome: nomeAtendente,
      atualizadoEm: FieldValue.serverTimestamp(),
    })

    await chamadoRef.collection('mensagens').add({
      autorTipo: 'admin',
      autorNome: nomeAtendente,
      conteudo: `${nomeAtendente} assumiu o atendimento.`,
      enviadoEm: FieldValue.serverTimestamp(),
      lida: true,
      sistema: true,
    })

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

    const privado = await callTelegram('sendMessage', {
      chat_id: telegramId,
      text: `✅ Você assumiu o chamado <code>${escaparHtml(chamadoId)}</code>.\n\nTudo que o usuário enviar aparecerá aqui. Para responder, use <b>Responder/Reply</b> na mensagem do usuário.`,
      parse_mode: 'HTML',
    })

    if (!privado.ok) {
      if (cb.message) {
        await callTelegram('sendMessage', {
          chat_id: cb.message.chat.id,
          text: `${nomeAtendente} assumiu o atendimento, mas o bot não conseguiu enviar mensagem no privado. Abra uma conversa privada com o bot e clique em Iniciar.`,
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
        text: `❌ Não foi possível assumir o atendimento.\n\nErro: ${escaparHtml(err?.message || String(err))}`,
      })
    }
    return NextResponse.json({
      ok: true,
      erro: 'Falha ao assumir atendimento',
    })
  }
}

const responderUsuarioPeloReply = async (msg) => {
  const replyText = msg.reply_to_message?.text || ''
  const texto = msg.text || ''
  const match = replyText.match(/ID:\s*([a-zA-Z0-9_-]+)\)/)

  if (!match?.[1] || !texto.trim()) return NextResponse.json({ ok: true })

  const chamadoId = match[1]
  const nomeAtendente = msg.from?.first_name || msg.from?.username || 'Atendente'

  try {
    const db = getFirestore(getSupportAdminApp())
    const chamadoRef = db.collection('chamados').doc(chamadoId)

    await chamadoRef.collection('mensagens').add({
      autorTipo: 'admin',
      autorNome: nomeAtendente,
      conteudo: texto.trim(),
      enviadoEm: FieldValue.serverTimestamp(),
      lida: false,
    })

    await chamadoRef.update({
      status: 'aguardando_usuario',
      naoLidasUsuario: FieldValue.increment(1),
      ultimaMensagem: texto.trim().slice(0, 160),
      ultimaMensagemAutor: 'admin',
      ultimaMensagemEm: FieldValue.serverTimestamp(),
      atualizadoEm: FieldValue.serverTimestamp(),
    })
  } catch (err) {
    console.error('[webhook-telegram] erro ao responder usuario pelo reply', err)
  }

  return NextResponse.json({ ok: true })
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))

    if (body.callback_query) {
      const cb = body.callback_query
      const data = cb.data || ''

      if (data.startsWith('assumir_')) {
        return assumirAtendimento(cb)
      }

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

export async function GET() {
  return NextResponse.json({
    ok: true,
    rota: 'support/webhook-telegram',
    version: WEBHOOK_VERSION,
    env: {
      telegramBotToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      telegramChatId: Boolean(process.env.TELEGRAM_CHAT_ID),
      supportServiceAccount: Boolean(process.env.SUPPORT_SERVICE_ACCOUNT),
      supportServiceAccountBase64: Boolean(process.env.SUPPORT_SERVICE_ACCOUNT_BASE64),
    },
  })
}
