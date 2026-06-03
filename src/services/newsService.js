import { onValue, push, ref, remove, set, update } from 'firebase/database'
import { getFirebaseClient } from '../firebase/firebaseClient.js'
import { uploadImage } from './storageService.js'

export const NEWS_PATH = 'news'

export function normalizeNewsPlacement(value) {
  if (value === 'hero' || value === 'hidden' || value === 'feed') {
    return value
  }

  return 'feed'
}

export function normalizeNewsPriority(value) {
  const priority = Number(value ?? 0)

  return Number.isNaN(priority) ? 0 : priority
}

const NEWS_DEFAULTS = {
  sourceLabel: 'Mesa Editorial HeroIndex',
  editorialTone: 'verified',
  homePlacement: 'feed',
  priority: 0,
  imageFit: 'cover',
  imagePositionX: 50,
  imagePositionY: 50,
  imageScale: 1,
  imageOverlayStrength: 0.55,
  headlinePlacement: 'bottom-left',
  active: true,
}

function withNewsDefaults(newsData = {}) {
  return {
    ...NEWS_DEFAULTS,
    ...newsData,
    homePlacement: normalizeNewsPlacement(newsData.homePlacement ?? NEWS_DEFAULTS.homePlacement),
    priority: normalizeNewsPriority(newsData.priority ?? NEWS_DEFAULTS.priority),
    imagePositionX: Number(newsData.imagePositionX ?? NEWS_DEFAULTS.imagePositionX),
    imagePositionY: Number(newsData.imagePositionY ?? NEWS_DEFAULTS.imagePositionY),
    imageScale: Number(newsData.imageScale ?? NEWS_DEFAULTS.imageScale),
    imageOverlayStrength: Number(newsData.imageOverlayStrength ?? NEWS_DEFAULTS.imageOverlayStrength),
    sourceLabel: newsData.sourceLabel ?? newsData.source ?? NEWS_DEFAULTS.sourceLabel,
    active: newsData.active ?? NEWS_DEFAULTS.active,
  }
}

function normalizeNewsItem(id, newsItem) {
   const active = newsItem.active !== false
  const homePlacement = normalizeNewsPlacement(newsItem.homePlacement)

  return {
    id,
    ...newsItem,
    active,
    homePlacement,
    isPublic: active && homePlacement !== 'hidden',
    priority: normalizeNewsPriority(newsItem.priority),
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

export function subscribeToNews(options) {
  const onData = typeof options === 'function' ? options : options?.onData
  const onError = typeof options === 'function' ? undefined : options?.onError
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
    ...withNewsDefaults(newsData),
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


export function createNewsItem(newsData) {
  return createNews(newsData)
}

export function updateNewsItem(newsId, newsData) {
  return updateNews(newsId, newsData)
}

export function uploadNewsImage(file) {
  return uploadImage(file, 'news')
}

