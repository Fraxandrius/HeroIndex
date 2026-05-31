import { get, onValue, push, ref, set, update } from 'firebase/database'
import { getFirebaseClient } from '../firebase/firebaseClient.js'

export const MISSION_CALCULATIONS_PATH = 'missionCalculations'
const VALID_MISSION_CALCULATION_STATUSES = ['draft', 'approved', 'rejected']

function normalizeMissionCalculation(id, calculation) {
  return {
    id,
    ...calculation,
  }
}

function normalizeMissionCalculationsSnapshot(snapshotValue) {
  if (!snapshotValue) {
    return []
  }

  return Object.entries(snapshotValue)
    .filter(([, calculation]) => calculation && typeof calculation === 'object')
    .map(([id, calculation]) => normalizeMissionCalculation(id, calculation))
    .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0))
}

export async function createMissionCalculation(calculationData) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  const timestamp = Date.now()
  const calculationRef = push(ref(database, MISSION_CALCULATIONS_PATH))
  const payload = {
    ...calculationData,
     applied: calculationData.applied ?? false,
    appliedAt: calculationData.appliedAt ?? null,
    status: calculationData.status ?? 'draft',
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await set(calculationRef, payload)

  return {
    id: calculationRef.key,
    ...payload,
  }
}

export function subscribeToMissionCalculations(callback, onError) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    callback?.([])
    return () => {}
  }

  const calculationsRef = ref(database, MISSION_CALCULATIONS_PATH)

  return onValue(
    calculationsRef,
    (snapshot) => {
      callback?.(normalizeMissionCalculationsSnapshot(snapshot.val()))
    },
    (error) => {
      onError?.(error)
    },
  )
}


export async function updateMissionCalculationStatus(calculationId, status) {
  const { database, isConfigured } = getFirebaseClient()

  if (!VALID_MISSION_CALCULATION_STATUSES.includes(status)) {
    throw new Error(`Invalid mission calculation status: ${status}`)
  }

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  const calculationRef = ref(database, `${MISSION_CALCULATIONS_PATH}/${calculationId}`)

  await update(calculationRef, {
    status,
    updatedAt: Date.now(),
  })

  return status
}


export async function applyMissionCalculationToHero(calculation) {
  const { database, isConfigured } = getFirebaseClient()

  if (!calculation) {
    throw new Error('Assessment not found')
  }

  if (!calculation.id) {
    throw new Error('Assessment does not have an id')
  }

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  const calculationRef = ref(database, `${MISSION_CALCULATIONS_PATH}/${calculation.id}`)
  const calculationSnapshot = await get(calculationRef)
  const latestCalculation = {
    ...calculation,
    ...(calculationSnapshot.val() ?? {}),
    id: calculation.id,
  }

  if (latestCalculation.status !== 'approved') {
    throw new Error('Only approved assessments can be applied to ranking')
  }

  if (latestCalculation.applied === true) {
    throw new Error('Assessment has already been applied to ranking')
  }

  if (!latestCalculation.heroId) {
    throw new Error('Assessment does not have a linked hero')
  }

  const heroRef = ref(database, `heroes/${latestCalculation.heroId}`)
  const heroSnapshot = await get(heroRef)
  const hero = heroSnapshot.val()

  if (!hero) {
    throw new Error('Linked hero was not found')
  }

  const currentRankingPoints = Number(hero.rankingPoints) || 0
  const pointsToApply = Number(latestCalculation.suggestedRankingPoints) || 0
  const timestamp = Date.now()

  await update(heroRef, {
    rankingPoints: currentRankingPoints + pointsToApply,
    updatedAt: timestamp,
  })

  await update(calculationRef, {
    applied: true,
    appliedAt: timestamp,
    updatedAt: timestamp,
  })

  return currentRankingPoints + pointsToApply
}
