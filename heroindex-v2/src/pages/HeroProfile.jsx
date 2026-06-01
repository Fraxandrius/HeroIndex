import { useMemo } from 'react'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { useNews } from '../hooks/useNews.js'

function getNumericValue(value) {
  const numberValue = Number(value ?? 0)

  return Number.isNaN(numberValue) ? 0 : numberValue
}

function toTimestamp(value) {
  if (!value) return 0
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value

  const parsed = Date.parse(value)

  return Number.isNaN(parsed) ? 0 : parsed
}

function getInitials(name = '') {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')

  return initials || 'HI'
}

function getHeroDisplayName(hero = {}) {
  return hero.alias || hero.publicName || hero.codename || hero.name || 'Identidad HeroIndex'
}

function getHeroTitle(hero = {}) {
  return hero.heroTitle || 'Figura HeroIndex'
}

function getHeroTier(rankingPoints) {
  const points = getNumericValue(rankingPoints)

  if (points >= 20000) return 'Símbolo global'
  if (points >= 10000) return 'Figura internacional'
  if (points >= 6000) return 'Ícono nacional'
  if (points >= 3000) return 'Héroe destacado'
  if (points >= 1500) return 'Héroe reconocido'
  if (points >= 750) return 'Protector urbano'
  if (points >= 250) return 'Héroe emergente'

  return 'Registro inicial'
}

function getCorporationName(hero, getCorporationById) {
  if (hero.independent === true || !hero.corporationId || hero.corporationId === 'independent') {
    return 'Independiente'
  }

  return getCorporationById(hero.corporationId)?.name || hero.corporationId
}

function getPublicPowers(hero = {}) {
  const powers = hero.publicPowers ?? hero.visiblePowers

  if (Array.isArray(powers)) {
    return powers.filter(Boolean)
  }

  if (typeof powers === 'string' && powers.trim()) {
    return powers
      .split(',')
      .map((power) => power.trim())
      .filter(Boolean)
  }

  return []
}

function getNewsSummary(newsItem) {
  const summary = newsItem.summary ?? newsItem.body ?? ''

  return summary.length > 150 ? `${summary.slice(0, 147)}...` : summary
}

function formatDate(value) {
  const timestamp = toTimestamp(value)

  if (!timestamp) return 'Fecha pendiente'

  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp))
}

function sortHeroesByPublicPosition(firstHero, secondHero) {
  const rankingDifference = getNumericValue(secondHero.rankingPoints) - getNumericValue(firstHero.rankingPoints)

  if (rankingDifference !== 0) return rankingDifference

  const approvalDifference = getNumericValue(secondHero.approval) - getNumericValue(firstHero.approval)

  if (approvalDifference !== 0) return approvalDifference

  return getHeroDisplayName(firstHero).localeCompare(getHeroDisplayName(secondHero), 'es')
}

function HeroProfile({ routeParams = {} }) {
  const heroId = routeParams.heroId
  const { error: heroesError, heroes, loading: heroesLoading } = useHeroes()
  const {
    getCorporationById,
    loading: corporationsLoading,
    error: corporationsError,
  } = useCorporations()
  const { feedNews, loading: newsLoading, error: newsError } = useNews()

  const hero = heroes.find((heroItem) => String(heroItem.id) === String(heroId))
  const activeHeroes = useMemo(
    () => [...heroes].filter((heroItem) => heroItem.active !== false).sort(sortHeroesByPublicPosition),
    [heroes],
  )
  const publicPosition = hero
    ? activeHeroes.findIndex((heroItem) => String(heroItem.id) === String(hero.id)) + 1
    : 0
  const displayName = hero ? getHeroDisplayName(hero) : ''
  const relatedNews = hero
    ? feedNews
        .filter(
          (newsItem) =>
            newsItem.active !== false &&
            Array.isArray(newsItem.heroIds) &&
            newsItem.heroIds.map(String).includes(String(hero.id)),
        )
        .sort((firstItem, secondItem) => toTimestamp(secondItem.createdAt) - toTimestamp(firstItem.createdAt))
        .slice(0, 5)
    : []

  const loading = heroesLoading || corporationsLoading || newsLoading
  const error = heroesError || corporationsError || newsError

  if (loading) {
    return (
      <section className="page-card hero-profile-page">
        <p className="hero-profile-state">Cargando perfil HeroIndex...</p>
      </section>
    )
  }

  if (error && !hero) {
    return (
      <section className="page-card hero-profile-page">
        <p className="hero-profile-state hero-profile-state--error">No fue posible cargar el perfil.</p>
      </section>
    )
  }

  if (!hero) {
    return (
      <section className="page-card hero-profile-page">
        <p className="hero-profile-state">No se encontró el perfil solicitado.</p>
      </section>
    )
  }

  const corporationName = getCorporationName(hero, getCorporationById)
  const publicPowers = getPublicPowers(hero)
  const publicBio = hero.publicBio || hero.description || 'Biografía pública pendiente de actualización.'

  return (
    <section className="page-card hero-profile-page">
      <header className="hero-profile-cover">
        {hero.bannerUrl ? (
          <img
            alt={`Portada pública de ${displayName}`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.hidden = true
            }}
            src={hero.bannerUrl}
          />
        ) : null}
        <div className="hero-profile-cover__overlay">
          <span className="hero-profile-avatar">
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
          </span>
          <div className="hero-profile-heading">
            <p className="page-card__kicker">Perfil público HeroIndex</p>
            <h2>{displayName}</h2>
            <p>{getHeroTitle(hero)}</p>
            <div className="hero-profile-tags">
              <span>{corporationName}</span>
              <span>{getHeroTier(hero.rankingPoints)}</span>
            </div>
          </div>
        </div>
      </header>

      <dl className="hero-profile-metrics">
        <div>
          <dt>Puntos HeroIndex</dt>
          <dd>{getNumericValue(hero.rankingPoints)}</dd>
        </div>
        <div>
          <dt>Aprobación ciudadana</dt>
          <dd>{getNumericValue(hero.approval)}</dd>
        </div>
        <div>
          <dt>Posición pública</dt>
          <dd>{publicPosition > 0 ? `#${publicPosition}` : '—'}</dd>
        </div>
        <div>
          <dt>Afiliación</dt>
          <dd>{corporationName}</dd>
        </div>
      </dl>

      <section className="hero-profile-section">
        <p className="page-card__kicker">Biografía pública</p>
        <p>{publicBio}</p>
      </section>

      <section className="hero-profile-section">
        <p className="page-card__kicker">Poderes visibles</p>
        {publicPowers.length > 0 ? (
          <div className="hero-profile-powers">
            {publicPowers.map((power) => (
              <span key={power}>{power}</span>
            ))}
          </div>
        ) : (
          <p>Sin poderes públicos registrados.</p>
        )}
      </section>

      <section className="hero-profile-section">
        <p className="page-card__kicker">Noticias relacionadas</p>
        {relatedNews.length > 0 ? (
          <div className="hero-profile-news">
            {relatedNews.map((newsItem) => (
              <article className="hero-profile-news__item" key={newsItem.id}>
                {newsItem.imageUrl ? (
                  <img
                    alt={newsItem.title}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.hidden = true
                    }}
                    src={newsItem.imageUrl}
                  />
                ) : null}
                <div>
                  <span>{newsItem.category || newsItem.layer || 'HeroIndex News'}</span>
                  <h3>{newsItem.title}</h3>
                  <p>{getNewsSummary(newsItem)}</p>
                  <time dateTime={newsItem.createdAt ? new Date(toTimestamp(newsItem.createdAt)).toISOString() : undefined}>
                    {formatDate(newsItem.createdAt)}
                  </time>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>Sin noticias relacionadas.</p>
        )}
      </section>
    </section>
  )
}

export default HeroProfile