import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: "AIzaSyAUDFLdtZZ5HJj4a50wR7Kw6IZwlEar2p8",
  authDomain: "drenz-ce592.firebaseapp.com",
  projectId: "drenz-ce592",
  storageBucket: "drenz-ce592.firebasestorage.app",
  messagingSenderId: "588309929485",
  appId: "1:588309929485:web:3b4ca03eeae5660507ff44",
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const VAPID_KEY = "BLB6Npt8ghs7gJ2o_PhA5cMHN56WbrHLmz-k00vL7IXnErJKpFRjU1jFuqtyYiV56J5EIpqWgjrRl2DwIa2jqx4"

export async function getMessagingInstance() {
  const supported = await isSupported()
  if (!supported) return null
  return getMessaging(app)
}

export { getToken, onMessage }