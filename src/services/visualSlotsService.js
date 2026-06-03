import { get, onValue, ref, set } from 'firebase/database'
import { getFirebaseClient } from '../firebase/firebaseClient.js'
import { uploadImageWithPath } from './storageService.js'
import { normalizeVisualData } from '../utils/visualModel.js'

export const VISUAL_SLOTS_PATH = 'visualSlots'
export const VISUAL_SLOTS_STORAGE_PATH = 'visual-slots'

export function subscribeToVisualSlot(slotId, callback) {
  if (!slotId) {
    callback?.(null)
    return () => {}
  }

  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    callback?.(null)
    return () => {}
  }

  const slotReference = ref(database, `${VISUAL_SLOTS_PATH}/${slotId}`)

  return onValue(slotReference, (snapshot) => {
    callback?.(snapshot.exists() ? { id: slotId, ...normalizeVisualData(snapshot.val()) } : null)
  })
}

export async function updateVisualSlot(slotId, data = {}) {
  if (!slotId) {
    throw new Error('Visual slot id is required')
  }

  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  const slotReference = ref(database, `${VISUAL_SLOTS_PATH}/${slotId}`)
  const snapshot = await get(slotReference)
  const currentData = snapshot.exists() ? snapshot.val() : {}
  const timestamp = Date.now()
  const payload = {
    ...normalizeVisualData({ ...currentData, ...data }),
    id: slotId,
    createdAt: currentData.createdAt ?? data.createdAt ?? timestamp,
    updatedAt: timestamp,
  }

  if (data.storagePath ?? currentData.storagePath) {
    payload.storagePath = data.storagePath ?? currentData.storagePath
  }

  await set(slotReference, payload)

  return payload
}

export function saveVisualSlot(slotId, data = {}) {
  return updateVisualSlot(slotId, data)
}

export async function uploadVisualSlotImage(slotId, file) {
  if (!slotId) {
    throw new Error('Visual slot id is required')
  }

  return uploadImageWithPath(file, `${VISUAL_SLOTS_STORAGE_PATH}/${slotId}`)
}
