import { useCallback, useEffect, useMemo, useState } from 'react'
import { mockCorporations } from '../data/mockCorporations.js'
import { getFirebaseClient } from '../firebase/firebaseClient.js'
import { subscribeToCorporations } from '../services/corporationsService.js'

function getScoreValue(value) {
  const score = Number(value ?? 0)

  return Number.isNaN(score) ? 0 : score
}

function sortCorporationsByApproval(firstCorporation, secondCorporation) {
  const approvalDifference =
    getScoreValue(secondCorporation.approval) - getScoreValue(firstCorporation.approval)

  if (approvalDifference !== 0) {
    return approvalDifference
  }

  return (
    getScoreValue(secondCorporation.trustScore) - getScoreValue(firstCorporation.trustScore)
  )
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

function normalizeCorporationForUi(corporation) {
  return {
    ...corporation,
    approval: getScoreValue(corporation.approval),
    bannerUrl: corporation.bannerUrl ?? '',
    country: corporation.country ?? 'Unknown country',
    description: corporation.description ?? 'No corporate dossier available yet.',
    logoUrl: corporation.logoUrl ?? '',
    name: corporation.name ?? 'Unknown corporation',
    sector: corporation.sector ?? 'Unclassified sector',
    tagline: corporation.tagline ?? 'No public tagline available.',
    trustScore: getScoreValue(corporation.trustScore),
  }
}

function getActiveCorporations(corporations) {
  return corporations.filter((corporation) => corporation.active !== false)
}

function createCorporationsState({ firebaseCorporations, error = null }) {
  const normalizedFirebaseCorporations = firebaseCorporations ?? []
  const hasFirebaseCorporations = normalizedFirebaseCorporations.length > 0
  const sourceCorporations = hasFirebaseCorporations
    ? normalizedFirebaseCorporations
    : mockCorporations
  const corporations = getActiveCorporations(sourceCorporations)
    .map(normalizeCorporationForUi)
    .sort(sortCorporationsByApproval)

  return {
    corporations,
    error,
    firebaseCorporations: normalizedFirebaseCorporations,
    source: hasFirebaseCorporations ? 'firebase' : 'mock',
  }
}

export function useCorporations() {
  const [corporationsState, setCorporationsState] = useState(() =>
    createCorporationsState({ firebaseCorporations: [] }),
  )

  useEffect(() => {
    const unsubscribe = subscribeToCorporations({
      onData: (firebaseCorporations) => {
        setCorporationsState(createCorporationsState({ firebaseCorporations }))
      },
      onError: (error) => {
        setCorporationsState(createCorporationsState({ firebaseCorporations: [], error }))
      },
    })

    return unsubscribe
  }, [])

  const corporationsById = useMemo(
    () =>
      Object.fromEntries(
        corporationsState.corporations.map((corporation) => [corporation.id, corporation]),
      ),
    [corporationsState.corporations],
  )

  const getCorporationById = useCallback(
    (corporationId) => corporationsById[corporationId] ?? null,
    [corporationsById],
  )

  return {
    ...corporationsState,
    corporationsById,
    debug: {
      errorMessage: getErrorMessage(corporationsState.error),
      firebaseConfigured: getFirebaseClient().isConfigured,
      firebaseCorporationsCount: corporationsState.firebaseCorporations.length,
      mockCorporationsCount: mockCorporations.length,
      source: corporationsState.source,
    },
    getCorporationById,
  }
}
