import { useState } from 'react'
import BroadcastSlot from '../components/broadcast/BroadcastSlot.jsx'
import { useNews } from '../hooks/useNews.js'
import { deleteNews, isSignalStory, isVisualStory } from '../services/newsService.js'

const isOraculoMode = import.meta.env.VITE_ORACULO_MODE === 'true'

function getNewsCategory(newsItem = {}, index = 0) {
  return newsItem.category || newsItem.layer || newsItem.tag || newsItem.kicker || (index === 0 ? 'Cobertura verificada' : 'Canal verificado')
}

function getNewsTitle(newsItem = {}) {
  if (newsItem.title) return newsItem.title
  if (isVisualStory(newsItem)) return 'Cobertura visual'
  if (isSignalStory(newsItem)) return newsItem.kicker || 'Señal editorial'

  return ''
}

function getNewsCopy(newsItem = {}) { return newsItem.summary || newsItem.body || '' }

function getNewsItemClass(newsItem, index) {
  return [
    'news-list__item',
    index === 0 ? 'news-list__item--featured' : '',
    isVisualStory(newsItem) || newsItem.displayMode === 'image-first' ? 'news-list__item--visual-story' : '',
    isSignalStory(newsItem) || newsItem.displayMode === 'signal-card' ? 'news-list__item--signal-story' : '',
  ].filter(Boolean).join(' ')
}

function getNewsFeedTag(newsItem, index) {
  if (isSignalStory(newsItem)) return 'SEÑAL EDITORIAL'
  if (isVisualStory(newsItem)) return 'COBERTURA VISUAL'

  return index === 0 ? 'ÚLTIMO MINUTO' : 'CANAL VERIFICADO'
}

function getEmptyCopy(newsItem) {
  if (isSignalStory(newsItem)) return 'Señal editorial HeroIndex · Actualización breve verificada.'
  if (isVisualStory(newsItem)) return 'Pieza visual HeroIndex · Cobertura visual verificada.'

  return 'Cobertura HeroIndex en consolidación.'
}

function News() {
  const { feedNews, loading } = useNews()
  const [deletingNewsId, setDeletingNewsId] = useState(null)
  const [deleteMessage, setDeleteMessage] = useState('')
  const visibleNews = feedNews.filter((item) => item.active !== false && item.homePlacement !== 'hidden')

  const handleDeleteNews = async (newsItem) => {
    if (!window.confirm('Eliminar cobertura. Esta acción no se puede deshacer.')) return
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
    <section className="page-card news-page news-page--editorial">
      <header className="news-hero news-hero--editorial">
        <div className="news-hero__copy">
          <p className="page-card__kicker">COBERTURA VERIFICADA · HEROINDEX</p>
          <h2>Noticias HeroIndex</h2>
          <p>Cobertura verificada de intervenciones, alertas y eventos heroicos relevantes para una ciudadanía protegida.</p>
        </div>
        <div className="news-hero__status" aria-label="Estado del canal editorial">
          <span>Canal verificado</span>
          <strong>Ciclo informativo activo</strong>
          <small>Señales públicas consolidadas por Red HeroIndex.</small>
        </div>
      </header>

      <section className="news-signal-block" aria-label="Cobertura destacada HeroIndex">
        <div className="news-section-heading">
          <div>
            <p className="page-card__kicker">SEÑAL DESTACADA</p>
            <h3>Cobertura en curso</h3>
          </div>
          <span>Red editorial activa</span>
        </div>
        <BroadcastSlot className="news-broadcast-channel" placement="news-feature" variant="feature" />
      </section>

      {deleteMessage && isOraculoMode ? <p className="news-state news-state--oraculo">{deleteMessage}</p> : null}

      <section className="news-directory" aria-label="Coberturas públicas HeroIndex">
        <div className="news-section-heading">
          <div>
            <p className="page-card__kicker">MESA EDITORIAL</p>
            <h3>Últimas coberturas</h3>
          </div>
          <span>{visibleNews.length} señales verificadas</span>
        </div>


        <div className="news-list">
          {loading ? <p className="news-state">Sincronizando cobertura verificada…</p> : null}
          {!loading && visibleNews.length === 0 ? <p className="news-state">La Mesa Editorial no registra coberturas activas durante este ciclo.</p> : null}
          {!loading
            ? visibleNews.map((newsItem, index) => (
                <article className={getNewsItemClass(newsItem, index)} key={newsItem.id}>
                  <div className="news-list__media">
                    {newsItem.imageUrl ? (
                      <img
                        alt={getNewsTitle(newsItem) || 'Pieza visual HeroIndex'}
                        className="news-list__image"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.hidden = true
                          event.currentTarget.nextElementSibling?.removeAttribute('hidden')
                        }}
                        src={newsItem.imageUrl}
                      />
                    ) : null}
                    <div className="news-list__placeholder" hidden={Boolean(newsItem.imageUrl)}>
                      <span>RED HEROINDEX</span>
                      <strong>COBERTURA VERIFICADA</strong>
                    </div>
                    <span className="news-list__category">{getNewsCategory(newsItem, index)}</span>
                  </div>
                  <div className="news-list__body">
                    <p className="feed-card__tag">{getNewsFeedTag(newsItem, index)}</p>
                    {getNewsTitle(newsItem) ? <h3>{getNewsTitle(newsItem)}</h3> : null}
                    {getNewsCopy(newsItem) ? <p>{getNewsCopy(newsItem)}</p> : <p className="news-list__visual-copy">{getEmptyCopy(newsItem)}</p>}
                    <footer>
                      <span>Red HeroIndex</span>
                      <span>{newsItem.time || 'Cobertura activa'}</span>
                    </footer>
                    <div className="news-list__actions">
                      <span className="news-list__open">Leer cobertura →</span>
                      {isOraculoMode ? (
                        <button
                          className="news-list__delete"
                          disabled={deletingNewsId === newsItem.id}
                          onClick={() => handleDeleteNews(newsItem)}
                          type="button"
                        >
                          {deletingNewsId === newsItem.id ? 'Eliminando...' : 'Eliminar cobertura'}
                        </button>
                      ) : null}
                    </div>
                    {index === 1 ? <BroadcastSlot className="news-feed-signal" placement="news-feed" variant="inline" /> : null}
                  </div>
                </article>
              ))
            : null}
        </div>
      </section>
    </section>
  )
}

export default News