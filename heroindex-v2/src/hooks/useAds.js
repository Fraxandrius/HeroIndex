import { useCallback, useEffect, useState } from 'react'
import { mockAds } from '../data/mockAds.js'
import { getFirebaseClient } from '../firebase/firebaseClient.js'
import { subscribeToAds } from '../services/adsService.js'
import { CANONICAL_AD_SLOT_IDS } from '../utils/adSlots.js'

const env = import.meta.env ?? {}

function getActiveMockAdBySlotId(slotId) {
  return mockAds.find((ad) => ad.slotId === slotId && ad.active === true) ?? null
}

function getAdTimestamp(ad) {
  const rawDate = ad.updatedAt ?? ad.createdAt
  const timestamp = rawDate ? Date.parse(rawDate) : 0

  return Number.isNaN(timestamp) ? 0 : timestamp
}

function sortAdsByNewest(firstAd, secondAd) {
  return getAdTimestamp(secondAd) - getAdTimestamp(firstAd)
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

function getAdsSource({ error, firebaseAds }) {
  if (error) {
    return 'error'
  }

  if (firebaseAds.length > 0) {
    return 'firebase'
  }

  return getFirebaseClient().isConfigured ? 'empty' : 'mock'
}

export function resolveAdForSlot(slotId, firebaseAds) {
  const firebaseCandidates = firebaseAds.filter((ad) => ad.slotId === slotId)
  const activeFirebaseCandidates = firebaseCandidates
    .filter((ad) => ad.active === true)
    .sort(sortAdsByNewest)
  const selectedFirebaseAd = activeFirebaseCandidates[0] ?? null

  if (selectedFirebaseAd) {
    return {
      ad: selectedFirebaseAd,
      activeFirebaseCandidatesCount: activeFirebaseCandidates.length,
      firebaseCandidatesCount: firebaseCandidates.length,
      mockFallback: getActiveMockAdBySlotId(slotId),
      source: 'firebase',
    }
  }

  const mockFallback = getActiveMockAdBySlotId(slotId)

  return {
    ad: mockFallback,
    activeFirebaseCandidatesCount: activeFirebaseCandidates.length,
    firebaseCandidatesCount: firebaseCandidates.length,
    mockFallback,
    source: mockFallback ? 'mock' : 'none',
  }
}

function createSlotDebug(slotId, firebaseAds) {
  const resolution = resolveAdForSlot(slotId, firebaseAds)

  return {
    slotId,
    firebaseCandidatesCount: resolution.firebaseCandidatesCount,
    activeFirebaseCandidatesCount: resolution.activeFirebaseCandidatesCount,
    mockFallbackExists: Boolean(resolution.mockFallback),
    selectedSource: resolution.source,
    selectedAdId: resolution.ad?.id ?? 'none',
    selectedAdBrand: resolution.ad?.brand ?? 'none',
    selectedAdHeadline: resolution.ad?.headline ?? 'none',
    selectedImageUrl: Boolean(resolution.ad?.imageUrl),
  }
}

function createAdsState({ firebaseAds, error = null }) {
  const normalizedFirebaseAds = firebaseAds ?? []

  return {
    debug: {
      ...getFirebaseDebugConfig(),
      source: getAdsSource({ error, firebaseAds: normalizedFirebaseAds }),
      firebaseAdsCount: normalizedFirebaseAds.length,
      mockAdsCount: mockAds.length,
      errorMessage: getErrorMessage(error),
      slots: CANONICAL_AD_SLOT_IDS.map((slotId) =>
        createSlotDebug(slotId, normalizedFirebaseAds),
      ),
    },
    error,
    firebaseAds: normalizedFirebaseAds,
    mockAds,
  }
}

export function useAds() {
  const [adsState, setAdsState] = useState(() =>
    createAdsState({ firebaseAds: [] }),
  )

  useEffect(() => {
    const unsubscribe = subscribeToAds({
      onData: (firebaseAds) => {
        setAdsState(createAdsState({ firebaseAds }))
      },
      onError: (error) => {
        setAdsState(createAdsState({ firebaseAds: [], error }))
      },
    })

    return unsubscribe
  }, [])

  const getActiveAdForSlot = useCallback(
    (slotId) => resolveAdForSlot(slotId, adsState.firebaseAds).ad,
    [adsState.firebaseAds],
  )

  const getAdResolutionForSlot = useCallback(
    (slotId) => resolveAdForSlot(slotId, adsState.firebaseAds),
    [adsState.firebaseAds],
  )

  return {
    ...adsState,
    getActiveAdForSlot,
    getAdResolutionForSlot,
  }
}
