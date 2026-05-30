import { onValue, push, ref, set } from 'firebase/database'
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
