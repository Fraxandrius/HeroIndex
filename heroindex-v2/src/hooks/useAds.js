import { useCallback, useEffect, useMemo, useState } from 'react'
import { mockAds } from '../data/mockAds.js'
import { subscribeToAds } from '../services/adsService.js'

function getActiveAdBySlotId(ads, slotId) {
  return ads.find((ad) => ad.slotId === slotId && ad.active) ?? null
}

function createAdsState({ ads, error = null, source }) {
  const hasFirebaseAds = source === 'firebase' && ads.length > 0

  return {
    ads: hasFirebaseAds ? ads : mockAds,
    error,
    source: hasFirebaseAds ? 'firebase' : 'mock',
  }
}

export function useAds() {
  const [adsState, setAdsState] = useState(() =>
    createAdsState({ ads: [], source: 'mock' }),
  )

  useEffect(() => {
    const unsubscribe = subscribeToAds({
      onData: (firebaseAds) => {
        setAdsState(createAdsState({ ads: firebaseAds, source: 'firebase' }))
      },
      onError: (error) => {
        setAdsState(createAdsState({ ads: [], error, source: 'mock' }))
      },
    })

    return unsubscribe
  }, [])

  const activeAdsBySlotId = useMemo(
    () =>
      adsState.ads.reduce((adsBySlotId, ad) => {
        if (!ad.active) {
          return adsBySlotId
        }

        return {
          ...adsBySlotId,
          [ad.slotId]: ad,
        }
      }, {}),
    [adsState.ads],
  )

  const getActiveAdForSlot = useCallback(
    (slotId) => activeAdsBySlotId[slotId] ?? getActiveAdBySlotId(mockAds, slotId),
    [activeAdsBySlotId],
  )

  return {
    ...adsState,
    getActiveAdForSlot,
  }
}
