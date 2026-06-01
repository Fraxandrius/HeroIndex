import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { useNews } from '../hooks/useNews.js'

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('') || 'HI'
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

function getHeroDisplayName(hero = {}) {
  return hero.alias || hero.publicName || hero.codename || hero.name || 'Identidad HeroIndex'
}

function getHeroTitle(hero = {}) {
  return hero.heroTitle || 'Figura HeroIndex'
}

function getCorporationName(hero, getCorporationById) {
  if (hero.independent === true || !hero.corporationId || hero.corporationId === 'independent') {
    return 'Independiente'
  }

  return getCorporationById(hero.corporationId)?.name || hero.corporationId
}

function getPublicBio(hero = {}) {
  return hero.publicBio || hero.description || 'Biografía pública pendiente de actualización.'
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

function Profiles({ onNavigate }) {
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
        Perfiles públicos · héroes {source} · corporaciones {corporationsSource}
      </p>
      <h2>Perfiles públicos</h2>
      <div className="profiles-list">
        {heroesLoading || corporationsLoading || newsLoading ? <p>Cargando perfiles HeroIndex...</p> : null}
        {!heroesLoading && !corporationsLoading && !newsLoading
          ? heroes.map((hero) => {
              const relatedNews = getRelatedNews(hero.id, feedNews)
              const displayName = getHeroDisplayName(hero)
              const corporationName = getCorporationName(hero, getCorporationById)

              return (
                <article className="profile-card" key={hero.id}>
                  <div className="profile-card__avatar">
                    <span>{getInitials(displayName)}</span>
                    {hero.avatarUrl ? (
                      <img
                        alt={`Avatar público de ${displayName}`}
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
                        alt={`Portada pública de ${displayName}`}
                        className="profile-card__cover"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.hidden = true
                        }}
                        src={hero.bannerUrl}
                      />
                    ) : null}
                    <p className="page-card__kicker">{getHeroTitle(hero)}</p>
                    <h3>{displayName}</h3>
                    <p>{getPublicBio(hero)}</p>
                    <small>{corporationName}</small>
                    <div className="profile-card__actions">
                      <button
                        className="hero-profile-link"
                        onClick={() => onNavigate?.('hero-profile', { heroId: hero.id })}
                        type="button"
                      >
                        Ver perfil
                      </button>
                    </div>
                    <section
                      className="profile-news"
                      aria-label={`Noticias relacionadas de ${displayName}`}
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