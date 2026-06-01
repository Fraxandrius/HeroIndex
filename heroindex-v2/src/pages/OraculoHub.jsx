import { useEffect, useState } from 'react'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { useNews } from '../hooks/useNews.js'
import { subscribeToCharacterSheets } from '../services/characterSheetsService.js'
import { subscribeToMissionCalculations } from '../services/missionCalculationsService.js'

const heroFilters = [
  { id: 'all', label: 'Todos' },
  { id: 'affiliated', label: 'Afiliados' },
  { id: 'independent', label: 'Independientes' },
  { id: 'missingSheet', label: 'Sin hoja privada RPG' },
]

const statusLabels = {
  approved: 'Aprobado',
  draft: 'Borrador',
  rejected: 'Rechazado',
}

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

function formatDate(value) {
  const timestamp = toTimestamp(value)

  if (!timestamp) return 'Fecha pendiente'

  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
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

function heroHasAffiliation(hero) {
  return Boolean(hero.corporationId && hero.corporationId !== 'independent')
}

function sortHeroesByRankingPoints(firstHero, secondHero) {
  const rankingDifference = getNumericValue(secondHero.rankingPoints) - getNumericValue(firstHero.rankingPoints)

  if (rankingDifference !== 0) return rankingDifference

  return getHeroDisplayName(firstHero).localeCompare(getHeroDisplayName(secondHero), 'es')
}

function matchesHeroSearch(hero, search, corporationName) {
  if (!search) return true

  return [
    hero.alias,
    hero.publicName,
    hero.codename,
    hero.name,
    getHeroTitle(hero),
    corporationName,
  ].some((value) => value?.toString().toLowerCase().includes(search))
}

function OraculoHub({ onNavigate }) {
  const [heroFilter, setHeroFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [missionCalculations, setMissionCalculations] = useState([])
  const [missionCalculationsLoading, setMissionCalculationsLoading] = useState(true)
  const [missionCalculationsError, setMissionCalculationsError] = useState(null)
  const [characterSheets, setCharacterSheets] = useState([])
  const [characterSheetsLoading, setCharacterSheetsLoading] = useState(true)
  const [characterSheetsError, setCharacterSheetsError] = useState(null)
  const { error: heroesError, firebaseHeroes, heroes, loading: heroesLoading } = useHeroes()
  const { error: newsError, feedNews, firebaseNews, loading: newsLoading } = useNews()
  const {
    corporations,
    error: corporationsError,
    firebaseCorporations,
    getCorporationById,
    loading: corporationsLoading,
  } = useCorporations()

  useEffect(() => {
    return subscribeToMissionCalculations(
      (items) => {
        setMissionCalculations(items)
        setMissionCalculationsLoading(false)
      },
      (error) => {
        setMissionCalculationsError(error)
        setMissionCalculationsLoading(false)
      },
    )
  }, [])

  useEffect(() => {
    return subscribeToCharacterSheets(
      (items) => {
        setCharacterSheets(items)
        setCharacterSheetsLoading(false)
      },
      (error) => {
        setCharacterSheetsError(error)
        setCharacterSheetsLoading(false)
      },
    )
  }, [])

  const allHeroes = firebaseHeroes.length > 0 ? firebaseHeroes : heroes
  const allCorporations = firebaseCorporations.length > 0 ? firebaseCorporations : corporations
  const allNews = firebaseNews.length > 0 ? firebaseNews : feedNews
  const heroIds = new Set(allHeroes.map((hero) => String(hero.id)))
  const corporationIds = new Set(allCorporations.map((corporation) => String(corporation.id)))
  const sheetsByHeroId = new Map(characterSheets.map((sheet) => [String(sheet.heroId ?? sheet.id), sheet]))
  const activeHeroes = allHeroes.filter((hero) => hero.active !== false)
  const search = searchQuery.trim().toLowerCase()
  const filteredHeroes = allHeroes
    .filter((hero) => {
      const hasSheet = sheetsByHeroId.has(String(hero.id))
      const corporationName = getCorporationName(hero, getCorporationById)

      if (heroFilter === 'affiliated' && !heroHasAffiliation(hero)) return false
      if (heroFilter === 'independent' && heroHasAffiliation(hero) && hero.independent !== true) return false
      if (heroFilter === 'missingSheet' && hasSheet) return false

      return matchesHeroSearch(hero, search, corporationName)
    })
    .sort(sortHeroesByRankingPoints)
    .slice(0, 12)
  const recentAssessments = [...missionCalculations]
    .sort((first, second) => toTimestamp(second.createdAt) - toTimestamp(first.createdAt))
    .slice(0, 5)
  const pendingAssessments = missionCalculations
    .filter((assessment) => assessment.status === 'approved' && assessment.applied !== true && assessment.heroId)
    .sort((first, second) => toTimestamp(second.createdAt) - toTimestamp(first.createdAt))
    .slice(0, 5)
  const heroesWithoutSheets = activeHeroes
    .filter((hero) => !sheetsByHeroId.has(String(hero.id)))
    .sort(sortHeroesByRankingPoints)
    .slice(0, 5)
  const highlightedHeroes = [...activeHeroes].sort(sortHeroesByRankingPoints).slice(0, 5)
  const activeHeroCount = activeHeroes.length
  const inactiveHeroCount = allHeroes.filter((hero) => hero.active === false).length
  const missingSheetCount = activeHeroes.filter((hero) => !sheetsByHeroId.has(String(hero.id))).length
  const orphanSheetsCount = characterSheets.filter((sheet) => !heroIds.has(String(sheet.heroId ?? sheet.id))).length
  const orphanAssessmentsCount = missionCalculations.filter(
    (assessment) => assessment.heroId && !heroIds.has(String(assessment.heroId)),
  ).length
  const newsWithBrokenHeroLinksCount = allNews.filter(
    (newsItem) =>
      Array.isArray(newsItem.heroIds) &&
      newsItem.heroIds.some((heroId) => !heroIds.has(String(heroId))),
  ).length
  const newsWithBrokenCorporationLinksCount = allNews.filter(
    (newsItem) =>
      Array.isArray(newsItem.corporationIds) &&
      newsItem.corporationIds.some((corporationId) => !corporationIds.has(String(corporationId))),
  ).length
  const heroesWithInvalidCorporationCount = allHeroes.filter(
    (hero) =>
      hero.corporationId &&
      hero.corporationId !== 'independent' &&
      !corporationIds.has(String(hero.corporationId)),
  ).length
  const brokenNewsLinksCount = newsWithBrokenHeroLinksCount + newsWithBrokenCorporationLinksCount
  const integrityIssuesCount =
    orphanSheetsCount + orphanAssessmentsCount + brokenNewsLinksCount + heroesWithInvalidCorporationCount
  const loading = heroesLoading || corporationsLoading || newsLoading || missionCalculationsLoading || characterSheetsLoading
  const error = heroesError || corporationsError || newsError || missionCalculationsError
  const quickLinks = [
    {
      description: 'Crear héroes NPC con perfil público y hoja privada.',
      label: 'Creador de NPC',
      routeId: 'oraculo-npc-builder',
    },
    {
      description: 'Crear múltiples NPCs desde un archivo CSV.',
      label: 'Importador de NPCs',
      routeId: 'oraculo-npc-import',
    },
    {
      description: 'Calcular impacto de misión y proyección de ranking.',
      label: 'Mission Calculator',
      routeId: 'mission-calculator',
    },
    {
      description: 'Gestionar contenido público, héroes, corporaciones y noticias.',
      label: 'GM Manager',
      routeId: 'gm-manager',
    },
    {
      description: 'Ver posicionamiento público HeroIndex.',
      label: 'Ranking público',
      routeId: 'ranking',
    },
    {
      description: 'Explorar catálogo público de héroes.',
      label: 'Perfiles públicos',
      routeId: 'profiles',
    },
  ]

  if (loading) {
    return (
      <section className="page-card oraculo-hub-page">
        <p className="oraculo-hub-state">Cargando ORÁCULO Hub...</p>
      </section>
    )
  }

  if (error && allHeroes.length === 0) {    
    return (
      <section className="page-card oraculo-hub-page">
        <p className="oraculo-hub-state oraculo-hub-state--error">
          No fue posible cargar datos internos de ORÁCULO.
        </p>
      </section>
    )
  }

  return (
    <section className="page-card oraculo-hub-page">
      <header className="oraculo-hub-hero">
        <p className="page-card__kicker">Capa interna HeroIndex</p>
        <h2>ORÁCULO Hub</h2>
        <p className="oraculo-hub-hero__subtitle">
          Centro interno de observación, evaluación y control de HeroIndex.
        </p>
        <p>
          Acceso restringido a dossiers, evaluaciones de misión, herramientas de contenido y señales
          internas del ecosistema heroico.
        </p>
      </header>

      <section className="oraculo-hub-quick-links" aria-label="Accesos rápidos ORÁCULO">
        {quickLinks.map((link) => (
          <button key={link.routeId} onClick={() => onNavigate?.(link.routeId)} type="button">
            <span>{link.label}</span>
            <small>{link.description}</small>
          </button>
        ))}
      </section>

<section className="oraculo-hub-summary" aria-label="Resumen operativo ORÁCULO">
        <article>
          <span>Héroes activos</span>
          <strong>{activeHeroCount}</strong>
        </article>
        <article>
          <span>Héroes inactivos</span>
          <strong>{inactiveHeroCount}</strong>
        </article>
        <article>
          <span>Sin hoja RPG</span>
          <strong>{missingSheetCount}</strong>
        </article>
        <article>
          <span>Evaluaciones pendientes</span>
          <strong>{pendingAssessments.length}</strong>
        </article>
      </section>

      {allHeroes.length === 0 ? <p className="oraculo-hub-state">No hay héroes registrados.</p> : null}

      <div className="oraculo-hub-layout">
        <main className="oraculo-hub-main">
          <section className="oraculo-hub-panel">
            <div className="oraculo-hub-panel__header">
              <div>
                <h3>Acceso rápido a dossiers</h3>
                <p>Busca héroes y abre su dossier interno ORÁCULO. Los filtros respetan afiliación, independencia y hojas privadas.</p>
              </div>
            </div>
            <div className="oraculo-hub-controls">
              <input
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar héroe, título, alias o afiliación..."
                type="search"
                value={searchQuery}
              />
              <div className="oraculo-hub-filter-tabs" role="tablist" aria-label="Filtro de héroes ORÁCULO">
                {heroFilters.map((filter) => (
                  <button
                    aria-selected={heroFilter === filter.id}
                    className={heroFilter === filter.id ? 'is-active' : ''}
                    key={filter.id}
                    onClick={() => setHeroFilter(filter.id)}
                    role="tab"
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            {characterSheetsError ? (
              <p className="oraculo-hub-state oraculo-hub-state--warning">
                Estado de hojas privadas no disponible.
              </p>
            ) : null}
            {filteredHeroes.length > 0 ? (
              <div className="oraculo-hub-hero-list">
                {filteredHeroes.map((hero) => {
                  const corporationName = getCorporationName(hero, getCorporationById)
                  const hasSheet = sheetsByHeroId.has(String(hero.id))

                  return (
                    <article key={hero.id}>
                      <div>
                        <strong>{getHeroDisplayName(hero)}</strong>
                        <span>{getHeroTitle(hero)} · {corporationName}</span>
                      </div>
                      <div>
                        <small>Puntos HeroIndex</small>
                        <b>{getNumericValue(hero.rankingPoints)}</b>
                      </div>
                      <span className={hero.active === false ? 'is-inactive' : ''}>
                        {hero.active === false ? 'Inactivo' : 'Activo'}
                      </span>
                      <span className={hasSheet ? 'has-sheet' : 'missing-sheet'}>
                        {hasSheet ? 'Hoja RPG registrada' : 'Sin hoja RPG'}
                      </span>
                      <button onClick={() => onNavigate?.('oraculo-hero-dossier', { heroId: hero.id })} type="button">
                        Ver dossier
                      </button>
                    </article>
                  )
                })}
              </div>
            ) : (
              <p className="oraculo-hub-state">No hay héroes que coincidan con la búsqueda.</p>
            )}
          </section>

          <section className="oraculo-hub-panel">
            <h3>Evaluaciones recientes</h3>
            {recentAssessments.length > 0 ? (
              <div className="oraculo-hub-assessment-list">
                {recentAssessments.map((assessment) => (
                  <article key={assessment.id}>
                    <span>{statusLabels[assessment.status] ?? assessment.status ?? 'Borrador'}</span>
                    <h4>{assessment.missionName || 'Misión sin nombre'}</h4>
                    <p>{assessment.heroAlias || assessment.heroName || 'Héroe no asignado'}</p>
                    <dl>
                      <div>
                        <dt>Puntos sugeridos</dt>
                        <dd>{getNumericValue(assessment.suggestedRankingPoints)}</dd>
                      </div>
                      <div>
                        <dt>Clasificación</dt>
                        <dd>{assessment.classification || 'Pendiente'}</dd>
                      </div>
                      <div>
                        <dt>Aplicación</dt>
                        <dd>{assessment.applied ? 'Aplicada' : 'Pendiente'}</dd>
                      </div>
                      <div>
                        <dt>Creada</dt>
                        <dd>{formatDate(assessment.createdAt)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <p className="oraculo-hub-state">Sin evaluaciones registradas.</p>
            )}
          </section>
        </main>

        <aside className="oraculo-hub-side">
          <section className="oraculo-hub-panel oraculo-hub-integrity">
            <h3>Integridad de datos</h3>
            <p>Diagnóstico de solo lectura. ORÁCULO no modifica Firebase desde este panel.</p>
            <div className="oraculo-hub-integrity__grid">
              <article>
                <span>Hojas huérfanas</span>
                <strong>{orphanSheetsCount}</strong>
              </article>
              <article>
                <span>Evaluaciones huérfanas</span>
                <strong>{orphanAssessmentsCount}</strong>
              </article>
              <article>
                <span>Noticias con vínculos rotos</span>
                <strong>{brokenNewsLinksCount}</strong>
              </article>
              <article>
                <span>Afiliaciones inválidas</span>
                <strong>{heroesWithInvalidCorporationCount}</strong>
              </article>
            </div>
            {integrityIssuesCount === 0 ? (
              <p className="oraculo-hub-state">Sin inconsistencias detectadas.</p>
            ) : (
              <p className="oraculo-hub-state oraculo-hub-state--warning">
                Se detectaron {integrityIssuesCount} señales para revisión manual.
              </p>
            )}
          </section>

          <section className="oraculo-hub-panel oraculo-hub-panel--priority">
            <h3>Pendientes de aplicación</h3>
            {pendingAssessments.length > 0 ? (
              <div className="oraculo-hub-compact-list">
                {pendingAssessments.map((assessment) => (
                  <article key={assessment.id}>
                    <div>
                      <strong>{assessment.missionName || 'Misión sin nombre'}</strong>
                      <span>{assessment.heroAlias || assessment.heroName || 'Héroe no asignado'}</span>
                      <small>{getNumericValue(assessment.suggestedRankingPoints)} puntos sugeridos</small>
                    </div>
                    <button onClick={() => onNavigate?.('mission-calculator')} type="button">
                      Abrir Mission Calculator
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="oraculo-hub-state">No hay evaluaciones aprobadas pendientes.</p>
            )}
          </section>

          <section className="oraculo-hub-panel">
            <h3>Héroes sin hoja privada ({missingSheetCount})</h3>
            {characterSheetsError ? (
              <p className="oraculo-hub-state oraculo-hub-state--warning">
                Estado de hojas privadas no disponible.
              </p>
            ) : heroesWithoutSheets.length > 0 ? (
              <div className="oraculo-hub-compact-list">
                {heroesWithoutSheets.map((hero) => (
                  <article key={hero.id}>
                    <div>
                      <strong>{getHeroDisplayName(hero)}</strong>
                      <span>{getHeroTitle(hero)}</span>
                    </div>
                    <button onClick={() => onNavigate?.('oraculo-hero-dossier', { heroId: hero.id })} type="button">
                      Abrir dossier
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="oraculo-hub-state">Todos los héroes activos tienen hoja privada registrada.</p>
            )}
          </section>

          <section className="oraculo-hub-panel">
            <h3>Señales destacadas</h3>
            {highlightedHeroes.length > 0 ? (
              <div className="oraculo-hub-highlight-list">
                {highlightedHeroes.map((hero, index) => (
                  <article key={hero.id}>
                    <span>#{index + 1}</span>
                    <div>
                      <strong>{getHeroDisplayName(hero)}</strong>
                      <small>{getHeroTier(hero.rankingPoints)}</small>
                    </div>
                    <b>{getNumericValue(hero.rankingPoints)}</b>
                    <button onClick={() => onNavigate?.('oraculo-hero-dossier', { heroId: hero.id })} type="button">
                      Ver dossier
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="oraculo-hub-state">No hay héroes destacados disponibles.</p>
            )}
          </section>
        </aside>
      </div>
    </section>
  )
}

export default OraculoHub
