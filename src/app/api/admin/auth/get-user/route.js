import { NextResponse } from 'next/server'
import { requireMainAdmin, respostaFalhaAdminAuth } from '@/lib/admin/require-admin'
import { lookupAuthUser } from '@/lib/admin/main-auth-rest'

export const runtime = 'nodejs'

export async function POST(req) {
  try {
    const gate = await requireMainAdmin(req)
    if (gate.error) return gate.error

    const body = await req.json().catch(() => ({}))
    const uid = String(body.uid || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    if (!uid && !email) {
      return NextResponse.json({ erro: 'Informe uid ou e-mail.' }, { status: 400 })
    }

    const record = await lookupAuthUser({ uid, email })
    return NextResponse.json(record)
  } catch (err) {
    const code = err?.code || ''
    if (code === 'auth/user-not-found') {
      return NextResponse.json({ erro: 'Conta Auth não encontrada.', code }, { status: 404 })
    }
    console.error('[admin/auth/get-user]', err?.code || '', err?.message || err)
    return respostaFalhaAdminAuth(err, 'Falha ao buscar conta Auth.')
  }
}
