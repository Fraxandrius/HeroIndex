import { useState } from 'react'
import BroadcastSlot from '../components/broadcast/BroadcastSlot.jsx'
import InlineVisualSlot from '../components/visual/InlineVisualSlot.jsx'
import { useNews } from '../hooks/useNews.js'
import { deleteNews } from '../services/newsService.js'

const isOraculoMode = import.meta.env.VITE_ORACULO_MODE === 'true'

function News() {
  const { feedNews, loading, source } = useNews()
  const [deletingNewsId, setDeletingNewsId] = useState(null)
  const [deleteMessage, setDeleteMessage] = useState('')
  const visibleNews = feedNews.filter((item) => item.active !== false)

  const handleDeleteNews = async (newsItem) => {
    if (!window.confirm('Eliminar noticia. Esta acción no se puede deshacer.')) return

    setDeletingNewsId(newsItem.id)
    setDeleteMessage('Eliminando...')

    try {
      await deleteNews(newsItem.id)
      setDeleteMessage('Registro eliminado correctamente.')
    } catch {
      setDeleteMessage('No fue posible eliminar el registro.')
    } finally {
      setDeletingNewsId(null)
    }
  }

  return (
    <section className="page-card news-page">
        <InlineVisualSlot className="news-hero hi-card hi-card-public" page="news" section="Cabecera de noticias" slotId="news-feature-visual">
        <p className="page-card__kicker">Cobertura verificada · {source}</p>
        <h2>Noticias HeroIndex</h2>
        <p>Cobertura verificada de intervenciones, alertas y eventos heroicos relevantes para una ciudadanía protegida.</p>
      </InlineVisualSlot>
      <BroadcastSlot className="news-broadcast-channel" placement="news-feature" variant="feature" />
      {deleteMessage && isOraculoMode ? <p>{deleteMessage}</p> : null}
      <div className="news-list">
        {loading ? <p>Cargando noticias HeroIndex...</p> : null}
        {!loading && visibleNews.length === 0 ? <p>No hay noticias activas por el momento.</p> : null}
        {!loading
          ? visibleNews.map((newsItem) => (
              <article className="news-list__item" key={newsItem.id}>
                 <p className="feed-card__tag">{newsItem.category ?? newsItem.layer ?? newsItem.tag}</p>
                <h3>{newsItem.title}</h3>
                <p>{newsItem.summary ?? newsItem.body}</p>
                {newsItem.imageUrl ? (
                  <img
                    alt={newsItem.title ?? 'HeroIndex news'}
                    className="news-list__image"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.hidden = true
                    }}
                    src={newsItem.imageUrl}
                  />
                ) : null}
                <footer>
                  {newsItem.source} · {newsItem.time}
                </footer>
                {isOraculoMode ? (
                  <button disabled={deletingNewsId === newsItem.id} onClick={() => handleDeleteNews(newsItem)} type="button">
                    {deletingNewsId === newsItem.id ? 'Eliminando...' : 'Eliminar noticia'}
                  </button>
                ) : null}
                {visibleNews.indexOf(newsItem) === 1 ? (
                  <BroadcastSlot className="news-feed-signal" placement="news-feed" variant="inline" />
                ) : null}
              </article>
            ))
          : null}
      </div>
    </section>
  )
}

export default News
