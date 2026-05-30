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

function getValue(value) {
  if (value === undefined || value === null || value === '') {
    return '—'
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  return value
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

function GMManagerSection({ children, title }) {
  return (
    <section className="gm-manager-section">
      <div className="gm-manager-title">
        <p className="page-card__kicker">Review</p>
        <h3>{title}</h3>
      </div>
      <div className="gm-manager-table-wrap">{children}</div>
    </section>
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
      
      <GMManagerSection title="News">
        <table className="gm-manager-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category / Type</th>
              <th>Active</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {feedNews.map((newsItem) => (
              <tr key={newsItem.id}>
                <td>{getValue(newsItem.title)}</td>
                <td>{getValue(newsItem.category ?? newsItem.type)}</td>
                <td>{getValue(newsItem.active)}</td>
                <td>{getValue(newsItem.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GMManagerSection>

      <GMManagerSection title="Heroes">
        <table className="gm-manager-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Alias</th>
              <th>Corporation</th>
              <th>Approval</th>
              <th>Trust</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {heroes.map((hero) => (
              <tr key={hero.id}>
                <td>{getValue(hero.name)}</td>
                <td>{getValue(hero.alias)}</td>
                <td>{getValue(hero.corporationId)}</td>
                <td>{getValue(hero.approval)}</td>
                <td>{getValue(hero.trustScore)}</td>
                <td>{getValue(hero.active)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GMManagerSection>

      <GMManagerSection title="Corporations">
        <table className="gm-manager-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Sector</th>
              <th>Country</th>
              <th>Approval</th>
              <th>Trust</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {corporations.map((corporation) => (
              <tr key={corporation.id}>
                <td>{getValue(corporation.name)}</td>
                <td>{getValue(corporation.sector)}</td>
                <td>{getValue(corporation.country)}</td>
                <td>{getValue(corporation.approval)}</td>
                <td>{getValue(corporation.trustScore)}</td>
                <td>{getValue(corporation.active)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GMManagerSection>
    </section>
  )
}

export default GMManager