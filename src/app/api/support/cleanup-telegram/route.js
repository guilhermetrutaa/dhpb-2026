import { NextResponse } from 'next/server'
import { getProjectId, getToken, fsGet, fsUpdate } from '@/lib/support/server/firestore-rest'

export const runtime = 'nodejs'

export async function POST(req) {
  try {
    const { chamadoId } = await req.json().catch(() => ({}))
    if (!chamadoId) {
      return NextResponse.json({ erro: 'chamadoId obrigatorio' }, { status: 400 })
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      return NextResponse.json({ ok: false, aviso: 'Telegram nao configurado' })
    }

    const token = await getToken()
    const projectId = getProjectId()
    const snap = await fsGet(projectId, `chamados/${chamadoId}`, token)

    if (!snap.exists) {
      return NextResponse.json({ ok: true, aviso: 'Chamado nao encontrado' })
    }

    const dados = snap.data
    const mensagensParaApagar = Array.isArray(dados.telegramPrivadoMsgIds) ? [...dados.telegramPrivadoMsgIds] : []

    // Adiciona a mensagem inicial de "assumido" se houver
    if (dados.atendenteMsgId && dados.atendenteTelegramId) {
      mensagensParaApagar.push({
        messageId: dados.atendenteMsgId,
        chatId: String(dados.atendenteTelegramId),
      })
    }

    if (mensagensParaApagar.length > 0) {
      await Promise.allSettled(
        mensagensParaApagar.map(async (item) => {
          try {
            await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: item.chatId,
                message_id: item.messageId,
              }),
            })
          } catch (e) {
            console.error('[cleanup-telegram] falha ao deletar mensagem:', e)
          }
        })
      )

      await fsUpdate(projectId, `chamados/${chamadoId}`, { telegramPrivadoMsgIds: [] }, token)
    }

    return NextResponse.json({ ok: true, deletadas: mensagensParaApagar.length })
  } catch (err) {
    console.error('[cleanup-telegram] Erro:', err)
    return NextResponse.json({ ok: false, erro: 'Falha ao limpar mensagens' }, { status: 500 })
  }
}
