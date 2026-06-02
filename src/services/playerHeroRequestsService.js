import { onValue, push, ref, set, update } from 'firebase/database'
import { getFirebaseClient } from '../firebase/firebaseClient.js'

export const PLAYER_HERO_REQUESTS_PATH = 'playerHeroRequests'

function assertFirebase(database, isConfigured) {
  if (!isConfigured || !database) {
    throw new Error('Firebase no está configurado.')
  }
}

function normalizeRequest(id, request = {}) {
  return {
    id,
    uid: request.uid ?? '',
    username: request.username ?? '',
    displayName: request.displayName ?? '',
    requestedHeroName: request.requestedHeroName ?? '',
    notes: request.notes ?? '',
    status: request.status ?? 'pending',
    heroId: request.heroId ?? '',
    createdAt: request.createdAt ?? 0,
    updatedAt: request.updatedAt ?? 0,
  }
}

function normalizeRequestsSnapshot(snapshotValue) {
  if (!snapshotValue) return []

  return Object.entries(snapshotValue)
    .filter(([, request]) => request && typeof request === 'object')
    .map(([id, request]) => normalizeRequest(id, request))
    .sort((first, second) => Number(second.createdAt ?? 0) - Number(first.createdAt ?? 0))
}

export function subscribeToPlayerHeroRequests(callback, onError) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    callback?.([])
    return () => {}
  }

  return onValue(
    ref(database, PLAYER_HERO_REQUESTS_PATH),
    (snapshot) => callback?.(normalizeRequestsSnapshot(snapshot.val())),
    (error) => onError?.(error),
  )
}

export async function createPlayerHeroRequest(data = {}) {
  const { database, isConfigured } = getFirebaseClient()

  assertFirebase(database, isConfigured)

  const timestamp = Date.now()
  const requestReference = push(ref(database, PLAYER_HERO_REQUESTS_PATH))
  const payload = {
    id: requestReference.key,
    uid: data.uid ?? '',
    username: data.username ?? '',
    displayName: data.displayName ?? '',
    requestedHeroName: data.requestedHeroName ?? '',
    notes: data.notes ?? '',
    status: data.status ?? 'pending',
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await set(requestReference, payload)

  return payload
}

export async function updatePlayerHeroRequest(requestId, data = {}) {
  if (!requestId) {
    throw new Error('La solicitud de jugador es obligatoria.')
  }

  const { database, isConfigured } = getFirebaseClient()

  assertFirebase(database, isConfigured)

  const payload = {
    ...data,
    updatedAt: Date.now(),
  }

  await update(ref(database, `${PLAYER_HERO_REQUESTS_PATH}/${requestId}`), payload)

  return {
    id: requestId,
    ...payload,
  }
}
