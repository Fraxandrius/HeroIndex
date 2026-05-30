import { useEffect, useMemo, useState } from 'react'
import { mockNews } from '../data/mockNews.js'
import { getFirebaseClient } from '../firebase/firebaseClient.js'
import { subscribeToNews } from '../services/newsService.js'

function getNewsTimestamp(newsItem) {
  const rawDate = newsItem.publishedAt ?? newsItem.updatedAt ?? newsItem.createdAt
  const timestamp = rawDate ? Date.parse(rawDate) : 0

  return Number.isNaN(timestamp) ? 0 : timestamp
}

function sortNewsByNewest(firstNewsItem, secondNewsItem) {
  return getNewsTimestamp(secondNewsItem) - getNewsTimestamp(firstNewsItem)
}

function sortNewsByTrending(firstNewsItem, secondNewsItem) {
  const firstScore = Number(firstNewsItem.trendingScore ?? firstNewsItem.score ?? 0)
  const secondScore = Number(secondNewsItem.trendingScore ?? secondNewsItem.score ?? 0)

  if (secondScore !== firstScore) {
    return secondScore - firstScore
  }

  return sortNewsByNewest(firstNewsItem, secondNewsItem)
}

function formatNewsTime(newsItem) {
  if (newsItem.time) {
    return newsItem.time
  }

  const timestamp = getNewsTimestamp(newsItem)

  if (!timestamp) {
    return 'now'
  }

  const elapsedMinutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000))

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m`
  }

  const elapsedHours = Math.round(elapsedMinutes / 60)

  if (elapsedHours < 24) {
    return `${elapsedHours}h`
  }

  return `${Math.round(elapsedHours / 24)}d`
}

function getNewsTag(newsItem) {
  if (newsItem.tag) {
    return newsItem.tag
  }

  if (Array.isArray(newsItem.tags) && newsItem.tags.length > 0) {
    return newsItem.tags[0]
  }

  return 'HeroIndex News'
}

function normalizeNewsForUi(newsItem) {
  return {
    ...newsItem,
    author: newsItem.author ?? newsItem.source ?? 'HeroIndex Newsroom',
    body: newsItem.body ?? newsItem.summary ?? newsItem.excerpt ?? '',
    handle: newsItem.handle ?? '@heroindex',
    inlinePlacementSlotId:
      newsItem.inlinePlacementSlotId ?? newsItem.placementSlotId ?? null,
    metric: newsItem.metric ?? newsItem.reactionCount ?? 'Live update',
    movement: newsItem.movement ?? newsItem.move ?? '+1',
    source: newsItem.source ?? newsItem.author ?? 'HeroIndex Newsroom',
    tag: getNewsTag(newsItem),
    time: formatNewsTime(newsItem),
    title: newsItem.title ?? 'Untitled HeroIndex update',
  }
}

function getErrorMessage(error) {
  if (!error) {
    return null
  }

  if (typeof error === 'string') {
    return error
  }

  return error.message ?? String(error)
}

function createNewsState({ firebaseNews, error = null }) {
  const normalizedFirebaseNews = firebaseNews ?? []
  const hasFirebaseNews = normalizedFirebaseNews.length > 0
  const activeNews = hasFirebaseNews ? normalizedFirebaseNews : mockNews
  const newsItems = activeNews.map(normalizeNewsForUi).sort(sortNewsByNewest)

  return {
    error,
    firebaseNews: normalizedFirebaseNews,
    newsItems,
    source: hasFirebaseNews ? 'firebase' : 'mock',
  }
}

export function useNews() {
  const [newsState, setNewsState] = useState(() =>
    createNewsState({ firebaseNews: [] }),
  )

  useEffect(() => {
    const unsubscribe = subscribeToNews({
      onData: (firebaseNews) => {
        setNewsState(createNewsState({ firebaseNews }))
      },
      onError: (error) => {
        setNewsState(createNewsState({ firebaseNews: [], error }))
      },
    })

    return unsubscribe
  }, [])

  const trendingNews = useMemo(
    () => [...newsState.newsItems].sort(sortNewsByTrending).slice(0, 3),
    [newsState.newsItems],
  )

  return {
    ...newsState,
    debug: {
      errorMessage: getErrorMessage(newsState.error),
      firebaseConfigured: getFirebaseClient().isConfigured,
      firebaseNewsCount: newsState.firebaseNews.length,
      mockNewsCount: mockNews.length,
      source: newsState.source,
    },
    feedNews: newsState.newsItems,
    trendingNews,
  }
}
