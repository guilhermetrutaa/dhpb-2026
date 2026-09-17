import { NextResponse } from 'next/server'
import { getMainAdminAuth, getMainAdminDb } from '@/lib/admin/main-firebase-admin'
import { requireMainAdmin, normalizarNomeCampo, respostaFalhaAdminAuth } from '@/lib/admin/require-admin'

export const runtime = 'nodejs'

export async function POST(req) {
  const gate = await requireMainAdmin(req)
  if (gate.error) return gate.error

  try {
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

    const auth = getMainAdminAuth()
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${nome} ${sobrenome}`.trim(),
    })

    try {
      const db = await getMainAdminDb()
      await db.collection('users').doc(userRecord.uid).set({
        nome,
        sobrenome,
        email,
        tipo,
        avatar: '/avatar.svg',
        createdAt: new Date().toISOString(),
      })
    } catch (err) {
      await auth.deleteUser(userRecord.uid).catch(() => {})
      throw err
    }

    return NextResponse.json({ uid: userRecord.uid, email, tipo })
  } catch (err) {
    const code = err?.code || ''
    if (code === 'auth/email-already-exists') {
      return NextResponse.json({ erro: 'Já existe uma conta com este e-mail.' }, { status: 409 })
    }
    if (code === 'auth/invalid-email') {
      return NextResponse.json({ erro: 'E-mail inválido.' }, { status: 400 })
    }
    console.error('[admin/auth/create-user]', err?.code || '', err?.message || err)
    return respostaFalhaAdminAuth(err, 'Falha ao criar conta.')
  }
}
