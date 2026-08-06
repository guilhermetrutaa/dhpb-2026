import admin from 'firebase-admin'
import { getAuth } from 'firebase-admin/auth'

let app = null

const carregarServiceAccount = () => {
  const raw = process.env.SUPPORT_SERVICE_ACCOUNT || process.env.SUPPORT_SERVICE_ACCOUNT_BASE64
  if (!raw) throw new Error('SUPPORT_SERVICE_ACCOUNT não configurada')

  const json = process.env.SUPPORT_SERVICE_ACCOUNT_BASE64
    ? Buffer.from(raw, 'base64').toString('utf8')
    : raw

  const cert = JSON.parse(json)
  if (typeof cert.private_key === 'string') {
    cert.private_key = cert.private_key.replace(/\\n/g, '\n')
  }
  return cert
}

export const getSupportAdminApp = () => {
  if (app) return app
  const existente = admin.apps?.find((a) => a?.name === 'support-admin')
  if (existente) {
    app = existente
    return app
  }

  const cert = carregarServiceAccount()
  app = admin.initializeApp(
    {
      credential: admin.cert(cert),
      projectId: cert.project_id,
    },
    'support-admin'
  )
  return app
}

export const getSupportAdminAuth = () => getAuth(getSupportAdminApp())
