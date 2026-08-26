'use client'
import { useEffect, useState } from 'react'
import Script from 'next/script'

export default function OneSignalInit() {
  const [isLocalhost, setIsLocalhost] = useState(false)

  useEffect(() => {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      setIsLocalhost(true)
      return
    }
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async function (OneSignal) {
      await OneSignal.init({
        appId: '05c58dde-ef80-4abe-9f1d-91654dbc8c18',
        safari_web_id: 'web.onesignal.auto.2b30b273-8f48-4327-8bae-bed77c33071b',
        notifyButton: {
          enable: false,
        },
      })
    })
  }, [])

  if (isLocalhost) return null

  return <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="afterInteractive" />
}
