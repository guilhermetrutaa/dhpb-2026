import { NextResponse } from 'next/server'
import { getMainAdminAuth } from '@/lib/admin/main-firebase-admin'
import { requireMainAdmin } from '@/lib/admin/require-admin'

export const runtime = 'nodejs'

const serializar = (record) => ({
  uid: record.uid,
  email: record.email || '',
  emailVerified: !!record.emailVerified,
  disabled: !!record.disabled,
  displayName: record.displayName || '',
  lastSignInAt: record.metadata?.lastSignInTime || null,
  creationTime: record.metadata?.creationTime || null,
})

export async function POST(req) {
  const gate = await requireMainAdmin(req)
  if (gate.error) return gate.error

  try {
    const body = await req.json().catch(() => ({}))
    const uid = String(body.uid || '').trim()
    const email = String(body.email || '').trim().toLowerCase()

    const auth = getMainAdminAuth()
    const record = uid
      ? await auth.getUser(uid)
      : email
        ? await auth.getUserByEmail(email)
        : null

    if (!record) {
      return NextResponse.json({ erro: 'Informe uid ou e-mail.' }, { status: 400 })
    }

    return NextResponse.json(serializar(record))
  } catch (err) {
    const code = err?.code || ''
    if (code === 'auth/user-not-found') {
      return NextResponse.json({ erro: 'Conta Auth não encontrada.' }, { status: 404 })
    }
    console.error('[admin/auth/get-user]', err?.message || err)
    return NextResponse.json({ erro: err?.message || 'Falha ao buscar conta Auth.' }, { status: 500 })
  }
}
