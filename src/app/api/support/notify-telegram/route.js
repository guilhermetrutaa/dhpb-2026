import { NextResponse } from 'next/server'
import { getProjectId, getToken, fsGet, fsUpdate } from '@/lib/support/server/firestore-rest'

const CATEGORIA_LABELS = {
  inscricao: 'Inscrição',
  regulamento: 'Regulamento',
  equipes: 'Equipes',
  fases: 'Fases e atividades',
  acesso: 'Acesso e recuperação',
  certificados: 'Certificados',
  tecnico: 'Problema técnico',
  outros: 'Outros',
}

const PRIORIDADE_LABELS = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
}

const escaparHtml = (texto = '') =>
  String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const { tipo, chamadoId, resumo, categoria, prioridade, nome, email, dataHora, telegramId, mensagem, atendenteMsgId } = body

    if (!chamadoId) {
      return NextResponse.json({ erro: 'chamadoId obrigatório.' }, { status: 400 })
    }

    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (!token || !chatId) {
      console.error('[support/notify-telegram] Telegram não configurado.')
      return NextResponse.json({ erro: 'Telegram não configurado no servidor.' }, { status: 500 })
    }

    let chatToSend = chatId
    let texto = ''
    let replyMarkup = undefined

    if (tipo === 'nova_mensagem_usuario') {
      if (!telegramId) return NextResponse.json({ erro: 'telegramId ausente para mensagem privada' }, { status: 400 })
      chatToSend = telegramId
      texto = `👤 <b>Nova mensagem de ${escaparHtml(nome || 'Usuário')}</b>\n\n${escaparHtml(mensagem)}\n\n<i>(Responda a esta mensagem para falar com o usuário. ID: ${chamadoId})</i>`
    } else {
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin || '').replace(/\/$/, '')
      const link = `${siteUrl}/admin/suporte/chamados/${encodeURIComponent(chamadoId)}`
      const usuario = `${nome || 'Não informado'}${email ? ` (${email})` : ''}`

      texto = [
        '<b>NOVO ATENDIMENTO SOLICITADO</b>',
        '',
        `<b>Usuário:</b> ${escaparHtml(usuario)}`,
        `<b>Categoria:</b> ${escaparHtml(CATEGORIA_LABELS[categoria] || categoria || 'outros')}`,
        `<b>Prioridade:</b> ${escaparHtml(PRIORIDADE_LABELS[prioridade] || prioridade || 'media')}`,
        `<b>Data/Hora:</b> ${escaparHtml(dataHora || new Date().toLocaleString('pt-BR'))}`,
        `<b>ID do chamado:</b> <code>${escaparHtml(chamadoId)}</code>`,
        '',
        '<b>Resumo:</b>',
        escaparHtml(resumo || 'Sem resumo informado.'),
      ].join('\n')

      replyMarkup = {
        inline_keyboard: [[{ text: 'Assumir atendimento', callback_data: `assumir_${chamadoId}` }]],
      }
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatToSend,
        text: texto,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: replyMarkup,
        ...(tipo === 'nova_mensagem_usuario' && atendenteMsgId
          ? { reply_to_message_id: atendenteMsgId }
          : {}),
      }),
    })

    if (!res.ok) {
      const corpo = await res.text().catch(() => '')
      console.error('[support/notify-telegram]', res.status, corpo)
      return NextResponse.json({ erro: `Telegram retornou ${res.status}` }, { status: 502 })
    }

    const resData = await res.json().catch(() => ({}))
    const sentMsgId = resData?.result?.message_id

    // Se foi mensagem privada para atendente, rastreia o ID para limpeza posterior
    if (tipo === 'nova_mensagem_usuario' && sentMsgId && telegramId) {
      try {
        const fsToken = await getToken()
        const projectId = getProjectId()
        const snap = await fsGet(projectId, `chamados/${chamadoId}`, fsToken)
        if (snap.exists) {
          const listaAtual = Array.isArray(snap.data.telegramPrivadoMsgIds) ? snap.data.telegramPrivadoMsgIds : []
          listaAtual.push({ messageId: sentMsgId, chatId: String(telegramId) })
          await fsUpdate(projectId, `chamados/${chamadoId}`, { telegramPrivadoMsgIds: listaAtual }, fsToken)
        }
      } catch (e) {
        console.error('[notify-telegram] erro ao salvar msg privada para limpeza:', e)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[support/notify-telegram]', err)
    return NextResponse.json({ erro: 'Falha ao enviar notificação.' }, { status: 500 })
  }
}

