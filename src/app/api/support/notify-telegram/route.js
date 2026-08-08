import { NextResponse } from 'next/server'

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

    const chamadoId = typeof body.chamadoId === 'string' ? body.chamadoId : ''
    const resumo = typeof body.resumo === 'string' ? body.resumo.slice(0, 700) : ''
    const categoria = typeof body.categoria === 'string' ? body.categoria : 'outros'
    const prioridade = typeof body.prioridade === 'string' ? body.prioridade : 'media'
    const nome = typeof body.nome === 'string' ? body.nome : ''
    const email = typeof body.email === 'string' ? body.email : ''
    const dataHora = typeof body.dataHora === 'string' ? body.dataHora : new Date().toLocaleString('pt-BR')

    if (!chamadoId) {
      return NextResponse.json({ erro: 'chamadoId obrigatório.' }, { status: 400 })
    }

    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (!token || !chatId) {
      console.error('[support/notify-telegram] Telegram não configurado.')
      return NextResponse.json({ erro: 'Telegram não configurado no servidor.' }, { status: 500 })
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin || '').replace(/\/$/, '')
    const link = `${siteUrl}/admin/suporte/chamados/${encodeURIComponent(chamadoId)}`
    const usuario = `${nome || 'Não informado'}${email ? ` (${email})` : ''}`

    const texto = [
      '<b>NOVO ATENDIMENTO SOLICITADO</b>',
      '',
      `<b>Usuário:</b> ${escaparHtml(usuario)}`,
      `<b>Categoria:</b> ${escaparHtml(CATEGORIA_LABELS[categoria] || categoria)}`,
      `<b>Prioridade:</b> ${escaparHtml(PRIORIDADE_LABELS[prioridade] || prioridade)}`,
      `<b>Data/Hora:</b> ${escaparHtml(dataHora)}`,
      `<b>ID do chamado:</b> <code>${escaparHtml(chamadoId)}</code>`,
      '',
      '<b>Resumo:</b>',
      escaparHtml(resumo || 'Sem resumo informado.'),
    ].join('\n')

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: texto,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [[{ text: 'Abrir atendimento', url: link }]],
        },
      }),
    })

    if (!res.ok) {
      const corpo = await res.text().catch(() => '')
      console.error('[support/notify-telegram]', res.status, corpo)
      return NextResponse.json({ erro: `Telegram retornou ${res.status}` }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[support/notify-telegram]', err)
    return NextResponse.json({ erro: 'Falha ao enviar notificação.' }, { status: 500 })
  }
}
