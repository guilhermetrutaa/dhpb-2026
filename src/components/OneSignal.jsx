'use client'
import { useEffect } from 'react'
import Script from 'next/script'

export default function OneSignalInit() {
  useEffect(() => {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return
    }

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    if (!appId) {
      console.warn('[OneSignal] NEXT_PUBLIC_ONESIGNAL_APP_ID não configurado.')
      return
    }

    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async function (OneSignal) {
      try {
        await OneSignal.init({
          appId,
          safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID,
          notifyButton: { enable: false },
        })

        OneSignal.User.PushSubscription.addEventListener('change', ({ current }) => {
          console.info('[OneSignal] Inscrição push atualizada.', {
            inscrito: current.optedIn,
            possuiToken: Boolean(current.token),
          })
        })
      } catch (error) {
        console.error('[OneSignal] Não foi possível inicializar as notificações push.', error)
      }
    })
  }, [])

  return <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="afterInteractive" />
}
