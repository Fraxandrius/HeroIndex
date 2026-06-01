import { onValue, push, ref, remove, set, update } from 'firebase/database'
import { getFirebaseClient } from '../firebase/firebaseClient.js'

export const NEWS_PATH = 'news'

function normalizeNewsItem(id, newsItem) {
  return {
    id,
    ...newsItem,
  }
}

export function normalizeNewsSnapshot(snapshotValue) {
  if (!snapshotValue) {
    return []
  }

  return Object.entries(snapshotValue)
    .filter(([, newsItem]) => newsItem && typeof newsItem === 'object')
    .map(([id, newsItem]) => normalizeNewsItem(id, newsItem))
}

export function subscribeToNews({ onData, onError }) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    onData?.([])
    return () => {}
  }

  const newsRef = ref(database, NEWS_PATH)

  return onValue(
    newsRef,
    (snapshot) => {
      onData?.(normalizeNewsSnapshot(snapshot.val()))
    },
    (error) => {
      onError?.(error)
    },
  )
}

export async function createNews(newsData) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  const timestamp = Date.now()
  const newsRef = push(ref(database, NEWS_PATH))
  const payload = {
    ...newsData,
    active: newsData.active ?? true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await set(newsRef, payload)

  return {
    id: newsRef.key,
    ...payload,
  }
}

export async function updateNews(newsId, newsData) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  const itemRef = ref(database, `${NEWS_PATH}/${newsId}`)

  await update(itemRef, {
    ...newsData,
    updatedAt: Date.now(),
  })
}

export async function toggleNewsActive(newsId, currentActive) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  const itemRef = ref(database, `${NEWS_PATH}/${newsId}`)
  const nextActive = !(currentActive ?? true)

  await update(itemRef, {
    active: nextActive,
    updatedAt: Date.now(),
  })

  return nextActive
}


export async function deleteNews(newsId) {
  const { database, isConfigured } = getFirebaseClient()

  if (!newsId) {
    throw new Error('News id is required')
  }

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  await remove(ref(database, `${NEWS_PATH}/${newsId}`))
}

export async function deleteMultipleNews(newsIds = []) {
  await Promise.all(newsIds.filter(Boolean).map((newsId) => deleteNews(newsId)))
}
