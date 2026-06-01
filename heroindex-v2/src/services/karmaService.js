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
  { category: 'other_gain', label: 'Otro mérito', amount: 1, manual: true },
]

const costOptions = [
  { category: 'attribute_plus_one', label: 'Subir atributo +1', amount: -10 },
  { category: 'power_level', label: 'Subir power level', amount: -20 },
  { category: 'power_boost', label: 'Nuevo power boost', amount: -20 },
  { category: 'new_talent', label: 'Nuevo talent', amount: -10 },
  { category: 'remove_drawback', label: 'Remover drawback', amount: -10 },
  { category: 'base_upgrade', label: 'Base upgrade', amount: -10 },
  { category: 'other_spend', label: 'Otro gasto', amount: -1, manual: true },
]

const penaltyOptions = [
  { category: 'no_ally_help', label: 'No ayudó a un aliado', amount: -1 },
  { category: 'no_innocent_help', label: 'No ayudó a inocentes', amount: -1 },
  { category: 'neglected_responsibilities', label: 'Descuidó responsabilidades', amount: -1 },
  { category: 'immoral_action', label: 'Actuó de forma inmoral', amount: -1 },
  { category: 'killed_someone', label: 'Mató a alguien', amount: -1 },
  { category: 'gm_penalty', label: 'Penalización GM', amount: -1, manual: true },
]

function normalizeTransaction(id, transaction = {}) {
  return {
    id,
    ...transaction,
    amount: Number(transaction.amount ?? 0),
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

export function subscribeToKarmaTransactions(heroId, callback, onError) {
  const { database, isConfigured } = getFirebaseClient()

  if (!heroId || !isConfigured || !database) {
    callback?.([])
    return () => {}
  }

  const transactionsRef = ref(database, KARMA_TRANSACTIONS_PATH)

  return onValue(
    transactionsRef,
    (snapshot) => {
      const transactions = normalizeSnapshot(snapshot.val()).filter(
        (transaction) => String(transaction.heroId) === String(heroId),
      )
      callback?.(transactions)
    },
    (error) => {
      onError?.(error)
    },
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
  const sheetRef = ref(database, `${CHARACTER_SHEETS_PATH}/${heroId}`)
  const sheetSnapshot = await get(sheetRef)
  const currentKarma = Number(sheetSnapshot.val()?.karma ?? 0)
  const nextKarma = currentKarma + amount

  if (nextKarma < 0) {
    throw new Error('No hay Karma suficiente para registrar este movimiento.')
  }

  const timestamp = Date.now()
  const transactionRef = push(ref(database, KARMA_TRANSACTIONS_PATH))
  const payload = {
    id: transactionRef.key,
    heroId,
    type: transactionData.type ?? 'adjustment',
    amount,
    category: transactionData.category ?? '',
    reason: transactionData.reason ?? '',
    notes: transactionData.notes ?? '',
    sessionLogId: transactionData.sessionLogId ?? '',
    missionCalculationId: transactionData.missionCalculationId ?? '',
    createdBy: transactionData.createdBy ?? 'ORÁCULO/GM',
    createdAt: timestamp,
  }

  await update(ref(database), {
    [`${KARMA_TRANSACTIONS_PATH}/${transactionRef.key}`]: payload,
    [`${CHARACTER_SHEETS_PATH}/${heroId}/karma`]: nextKarma,
    [`${CHARACTER_SHEETS_PATH}/${heroId}/updatedAt`]: timestamp,
  })

  return payload
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
  const sheetRef = ref(database, `${CHARACTER_SHEETS_PATH}/${heroId}`)
  const sheetSnapshot = await get(sheetRef)
  const currentKarma = Number(sheetSnapshot.val()?.karma ?? 0)
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

export function getKarmaCostOptions() {
  return costOptions
}

export function getKarmaGainOptions() {
  return gainOptions
}

export function getKarmaPenaltyOptions() {
  return penaltyOptions
}
