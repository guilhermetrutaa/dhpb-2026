import { NextResponse } from 'next/server'
import { requireMainAdmin, normalizarNomeCampo, respostaFalhaAdminAuth } from '@/lib/admin/require-admin'
import { createAuthUser, deleteAuthUser, setUsersDoc } from '@/lib/admin/main-auth-rest'

export const runtime = 'nodejs'

export async function POST(req) {
  try {
    const gate = await requireMainAdmin(req)
    if (gate.error) return gate.error

    const body = await req.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const nome = normalizarNomeCampo(body.nome)
    const sobrenome = normalizarNomeCampo(body.sobrenome)
    const tipo = body.tipo === 'professor' ? 'professor' : 'estudante'

    if (!email || !email.includes('@')) {
      return NextResponse.json({ erro: 'E-mail inválido.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ erro: 'Senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
    }
    if (!nome || !sobrenome) {
      return NextResponse.json({ erro: 'Nome e sobrenome são obrigatórios.' }, { status: 400 })
    }

    const userRecord = await createAuthUser({
      email,
      password,
      displayName: `${nome} ${sobrenome}`.trim(),
    })

    try {
      await setUsersDoc(userRecord.uid, {
        nome,
        sobrenome,
        email,
        tipo,
        avatar: '/avatar.svg',
        createdAt: new Date().toISOString(),
      })
    } catch (err) {
      await deleteAuthUser(userRecord.uid).catch(() => {})
      throw err
    }

    return NextResponse.json({ uid: userRecord.uid, email, tipo })
  } catch (err) {
    const code = err?.code || ''
    if (code === 'auth/email-already-exists') {
      return NextResponse.json({ erro: 'Já existe uma conta com este e-mail.', code }, { status: 409 })
    }
    if (code === 'auth/invalid-email') {
      return NextResponse.json({ erro: 'E-mail inválido.', code }, { status: 400 })
    }
    console.error('[admin/auth/create-user]', err?.code || '', err?.message || err)
    return respostaFalhaAdminAuth(err, 'Falha ao criar conta.')
  }
}
