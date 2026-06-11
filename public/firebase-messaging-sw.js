importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyAUDFLdtZZ5HJj4a50wR7Kw6IZwlEar2p8",
  authDomain: "drenz-ce592.firebaseapp.com",
  projectId: "drenz-ce592",
  storageBucket: "drenz-ce592.firebasestorage.app",
  messagingSenderId: "588309929485",
  appId: "1:588309929485:web:3b4ca03eeae5660507ff44",
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification

  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192x192.png',
  })
})