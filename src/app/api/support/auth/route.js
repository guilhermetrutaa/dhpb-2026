import { NextResponse } from 'next/server'
import { verificarTokenFirebase } from '@/lib/support/server/verify-token'
import { getSupportAdminAuth } from '@/lib/support/server/firebase-admin'

export const runtime = 'nodejs'

export async function POST(req) {
  try {
    const { tokenId, nome } = await req.json().catch(() => ({}))

    const payload = await verificarTokenFirebase(tokenId)

    const email = typeof payload.email === 'string' ? payload.email : ''
    const admins = (process.env.SUPPORT_ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)

    const role = admins.includes(email.toLowerCase()) ? 'admin' : 'usuario'

    const supportAuth = getSupportAdminAuth()
    const customToken = await supportAuth.createCustomToken(payload.sub, {
      email,
      nome: typeof nome === 'string' ? nome.slice(0, 120) : '',
      role,
    })

    return NextResponse.json({ customToken, role, email, nome: typeof nome === 'string' ? nome : '' })
  } catch (err) {
    console.error('[support/auth]', err?.message || err)
    return NextResponse.json({ erro: 'Falha na autenticação do suporte.' }, { status: 500 })
  }
}
