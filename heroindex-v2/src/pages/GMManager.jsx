import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { useNews } from '../hooks/useNews.js'

function getStatus({ error, loading }) {
  if (loading) {
    return 'loading'
  }

  if (error) {
    return 'error'
  }

  return 'ready'
}

function GMManagerSummary({ count, error, label, loading }) {
  const status = getStatus({ error, loading })

  return (
    <article className="gm-manager-summary">
      <p className="page-card__kicker">{label}</p>
      <strong>{count}</strong>
      <span>Status: {status}</span>
      {error ? <small>{error.message ?? String(error)}</small> : null}
    </article>
  )
}

function GMManager() {
  const { error: newsError, feedNews, loading: newsLoading } = useNews()
  const { error: heroesError, heroes, loading: heroesLoading } = useHeroes()
  const {
    corporations,
    error: corporationsError,
    loading: corporationsLoading,
  } = useCorporations()

  return (
    <section className="page-card gm-manager-page">
      <p className="page-card__kicker">Internal</p>
      <h2>GM Manager</h2>
      <p>Panel interno de gestión de HeroIndex.</p>

      <div className="gm-manager-grid">
        <GMManagerSummary
          count={feedNews.length}
          error={newsError}
          label="News"
          loading={newsLoading}
        />
        <GMManagerSummary
          count={heroes.length}
          error={heroesError}
          label="Heroes"
          loading={heroesLoading}
        />
        <GMManagerSummary
          count={corporations.length}
          error={corporationsError}
          label="Corporations"
          loading={corporationsLoading}
        />
      </div>
    </section>
  )
}

export default GMManager