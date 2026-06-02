import { useEffect, useMemo, useState } from 'react'
import { mockHeroes } from '../data/mockHeroes.js'
import { getFirebaseClient } from '../firebase/firebaseClient.js'
import { subscribeToHeroes } from '../services/heroesService.js'

function getNumberValue(value) {
  const numberValue = Number(value ?? 0)

  return Number.isNaN(numberValue) ? 0 : numberValue
}

function getApprovalValue(hero) {
  return getNumberValue(hero.approval)
}

function getRankingPointsValue(hero) {
  return getNumberValue(hero.rankingPoints)
}

function getHeroDisplayName(hero = {}) {
  return hero.alias ?? hero.publicName ?? hero.codename ?? hero.name ?? 'Identidad HeroIndex'
}

function sortHeroesByRankingPoints(firstHero, secondHero) {
  const rankingDifference = getRankingPointsValue(secondHero) - getRankingPointsValue(firstHero)

  if (rankingDifference !== 0) return rankingDifference

  const approvalDifference = getApprovalValue(secondHero) - getApprovalValue(firstHero)

  if (approvalDifference !== 0) return approvalDifference

  return getHeroDisplayName(firstHero).localeCompare(getHeroDisplayName(secondHero), 'es')
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
    heroTitle: hero.heroTitle ?? 'Figura HeroIndex',
    avatarUrl: hero.avatarUrl ?? '',
    bannerUrl: hero.bannerUrl ?? '',
    corporationId: hero.corporationId ?? 'independent',
    description: hero.description ?? 'No public dossier available yet.',
    name: hero.name ?? getHeroDisplayName(hero),
    publicBio: hero.publicBio ?? hero.description ?? '',
    publicName: hero.publicName ?? '',
    publicPowers: hero.publicPowers ?? hero.visiblePowers ?? [],
    rankingPoints: getRankingPointsValue(hero),
    visiblePowers: hero.visiblePowers ?? hero.publicPowers ?? [],
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
    () => [...heroesState.heroes].sort(sortHeroesByRankingPoints),
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
