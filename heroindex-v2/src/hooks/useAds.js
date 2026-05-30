import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { mockAds } from '../data/mockAds.js'
import { getFirebaseClient } from '../firebase/firebaseClient.js'
import { subscribeToAds } from '../services/adsService.js'

const env = import.meta.env ?? {}
const activeAdSlotIds = new Set()
const adSlotListeners = new Set()
let adSlotIdsSnapshot = []

function getActiveAdBySlotId(ads, slotId) {
  return ads.find((ad) => ad.slotId === slotId && ad.active) ?? null
}

function getFirebaseDebugConfig() {
  return {
    firebaseConfigured: getFirebaseClient().isConfigured,
    hasDatabaseUrl: Boolean(env.VITE_FIREBASE_DATABASE_URL),
    hasProjectId: Boolean(env.VITE_FIREBASE_PROJECT_ID),
    mode: env.MODE,
    prod: env.PROD,
    dev: env.DEV,
  }
}

function getErrorMessage(error) {
  if (!error) {
    return null
  }

  if (typeof error === 'string') {
    return error
  }

  return error.message ?? String(error)
}

function getSource({ error, firebaseAds, requestedSource }) {
  if (error) {
    return 'error'
  }

  if (requestedSource === 'firebase' && firebaseAds.length > 0) {
    return 'firebase'
  }

  if (requestedSource === 'firebase') {
    return 'empty'
  }

  return 'mock'
}

function createAdsState({ firebaseAds, error = null, source }) {
  const normalizedFirebaseAds = firebaseAds ?? []
  const adsSource = getSource({
    error,
    firebaseAds: normalizedFirebaseAds,
    requestedSource: source,
  })

  return {
    ads: adsSource === 'firebase' ? normalizedFirebaseAds : mockAds,
    debug: {
      ...getFirebaseDebugConfig(),
      source: adsSource,
      firebaseAdsCount: normalizedFirebaseAds.length,
      mockAdsCount: mockAds.length,
      errorMessage: getErrorMessage(error),
    },
    error,
    source: adsSource,
  }
}

function notifyAdSlotListeners() {
  adSlotListeners.forEach((listener) => listener())
}

function subscribeToAdSlotIds(listener) {
  adSlotListeners.add(listener)

  return () => {
    adSlotListeners.delete(listener)
  }
}

function getAdSlotIdsSnapshot() {
  return adSlotIdsSnapshot
}

function refreshAdSlotIdsSnapshot() {
  adSlotIdsSnapshot = Array.from(activeAdSlotIds).sort()
}

export function registerAdSlot(slotId) {
  activeAdSlotIds.add(slotId)
  refreshAdSlotIdsSnapshot()
  notifyAdSlotListeners()

  return () => {
    activeAdSlotIds.delete(slotId)
    refreshAdSlotIdsSnapshot()
    notifyAdSlotListeners()
  }
}

export function useRegisteredAdSlotIds() {
  return useSyncExternalStore(
    subscribeToAdSlotIds,
    getAdSlotIdsSnapshot,
    getAdSlotIdsSnapshot,
  )
}

export function useAds() {
  const [adsState, setAdsState] = useState(() =>
    createAdsState({ firebaseAds: [], source: 'mock' }),
  )

  useEffect(() => {
    const isFirebaseConfigured = getFirebaseClient().isConfigured
    const unsubscribe = subscribeToAds({
      onData: (firebaseAds) => {
        setAdsState(
          createAdsState({
            firebaseAds,
            source: isFirebaseConfigured ? 'firebase' : 'mock',
          }),
        )
      },
      onError: (error) => {
        setAdsState(createAdsState({ firebaseAds: [], error, source: 'firebase' }))
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
