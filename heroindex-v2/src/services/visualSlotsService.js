import { onValue, ref, set } from 'firebase/database'
import { getFirebaseClient } from '../firebase/firebaseClient.js'
import { uploadImage } from './storageService.js'

export const VISUAL_SLOTS_PATH = 'visualSlots'

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
    callback?.(snapshot.exists() ? { id: slotId, ...snapshot.val() } : null)
  })
}

export async function saveVisualSlot(slotId, slotData = {}) {
  if (!slotId) {
    throw new Error('Visual slot id is required')
  }

  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  const payload = {
    id: slotId,
    page: slotData.page ?? '',
    section: slotData.section ?? '',
    imageUrl: slotData.imageUrl ?? '',
    storagePath: slotData.storagePath ?? '',
    fitMode: slotData.fitMode ?? 'cover',
    position: slotData.position ?? 'center',
    altText: slotData.altText ?? '',
    updatedAt: Date.now(),
    updatedByMode: 'oraculo',
  }

  await set(ref(database, `${VISUAL_SLOTS_PATH}/${slotId}`), payload)

  return payload
}

export async function uploadVisualSlotImage(slotId, file) {
  if (!slotId) {
    throw new Error('Visual slot id is required')
  }

  const storagePath = `${VISUAL_SLOTS_PATH}/${slotId}`
  const imageUrl = await uploadImage(file, storagePath)

  return { imageUrl, storagePath }
}
