import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

const supportConfig = {
  apiKey: process.env.NEXT_PUBLIC_SUPPORT_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_SUPPORT_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_SUPPORT_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_SUPPORT_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_SUPPORT_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_SUPPORT_FIREBASE_APP_ID,
}

const suporteConfigurado = Boolean(supportConfig.apiKey && supportConfig.projectId)

let supportAuth = null
let supportDb = null

if (typeof window !== 'undefined' && suporteConfigurado) {
  const app = getApps().find((a) => a.name === 'support') || initializeApp(supportConfig, 'support')
  supportAuth = getAuth(app)
  try {
    supportDb = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  } catch {
    supportDb = getFirestore(app)
  }
}

export { supportAuth, supportDb, suporteConfigurado }
