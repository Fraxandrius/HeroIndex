import { onValue, push, ref, remove, set, update } from 'firebase/database'
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

export async function updateCorporation(corporationId, corporationData) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  const itemRef = ref(database, `${CORPORATIONS_PATH}/${corporationId}`)

  await update(itemRef, {
    ...corporationData,
    updatedAt: Date.now(),
  })
}

export async function toggleCorporationActive(corporationId, currentActive) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  const itemRef = ref(database, `${CORPORATIONS_PATH}/${corporationId}`)
  const nextActive = !(currentActive ?? true)

  await update(itemRef, {
    active: nextActive,
    updatedAt: Date.now(),
  })

  return nextActive
}


export async function deleteCorporation(corporationId) {
  const { database, isConfigured } = getFirebaseClient()

  if (!corporationId) {
    throw new Error('Corporation id is required')
  }

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  await remove(ref(database, `${CORPORATIONS_PATH}/${corporationId}`))
}

export async function deleteMultipleCorporations(corporationIds = []) {
  await Promise.all(corporationIds.filter(Boolean).map((corporationId) => deleteCorporation(corporationId)))
}
