import { NextResponse } from 'next/server'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getSupportAdminApp } from '@/lib/support/server/firebase-admin'

const callTelegram = async (metodo, corpo) => {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return false
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${metodo}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    })
    return res.ok
  } catch (e) {
    console.error('[webhook-telegram] erro api telegram', e)
    return false
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    
    // 1. Recebendo clique no botão "Assumir"
    if (body.callback_query) {
      const cb = body.callback_query
      const data = cb.data || ''
      if (data.startsWith('assumir_')) {
        const chamadoId = data.replace('assumir_', '')
        const telegramId = cb.from.id
        const nomeAtendente = cb.from.first_name || 'Atendente'

        const db = getFirestore(getSupportAdminApp())
        const chamadoRef = db.collection('chamados').doc(chamadoId)
        
        await chamadoRef.update({
          status: 'em_atendimento',
          atendenteTelegramId: telegramId,
          atendenteNome: nomeAtendente,
          atualizadoEm: FieldValue.serverTimestamp()
        })

        // Edita a mensagem no grupo
        if (cb.message) {
          await callTelegram('editMessageText', {
            chat_id: cb.message.chat.id,
            message_id: cb.message.message_id,
            text: cb.message.text + `\n\n✅ <b>Assumido por ${nomeAtendente}</b>`,
            parse_mode: 'HTML',
          })
        }

        // Chama o atendente no privado
        await callTelegram('sendMessage', {
          chat_id: telegramId,
          text: `Você assumiu o chamado <code>${chamadoId}</code>.\n\nTudo que o usuário enviar aparecerá aqui, e para responder, basta usar a função <b>Responder (Reply)</b> do Telegram na mensagem do usuário.`,
          parse_mode: 'HTML',
        })
      }
      
      // Responde ao Telegram para fechar o loading do botão inline
      await callTelegram('answerCallbackQuery', { callback_query_id: cb.id })
      return NextResponse.json({ ok: true })
    }

    // 2. Recebendo mensagem do privado do atendente (Resposta ao usuário)
    if (body.message && body.message.reply_to_message) {
      const msg = body.message
      const replyText = msg.reply_to_message.text || ''
      const texto = msg.text || ''
      
      // Extrai o chamadoId usando Regex: "ID: xyz)"
      const match = replyText.match(/ID:\s*([a-zA-Z0-9_-]+)\)/)
      
      if (match && match[1] && texto.trim()) {
        const chamadoId = match[1]
        const db = getFirestore(getSupportAdminApp())
        
        // Salva a mensagem no Firebase
        await db.collection('chamados').doc(chamadoId).collection('mensagens').add({
          autorTipo: 'atendente',
          conteudo: texto.trim(),
          enviadoEm: FieldValue.serverTimestamp(),
          lida: false
        })

        // Atualiza o contador de não lidas para o usuário na web
        await db.collection('chamados').doc(chamadoId).update({
          naoLidasUsuario: FieldValue.increment(1),
          atualizadoEm: FieldValue.serverTimestamp()
        })

        return NextResponse.json({ ok: true })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook-telegram]', err)
    return NextResponse.json({ erro: 'Falha interna do webhook' }, { status: 500 })
  }
}
