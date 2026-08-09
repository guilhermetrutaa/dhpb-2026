importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyAbTe9fFzHnG1CivJLT6W1lLiTe3WVgmGg",
  authDomain: "dhpb-55d27.firebaseapp.com",
  projectId: "dhpb-55d27",
  storageBucket: "dhpb-55d27.firebasestorage.app",
  messagingSenderId: "197763159758",
  appId: "1:197763159758:web:553ab0b870692bfc12e29f"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Recebeu mensagem em background: ', payload)

  const notificationTitle = payload.notification?.title || 'DHPB - Suporte'
  const notificationOptions = {
    body: payload.notification?.body || 'Você tem uma nova mensagem.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já houver uma aba aberta com o site, foca nela
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus()
        }
      }
      // Se não, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})
