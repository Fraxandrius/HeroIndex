import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { get, onValue, ref, set, update } from 'firebase/database'
import { getFirebaseClient } from '../firebase/firebaseClient.js'

export const USERS_PATH = 'users'
export const HERO_INDEX_EMAIL_DOMAIN = 'indexchile.cl'

let persistenceConfigured = false

function getConfiguredAuth() {
  const { auth, isConfigured } = getFirebaseClient()

  if (!isConfigured || !auth) {
    throw new Error('Firebase Auth is not configured')
  }

  return auth
}

async function ensurePersistence() {
  if (persistenceConfigured) return

  const auth = getConfiguredAuth()
  await setPersistence(auth, browserLocalPersistence)
  persistenceConfigured = true
}

function getConfiguredDatabase() {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    throw new Error('Firebase Database is not configured')
  }

  return database
}

export function normalizeHeroIndexUsername(username = '') {
  return username
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function buildHeroIndexEmail(username) {
  const normalizedUsername = normalizeHeroIndexUsername(username)

  if (normalizedUsername.length < 3) {
    throw new Error('INVALID_USERNAME')
  }

  return `${normalizedUsername}@${HERO_INDEX_EMAIL_DOMAIN}`
}

function mapAuthError(error, fallbackMessage) {
  if (error?.code === 'auth/email-already-in-use') {
    return new Error('Ese nombre de usuario ya está registrado.')
  }

  if (
    error?.code === 'auth/invalid-credential' ||
    error?.code === 'auth/user-not-found' ||
    error?.code === 'auth/wrong-password'
  ) {
    return new Error('Usuario o contraseña incorrectos.')
  }

  return new Error(fallbackMessage)
}

export async function createOrUpdateUserProfile(uid, data = {}) {
  if (!uid) {
    throw new Error('User id is required')
  }

  const database = getConfiguredDatabase()
  const timestamp = Date.now()
  const userReference = ref(database, `${USERS_PATH}/${uid}`)
  const snapshot = await get(userReference)
  const existingProfile = snapshot.exists() ? snapshot.val() : {}

  const payload = {
    ...existingProfile,
    ...data,
    uid,
    role: existingProfile.role ?? data.role ?? 'player',
    createdAt: existingProfile.createdAt ?? data.createdAt ?? timestamp,
    updatedAt: timestamp,
  }

  await set(userReference, payload)

  return payload
}

export async function registerWithHeroIndexUsername({ displayName, heroName, password, username }) {
  const normalizedUsername = normalizeHeroIndexUsername(username)

  if (normalizedUsername.length < 3) {
    throw new Error('Ingresa un usuario válido de al menos 3 caracteres.')
  }

  if (!password || password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.')
  }

  const authEmail = buildHeroIndexEmail(normalizedUsername)

  try {
    await ensurePersistence()
    const auth = getConfiguredAuth()
    const credential = await createUserWithEmailAndPassword(auth, authEmail, password)
    const timestamp = Date.now()

    await createOrUpdateUserProfile(credential.user.uid, {
      authEmail,
      avatarUrl: '',
      createdAt: timestamp,
      displayName: (heroName ?? displayName)?.trim() || username.trim(),
      heroId: '',
      heroName: (heroName ?? displayName)?.trim() || username.trim(),
      username: normalizedUsername,
    })

    return credential.user
  } catch (error) {
    throw mapAuthError(error, 'No fue posible crear la cuenta.')
  }
}

export async function loginWithHeroIndexUsername({ password, username }) {
  const normalizedUsername = normalizeHeroIndexUsername(username)

  if (normalizedUsername.length < 3 || !password) {
    throw new Error('Usuario o contraseña incorrectos.')
  }

  const authEmail = buildHeroIndexEmail(normalizedUsername)

  try {
    await ensurePersistence()
    const auth = getConfiguredAuth()
    const credential = await signInWithEmailAndPassword(auth, authEmail, password)

    return credential.user
  } catch (error) {
    throw mapAuthError(error, 'No fue posible iniciar sesión.')
  }
}

export async function logout() {
  await ensurePersistence()
  await signOut(getConfiguredAuth())
}

export function subscribeToAuth(callback) {
  const { auth, isConfigured } = getFirebaseClient()

  if (!isConfigured || !auth) {
    callback?.(null)
    return () => {}
  }

  if (!persistenceConfigured) {
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        persistenceConfigured = true
      })
      .catch(() => {
        persistenceConfigured = true
      })
  }

  return onAuthStateChanged(auth, callback)
}

export function subscribeToUserProfile(uid, callback) {
  if (!uid) {
    callback?.(null)
    return () => {}
  }

  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    callback?.(null)
    return () => {}
  }

  return onValue(ref(database, `${USERS_PATH}/${uid}`), (snapshot) => {
    callback?.(snapshot.exists() ? { uid, ...snapshot.val() } : null)
  })
}

export async function getUserProfile(uid) {
  if (!uid) return null

  const database = getConfiguredDatabase()
  const snapshot = await get(ref(database, `${USERS_PATH}/${uid}`))

  return snapshot.exists() ? { uid, ...snapshot.val() } : null
}

export async function updateUserProfile(uid, data = {}) {
  if (!uid) {
    throw new Error('User id is required')
  }

  const database = getConfiguredDatabase()
  const allowedData = {
    avatarUrl: data.avatarUrl ?? '',
    displayName: data.displayName ?? '',
    heroId: data.heroId ?? '',
    updatedAt: Date.now(),
    heroName: data.heroName ?? data.displayName ?? '',
  }

  await update(ref(database, `${USERS_PATH}/${uid}`), allowedData)

  return allowedData
}
