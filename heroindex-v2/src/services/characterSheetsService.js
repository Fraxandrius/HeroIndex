import { get, onValue, ref, set, update } from 'firebase/database'
import { getFirebaseClient } from '../firebase/firebaseClient.js'

export const CHARACTER_SHEETS_PATH = 'characterSheets'

function normalizeCharacterSheet(heroId, sheet) {
  if (!sheet) return null

  return {
    id: heroId,
    heroId,
    ...sheet,
  }
}


function normalizeCharacterSheetsSnapshot(snapshotValue) {
  if (!snapshotValue) return []

  return Object.entries(snapshotValue)
    .filter(([, sheet]) => sheet && typeof sheet === 'object')
    .map(([heroId, sheet]) => normalizeCharacterSheet(heroId, sheet))
}

export function subscribeToCharacterSheets(callback, onError) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    callback?.([])
    return () => {}
  }

  const sheetsRef = ref(database, CHARACTER_SHEETS_PATH)

  return onValue(
    sheetsRef,
    (snapshot) => {
      callback?.(normalizeCharacterSheetsSnapshot(snapshot.val()))
    },
    (error) => {
      onError?.(error)
    },
  )
}

export function subscribeToCharacterSheet(heroId, callback, onError) {
  const { database, isConfigured } = getFirebaseClient()

  if (!heroId || !isConfigured || !database) {
    callback?.(null)
    return () => {}
  }

  const sheetRef = ref(database, `${CHARACTER_SHEETS_PATH}/${heroId}`)

  return onValue(
    sheetRef,
    (snapshot) => {
      callback?.(normalizeCharacterSheet(heroId, snapshot.val()))
    },
    (error) => {
      onError?.(error)
    },
  )
}

export async function createOrUpdateCharacterSheet(heroId, sheetData = {}) {
  const { database, isConfigured } = getFirebaseClient()

  if (!heroId) {
    throw new Error('Hero id is required')
  }

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  const sheetRef = ref(database, `${CHARACTER_SHEETS_PATH}/${heroId}`)
  const snapshot = await get(sheetRef)
  const existingSheet = snapshot.val()
  const timestamp = Date.now()
  const payload = {
    ...existingSheet,
    ...sheetData,
    id: heroId,
    heroId,
    isNpc: sheetData.isNpc ?? existingSheet?.isNpc ?? true,
    createdAt: existingSheet?.createdAt ?? sheetData.createdAt ?? timestamp,
    updatedAt: timestamp,
  }

  await set(sheetRef, payload)

  return payload
}

export async function updateCharacterSheet(heroId, sheetData = {}) {
  const { database, isConfigured } = getFirebaseClient()

  if (!heroId) {
    throw new Error('Hero id is required')
  }

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  const sheetRef = ref(database, `${CHARACTER_SHEETS_PATH}/${heroId}`)
  const payload = {
    ...sheetData,
    id: heroId,
    heroId,
    updatedAt: Date.now(),
  }

  await update(sheetRef, payload)

  return payload
}
