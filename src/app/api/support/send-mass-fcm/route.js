import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const semDestinatariosElegiveis = (data) => {
  const erros = [
    ...(Array.isArray(data?.errors) ? data.errors : []),
    data?.error,
    data?.error_description,
  ].filter(Boolean).join(' ').toLowerCase()

  return erros.includes('not subscribed') ||
    erros.includes('no valid subscriptions') ||
    erros.includes('no eligible subscriptions')
}

export async function POST(req) {
  try {
    const { titulo, corpo, link } = await req.json()

    if (!titulo || !corpo) {
      return NextResponse.json({ ok: false, erro: 'Título e corpo são obrigatórios' }, { status: 400 })
    }

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    const apiKey = process.env.ONESIGNAL_REST_API_KEY

    if (!appId || !apiKey) {
      return NextResponse.json({ ok: false, erro: 'Chaves do OneSignal não configuradas. Verifique NEXT_PUBLIC_ONESIGNAL_APP_ID e ONESIGNAL_REST_API_KEY no .env.local' }, { status: 500 })
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
    const targetUrl = link ? (link.startsWith('http') ? link : siteUrl + (link.startsWith('/') ? link : `/${link}`)) : siteUrl

    const response = await fetch('https://api.onesignal.com/notifications?c=push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${apiKey}`
      },
      body: JSON.stringify({
        app_id: appId,
        target_channel: 'push',
        included_segments: ['All Subscribers'],
        headings: { en: titulo, pt: titulo },
        contents: { en: corpo, pt: corpo },
        url: targetUrl
      })
    })

    const data = await response.json().catch(() => ({}))

    // A API não cria uma mensagem quando não existe nenhuma inscrição push
    // ativa. Isso é esperado e não deve virar erro 500 para o administrador.
    if (semDestinatariosElegiveis(data) || data.recipients === 0 || (!data.id && response.ok)) {
      return NextResponse.json({
        ok: true,
        enviados: 0,
        falhas: 0,
        semDestinatarios: true,
        msg: 'Nenhum usuário possui notificações push ativas no momento.'
      })
    }

    if (!response.ok || data.errors) {
      console.error('[send-mass-onesignal] Erro da API OneSignal:', JSON.stringify(data, null, 2))

      const errorMsg = data.errors?.join(', ') || data.error || data.error_description || 'Erro desconhecido do OneSignal'
      return NextResponse.json({ ok: false, erro: `OneSignal: ${errorMsg}`, details: data }, { status: 500 })
    }

    if (data.recipients === 0) {
      return NextResponse.json({ ok: true, enviados: 0, falhas: 0, msg: 'Nenhum destinatário. Nenhum usuário ativou notificações ainda ou nenhum usuário está na segment "Subscribed Users".' })
    }

    return NextResponse.json({ ok: true, enviados: data.recipients, falhas: data.errors?.length || 0, msg: `Enviado para ${data.recipients} destinatário(s)` })
  } catch (err) {
    console.error('[send-mass-onesignal] Erro interno:', err)
    return NextResponse.json({ ok: false, erro: `Falha interna: ${err.message}` }, { status: 500 })
  }
}
