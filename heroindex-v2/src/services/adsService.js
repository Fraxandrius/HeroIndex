import { onValue, ref } from 'firebase/database'
import { getFirebaseClient } from '../firebase/firebaseClient.js'

export const ADS_PATH = 'ads'

export function normalizeAdsSnapshot(snapshotValue) {
  if (!snapshotValue) {
    return []
  }

  return Object.entries(snapshotValue).map(([id, ad]) => ({
    id,
    ...ad,
  }))
}

export function subscribeToAds({ onData, onError }) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    onData?.([])
    return () => {}
  }

  const adsRef = ref(database, ADS_PATH)

  return onValue(
    adsRef,
    (snapshot) => {
      onData?.(normalizeAdsSnapshot(snapshot.val()))
    },
    (error) => {
      onError?.(error)
    },
  )
}
