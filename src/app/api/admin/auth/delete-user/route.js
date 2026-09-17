import { NextResponse } from 'next/server'
import { requireMainAdmin, MAIN_ADMIN_EMAIL, respostaFalhaAdminAuth } from '@/lib/admin/require-admin'
import { lookupAuthUser, deleteAuthUser } from '@/lib/admin/main-auth-rest'

export const runtime = 'nodejs'

export async function POST(req) {
  try {
    const gate = await requireMainAdmin(req)
    if (gate.error) return gate.error

    const body = await req.json().catch(() => ({}))
    const uid = String(body.uid || '').trim()
    if (!uid) {
      return NextResponse.json({ erro: 'UID obrigatório.' }, { status: 400 })
    }

    const atual = await lookupAuthUser({ uid })
    if ((atual.email || '').toLowerCase() === MAIN_ADMIN_EMAIL) {
      return NextResponse.json({ erro: 'Não é permitido excluir a conta admin.' }, { status: 403 })
    }

    await deleteAuthUser(uid)
    return NextResponse.json({ ok: true, uid })
  } catch (err) {
    const code = err?.code || ''
    if (code === 'auth/user-not-found') {
      return NextResponse.json({ erro: 'Conta Auth não encontrada (Firestore pode já ter sido limpo).', code }, { status: 404 })
    }
    console.error('[admin/auth/delete-user]', err?.code || '', err?.message || err)
    return respostaFalhaAdminAuth(err, 'Falha ao excluir conta Auth.')
  }
}
