import { NextResponse } from 'next/server'
import { getMainAdminAuth } from '@/lib/admin/main-firebase-admin'

export const MAIN_ADMIN_EMAIL = 'admin@dhpb.com'

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
  } catch {
    return { error: NextResponse.json({ erro: 'Token inválido.' }, { status: 401 }) }
  }
}

export function normalizarNomeCampo(valor) {
  return String(valor || '').trim().replace(/\s+/g, ' ')
}
