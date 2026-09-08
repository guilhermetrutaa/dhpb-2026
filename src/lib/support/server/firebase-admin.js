import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

let app = null

const carregarServiceAccount = () => {
  const rawSa = process.env.SUPPORT_SERVICE_ACCOUNT
  const rawB64 = process.env.SUPPORT_SERVICE_ACCOUNT_BASE64

  if (!rawSa && !rawB64) {
    throw new Error(
      'Nenhuma variavel de service account configurada. ' +
        'Defina SUPPORT_SERVICE_ACCOUNT (JSON direto) ou SUPPORT_SERVICE_ACCOUNT_BASE64 (JSON em base64).'
    )
  }

  let json
  if (rawB64) {
    json = Buffer.from(rawB64, 'base64').toString('utf8')
  } else {
    json = rawSa
  }

  let parsed
  try {
    parsed = JSON.parse(json)
  } catch (e) {
    throw new Error(`SUPPORT_SERVICE_ACCOUNT invalido (erro ao parsear JSON): ${e.message}`)
  }

  if (typeof parsed.private_key === 'string') {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
  }

  return parsed
}

export const getSupportAdminApp = () => {
  if (app) return app

  const existente = getApps().find((a) => a?.name === 'support-admin')
  if (existente) {
    app = existente
    return app
  }

  const serviceAccount = carregarServiceAccount()
  app = initializeApp(
    {
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    },
    'support-admin'
  )
  return app
}

export const getSupportAdminAuth = () => getAuth(getSupportAdminApp())
