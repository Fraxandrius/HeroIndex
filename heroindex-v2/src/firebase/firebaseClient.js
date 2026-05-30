import { initializeApp, getApps } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const env = import.meta.env ?? {}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

const requiredFirebaseConfigKeys = ['apiKey', 'databaseURL', 'projectId', 'appId']

function hasFirebaseConfig() {
  return requiredFirebaseConfigKeys.every((key) => Boolean(firebaseConfig[key]))
}

const firebaseApp = hasFirebaseConfig()
  ? getApps()[0] ?? initializeApp(firebaseConfig)
  : null

export const firebaseClient = firebaseApp
  ? {
      app: firebaseApp,
      database: getDatabase(firebaseApp),
      isConfigured: true,
    }
  : {
      app: null,
      database: null,
      isConfigured: false,
    }

export function getFirebaseClient() {
  return firebaseClient
}
