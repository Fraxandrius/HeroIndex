import { onValue, push, ref, set } from 'firebase/database'
import { getFirebaseClient } from '../firebase/firebaseClient.js'

export const ORACULO_ACTIVITY_PATH = 'oraculoActivityLog'

const validTypes = new Set(['campaign-event', 'editorial-action', 'ranking-shift', 'reputation-crisis'])

function normalizeTags(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.map((tag) => String(tag).trim()).filter(Boolean)

  return String(value)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function normalizeNumber(value) {
  const numberValue = Number(value ?? 0)

  return Number.isNaN(numberValue) ? 0 : numberValue
}

function normalizeEvent(id, event = {}) {
  return {
    id,
    ...event,
    affectedCorporations: normalizeNumber(event.affectedCorporations),
    affectedHeroes: normalizeNumber(event.affectedHeroes),
    createdAt: normalizeNumber(event.createdAt),
    tags: normalizeTags(event.tags),
    type: validTypes.has(event.type) ? event.type : 'campaign-event',
    visibility: event.visibility === 'oraculo' ? 'oraculo' : 'oraculo',
  }
}

function normalizeSnapshot(snapshotValue) {
  if (!snapshotValue) return []

  return Object.entries(snapshotValue)
    .filter(([, event]) => event && typeof event === 'object')
    .map(([id, event]) => normalizeEvent(id, event))
    .sort((firstEvent, secondEvent) => (secondEvent.createdAt ?? 0) - (firstEvent.createdAt ?? 0))
}

function assertInternalStore(database, isConfigured) {
  if (!isConfigured || !database) {
    throw new Error('La capa interna no está disponible.')
  }
}

export function subscribeToOraculoActivity(callback, onError) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    callback?.([])
    return () => {}
  }

  const eventsRef = ref(database, ORACULO_ACTIVITY_PATH)

  return onValue(
    eventsRef,
    (snapshot) => callback?.(normalizeSnapshot(snapshot.val())),
    (error) => onError?.(error),
  )
}

export async function createOraculoActivityEvent(eventData = {}) {
  const { database, isConfigured } = getFirebaseClient()

  assertInternalStore(database, isConfigured)

  const timestamp = Date.now()
  const eventRef = push(ref(database, ORACULO_ACTIVITY_PATH))
  const payload = {
    affectedCorporations: normalizeNumber(eventData.affectedCorporations),
    affectedHeroes: normalizeNumber(eventData.affectedHeroes),
    createdAt: eventData.createdAt ?? timestamp,
    createdBy: eventData.createdBy ?? 'ORÁCULO',
    impactSummary: eventData.impactSummary ?? '',
    summary: eventData.summary ?? '',
    tags: normalizeTags(eventData.tags),
    title: eventData.title ?? 'Evento ORÁCULO',
    type: validTypes.has(eventData.type) ? eventData.type : 'campaign-event',
    visibility: 'oraculo',
  }

  await set(eventRef, payload)

  return {
    id: eventRef.key,
    ...payload,
  }
}
