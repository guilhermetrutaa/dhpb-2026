import { NextResponse } from 'next/server'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getSupportAdminApp } from '@/lib/support/server/firebase-admin'

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
    await responderCallback(cb.id, 'Chamado invalido.', true)
    return NextResponse.json({ ok: false, erro: 'callback invalido' }, { status: 400 })
  }

  try {
    const db = getFirestore(getSupportAdminApp())
    const chamadoRef = db.collection('chamados').doc(chamadoId)
    const chamadoSnap = await chamadoRef.get()

    if (!chamadoSnap.exists) {
      await responderCallback(cb.id, 'Chamado nao encontrado.', true)
      return NextResponse.json({ ok: false, erro: 'Chamado nao encontrado' }, { status: 404 })
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
      text: `Você assumiu o chamado <code>${escaparHtml(chamadoId)}</code>.\n\nTudo que o usuário enviar aparecerá aqui. Para responder, use <b>Responder/Reply</b> na mensagem do usuário.`,
      parse_mode: 'HTML',
    })

    if (!privado.ok) {
      await responderCallback(cb.id, 'Atendimento assumido. Abra uma conversa privada com o bot para receber mensagens.', true)
      return NextResponse.json({ ok: true, aviso: 'Privado do atendente indisponivel' })
    }

    await responderCallback(cb.id, 'Atendimento assumido.')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook-telegram] falha ao assumir atendimento', err)
    await responderCallback(cb.id, 'Nao foi possivel assumir agora. Veja os logs da Vercel.', true)
    return NextResponse.json({ erro: 'Falha ao assumir atendimento' }, { status: 500 })
  }
}

const responderUsuarioPeloReply = async (msg) => {
  const replyText = msg.reply_to_message?.text || ''
  const texto = msg.text || ''
  const match = replyText.match(/ID:\s*([a-zA-Z0-9_-]+)\)/)

  if (!match?.[1] || !texto.trim()) return NextResponse.json({ ok: true })

  const chamadoId = match[1]
  const nomeAtendente = msg.from?.first_name || msg.from?.username || 'Atendente'
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
