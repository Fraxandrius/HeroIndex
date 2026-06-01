import { useMemo, useState } from 'react'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { useNews } from '../hooks/useNews.js'
import { deleteHero } from '../services/heroesService.js'

const isOraculoMode = import.meta.env.VITE_ORACULO_MODE === 'true'

const profileFilters = [
  { id: 'all', label: 'Todos' },
  { id: 'affiliated', label: 'Afiliados' },
  { id: 'independent', label: 'Independientes' },
]

function getInitials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('') || 'HI'
  )
}

function getNumericValue(value) {
  const numberValue = Number(value ?? 0)

  return Number.isNaN(numberValue) ? 0 : numberValue
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

function getPublicBio(hero = {}) {
  return hero.publicBio || 'Biografía pública pendiente de actualización.'
}

function truncateText(value = '', maxLength = 150) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value
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

function getRelatedNewsCount(heroId, newsItems) {
  return newsItems.filter(
    (newsItem) =>
      newsItem.active !== false &&
      Array.isArray(newsItem.heroIds) &&
      newsItem.heroIds.map(String).includes(String(heroId)),
  ).length
}

function heroHasAffiliation(hero) {
  return Boolean(hero.corporationId && hero.corporationId !== 'independent')
}

function sortHeroesByRankingPoints(firstHero, secondHero) {
  const rankingDifference =
    getNumericValue(secondHero.rankingPoints) - getNumericValue(firstHero.rankingPoints)

  if (rankingDifference !== 0) return rankingDifference

  const approvalDifference = getNumericValue(secondHero.approval) - getNumericValue(firstHero.approval)

  if (approvalDifference !== 0) return approvalDifference

  return getHeroDisplayName(firstHero).localeCompare(getHeroDisplayName(secondHero), 'es')
}

function matchesSearch(hero, search, corporationName) {
  if (!search) return true

  const publicPowers = getPublicPowers(hero).join(' ')
  const values = [
    hero.alias,
    hero.publicName,
    hero.codename,
    hero.name,
    getHeroTitle(hero),
    corporationName,
    publicPowers,
  ]

  return values.some((value) => value?.toString().toLowerCase().includes(search))
}

function Profiles({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [profileFilter, setProfileFilter] = useState('all')
  const [selectedCorporationId, setSelectedCorporationId] = useState('all')
const [deletingHeroId, setDeletingHeroId] = useState(null)
  const [deleteMessage, setDeleteMessage] = useState('')

  const { error: heroesError, heroes, loading: heroesLoading } = useHeroes()
  const { feedNews, loading: newsLoading } = useNews()
  const {
    corporations,
    error: corporationsError,
    getCorporationById,
    loading: corporationsLoading,
  } = useCorporations()

  const activeHeroes = useMemo(
    () => heroes.filter((hero) => hero.active !== false),
    [heroes],
  )

  const affiliatedCorporations = useMemo(
    () =>
      corporations
        .filter((corporation) => activeHeroes.some((hero) => hero.corporationId === corporation.id))
        .sort((firstCorporation, secondCorporation) =>
          firstCorporation.name.localeCompare(secondCorporation.name, 'es'),
        ),
    [activeHeroes, corporations],
  )

  const search = searchQuery.trim().toLowerCase()
  const filteredHeroes = useMemo(
    () =>
      activeHeroes
        .filter((hero) => {
          if (profileFilter === 'affiliated' && !heroHasAffiliation(hero)) return false
          if (profileFilter === 'independent' && heroHasAffiliation(hero) && hero.independent !== true) return false
          if (selectedCorporationId !== 'all' && hero.corporationId !== selectedCorporationId) return false

          return matchesSearch(hero, search, getCorporationName(hero, getCorporationById))
        })
        .sort(sortHeroesByRankingPoints),
    [activeHeroes, getCorporationById, profileFilter, search, selectedCorporationId],
  )

  const loading = heroesLoading || corporationsLoading || newsLoading
  const error = heroesError || corporationsError

   const handleDeleteHero = async (hero) => {
    if (!window.confirm('Eliminar héroe público. Esta acción no se puede deshacer.')) return

    setDeletingHeroId(hero.id)
    setDeleteMessage('Eliminando...')

    try {
      await deleteHero(hero.id)
      setDeleteMessage('Registro eliminado correctamente.')
    } catch {
      setDeleteMessage('No fue posible eliminar el registro.')
    } finally {
      setDeletingHeroId(null)
    }
  }

  return (
    <section className="page-card profiles-page profiles-page--catalog">
      <header className="profiles-hero">
        <p className="page-card__kicker">Catálogo público HeroIndex</p>
        <h2>Perfiles HeroIndex</h2>
        <p className="profiles-hero__subtitle">
          Explora héroes registrados, trayectorias públicas y actividad destacada.
        </p>
        <p>
          HeroIndex reúne perfiles públicos de héroes activos, afiliaciones verificadas y
          señales de reconocimiento ciudadano.
        </p>
      </header>

      <section className="profiles-controls" aria-label="Filtros de perfiles">
        <div className="profiles-filter-tabs" role="tablist" aria-label="Tipo de perfil">
          {profileFilters.map((filter) => (
            <button
              aria-selected={profileFilter === filter.id}
              className={profileFilter === filter.id ? 'is-active' : ''}
              key={filter.id}
              onClick={() => {
                setProfileFilter(filter.id)
                if (filter.id !== 'affiliated') {
                  setSelectedCorporationId('all')
                }
              }}
              role="tab"
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="profiles-filter-grid">
          <label>
            <span>Búsqueda</span>
            <input
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar héroe, título, afiliación o poder visible..."
              type="search"
              value={searchQuery}
            />
          </label>
          <label>
            <span>Afiliación</span>
            <select
              onChange={(event) => setSelectedCorporationId(event.target.value)}
              value={selectedCorporationId}
            >
              <option value="all">Todas las afiliaciones</option>
              {affiliatedCorporations.map((corporation) => (
                <option key={corporation.id} value={corporation.id}>
                  {corporation.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {deleteMessage && isOraculoMode ? <p className="profiles-state">{deleteMessage}</p> : null}
      {loading ? <p className="profiles-state">Cargando perfiles HeroIndex...</p> : null}
      {!loading && error && activeHeroes.length === 0 ? (
        <p className="profiles-state profiles-state--error">No fue posible cargar los perfiles.</p>
      ) : null}
      {!loading && !error && activeHeroes.length === 0 ? (
        <p className="profiles-state">No hay héroes activos disponibles.</p>
      ) : null}
      {!loading && activeHeroes.length > 0 && filteredHeroes.length === 0 ? (
        <p className="profiles-state">No hay resultados para los filtros actuales.</p>
      ) : null}

      {!loading && filteredHeroes.length > 0 ? (
        <div className="profiles-catalog-grid">
          {filteredHeroes.map((hero) => {
            const displayName = getHeroDisplayName(hero)
            const corporationName = getCorporationName(hero, getCorporationById)
            const publicPowers = getPublicPowers(hero)
            const relatedNewsCount = getRelatedNewsCount(hero.id, feedNews)

            return (
              <article className="profile-public-card" key={hero.id}>
                <div className="profile-public-card__cover">
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
                </div>
                <div className="profile-public-card__body">
                  <span className="profile-public-card__avatar">
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
                  <div className="profile-public-card__heading">
                    <span className="ranking-tier">{getHeroTier(hero.rankingPoints)}</span>
                    <h3>{displayName}</h3>
                    <p>{getHeroTitle(hero)}</p>
                    <small>{corporationName}</small>
                  </div>

                  <dl className="profile-public-card__metrics">
                    <div>
                      <dt>Puntos HeroIndex</dt>
                      <dd>{getNumericValue(hero.rankingPoints)}</dd>
                    </div>
                    <div>
                      <dt>Aprobación ciudadana</dt>
                      <dd>{getNumericValue(hero.approval)}</dd>
                    </div>
                  </dl>

                  <p className="profile-public-card__bio">{truncateText(getPublicBio(hero))}</p>

                  {publicPowers.length > 0 ? (
                    <div className="profile-public-card__powers">
                      {publicPowers.slice(0, 4).map((power) => (
                        <span key={power}>{power}</span>
                      ))}
                    </div>
                  ) : null}

                  <p className="profile-public-card__news">
                    {relatedNewsCount === 1
                      ? '1 noticia relacionada'
                      : `${relatedNewsCount} noticias relacionadas`}
                  </p>

                  <button
                    className="hero-profile-link"
                    onClick={() => onNavigate?.('hero-profile', { heroId: hero.id })}
                    type="button"
                  >
                    Ver perfil
                  </button>
                   {isOraculoMode ? (
                    <button
                      className="hero-profile-link hero-profile-link--internal"
                      disabled={deletingHeroId === hero.id}
                      onClick={() => handleDeleteHero(hero)}
                      type="button"
                    >
                      {deletingHeroId === hero.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

export default Profiles
