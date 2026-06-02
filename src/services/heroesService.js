import { onValue, push, ref, remove, set, update } from 'firebase/database'
import { getFirebaseClient } from '../firebase/firebaseClient.js'

export const HEROES_PATH = 'heroes'
const CHARACTER_SHEETS_PATH = 'characterSheets'

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

export async function createHero(heroData) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  const timestamp = Date.now()
  const heroRef = push(ref(database, HEROES_PATH))
  const payload = {
    ...heroData,
    active: heroData.active ?? true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await set(heroRef, payload)

  return {
    id: heroRef.key,
    ...payload,
  }
}

export async function updateHero(heroId, heroData) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  const itemRef = ref(database, `${HEROES_PATH}/${heroId}`)

  await update(itemRef, {
    ...heroData,
    updatedAt: Date.now(),
  })
}

export async function toggleHeroActive(heroId, currentActive) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  const itemRef = ref(database, `${HEROES_PATH}/${heroId}`)
  const nextActive = !(currentActive ?? true)

  await update(itemRef, {
    active: nextActive,
    updatedAt: Date.now(),
  })

  return nextActive
}


export async function deleteHero(heroId, options = {}) {
  const { database, isConfigured } = getFirebaseClient()

  if (!heroId) {
    throw new Error('Hero id is required')
  }

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  await remove(ref(database, `${HEROES_PATH}/${heroId}`))

  if (options.deleteCharacterSheet === true) {
    await remove(ref(database, `${CHARACTER_SHEETS_PATH}/${heroId}`))
  }
}

export async function deleteMultipleHeroes(heroIds = [], options = {}) {
  await Promise.all(heroIds.filter(Boolean).map((heroId) => deleteHero(heroId, options)))
}
