import { useMemo, useState } from 'react'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'

const rankingModes = [
  {
    id: 'global',
    label: 'Global',
    description: 'Los héroes con mayor reconocimiento dentro del índice HeroIndex.',
  },
  {
    id: 'national',
    label: 'Nacional',
    description: 'Figuras destacadas por zona de cobertura.',
  },
  {
    id: 'corporate',
    label: 'Corporativo',
    description: 'Héroes afiliados con actividad destacada.',
  },
  {
    id: 'independent',
    label: 'Independiente',
    description: 'Héroes independientes con presencia registrada en HeroIndex.',
  },
]

function getInitials(name = '') {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')

  return initials || 'HI'
}

function getNumericValue(value) {
  const numberValue = Number(value ?? 0)

  return Number.isNaN(numberValue) ? 0 : numberValue
}

function getHeroDisplayName(hero) {
  return hero.alias || hero.publicName || hero.codename || hero.name || 'Identidad HeroIndex'
}

function getHeroTitle(hero) {
  return hero.heroTitle || 'Figura HeroIndex'
}

function getHeroRegion(hero) {
  return hero.country || hero.originCountry || hero.coverageCountry || hero.rankingRegion || ''
}

function getCorporationName(hero, getCorporationById) {
  if (hero.independent === true || !hero.corporationId || hero.corporationId === 'independent') {
    return 'Independiente'
  }

  return getCorporationById(hero.corporationId)?.name || hero.corporationId
}

function getHeroTier(hero) {
  const rankingPoints = getNumericValue(hero.rankingPoints)

  if (rankingPoints >= 20000) return 'Símbolo global'
  if (rankingPoints >= 10000) return 'Figura internacional'
  if (rankingPoints >= 6000) return 'Ícono nacional'
  if (rankingPoints >= 3000) return 'Héroe destacado'
  if (rankingPoints >= 1500) return 'Héroe reconocido'
  if (rankingPoints >= 750) return 'Protector urbano'
  if (rankingPoints >= 250) return 'Héroe emergente'

  return 'Registro inicial'
}

function sortHeroesByRankingValue(firstHero, secondHero) {
  const rankingDifference =
    getNumericValue(secondHero.rankingPoints) - getNumericValue(firstHero.rankingPoints)

  if (rankingDifference !== 0) {
    return rankingDifference
  }

  const trustDifference = getNumericValue(secondHero.trustScore) - getNumericValue(firstHero.trustScore)

  if (trustDifference !== 0) {
    return trustDifference
  }

  const approvalDifference = getNumericValue(secondHero.approval) - getNumericValue(firstHero.approval)

  if (approvalDifference !== 0) {
    return approvalDifference
  }

  return getHeroDisplayName(firstHero).localeCompare(getHeroDisplayName(secondHero), 'es')
}

function matchesSearch(hero, query, getCorporationById) {
  if (!query) {
    return true
  }

  const corporationName = getCorporationName(hero, getCorporationById)
  const searchValues = [
    hero.alias,
    hero.publicName,
    hero.codename,
    hero.name,
    getHeroTitle(hero),
    corporationName,
    getHeroRegion(hero),
  ]

  return searchValues.some((value) => value?.toString().toLowerCase().includes(query))
}

function HeroAvatar({ hero, name, size = 'default' }) {
  return (
    <span className={`hero-ranking-avatar hero-ranking-avatar--${size}`}>
      <span>{getInitials(name)}</span>
      {hero.avatarUrl ? (
        <img
          alt={`Retrato público de ${name}`}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.hidden = true
          }}
          src={hero.avatarUrl}
        />
      ) : null}
    </span>
  )
}

function RankingMetric({ label, value }) {
  return (
    <div className="ranking-metric">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function Ranking() {
  const [activeMode, setActiveMode] = useState('global')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedCorporationId, setSelectedCorporationId] = useState('all')

  const {
    heroes,
    error: heroesError,
    loading: heroesLoading,
  } = useHeroes()
  const {
    corporations,
    error: corporationsError,
    getCorporationById,
    loading: corporationsLoading,
  } = useCorporations()

  const activeHeroes = useMemo(() => heroes.filter((hero) => hero.active !== false), [heroes])

  const regionOptions = useMemo(
    () =>
      [...new Set(activeHeroes.map(getHeroRegion).filter(Boolean))].sort((firstRegion, secondRegion) =>
        firstRegion.localeCompare(secondRegion, 'es'),
      ),
    [activeHeroes],
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

  const rankedHeroes = useMemo(() => {
    const filteredHeroes = activeHeroes
      .filter((hero) => {
        if (activeMode === 'national') {
          const region = getHeroRegion(hero)

          if (!regionOptions.length) {
            return false
          }

          if (selectedRegion !== 'all' && region !== selectedRegion) {
            return false
          }

          return Boolean(region)
        }

        if (activeMode === 'corporate') {
          const hasCorporation = Boolean(hero.corporationId && hero.corporationId !== 'independent')

          if (!hasCorporation) {
            return false
          }

          return selectedCorporationId === 'all' || hero.corporationId === selectedCorporationId
        }

        if (activeMode === 'independent') {
          return hero.independent === true || !hero.corporationId || hero.corporationId === 'independent'
        }

        return true
      })
      .filter((hero) => matchesSearch(hero, search, getCorporationById))

    return filteredHeroes.sort(sortHeroesByRankingValue)
  }, [activeHeroes, activeMode, getCorporationById, regionOptions.length, search, selectedCorporationId, selectedRegion])

  const topHeroes = rankedHeroes.slice(0, 3)
  const activeModeData = rankingModes.find((mode) => mode.id === activeMode) ?? rankingModes[0]
  const loading = heroesLoading || corporationsLoading
  const error = heroesError || corporationsError
  const hasActiveHeroes = activeHeroes.length > 0
  const emptyMessage =
    activeMode === 'national' && !regionOptions.length
      ? 'No hay resultados nacionales disponibles para los filtros actuales.'
      : 'No hay resultados para los filtros actuales.'

  return (
    <section className="page-card ranking-page">
      <header className="ranking-hero">
        <p className="page-card__kicker">Índice oficial HeroIndex</p>
        <h2>Ranking HeroIndex</h2>
        <p className="ranking-hero__subtitle">
          El índice oficial de reconocimiento heroico, actividad destacada y presencia pública.
        </p>
        <p>
          HeroIndex reúne señales públicas de actividad, respuesta e impacto ciudadano para destacar
          a los héroes que inspiran mayor confianza en el ecosistema heroico.
        </p>
      </header>

      <section className="ranking-controls" aria-label="Filtros del ranking">
        <div className="ranking-mode-nav" role="tablist" aria-label="Modo de ranking">
          {rankingModes.map((mode) => (
            <button
              aria-selected={activeMode === mode.id}
              className={activeMode === mode.id ? 'is-active' : ''}
              key={mode.id}
              onClick={() => {
                setActiveMode(mode.id)
                setSelectedRegion('all')
                setSelectedCorporationId('all')
              }}
              role="tab"
              type="button"
            >
              {mode.label}
            </button>
          ))}
        </div>

        <p className="ranking-controls__copy">{activeModeData.description}</p>

        <div className="ranking-filter-grid">
          <label>
            <span>Búsqueda</span>
            <input
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar héroe, alias, afiliación o título..."
              type="search"
              value={searchQuery}
            />
          </label>

          {activeMode === 'national' ? (
            <label>
              <span>Zona de cobertura</span>
              <select onChange={(event) => setSelectedRegion(event.target.value)} value={selectedRegion}>
                <option value="all">Todas las zonas disponibles</option>
                {regionOptions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {activeMode === 'corporate' ? (
            <label>
              <span>Afiliación</span>
              <select
                onChange={(event) => setSelectedCorporationId(event.target.value)}
                value={selectedCorporationId}
              >
                <option value="all">Todas las corporaciones</option>
                {affiliatedCorporations.map((corporation) => (
                  <option key={corporation.id} value={corporation.id}>
                    {corporation.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </section>

      {loading ? <p className="ranking-state">Cargando Ranking HeroIndex...</p> : null}
      {!loading && error && !hasActiveHeroes ? (
        <p className="ranking-state ranking-state--error">No fue posible cargar el ranking.</p>
      ) : null}
      {!loading && !error && !hasActiveHeroes ? (
        <p className="ranking-state">No hay héroes activos en el índice.</p>
      ) : null}

      {!loading && hasActiveHeroes ? (
        <>
          {rankedHeroes.length > 0 ? (
            <section className="ranking-top-section">
              <div>
                <p className="page-card__kicker">Héroes que inspiran confianza</p>
                <h3>Top HeroIndex</h3>
              </div>
              <div className="ranking-top-grid">
                {topHeroes.map((hero, index) => {
                  const displayName = getHeroDisplayName(hero)
                  const corporationName = getCorporationName(hero, getCorporationById)

                  return (
                    <article
                      className={index === 0 ? 'ranking-top-card ranking-top-card--leader' : 'ranking-top-card'}
                      key={hero.id}
                    >
                      <span className="ranking-position">#{index + 1}</span>
                      <HeroAvatar hero={hero} name={displayName} size={index === 0 ? 'large' : 'default'} />
                      <div className="ranking-top-card__body">
                        <span className="ranking-tier">{getHeroTier(hero)}</span>
                        <h4>{displayName}</h4>
                        <p>{getHeroTitle(hero)}</p>
                        <small>{corporationName}</small>
                      </div>
                      <dl className="ranking-card-metrics">
                        <RankingMetric label="Puntos HeroIndex" value={getNumericValue(hero.rankingPoints)} />
                        <RankingMetric label="Aprobación ciudadana" value={getNumericValue(hero.approval)} />
                      </dl>
                    </article>
                  )
                })}
              </div>
            </section>
          ) : (
            <p className="ranking-state">{emptyMessage}</p>
          )}

          {rankedHeroes.length > 0 ? (
            <section className="ranking-list-section">
              <div>
                <p className="page-card__kicker">Reconocimiento actualizado por HeroIndex</p>
                <h3>Posicionamiento oficial</h3>
                <p>Posición oficial según señales públicas verificadas.</p>
              </div>

              <ol className="hero-ranking-list">
                {rankedHeroes.map((hero, index) => {
                  const displayName = getHeroDisplayName(hero)
                  const corporationName = getCorporationName(hero, getCorporationById)

                  return (
                    <li key={hero.id}>
                      <span className="ranking-position">#{index + 1}</span>
                      <HeroAvatar hero={hero} name={displayName} />
                      <div className="hero-ranking-list__identity">
                        <strong>{displayName}</strong>
                        <span>{getHeroTitle(hero)}</span>
                      </div>
                      <span className="hero-ranking-list__affiliation">{corporationName}</span>
                      <span className="ranking-tier">{getHeroTier(hero)}</span>
                      <dl className="hero-ranking-list__metrics">
                        <RankingMetric label="Puntos HeroIndex" value={getNumericValue(hero.rankingPoints)} />
                        <RankingMetric label="Aprobación ciudadana" value={getNumericValue(hero.approval)} />
                        <RankingMetric label="Confianza pública" value={getNumericValue(hero.trustScore)} />
                      </dl>
                    </li>
                  )
                })}
              </ol>
            </section>
          ) : null}
        </>
      ) : null}
    </section>
  )
}

export default Ranking
