import { get, onValue, push, ref, remove, update } from 'firebase/database'
import { getFirebaseClient } from '../firebase/firebaseClient.js'

export const KARMA_TRANSACTIONS_PATH = 'karmaTransactions'
const CHARACTER_SHEETS_PATH = 'characterSheets'

const gainOptions = [
  { category: 'action_scene', label: 'Participó en escena de acción', amount: 1 },
  { category: 'social_scene', label: 'Participó en escena social', amount: 1 },
  { category: 'personality', label: 'Actuó según personalidad', amount: 1 },
  { category: 'drive', label: 'Actuó según drive', amount: 1 },
  { category: 'flaw', label: 'Actuó según flaw', amount: 1 },
  { category: 'ally_risk', label: 'Arriesgó la vida por un aliado', amount: 1 },
  { category: 'saved_innocents', label: 'Salvó inocentes', amount: 1 },
  { category: 'responsibilities', label: 'Cumplió responsabilidades', amount: 1 },
  { category: 'drawback_challenge', label: 'Superó desafío de drawback', amount: 1 },
  { category: 'extraordinary_action', label: 'Acción extraordinaria aprobada por el grupo', amount: 1 },
]

const spendOptions = [
  { category: 'attribute_plus_one', label: 'Subir atributo +1', amount: -10 },
  { category: 'power_level', label: 'Subir power level', amount: -20 },
  { category: 'power_boost', label: 'Nuevo power boost', amount: -20 },
  { category: 'new_talent', label: 'Nuevo talent', amount: -10 },
  { category: 'remove_drawback', label: 'Remover drawback', amount: -10 },
  { category: 'base_upgrade', label: 'Base upgrade', amount: -10 },
  { category: 'manual_spend', label: 'Gasto manual', amount: -1, manual: true },
]

const penaltyOptions = [
  { category: 'no_ally_help', label: 'No ayudó a un aliado', amount: -1 },
  { category: 'no_innocent_help', label: 'No ayudó a inocentes', amount: -1 },
  { category: 'neglected_responsibilities', label: 'Descuidó responsabilidades', amount: -1 },
  { category: 'immoral_action', label: 'Actuó de forma inmoral', amount: -1 },
  { category: 'killed_someone', label: 'Mató a alguien', amount: -1 },
  { category: 'gm_penalty', label: 'Penalización ORÁCULO/GM', amount: -1, manual: true },
]

function normalizeTransaction(id, transaction = {}) {
  return {
    id,
    ...transaction,
    amount: Number(transaction.amount ?? 0),
    criteria: Array.isArray(transaction.criteria) ? transaction.criteria : [],
    source: transaction.source ?? 'oraculo',
    status: transaction.status ?? 'accepted',
  }
}

function normalizeSnapshot(snapshotValue) {
  if (!snapshotValue) return []

  return Object.entries(snapshotValue)
    .filter(([, transaction]) => transaction && typeof transaction === 'object')
    .map(([id, transaction]) => normalizeTransaction(id, transaction))
    .sort((first, second) => Number(second.createdAt ?? 0) - Number(first.createdAt ?? 0))
}

function assertFirebase(database, isConfigured) {
  if (!isConfigured || !database) {
    throw new Error('Firebase no está configurado.')
  }
}

function getAmountValue(value) {
  const amount = Number(value)

  if (Number.isNaN(amount) || amount === 0) {
    throw new Error('La cantidad de Karma debe ser un número distinto de 0.')
  }

  return amount
}

async function getCharacterSheet(database, heroId) {
  const sheetSnapshot = await get(ref(database, `${CHARACTER_SHEETS_PATH}/${heroId}`))

  return sheetSnapshot.val()
}

function buildTransactionPayload(transactionRef, transactionData, amount, timestamp) {
  return {
    id: transactionRef.key,
    heroId: transactionData.heroId,
    type: transactionData.type ?? (amount >= 0 ? 'gain' : 'spend'),
    amount,
    category: transactionData.category ?? '',
    reason: transactionData.reason ?? '',
    notes: transactionData.notes ?? '',
    criteria: Array.isArray(transactionData.criteria) ? transactionData.criteria : [],
    source: transactionData.source ?? 'oraculo',
    status: transactionData.status ?? 'accepted',
    sessionLogId: transactionData.sessionLogId ?? '',
    missionCalculationId: transactionData.missionCalculationId ?? '',
    createdBy: transactionData.createdBy ?? (transactionData.source === 'player' ? 'Jugador' : 'ORÁCULO/GM'),
    createdAt: timestamp,
    reviewedBy: transactionData.reviewedBy ?? '',
    reviewedAt: transactionData.reviewedAt ?? '',
  }
}

export function subscribeToKarmaTransactions(heroId, callback, onError) {
  return subscribeToAllKarmaTransactions(
    (transactions) => {
      callback?.(transactions.filter((transaction) => String(transaction.heroId) === String(heroId)))
    },
    onError,
  )
}

export function subscribeToAllKarmaTransactions(callback, onError) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    callback?.([])
    return () => {}
  }

  return onValue(
    ref(database, KARMA_TRANSACTIONS_PATH),
    (snapshot) => callback?.(normalizeSnapshot(snapshot.val())),
    (error) => onError?.(error),
  )
}

export async function createKarmaTransaction(transactionData = {}) {
  const { database, isConfigured } = getFirebaseClient()

  assertFirebase(database, isConfigured)

  const heroId = transactionData.heroId

  if (!heroId) {
    throw new Error('El héroe es obligatorio para registrar Karma.')
  }

  const amount = getAmountValue(transactionData.amount)
  const characterSheet = await getCharacterSheet(database, heroId)
  const currentKarma = Number(characterSheet?.karma ?? 0)
  const nextKarma = currentKarma + amount

  if (nextKarma < 0) {
    throw new Error('No hay Karma suficiente para registrar este movimiento.')
  }

  const timestamp = Date.now()
  const transactionRef = push(ref(database, KARMA_TRANSACTIONS_PATH))
  const payload = buildTransactionPayload(transactionRef, { ...transactionData, heroId }, amount, timestamp)

  await update(ref(database), {
    [`${KARMA_TRANSACTIONS_PATH}/${transactionRef.key}`]: payload,
    [`${CHARACTER_SHEETS_PATH}/${heroId}/karma`]: nextKarma,
    [`${CHARACTER_SHEETS_PATH}/${heroId}/updatedAt`]: timestamp,
  })

  return payload
}

export async function createKarmaBatchTransactions(heroIds = [], batchData = {}) {
  const { database, isConfigured } = getFirebaseClient()

  assertFirebase(database, isConfigured)

  const uniqueHeroIds = [...new Set(heroIds.filter(Boolean).map(String))]
  const amount = getAmountValue(batchData.amount)
  const timestamp = Date.now()
  const updates = {}
  const createdTransactions = []
  const skippedHeroIds = []

  for (const heroId of uniqueHeroIds) {
    const characterSheet = await getCharacterSheet(database, heroId)

    if (!characterSheet) {
      skippedHeroIds.push(heroId)
      continue
    }

    const currentKarma = Number(characterSheet.karma ?? 0)
    const nextKarma = currentKarma + amount

    if (nextKarma < 0) {
      throw new Error(`El movimiento dejaría Karma negativo para ${heroId}.`)
    }

    const transactionRef = push(ref(database, KARMA_TRANSACTIONS_PATH))
    const payload = buildTransactionPayload(transactionRef, { ...batchData, heroId }, amount, timestamp)

    updates[`${KARMA_TRANSACTIONS_PATH}/${transactionRef.key}`] = payload
    updates[`${CHARACTER_SHEETS_PATH}/${heroId}/karma`] = nextKarma
    updates[`${CHARACTER_SHEETS_PATH}/${heroId}/updatedAt`] = timestamp
    createdTransactions.push(payload)
  }

  if (createdTransactions.length > 0) {
    await update(ref(database), updates)
  }

  return { createdTransactions, skippedHeroIds }
}

export async function deleteKarmaTransaction(transactionId) {
  const { database, isConfigured } = getFirebaseClient()

  assertFirebase(database, isConfigured)

  if (!transactionId) {
    throw new Error('La transacción de Karma es obligatoria.')
  }

  const transactionRef = ref(database, `${KARMA_TRANSACTIONS_PATH}/${transactionId}`)
  const transactionSnapshot = await get(transactionRef)
  const transaction = transactionSnapshot.val()

  if (!transaction) return

  const heroId = transaction.heroId
  const amount = Number(transaction.amount ?? 0)
  const characterSheet = await getCharacterSheet(database, heroId)
  const currentKarma = Number(characterSheet?.karma ?? 0)
  const nextKarma = currentKarma - amount

  if (nextKarma < 0) {
    throw new Error('No se puede revertir el movimiento porque dejaría Karma negativo.')
  }

  await update(ref(database), {
    [`${CHARACTER_SHEETS_PATH}/${heroId}/karma`]: nextKarma,
    [`${CHARACTER_SHEETS_PATH}/${heroId}/updatedAt`]: Date.now(),
  })
  await remove(transactionRef)
}

export function getKarmaGainOptions() {
  return gainOptions
}

export function getKarmaPenaltyOptions() {
  return penaltyOptions
}

export function getKarmaSpendOptions() {
  return spendOptions
}

export function getKarmaCostOptions() {
  return spendOptions
}
