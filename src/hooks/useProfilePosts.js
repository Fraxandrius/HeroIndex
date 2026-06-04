import { useEffect, useState } from 'react'
import { subscribeToProfilePostsByHero } from '../services/profilePostsService.js'

export function useProfilePosts(heroId, { publicOnly = false } = {}) {
  const [state, setState] = useState({ error: null, heroId: '', loading: Boolean(heroId), posts: [] })

  useEffect(
    () => subscribeToProfilePostsByHero(heroId, {
      onData: (posts) => setState({ error: null, heroId, loading: false, posts }),
      onError: (error) => setState({ error, heroId, loading: false, posts: [] }),
      publicOnly,
    }),
    [heroId, publicOnly],
  )

  return state.heroId === heroId ? state : { error: null, loading: Boolean(heroId), posts: [] }
}
