import { onValue, ref } from 'firebase/database'
import { getFirebaseClient } from '../firebase/firebaseClient.js'

export const HEROES_PATH = 'heroes'

function normalizeHero(id, hero) {
  return {
    id,
    ...hero,
  }
}

export function normalizeHeroesSnapshot(snapshotValue) {
  if (!snapshotValue) {
    return []
  }

  return Object.entries(snapshotValue)
    .filter(([, hero]) => hero && typeof hero === 'object')
    .map(([id, hero]) => normalizeHero(id, hero))
}

export function subscribeToHeroes({ onData, onError }) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    onData?.([])
    return () => {}
  }

  const heroesRef = ref(database, HEROES_PATH)

  return onValue(
    heroesRef,
    (snapshot) => {
      onData?.(normalizeHeroesSnapshot(snapshot.val()))
    },
    (error) => {
      onError?.(error)
    },
  )
}
