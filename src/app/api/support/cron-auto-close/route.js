import { NextResponse } from 'next/server'
import {
  getProjectId,
  getToken,
  fsGetCollection,
  fsUpdateComTimestamp,
  fsAddComTimestamp,
} from '@/lib/support/server/firestore-rest'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const token = await getToken()
    const projectId = getProjectId()
    const chamados = await fsGetCollection(projectId, 'chamados', token)

    const agora = Date.now()
    const DOIS_DIAS_MS = 48 * 60 * 60 * 1000
    let finalizados = 0

    const botToken = process.env.TELEGRAM_BOT_TOKEN

    for (const c of chamados) {
      if (c.status === 'aguardando_usuario') {
        const ultimaData = c.ultimaMensagemEm
          ? new Date(c.ultimaMensagemEm).getTime()
          : c.atualizadoEm
          ? new Date(c.atualizadoEm).getTime()
          : 0

        if (ultimaData > 0 && agora - ultimaData >= DOIS_DIAS_MS) {
          const docPath = `chamados/${c.id}`

          // 1. Atualiza status para resolvido
          await fsUpdateComTimestamp(
            projectId,
            docPath,
            {
              status: 'resolvido',
              resolvidoAutomaticamente: true,
              motivoEncerramento: 'inatividade_48h',
            },
            ['atualizadoEm', 'resolvidoEm'],
            token
          )

          // 2. Grava mensagem de sistema
          await fsAddComTimestamp(
            projectId,
            `${docPath}/mensagens`,
            {
              autorTipo: 'admin',
              autorNome: 'Sistema DHPB',
              conteudo: 'Atendimento finalizado automaticamente após 48 horas sem resposta.',
              lida: true,
              sistema: true,
            },
            ['enviadoEm'],
            token
          )

          // 3. Limpa mensagens no Telegram do atendente
          if (botToken) {
            const msgsParaApagar = Array.isArray(c.telegramPrivadoMsgIds) ? [...c.telegramPrivadoMsgIds] : []
            if (c.atendenteMsgId && c.atendenteTelegramId) {
              msgsParaApagar.push({
                messageId: c.atendenteMsgId,
                chatId: String(c.atendenteTelegramId),
              })
            }
            if (msgsParaApagar.length > 0) {
              await Promise.allSettled(
                msgsParaApagar.map((item) =>
                  fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: item.chatId,
                      message_id: item.messageId,
                    }),
                  }).catch(() => {})
                )
              )
            }
          }

          finalizados++
        }
      }
    }

    return NextResponse.json({ ok: true, finalizados })
  } catch (err) {
    console.error('[cron-auto-close] Erro:', err)
    return NextResponse.json({ ok: false, erro: 'Falha ao executar auto-close' }, { status: 500 })
  }
}
