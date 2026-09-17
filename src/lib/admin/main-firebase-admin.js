import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

let app = null

const ADMIN_APP_NAME = 'main-admin'

export class ServiceAccountError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ServiceAccountError'
  }
}

const MSG_AUSENTE =
  'MAIN_SERVICE_ACCOUNT ausente ou inválida no servidor. Confira .env.local / Vercel e reinicie.'

const stripWrappingQuotes = (raw) => {
  let s = String(raw || '').trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1)
  }
  return s.trim()
}

const parseServiceAccountJson = (raw) => {
  const s = stripWrappingQuotes(raw)
  const tentativas = [s]
  if (s.includes('\n') || s.includes('\r')) {
    tentativas.push(s.replace(/\r?\n/g, '\\n'))
  }

  let lastErr
  for (const candidate of tentativas) {
    try {
      const parsed = JSON.parse(candidate)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed
      }
      if (typeof parsed === 'string') {
        return parseServiceAccountJson(parsed)
      }
    } catch (e) {
      lastErr = e
    }
  }

  throw new ServiceAccountError(
    `${MSG_AUSENTE} (JSON: ${lastErr?.message || 'inválido'})`
  )
}

const carregarServiceAccount = () => {
  const rawB64 = process.env.MAIN_SERVICE_ACCOUNT_BASE64
  const rawSa = process.env.MAIN_SERVICE_ACCOUNT

  if (!rawB64 && !rawSa) {
    throw new ServiceAccountError(MSG_AUSENTE)
  }

  let json
  if (rawB64) {
    try {
      json = Buffer.from(String(rawB64).trim(), 'base64').toString('utf8')
    } catch (e) {
      throw new ServiceAccountError(`${MSG_AUSENTE} (BASE64: ${e.message})`)
    }
  } else {
    json = rawSa
  }

  const parsed = parseServiceAccountJson(json)

  if (typeof parsed.private_key === 'string') {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
  }

  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new ServiceAccountError(`${MSG_AUSENTE} (faltam project_id, client_email ou private_key)`)
  }

  return parsed
}

export const getMainAdminApp = () => {
  if (app) return app

  const existente = getApps().find((a) => a?.name === ADMIN_APP_NAME)
  if (existente) {
    app = existente
    return app
  }

  let serviceAccount
  try {
    serviceAccount = carregarServiceAccount()
  } catch (err) {
    if (err instanceof ServiceAccountError) throw err
    throw new ServiceAccountError(`${MSG_AUSENTE} (${err.message})`)
  }

  try {
    app = initializeApp(
      {
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      },
      ADMIN_APP_NAME
    )
  } catch (err) {
    throw new ServiceAccountError(`${MSG_AUSENTE} (${err.message})`)
  }
  return app
}

export const getMainAdminAuth = () => getAuth(getMainAdminApp())

export const getMainAdminDb = async () => {
  const { getFirestore } = await import('firebase-admin/firestore')
  return getFirestore(getMainAdminApp())
}
