import { NextResponse } from 'next/server'
import { requireMainAdmin, MAIN_ADMIN_EMAIL, respostaFalhaAdminAuth } from '@/lib/admin/require-admin'
import { lookupAuthUser, updateAuthUser } from '@/lib/admin/main-auth-rest'

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
      return NextResponse.json({ erro: 'Não é permitido alterar a conta admin.' }, { status: 403 })
    }

    const updates = {}
    if (typeof body.email === 'string' && body.email.trim()) {
      const email = body.email.trim().toLowerCase()
      if (!email.includes('@')) {
        return NextResponse.json({ erro: 'E-mail inválido.' }, { status: 400 })
      }
      updates.email = email
    }
    if (typeof body.password === 'string' && body.password) {
      if (body.password.length < 6) {
        return NextResponse.json({ erro: 'Senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
      }
      updates.password = body.password
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ erro: 'Nada para atualizar.' }, { status: 400 })
    }

    const updated = await updateAuthUser({ uid, ...updates })
    return NextResponse.json({
      uid: updated.uid,
      email: updated.email || '',
    })
  } catch (err) {
    const code = err?.code || ''
    if (code === 'auth/user-not-found') {
      return NextResponse.json({ erro: 'Conta Auth não encontrada.', code }, { status: 404 })
    }
    if (code === 'auth/email-already-exists') {
      return NextResponse.json({ erro: 'Já existe uma conta com este e-mail.', code }, { status: 409 })
    }
    console.error('[admin/auth/update-user]', err?.code || '', err?.message || err)
    return respostaFalhaAdminAuth(err, 'Falha ao atualizar conta.')
  }
}
