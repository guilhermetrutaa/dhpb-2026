import admin from 'firebase-admin'
import { getAuth } from 'firebase-admin/auth'

let app = null

export const getSupportAdminApp = () => {
  if (app) return app
  const existente = admin.apps?.find((a) => a?.name === 'support-admin')
  if (existente) {
    app = existente
    return app
  }
  const serviceAccount = process.env.SUPPORT_SERVICE_ACCOUNT
  if (!serviceAccount) throw new Error('SUPPORT_SERVICE_ACCOUNT não configurada')
  const cert = JSON.parse(serviceAccount)
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
