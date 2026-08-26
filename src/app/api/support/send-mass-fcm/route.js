import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

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

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${apiKey}`
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ['Subscribed Users'],
        headings: { en: titulo, pt: titulo },
        contents: { en: corpo, pt: corpo },
        url: targetUrl
      })
    })

    const data = await response.json()

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
