import { onValue, ref } from 'firebase/database'
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
