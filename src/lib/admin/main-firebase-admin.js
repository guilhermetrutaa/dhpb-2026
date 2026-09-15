import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

let app = null

const ADMIN_APP_NAME = 'main-admin'

const carregarServiceAccount = () => {
  const rawSa = process.env.MAIN_SERVICE_ACCOUNT
  const rawB64 = process.env.MAIN_SERVICE_ACCOUNT_BASE64

  if (!rawSa && !rawB64) {
    throw new Error(
      'Nenhuma variavel de service account do Firebase principal configurada. ' +
        'Defina MAIN_SERVICE_ACCOUNT (JSON direto) ou MAIN_SERVICE_ACCOUNT_BASE64 (JSON em base64).'
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
    throw new Error(`MAIN_SERVICE_ACCOUNT invalido (erro ao parsear JSON): ${e.message}`)
  }

  if (typeof parsed.private_key === 'string') {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
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

  const serviceAccount = carregarServiceAccount()
  app = initializeApp(
    {
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    },
    ADMIN_APP_NAME
  )
  return app
}

export const getMainAdminAuth = () => getAuth(getMainAdminApp())

export const getMainAdminDb = () => getFirestore(getMainAdminApp())
