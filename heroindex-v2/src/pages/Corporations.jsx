import { useCorporations } from '../hooks/useCorporations.js'
import { useNews } from '../hooks/useNews.js'

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
}

function toTimestamp(value) {
  if (!value) {
    return 0
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? 0 : value
  }

  const parsed = Date.parse(value)

  return Number.isNaN(parsed) ? 0 : parsed
}

function getRelatedNews(corporationId, newsItems) {
  return newsItems
    .filter(
      (newsItem) =>
        newsItem.active !== false &&
        Array.isArray(newsItem.corporationIds) &&
        newsItem.corporationIds.map(String).includes(String(corporationId)),
    )
    .sort(
      (firstItem, secondItem) =>
        toTimestamp(secondItem.createdAt) - toTimestamp(firstItem.createdAt),
    )
    .slice(0, 3)
}

function getNewsSummary(newsItem) {
  const summary = newsItem.summary ?? newsItem.body ?? ''

  return summary.length > 140 ? `${summary.slice(0, 137)}...` : summary
}

function Corporations() {
  const { corporations, loading, source } = useCorporations()
  const { feedNews, loading: newsLoading } = useNews()

  return (
    <section className="page-card corporations-page">
      <p className="page-card__kicker">Corporations · {source}</p>
      <h2>Corporations</h2>
      <div className="corporations-list">
        {loading || newsLoading ? <p>Loading...</p> : null}
        {!loading && !newsLoading
          ? corporations.map((corporation) => {
              const relatedNews = getRelatedNews(corporation.id, feedNews)

              return (
                <article className="corporation-card" key={corporation.id}>
                  <div className="corporation-card__logo">
                    <span>{getInitials(corporation.name)}</span>
                    {corporation.logoUrl ? (
                      <img
                        src={corporation.logoUrl}
                        alt={corporation.name}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.hidden = true
                        }}
                      />
                    ) : null}
                  </div>
                  <div>
                    {corporation.bannerUrl ? (
                      <img
                        alt={corporation.name}
                        className="corporation-card__cover"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.hidden = true
                        }}
                        src={corporation.bannerUrl}
                      />
                    ) : null}
                    <p className="page-card__kicker">{corporation.sector}</p>
                    <h3>{corporation.name}</h3>
                    <strong>{corporation.tagline}</strong>
                    <p>{corporation.description}</p>
                    <dl className="corporation-card__stats">
                      <div>
                        <dt>Country</dt>
                        <dd>{corporation.country}</dd>
                      </div>
                      <div>
                        <dt>Approval</dt>
                        <dd>{corporation.approval}</dd>
                      </div>
                      <div>
                        <dt>Trust</dt>
                        <dd>{corporation.trustScore}</dd>
                      </div>
                    </dl>
                    <section
                      className="corporation-news"
                      aria-label={`Noticias relacionadas de ${corporation.name}`}
                    >
                      <div className="corporation-news__top">
                        <p className="page-card__kicker">Noticias relacionadas</p>
                      </div>
                      {relatedNews.length > 0 ? (
                        <div className="corporation-news__list">
                          {relatedNews.map((newsItem) => (
                            <article className="corporation-news__item" key={newsItem.id}>
                              {newsItem.imageUrl ? (
                                <img
                                  alt={newsItem.title ?? 'HeroIndex news'}
                                  loading="lazy"
                                  onError={(event) => {
                                    event.currentTarget.hidden = true
                                  }}
                                  src={newsItem.imageUrl}
                                />
                              ) : null}
                              <div>
                                <span>{newsItem.category ?? newsItem.layer ?? newsItem.tag}</span>
                                <strong>{newsItem.title}</strong>
                                {getNewsSummary(newsItem) ? (
                                  <p>{getNewsSummary(newsItem)}</p>
                                ) : null}
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p className="corporation-news__empty">Sin noticias relacionadas.</p>
                      )}
                    </section>
                  </div>
                </article>
              )
            })
          : null}
      </div>
    </section>
  )
}

export default Corporations