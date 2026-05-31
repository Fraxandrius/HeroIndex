import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
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

function getRelatedNews(heroId, newsItems) {
  return newsItems
    .filter(
      (newsItem) =>
        newsItem.active !== false &&
        Array.isArray(newsItem.heroIds) &&
        newsItem.heroIds.map(String).includes(String(heroId)),
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

function Profiles() {
  const { heroes, loading: heroesLoading, source } = useHeroes()
  const { feedNews, loading: newsLoading } = useNews()
  const {
    getCorporationById,
    loading: corporationsLoading,
    source: corporationsSource,
  } = useCorporations()

  return (
    <section className="page-card profiles-page">
      <p className="page-card__kicker">
        Players · {source} heroes · {corporationsSource} corporations
      </p>
      <h2>Profiles</h2>
      <div className="profiles-list">
        {heroesLoading || corporationsLoading || newsLoading ? <p>Loading...</p> : null}
        {!heroesLoading && !corporationsLoading && !newsLoading
          ? heroes.map((hero) => {
              const relatedNews = getRelatedNews(hero.id, feedNews)

              return (
                <article className="profile-card" key={hero.id}>
                  <div className="profile-card__avatar">
                    <span>{getInitials(hero.name)}</span>
                    {hero.avatarUrl ? (
                      <img
                        alt={hero.alias ?? hero.name}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.hidden = true
                        }}
                        src={hero.avatarUrl}
                      />
                    ) : null}
                  </div>
                  <div>
                    {hero.bannerUrl ? (
                      <img
                        alt={hero.alias ?? hero.name}
                        className="profile-card__cover"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.hidden = true
                        }}
                        src={hero.bannerUrl}
                      />
                    ) : null}
                    <p className="page-card__kicker">{hero.powerClass}</p>
                    <h3>{hero.name}</h3>
                    <p>{hero.description}</p>
                    <small>
                      {getCorporationById(hero.corporationId)?.name ?? hero.corporationId}
                    </small>
                    <section
                      className="profile-news"
                      aria-label={`Noticias relacionadas de ${hero.name}`}
                    >
                      <div className="profile-news__top">
                        <p className="page-card__kicker">Noticias relacionadas</p>
                      </div>
                      {relatedNews.length > 0 ? (
                        <div className="profile-news__list">
                          {relatedNews.map((newsItem) => (
                            <article className="profile-news__item" key={newsItem.id}>
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
                        <p className="profile-news__empty">Sin noticias relacionadas.</p>
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

export default Profiles