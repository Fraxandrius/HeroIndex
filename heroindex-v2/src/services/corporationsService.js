import { onValue, push, ref, set } from 'firebase/database'
import { getFirebaseClient } from '../firebase/firebaseClient.js'

export const CORPORATIONS_PATH = 'corporations'

function normalizeCorporation(id, corporation) {
  return {
    id,
    ...corporation,
  }
}

export function normalizeCorporationsSnapshot(snapshotValue) {
  if (!snapshotValue) {
    return []
  }

  return Object.entries(snapshotValue)
    .filter(([, corporation]) => corporation && typeof corporation === 'object')
    .map(([id, corporation]) => normalizeCorporation(id, corporation))
}

export function subscribeToCorporations({ onData, onError }) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    onData?.([])
    return () => {}
  }

  const corporationsRef = ref(database, CORPORATIONS_PATH)

  return onValue(
    corporationsRef,
    (snapshot) => {
      onData?.(normalizeCorporationsSnapshot(snapshot.val()))
    },
    (error) => {
      onError?.(error)
    },
  )
}

export async function createCorporation(corporationData) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  const timestamp = Date.now()
  const corporationRef = push(ref(database, CORPORATIONS_PATH))
  const payload = {
    ...corporationData,
    active: corporationData.active ?? true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await set(corporationRef, payload)

  return {
    id: corporationRef.key,
    ...payload,
  }
}
