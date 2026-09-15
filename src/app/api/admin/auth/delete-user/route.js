import { NextResponse } from 'next/server'
import { getMainAdminAuth } from '@/lib/admin/main-firebase-admin'
import { requireMainAdmin, MAIN_ADMIN_EMAIL } from '@/lib/admin/require-admin'

export const runtime = 'nodejs'

export async function POST(req) {
  const gate = await requireMainAdmin(req)
  if (gate.error) return gate.error

  try {
    const body = await req.json().catch(() => ({}))
    const uid = String(body.uid || '').trim()
    if (!uid) {
      return NextResponse.json({ erro: 'UID obrigatório.' }, { status: 400 })
    }

    const auth = getMainAdminAuth()
    const atual = await auth.getUser(uid)
    if ((atual.email || '').toLowerCase() === MAIN_ADMIN_EMAIL) {
      return NextResponse.json({ erro: 'Não é permitido excluir a conta admin.' }, { status: 403 })
    }

    await auth.deleteUser(uid)
    return NextResponse.json({ ok: true, uid })
  } catch (err) {
    const code = err?.code || ''
    if (code === 'auth/user-not-found') {
      return NextResponse.json({ erro: 'Conta Auth não encontrada (Firestore pode já ter sido limpo).' }, { status: 404 })
    }
    console.error('[admin/auth/delete-user]', err?.message || err)
    return NextResponse.json({ erro: err?.message || 'Falha ao excluir conta Auth.' }, { status: 500 })
  }
}
