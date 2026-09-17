import { NextResponse } from 'next/server'
import { getMainAdminAuth, ServiceAccountError } from '@/lib/admin/main-firebase-admin'

export const MAIN_ADMIN_EMAIL = 'admin@dhpb.com'

export function adminAuthErroJson(err, fallback) {
  const code = err?.code || ''
  return {
    erro: err?.message || fallback,
    ...(code ? { code } : {}),
  }
}

export function respostaFalhaAdminAuth(err, fallback) {
  if (err instanceof ServiceAccountError) {
    return NextResponse.json({ erro: err.message }, { status: 503 })
  }
  return NextResponse.json(adminAuthErroJson(err, fallback), { status: 500 })
}

export async function requireMainAdmin(req) {
  const header = req.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) {
    return { error: NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 }) }
  }

  try {
    const decoded = await getMainAdminAuth().verifyIdToken(token)
    const email = typeof decoded.email === 'string' ? decoded.email.trim().toLowerCase() : ''
    if (email !== MAIN_ADMIN_EMAIL) {
      return { error: NextResponse.json({ erro: 'Proibido.' }, { status: 403 }) }
    }
    return { decoded, email }
  } catch (err) {
    if (err instanceof ServiceAccountError) {
      console.error('[admin/auth] service account', err.message)
      return { error: NextResponse.json({ erro: err.message }, { status: 503 }) }
    }
    const msg = String(err?.message || '')
    if (/MAIN_SERVICE_ACCOUNT|service account|Failed to parse private key|PEM/i.test(msg)) {
      console.error('[admin/auth] service account', msg)
      return {
        error: NextResponse.json(
          { erro: 'MAIN_SERVICE_ACCOUNT ausente ou inválida no servidor. Confira .env.local / Vercel e reinicie.' },
          { status: 503 }
        ),
      }
    }
    return { error: NextResponse.json({ erro: 'Token inválido.' }, { status: 401 }) }
  }
}

export function normalizarNomeCampo(valor) {
  return String(valor || '').trim().replace(/\s+/g, ' ')
}
