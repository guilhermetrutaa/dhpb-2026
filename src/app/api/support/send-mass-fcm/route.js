import { NextResponse } from 'next/server'
import { getProjectId, getToken, fsGetCollection, fsSendFcm } from '@/lib/support/server/firestore-rest'

export const runtime = 'nodejs'

export async function POST(req) {
  try {
    const { titulo, corpo, link } = await req.json()

    if (!titulo || !corpo) {
      return NextResponse.json({ ok: false, erro: 'Título e corpo são obrigatórios' }, { status: 400 })
    }

    const token = await getToken()
    const projectId = getProjectId()
    
    // Busca todos os tokens salvos globalmente
    const tokensDocs = await fsGetCollection(projectId, 'fcm_tokens', token)
    const validTokens = tokensDocs.filter(d => d.ativo && d.token).map(d => d.token)

    if (validTokens.length === 0) {
      return NextResponse.json({ ok: true, enviados: 0, aviso: 'Nenhum token válido encontrado' })
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
    const targetUrl = link ? (link.startsWith('http') ? link : siteUrl + (link.startsWith('/') ? link : `/${link}`)) : siteUrl

    let successCount = 0
    let failCount = 0

    // Envio em lotes concorrentes para não sobrecarregar
    const batchSize = 10
    for (let i = 0; i < validTokens.length; i += batchSize) {
      const batch = validTokens.slice(i, i + batchSize)
      const promises = batch.map(async (fcmToken) => {
        try {
          await fsSendFcm(projectId, fcmToken, token, titulo, corpo, targetUrl)
          successCount++
        } catch (e) {
          console.error(`[send-mass-fcm] Erro ao enviar para ${fcmToken}:`, e)
          failCount++
        }
      })
      await Promise.all(promises)
    }

    return NextResponse.json({ ok: true, enviados: successCount, falhas: failCount })
  } catch (err) {
    console.error('[send-mass-fcm] Erro:', err)
    return NextResponse.json({ ok: false, erro: 'Falha interna ao enviar FCM em massa' }, { status: 500 })
  }
}
