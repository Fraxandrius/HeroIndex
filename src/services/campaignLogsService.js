import { onValue, push, ref, remove, set, update } from 'firebase/database'
import { getFirebaseClient } from '../firebase/firebaseClient.js'

export const CAMPAIGN_LOGS_PATH = 'campaignLogs'

const arrayFields = ['heroIds', 'corporationIds', 'newsIds', 'missionCalculationIds', 'tags']

function normalizeArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)

  return Object.values(value).filter(Boolean)
}

function normalizeCampaignLog(id, log = {}) {
  return {
    id,
    ...log,
    heroIds: normalizeArray(log.heroIds),
    corporationIds: normalizeArray(log.corporationIds),
    newsIds: normalizeArray(log.newsIds),
    missionCalculationIds: normalizeArray(log.missionCalculationIds),
    tags: normalizeArray(log.tags),
  }
}

function getLogTimestamp(log = {}) {
  if (log.sessionDate) {
    const parsedDate = Date.parse(log.sessionDate)

    if (!Number.isNaN(parsedDate)) return parsedDate
  }

  return Number(log.createdAt ?? 0) || 0
}

function normalizeCampaignLogsSnapshot(snapshotValue) {
  if (!snapshotValue) return []

  return Object.entries(snapshotValue)
    .filter(([, log]) => log && typeof log === 'object')
    .map(([id, log]) => normalizeCampaignLog(id, log))
    .sort((first, second) => getLogTimestamp(second) - getLogTimestamp(first))
}

function assertFirebase(database, isConfigured) {
  if (!isConfigured || !database) {
    throw new Error('Firebase no está configurado.')
  }
}

function buildCampaignLogPayload(logData = {}) {
  return {
    title: logData.title ?? '',
    sessionDate: logData.sessionDate ?? '',
    location: logData.location ?? '',
    outcome: logData.outcome ?? '',
    summaryPublic: logData.summaryPublic ?? '',
    summaryPrivate: logData.summaryPrivate ?? '',
    publicConsequences: logData.publicConsequences ?? '',
    privateConsequences: logData.privateConsequences ?? '',
    status: logData.status ?? 'draft',
    ...Object.fromEntries(arrayFields.map((field) => [field, normalizeArray(logData[field])])),
  }
}

export function subscribeToCampaignLogs(callback, onError) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    callback?.([])
    return () => {}
  }

  const logsRef = ref(database, CAMPAIGN_LOGS_PATH)

  return onValue(
    logsRef,
    (snapshot) => {
      callback?.(normalizeCampaignLogsSnapshot(snapshot.val()))
    },
    (error) => {
      onError?.(error)
    },
  )
}

export async function createCampaignLog(logData = {}) {
  const { database, isConfigured } = getFirebaseClient()

  assertFirebase(database, isConfigured)

  const timestamp = Date.now()
  const logRef = push(ref(database, CAMPAIGN_LOGS_PATH))
  const payload = {
    ...buildCampaignLogPayload(logData),
    id: logRef.key,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await set(logRef, payload)

  return payload
}

export async function updateCampaignLog(logId, logData = {}) {
  const { database, isConfigured } = getFirebaseClient()

  if (!logId) {
    throw new Error('El registro de campaña es obligatorio.')
  }

  assertFirebase(database, isConfigured)

  const itemRef = ref(database, `${CAMPAIGN_LOGS_PATH}/${logId}`)
  const payload = {
    ...buildCampaignLogPayload(logData),
    updatedAt: Date.now(),
  }

  await update(itemRef, payload)

  return {
    id: logId,
    ...payload,
  }
}

export async function deleteCampaignLog(logId) {
  const { database, isConfigured } = getFirebaseClient()

  if (!logId) {
    throw new Error('El registro de campaña es obligatorio.')
  }

  assertFirebase(database, isConfigured)

  await remove(ref(database, `${CAMPAIGN_LOGS_PATH}/${logId}`))
}
