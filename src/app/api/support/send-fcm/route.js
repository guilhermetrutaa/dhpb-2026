import { NextResponse } from 'next/server'
import { getProjectId, getToken, fsGet, fsSendFcm } from '@/lib/support/server/firestore-rest'

export const runtime = 'nodejs'

export async function POST(req) {
  try {
    const { chamadoId, texto } = await req.json()

    if (!chamadoId || !texto) {
      return NextResponse.json({ ok: false, erro: 'Dados incompletos' }, { status: 400 })
    }

    const token = await getToken()
    const projectId = getProjectId()
    const docPath = `chamados/${chamadoId}`

    const snap = await fsGet(projectId, docPath, token)
    if (!snap.exists || !snap.data.fcmToken) {
      return NextResponse.json({ ok: true, aviso: 'Usuário não tem token de notificação' })
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
    
    // Título da notificação
    const titulo = snap.data.atendenteNome ? `Suporte DHPB: Resposta de ${snap.data.atendenteNome}` : 'Equipe de Suporte DHPB'
    const resumoTexto = texto.trim().slice(0, 100) + (texto.length > 100 ? '...' : '')

    await fsSendFcm(
      projectId,
      snap.data.fcmToken,
      token,
      titulo,
      resumoTexto,
      siteUrl
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[send-fcm] Erro:', err)
    return NextResponse.json({ ok: false, erro: 'Falha interna ao enviar FCM' }, { status: 500 })
  }
}
