import { useEffect, useState } from 'react'
import { subscribeToProfileGalleryByHero } from '../services/profileGalleryService.js'

export function useProfileGallery(heroId, { publicOnly = false } = {}) {
  const [state, setState] = useState({ error: null, heroId: '', loading: Boolean(heroId), images: [] })
  useEffect(() => subscribeToProfileGalleryByHero(heroId, {
    onData: (images) => setState({ error: null, heroId, loading: false, images }),
    onError: (error) => setState({ error, heroId, loading: false, images: [] }),
    publicOnly,
  }), [heroId, publicOnly])
  return state.heroId === heroId ? state : { error: null, loading: Boolean(heroId), images: [] }
}
