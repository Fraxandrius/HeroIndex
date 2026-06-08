import { useEffect, useMemo, useState } from 'react'
import BroadcastSlot from '../components/broadcast/BroadcastSlot.jsx'
import InlineVisualSlot from '../components/visual/InlineVisualSlot.jsx'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { subscribeToCharacterSheets } from '../services/characterSheetsService.js'

const rankingModes = [
  {
    id: 'global',
    label: 'Global',
    description: 'Reconocimiento oficial dentro del ecosistema HeroIndex.',
  },
  {
    id: 'national',
    label: 'Nacional',
    description: 'Figuras destacadas por zona de cobertura pública.',
  },
  {
    id: 'corporate',
    label: 'Corporativo',
    description: 'Héroes afiliados con presencia verificada.',
  },
  {
    id: 'independent',
    label: 'Independiente',
    description: 'Registros independientes con confianza ciudadana activa.',
  },
]

const publicAbilityAxes = [
  { id: 'potencia', label: 'Potencia' },
  { id: 'resistencia', label: 'Resistencia' },
  { id: 'movilidad', label: 'Movilidad' },
  { id: 'tecnica', label: 'Técnica' },
  { id: 'control', label: 'Control' },
  { id: 'impacto', label: 'Impacto' },
]
const publicTierScale = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS']

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

function hasPublicMeasurement(value) {
  return value !== undefined && value !== null && value !== '' && !Number.isNaN(Number(value))
}

function formatPublicNumber(value, fallback = 'Sin medición') {
  return hasPublicMeasurement(value) ? getNumericValue(value).toLocaleString('es') : fallback
}

function formatPublicPercent(value, fallback = 'Sin medición') {
  return hasPublicMeasurement(value) ? `${getNumericValue(value)}%` : fallback
}

function getHeroDisplayName(hero) {
  return hero.alias || hero.publicName || hero.codename || hero.name || 'Identidad HeroIndex'
}

function getHeroTitle(hero) {
  return hero.heroTitle || hero.title || 'Figura HeroIndex'
}

function getHeroRegion(hero) {
  return hero.country || hero.originCountry || hero.coverageCountry || hero.rankingRegion || ''
}

function getHeroAvatar(hero) {
  return hero.avatarUrl || hero.imageUrl || hero.portraitUrl || ''
}

function getHeroPoints(hero) {
  return hero.rankingPoints
}

function getHeroApproval(hero) {
  return hero.approval ?? hero.approvalScore ?? hero.citizenApproval
}

function getHeroTrust(hero) {
  return hero.trustScore ?? hero.publicTrust ?? hero.trust
}

function getCorporationName(hero, getCorporationById) {
  if (hero.independent === true || !hero.corporationId || hero.corporationId === 'independent') {
    return 'Independiente'
  }

  return getCorporationById(hero.corporationId)?.name || hero.corporationName || hero.affiliation || hero.corporationId
}

function getHeroAffiliation(hero, getCorporationById) {
  return getCorporationName(hero, getCorporationById) || 'Afiliación en consolidación'
}

function getHeroTier(hero) {
  const rankingPoints = getNumericValue(getHeroPoints(hero))

  if (rankingPoints >= 20000) return 'Símbolo global'
  if (rankingPoints >= 10000) return 'Figura internacional'
  if (rankingPoints >= 6000) return 'Ícono nacional'
  if (rankingPoints >= 3000) return 'Héroe destacado'
  if (rankingPoints >= 1500) return 'Héroe reconocido'
  if (rankingPoints >= 750) return 'Protector urbano'
  if (rankingPoints >= 250) return 'Héroe emergente'

  return 'Registro inicial'
}

function getHeroTrend(hero) {
  const rawMovement = hero.rankChange ?? hero.movement ?? hero.trend ?? hero.publicTrend

  if (typeof rawMovement === 'number') {
    if (rawMovement > 0) return { label: `En ascenso +${rawMovement}`, tone: 'up' }
    if (rawMovement < 0) return { label: `Descenso ${rawMovement}`, tone: 'down' }
    return { label: 'Estable', tone: 'stable' }
  }

  const normalizedMovement = String(rawMovement || '').trim().toLowerCase()

  if (['up', 'ascenso', 'rising', 'sube', 'positivo'].includes(normalizedMovement)) {
    return { label: 'En ascenso', tone: 'up' }
  }

  if (['down', 'descenso', 'falling', 'baja', 'negativo'].includes(normalizedMovement)) {
    return { label: 'Descenso controlado', tone: 'down' }
  }

  if (['new', 'nuevo', 'new-entry', 'ingreso'].includes(normalizedMovement)) {
    return { label: 'Nuevo ingreso', tone: 'new' }
  }

  return { label: 'Estable', tone: 'stable' }
}

function normalizePublicTier(value) {
  const normalizedTier = String(value?.tier ?? value ?? '').trim().toUpperCase()

  return publicTierScale.includes(normalizedTier) ? normalizedTier : ''
}

function tierFromPrivateScore(score, fallback = 'D') {
  if (score === undefined || score === null || score === '') return fallback

  const numberValue = Number(score)

  if (Number.isNaN(numberValue)) return fallback

  const clampedScore = Math.min(12, Math.max(1, Math.round(numberValue)))

  if (clampedScore <= 2) return 'D'
  if (clampedScore === 3) return 'C'
  if (clampedScore === 4) return 'B'
  if (clampedScore <= 6) return 'A'
  if (clampedScore <= 8) return 'S'
  if (clampedScore <= 10) return 'SS'

  return 'SSS'
}

function getTierLevel(tier) {
  const normalizedTier = normalizePublicTier(tier) || 'D'

  return publicTierScale.indexOf(normalizedTier) + 1
}

function increaseTier(tier, levels = 1) {
  const currentIndex = Math.max(0, publicTierScale.indexOf(normalizePublicTier(tier) || 'D'))
  const nextIndex = Math.min(publicTierScale.length - 1, currentIndex + levels)

  return publicTierScale[nextIndex]
}

function averagePrivateScores(...scores) {
  const numericScores = scores
    .map((score) => Number(score))
    .filter((score) => !Number.isNaN(score) && score > 0)

  if (!numericScores.length) return null

  return numericScores.reduce((total, score) => total + score, 0) / numericScores.length
}

function getPrivateRpgSheet(hero = {}, characterSheet = null) {
  return (
    characterSheet ||
    hero.privateRpgSheet ||
    hero.rpgPrivateSheet ||
    hero.characterSheet ||
    hero.oraculoSheet ||
    hero.rpgSheet ||
    hero.privateSheet ||
    null
  )
}

function getPrivateAttributes(privateSheet = {}) {
  return privateSheet.attributes || privateSheet.privateRpgSheet?.attributes || privateSheet.rpgSheet?.attributes || {}
}

function getPrivateSheetValue(privateSheet = {}, ...keys) {
  for (const key of keys) {
    if (privateSheet[key] !== undefined && privateSheet[key] !== null && privateSheet[key] !== '') return privateSheet[key]
  }

  return undefined
}

function getFallbackPrivateScore(hero, axisId, position) {
  const points = getNumericValue(getHeroPoints(hero))
  const approval = hasPublicMeasurement(getHeroApproval(hero)) ? getNumericValue(getHeroApproval(hero)) : 48
  const trust = hasPublicMeasurement(getHeroTrust(hero)) ? getNumericValue(getHeroTrust(hero)) : 46
  const positionBoost = Math.max(0, 26 - position) * 1.8
  const pointsScore = Math.min(100, Math.log10(Math.max(points, 1)) * 22)
  const publicCategoryBoost = hero.independent === true ? 2 : 6
  const base = Math.min(100, pointsScore + positionBoost + publicCategoryBoost)
  const scores = {
    potencia: base * 0.82 + approval * 0.12 + trust * 0.06,
    resistencia: base * 0.68 + trust * 0.24 + approval * 0.08,
    movilidad: base * 0.62 + approval * 0.24 + trust * 0.08 + positionBoost,
    tecnica: base * 0.58 + trust * 0.28 + approval * 0.14,
    control: base * 0.52 + trust * 0.34 + approval * 0.14,
    impacto: base * 0.72 + approval * 0.18 + trust * 0.1 + (position <= 3 ? 8 : 0),
  }
  const publicScore = Math.max(0, Math.min(100, scores[axisId] ?? base))

  return Math.max(1, Math.min(12, Math.ceil(publicScore / 100 * 12)))
}

function getPublicEvaluationTier(publicEvaluation, axisId) {
  if (!publicEvaluation || typeof publicEvaluation !== 'object') return ''

  const axisValue = publicEvaluation[axisId]

  return normalizePublicTier(axisValue)
}

function derivePublicAbilityMatrix(hero, { characterSheet = null, position = 1 } = {}) {
  const privateSheet = getPrivateRpgSheet(hero, characterSheet)
  const attributes = getPrivateAttributes(privateSheet)
  const reputation = Number(getPrivateSheetValue(privateSheet, 'reputation'))
  const hasPrivateAttributes = ['strength', 'fighting', 'agility', 'reason', 'intuition', 'presence'].some(
    (attribute) => attributes[attribute] !== undefined && attributes[attribute] !== null && attributes[attribute] !== '',
  )
  const privateScores = hasPrivateAttributes
    ? {
        potencia: attributes.strength,
        resistencia: averagePrivateScores(attributes.strength, attributes.fighting),
        movilidad: attributes.agility,
        tecnica: attributes.fighting,
        control: averagePrivateScores(attributes.reason, attributes.intuition),
        impacto: averagePrivateScores(attributes.presence, attributes.strength, Number.isNaN(reputation) ? null : reputation),
      }
    : {}

  return Object.fromEntries(
    publicAbilityAxes.map((axis) => {
      const privateScore = privateScores[axis.id]
      let tier = hasPrivateAttributes && privateScore !== null && privateScore !== undefined
        ? tierFromPrivateScore(privateScore)
        : tierFromPrivateScore(getFallbackPrivateScore(hero, axis.id, position))

      if (axis.id === 'impacto' && (position <= 3 || getNumericValue(getHeroPoints(hero)) >= 10000)) {
        tier = increaseTier(tier)
      }

      const publicOverrideTier = getPublicEvaluationTier(hero.publicEvaluation, axis.id)

      return [
        axis.id,
        {
          label: axis.label,
          tier: publicOverrideTier || tier,
        },
      ]
    }),
  )
}

function getPublicAbilityList(matrix) {
  return publicAbilityAxes.map((axis) => matrix[axis.id] ?? { label: axis.label, tier: 'D' })
}

function sortHeroesByRankingValue(firstHero, secondHero) {
  const rankingDifference =
    getNumericValue(getHeroPoints(secondHero)) - getNumericValue(getHeroPoints(firstHero))

  if (rankingDifference !== 0) {
    return rankingDifference
  }

  const approvalDifference = getNumericValue(getHeroApproval(secondHero)) - getNumericValue(getHeroApproval(firstHero))

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
  const avatarUrl = getHeroAvatar(hero)

  return (
    <span className={`hero-ranking-avatar hero-ranking-avatar--${size}`}>
      <span>{getInitials(name)}</span>
      {avatarUrl ? (
        <img
          alt={`Retrato público de ${name}`}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.hidden = true
          }}
          src={avatarUrl}
        />
      ) : null}
    </span>
  )
}

function RankingMetric({ label, value, compact = false }) {
  return (
    <div className={compact ? 'ranking-stat-chip' : 'ranking-metric'}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function RankingHeroPreview({ characterSheet, hero, onClose, onNavigate, position, getCorporationById }) {
  const displayName = getHeroDisplayName(hero)
  const affiliation = getHeroAffiliation(hero, getCorporationById)
  const trend = getHeroTrend(hero)
  const abilityMatrix = derivePublicAbilityMatrix(hero, { characterSheet, position })
  const abilityTiers = getPublicAbilityList(abilityMatrix)
  const polygonPoints = abilityTiers
    .map((ability, index) => {
      const angle = (-90 + index * 60) * (Math.PI / 180)
      const radius = 12 + getTierLevel(ability.tier) * 5
      const x = 50 + Math.cos(angle) * radius
      const y = 50 + Math.sin(angle) * radius

      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  const handleOpenProfile = () => {
    onNavigate?.('hero-profile', { heroId: hero.id })
  }

  return (
    <div className="ranking-preview" aria-labelledby="ranking-preview-title" aria-modal="true" role="dialog">
      <button aria-label="Cerrar vista de estadísticas" className="ranking-preview__overlay" onClick={onClose} type="button" />
      <article className="ranking-preview__card">
        <button aria-label="Cerrar" className="ranking-preview__close" onClick={onClose} type="button">
          ×
        </button>

        <header className="ranking-preview__header">
          <HeroAvatar hero={hero} name={displayName} size="preview" />
          <div>
            <p className="page-card__kicker">Perfil público</p>
            <h3 id="ranking-preview-title">{displayName}</h3>
            <p>{getHeroTitle(hero)}</p>
            <span>{affiliation}</span>
          </div>
          <div className="ranking-preview__status">
            <span className="ranking-position">#{position}</span>
            <span className="ranking-verified-chip">Canal verificado</span>
          </div>
        </header>

        <section className="ranking-preview__metrics" aria-label="Métricas públicas">
          <RankingMetric compact label="Puntos HeroIndex" value={formatPublicNumber(getHeroPoints(hero))} />
          <RankingMetric compact label="Aprobación ciudadana" value={formatPublicPercent(getHeroApproval(hero), 'Sin medición pública')} />
          <RankingMetric compact label="Confianza pública" value={formatPublicPercent(getHeroTrust(hero), 'Datos en consolidación')} />
          <RankingMetric compact label="Tendencia pública" value={trend.label} />
        </section>

        <section className="ranking-preview__insight">
          <div>
            <p className="page-card__kicker">Evolución pública</p>
            <h4>{trend.label}</h4>
            <p>
              {trend.tone === 'stable'
                ? 'Historial en consolidación por Red HeroIndex.'
                : 'Movimiento detectado por señales públicas recientes de reconocimiento y confianza ciudadana.'}
            </p>
          </div>
          <span className={`ranking-trend ranking-trend--${trend.tone}`}>{trend.label}</span>
        </section>

        <section className="ranking-preview__ability-panel" aria-label="Evaluación HeroIndex">
          <div>
            <p className="page-card__kicker">EVALUACIÓN HEROINDEX</p>
            <h4>Matriz pública de capacidades</h4>
            <p>Lectura por tiers D–SSS basada en señales públicas y evaluación HeroIndex. No expone parámetros tácticos internos.</p>
          </div>
          <div className="ranking-preview__ability-layout">
            <div className="ranking-preview__radar" aria-label="Matriz pública de capacidades HeroIndex" role="img">
              <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
                <polygon className="ranking-preview__radar-grid" points="50,10 84.6,30 84.6,70 50,90 15.4,70 15.4,30" />
                <polygon className="ranking-preview__radar-grid ranking-preview__radar-grid--inner" points="50,26 70.7,38 70.7,62 50,74 29.3,62 29.3,38" />
                <polygon className="ranking-preview__radar-shape" points={polygonPoints} />
              </svg>
              <div className="ranking-preview__radar-tiers">
                {abilityTiers.map((ability, index) => (
                  <span className={`ranking-preview__radar-tier ranking-preview__radar-tier--${index + 1}`} key={`${ability.label}-radar`}>
                    {ability.tier}
                  </span>
                ))}
              </div>
            </div>
            <div className="ranking-preview__ability-grid">
              {abilityTiers.map((ability) => (
                <div className="ranking-preview__ability" key={ability.label}>
                  <span>{ability.label}</span>
                  <strong className={`ranking-tier ranking-tier--${ability.tier.toLowerCase()}`}>{ability.tier}</strong>
                  <small>Tier público</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="ranking-preview__footer">
          <p>Evaluación pública generada por Red HeroIndex. Los parámetros tácticos internos no son públicos.</p>
          <div>
            <button className="ranking-preview__primary" onClick={handleOpenProfile} type="button">
              Abrir perfil público
            </button>
            <button className="ranking-preview__secondary" onClick={onClose} type="button">
              Cerrar
            </button>
          </div>
        </footer>
      </article>
    </div>
  )
}

function Ranking({ onNavigate }) {
  const [activeMode, setActiveMode] = useState('global')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedCorporationId, setSelectedCorporationId] = useState('all')
  const [selectedHeroPreview, setSelectedHeroPreview] = useState(null)
  const [characterSheets, setCharacterSheets] = useState([])

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

  useEffect(() => {
    return subscribeToCharacterSheets(
      (items) => setCharacterSheets(items),
      () => setCharacterSheets([]),
    )
  }, [])

  const characterSheetsByHeroId = useMemo(
    () => new Map(characterSheets.map((sheet) => [String(sheet.heroId ?? sheet.id), sheet])),
    [characterSheets],
  )

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
  const selectedHeroPosition = selectedHeroPreview
    ? rankedHeroes.findIndex((hero) => hero.id === selectedHeroPreview.id) + 1
    : 0
  const emptyMessage =
    activeMode === 'national' && !regionOptions.length
      ? 'No hay resultados nacionales disponibles para los filtros actuales.'
      : 'No hay resultados para los filtros actuales.'

  useEffect(() => {
    if (!selectedHeroPreview) return undefined

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedHeroPreview(null)
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => document.removeEventListener('keydown', handleEscape)
  }, [selectedHeroPreview])

  const openHeroProfile = (heroId) => {
    onNavigate?.('hero-profile', { heroId })
  }

  const openHeroPreview = (hero) => {
    setSelectedHeroPreview(hero)
  }

  const handleRankingCardKeyDown = (event, hero) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openHeroPreview(hero)
    }
  }

  return (
    <section className="page-card ranking-page">
      <header className="ranking-hero">
        <div className="ranking-hero__copy">
          <p className="page-card__kicker">ÍNDICE OFICIAL HEROINDEX</p>
          <h2>Ranking HeroIndex</h2>
          <p className="ranking-hero__subtitle">
            Reconocimiento público, presencia verificada y confianza ciudadana dentro del ecosistema heroico.
          </p>
        </div>

        <section className="ranking-controls" aria-label="Filtros del ranking">
          <div className="ranking-filters ranking-mode-nav" role="tablist" aria-label="Modo de ranking">
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
            <label className="ranking-search">
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
      </header>

      {loading ? <p className="ranking-state">Actualizando índice oficial HeroIndex…</p> : null}
      {!loading && error && !hasActiveHeroes ? (
        <p className="ranking-state ranking-state--error">No fue posible cargar el ranking.</p>
      ) : null}
      {!loading && !error && !hasActiveHeroes ? (
        <p className="ranking-state">No hay identidades heroicas verificadas para este ciclo.</p>
      ) : null}

      {!loading && hasActiveHeroes ? (
        <>
          {rankedHeroes.length > 0 ? (
            <section className="ranking-top-section">
              <div className="ranking-section-heading">
                <p className="page-card__kicker">Héroes que inspiran confianza</p>
                <h3>Top HeroIndex</h3>
                <p>Referentes públicos con mayor reconocimiento oficial y presencia verificada.</p>
              </div>
              <div className="ranking-top-grid">
                {topHeroes.map((hero, index) => {
                  const displayName = getHeroDisplayName(hero)
                  const affiliation = getHeroAffiliation(hero, getCorporationById)
                  const trend = getHeroTrend(hero)

                  return (
                    <article
                      aria-label={`Ver estadísticas públicas de ${displayName}`}
                      className={
                        index === 0
                          ? 'ranking-top-card ranking-top-card--first ranking-top-card--interactive'
                          : 'ranking-top-card ranking-top-card--interactive'
                      }
                      key={hero.id}
                      onClick={() => openHeroPreview(hero)}
                      onKeyDown={(event) => handleRankingCardKeyDown(event, hero)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="ranking-top-card__chrome">
                        <span className="ranking-position">#{index + 1}</span>
                        <span className="ranking-verified-chip">{index === 0 ? 'TOP GLOBAL' : 'Perfil público'}</span>
                      </div>
                      <HeroAvatar hero={hero} name={displayName} size={index === 0 ? 'large' : 'default'} />
                      <div className="ranking-top-card__body">
                        <span className="ranking-tier">{getHeroTier(hero)}</span>
                        <h4>{displayName}</h4>
                        <p>{getHeroTitle(hero)}</p>
                        <small>{affiliation}</small>
                      </div>
                      <dl className="ranking-card-metrics">
                        <RankingMetric label="Puntos HeroIndex" value={formatPublicNumber(getHeroPoints(hero))} />
                        <RankingMetric label="Aprobación ciudadana" value={formatPublicPercent(getHeroApproval(hero))} />
                        <RankingMetric label="Tendencia pública" value={trend.label} />
                      </dl>
                      <div className="ranking-card-actions">
                        <span className="ranking-top-card__open-indicator">Ver estadísticas</span>
                        <button
                          className="hero-profile-link hero-profile-link--subtle"
                          onClick={(event) => {
                            event.stopPropagation()
                            openHeroProfile(hero.id)
                          }}
                          type="button"
                        >
                          Abrir perfil completo
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ) : (
            <p className="ranking-state">{emptyMessage}</p>
          )}

          {rankedHeroes.length > 0 ? (
            <InlineVisualSlot className="ranking-visual-signal hi-card hi-card-public" page="ranking" section="Señal destacada de ranking" slotId="ranking-feature-visual">
              <p className="page-card__kicker">Señal destacada</p>
              <h3>Héroes verificados dentro del estándar HeroIndex</h3>
              <p>Posicionamiento actualizado según señales públicas de actividad heroica y compromiso con la protección moderna.</p>
            </InlineVisualSlot>
          ) : null}

          {rankedHeroes.length > 0 ? (
            <BroadcastSlot className="ranking-broadcast-channel" placement="ranking-feature" variant="feature" />
          ) : null}

          {rankedHeroes.length > 0 ? (
            <section className="ranking-list-section">
              <div className="ranking-section-heading">
                <p className="page-card__kicker">Reconocimiento actualizado por HeroIndex</p>
                <h3>Posicionamiento oficial</h3>
                <p>Lista pública optimizada por señales verificadas, presencia civil y confianza ciudadana.</p>
              </div>

              <ol className="ranking-list">
                {rankedHeroes.map((hero, index) => {
                  const displayName = getHeroDisplayName(hero)
                  const affiliation = getHeroAffiliation(hero, getCorporationById)
                  const trend = getHeroTrend(hero)

                  return (
                    <li
                      aria-label={`Ver estadísticas públicas de ${displayName}`}
                      className="ranking-row"
                      key={hero.id}
                      onClick={() => openHeroPreview(hero)}
                      onKeyDown={(event) => handleRankingCardKeyDown(event, hero)}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="ranking-position">#{index + 1}</span>
                      <div className="ranking-row__identity">
                        <HeroAvatar hero={hero} name={displayName} />
                        <div>
                          <strong>{displayName}</strong>
                          <span>{getHeroTitle(hero)}</span>
                          <small>{affiliation}</small>
                        </div>
                      </div>
                      <div className="ranking-row__tags" aria-label="Etiquetas públicas">
                        <span className="ranking-tier">{getHeroTier(hero)}</span>
                        <span className="ranking-verified-chip">Canal verificado</span>
                        <span className={`ranking-trend ranking-trend--${trend.tone}`}>{trend.label}</span>
                      </div>
                      <dl className="ranking-row__metrics">
                        <RankingMetric compact label="Puntos HeroIndex" value={formatPublicNumber(getHeroPoints(hero))} />
                        <RankingMetric compact label="Aprobación ciudadana" value={formatPublicPercent(getHeroApproval(hero))} />
                        <RankingMetric compact label="Confianza pública" value={formatPublicPercent(getHeroTrust(hero), 'Datos en consolidación')} />
                      </dl>
                      <div className="ranking-row__actions">
                        <span>Ver estadísticas</span>
                        <button
                          className="hero-profile-link hero-profile-link--subtle"
                          onClick={(event) => {
                            event.stopPropagation()
                            openHeroProfile(hero.id)
                          }}
                          type="button"
                        >
                          Abrir perfil completo
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
          ) : null}
        </>
      ) : null}

      {selectedHeroPreview ? (
        <RankingHeroPreview
          getCorporationById={getCorporationById}
          characterSheet={characterSheetsByHeroId.get(String(selectedHeroPreview.id))}
          hero={selectedHeroPreview}
          onClose={() => setSelectedHeroPreview(null)}
          onNavigate={onNavigate}
          position={selectedHeroPosition || 1}
        />
      ) : null}
    </section>
  )
}

export default Ranking