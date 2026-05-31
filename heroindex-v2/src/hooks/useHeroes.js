import { useEffect, useMemo, useState } from 'react'
import { mockHeroes } from '../data/mockHeroes.js'
import { getFirebaseClient } from '../firebase/firebaseClient.js'
import { subscribeToHeroes } from '../services/heroesService.js'

function getApprovalValue(hero) {
  const approval = Number(hero.approval ?? 0)

  return Number.isNaN(approval) ? 0 : approval
}

function sortHeroesByApproval(firstHero, secondHero) {
  return getApprovalValue(secondHero) - getApprovalValue(firstHero)
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

function normalizeHeroForUi(hero) {
  return {
    ...hero,
    approval: getApprovalValue(hero),
    avatarUrl: hero.avatarUrl ?? '',
    bannerUrl: hero.bannerUrl ?? '',
    corporationId: hero.corporationId ?? 'independent',
    description: hero.description ?? 'No public dossier available yet.',
    name: hero.name ?? 'Unknown hero',
    powerClass: hero.powerClass ?? 'Unclassified',
  }
}

function getActiveHeroes(heroes) {
  return heroes.filter((hero) => hero.active !== false)
}

function createHeroesState({ firebaseHeroes, error = null, loading = false }) {
  const normalizedFirebaseHeroes = firebaseHeroes ?? []
  const hasFirebaseHeroes = normalizedFirebaseHeroes.length > 0
  const sourceHeroes = loading ? [] : hasFirebaseHeroes ? normalizedFirebaseHeroes : mockHeroes
  const heroes = getActiveHeroes(sourceHeroes).map(normalizeHeroForUi)

  return {
    error,
    loading,
    firebaseHeroes: normalizedFirebaseHeroes,
    heroes,
    source: loading ? 'loading' : hasFirebaseHeroes ? 'firebase' : 'mock',
  }
}

export function useHeroes() {
  const [heroesState, setHeroesState] = useState(() =>
    createHeroesState({ firebaseHeroes: [], loading: true }),
  )

  useEffect(() => {
    const unsubscribe = subscribeToHeroes({
      onData: (firebaseHeroes) => {
        setHeroesState(createHeroesState({ firebaseHeroes }))
      },
      onError: (error) => {
        setHeroesState(createHeroesState({ firebaseHeroes: [], error }))
      },
    })

    return unsubscribe
  }, [])

  const rankingHeroes = useMemo(
    () => [...heroesState.heroes].sort(sortHeroesByApproval),
    [heroesState.heroes],
  )

  return {
    ...heroesState,
    debug: {
      errorMessage: getErrorMessage(heroesState.error),
      loading: heroesState.loading,
      firebaseConfigured: getFirebaseClient().isConfigured,
      firebaseHeroesCount: heroesState.firebaseHeroes.length,
      mockHeroesCount: mockHeroes.length,
      source: heroesState.source,
    },
    rankingHeroes,
  }
}
