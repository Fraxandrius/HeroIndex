import { useEffect, useMemo, useState } from 'react'
import { mockNews } from '../data/mockNews.js'
import { getFirebaseClient } from '../firebase/firebaseClient.js'
import {
  hasEditorialText,
  isSignalStory,
  isVisualStory,
  normalizeDisplayMode,
  normalizeNewsPlacement,
  normalizeNewsPriority,
  normalizeStoryMode,
  subscribeToNews,
} from '../services/newsService.js'

function toTimestamp(value) {
  if (!value) {
    return 0
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? 0 : value
  }

  const timestamp = Date.parse(value)

  return Number.isNaN(timestamp) ? 0 : timestamp
}

function getNewsTimestamp(newsItem) {
  return toTimestamp(newsItem.updatedAt ?? newsItem.createdAt)
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
    return 'ahora'
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

  return 'Canal HeroIndex'
}

function normalizeNewsForUi(newsItem) {
   const storyMode = normalizeStoryMode(newsItem.storyMode)
  const displayMode = normalizeDisplayMode({ ...newsItem, storyMode })
  const homePlacement = normalizeNewsPlacement(newsItem.homePlacement)
  const visualStory = isVisualStory({ ...newsItem, storyMode })
  const signalStory = isSignalStory({ ...newsItem, storyMode })
  const title = newsItem.title || (storyMode === 'standard' ? 'Actualización HeroIndex sin titular' : '')

  return {
    ...newsItem,
    author: newsItem.author ?? newsItem.sourceLabel ?? newsItem.source ?? 'Mesa Editorial HeroIndex',
    body: newsItem.body ?? newsItem.summary ?? newsItem.excerpt ?? '',
    displayMode,
    handle: newsItem.handle ?? '@heroindex',
    inlinePlacementSlotId:
      newsItem.inlinePlacementSlotId ?? newsItem.placementSlotId ?? null,
    metric: newsItem.metric ?? newsItem.reactionCount ?? 'Actualización en vivo',
    movement: newsItem.movement ?? newsItem.move ?? '+1',
    editorialTone: newsItem.editorialTone ?? 'verified',
    hasEditorialText: hasEditorialText(newsItem),
    homePlacement,
    isPublic: newsItem.active !== false && homePlacement !== 'hidden',
    isSignalStory: signalStory,
    isVisualStory: visualStory,
    priority: normalizeNewsPriority(newsItem.priority),
    source: newsItem.sourceLabel ?? newsItem.source ?? newsItem.author ?? 'Mesa Editorial HeroIndex',
    sourceLabel: newsItem.sourceLabel ?? newsItem.source ?? newsItem.author ?? 'Mesa Editorial HeroIndex',
    storyMode,
    tag: newsItem.kicker ?? getNewsTag(newsItem),
    time: formatNewsTime(newsItem),
    title,
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

function createNewsState({ firebaseNews, error = null, loading = false }) {
  const normalizedFirebaseNews = firebaseNews ?? []
  const hasFirebaseNews = normalizedFirebaseNews.length > 0
  const sourceNews = loading ? [] : hasFirebaseNews ? normalizedFirebaseNews : mockNews
  const newsItems = sourceNews.map(normalizeNewsForUi).sort(sortNewsByNewest)

  return {
    error,
    loading,
    firebaseNews: normalizedFirebaseNews,
    newsItems,
    source: loading ? 'loading' : hasFirebaseNews ? 'firebase' : 'mock',
  }
}

export function useNews() {
  const [newsState, setNewsState] = useState(() =>
    createNewsState({ firebaseNews: [], loading: true }),
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
      loading: newsState.loading,
      firebaseConfigured: getFirebaseClient().isConfigured,
      firebaseNewsCount: newsState.firebaseNews.length,
      mockNewsCount: mockNews.length,
      source: newsState.source,
    },
    feedNews: newsState.newsItems,
    trendingNews,
  }
}
