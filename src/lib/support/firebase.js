import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getMessaging, getToken } from 'firebase/messaging'

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

let supportMessaging = null
if (typeof window !== 'undefined' && suporteConfigurado && 'Notification' in window) {
  try {
    const app = getApps().find((a) => a.name === 'support')
    supportMessaging = getMessaging(app)
  } catch (e) {
    console.error('Falha ao inicializar FCM do suporte:', e)
  }
}

export const requestNotificationToken = async () => {
  if (!supportMessaging) return null
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const vapidKey = process.env.NEXT_PUBLIC_SUPPORT_FIREBASE_VAPID_KEY
    if (!vapidKey) {
      console.error('VAPID Key não configurada para o FCM do Suporte.')
      return null
    }

    const swRegistration = await navigator.serviceWorker.register('/support-sw.js', { scope: '/support-sw-scope' })

    const tokenFCM = await getToken(supportMessaging, { vapidKey, serviceWorkerRegistration: swRegistration })
    if (tokenFCM && supportDb) {
      setDoc(doc(supportDb, 'fcm_tokens', tokenFCM), {
        token: tokenFCM,
        ativo: true,
        atualizadoEm: serverTimestamp()
      }, { merge: true }).catch((e) => console.error('Erro ao salvar token global', e))
    }
    return tokenFCM
  } catch (e) {
    console.error('Erro ao pedir token FCM:', e)
    return null
  }
}

export { supportAuth, supportDb, supportMessaging, suporteConfigurado }
