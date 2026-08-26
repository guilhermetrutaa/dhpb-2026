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
