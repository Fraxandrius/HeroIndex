import { get, onValue, ref, set } from 'firebase/database'
import { getFirebaseClient } from '../firebase/firebaseClient.js'
import { normalizeVisualData } from '../utils/visualModel.js'
import { uploadImageWithPath } from './storageService.js'

export const PUBLIC_SIGNALS_PATH = 'publicSignals'
export const PUBLIC_SIGNALS_STORAGE_PATH = 'public-signals'

export function subscribeToPublicSignal(signalId, callback) {
  if (!signalId) {
    callback?.(null)
    return () => {}
  }

  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    callback?.(null)
    return () => {}
  }

  const signalReference = ref(database, `${PUBLIC_SIGNALS_PATH}/${signalId}`)

  return onValue(signalReference, (snapshot) => {
    callback?.(snapshot.exists() ? { id: signalId, ...normalizeVisualData(snapshot.val()) } : null)
  })
}

export async function updatePublicSignal(signalId, data = {}) {
  if (!signalId) {
    throw new Error('Public signal id is required')
  }

  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  const signalReference = ref(database, `${PUBLIC_SIGNALS_PATH}/${signalId}`)
  const snapshot = await get(signalReference)
  const currentData = snapshot.exists() ? snapshot.val() : {}
  const timestamp = Date.now()
  const payload = {
    ...normalizeVisualData({ ...currentData, ...data }),
    id: signalId,
    createdAt: currentData.createdAt ?? data.createdAt ?? timestamp,
    updatedAt: timestamp,
  }

  if (data.storagePath ?? currentData.storagePath) {
    payload.storagePath = data.storagePath ?? currentData.storagePath
  }

  await set(signalReference, payload)

  return payload
}

export async function uploadPublicSignalImage(signalId, file) {
  if (!signalId) {
    throw new Error('Public signal id is required')
  }

  return uploadImageWithPath(file, `${PUBLIC_SIGNALS_STORAGE_PATH}/${signalId}`)
}
