import { useEffect, useState } from 'react'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { useNews } from '../hooks/useNews.js'
import { subscribeToMissionCalculations } from '../services/missionCalculationsService.js'

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

  if (Array.isArray(powers)) return powers.filter(Boolean)

  if (typeof powers === 'string' && powers.trim()) {
    return powers
      .split(',')
      .map((power) => power.trim())
      .filter(Boolean)
  }

  return []
}

function getSummary(value = '') {
  return value.length > 160 ? `${value.slice(0, 157)}...` : value
}

function formatInternalValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ')
  if (value && typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (value === 0) return '0'

  return value ? String(value) : ''
}

function getInternalFields(hero = {}) {
  return [
    ['Nombre real', hero.realName],
    ['Índice de confianza interno', hero.trustScore],
    ['Índice de riesgo', hero.risk],
    ['Flags ORÁCULO', hero.flags],
    ['Notas GM', hero.gmNotes],
    ['Clasificación legacy', hero.powerClass],
    ['Independiente', hero.independent],
    ['Alcance de ranking', hero.rankingScope],
    ['País', hero.country],
    ['Cobertura', hero.coverageCountry],
  ]
    .map(([label, value]) => [label, formatInternalValue(value)])
    .filter(([, value]) => value)
}

function OraculoHeroDossier({ onNavigate, routeParams = {} }) {
  const heroId = routeParams.heroId
  const { error: heroesError, heroes, loading: heroesLoading } = useHeroes()
  const { feedNews, loading: newsLoading, error: newsError } = useNews()
  const {
    error: corporationsError,
    getCorporationById,
    loading: corporationsLoading,
  } = useCorporations()
  const [missionCalculations, setMissionCalculations] = useState([])
  const [calculationsError, setCalculationsError] = useState(null)
  const [calculationsLoading, setCalculationsLoading] = useState(true)

  useEffect(() => {
    return subscribeToMissionCalculations(
      (items) => {
        setMissionCalculations(items)
        setCalculationsLoading(false)
      },
      (error) => {
        setCalculationsError(error)
        setCalculationsLoading(false)
      },
    )
  }, [])

  const hero = heroes.find((heroItem) => String(heroItem.id) === String(heroId))
  const displayName = hero ? getHeroDisplayName(hero) : ''
  const relatedCalculations = hero
    ? missionCalculations
        .filter((calculation) => String(calculation.heroId) === String(hero.id))
        .sort((first, second) => toTimestamp(second.createdAt) - toTimestamp(first.createdAt))
    : []
  const relatedNews = hero
    ? feedNews
        .filter(
          (newsItem) =>
            Array.isArray(newsItem.heroIds) && newsItem.heroIds.map(String).includes(String(hero.id)),
        )
        .sort((first, second) => toTimestamp(second.createdAt) - toTimestamp(first.createdAt))
    : []

  const loading = heroesLoading || corporationsLoading || newsLoading || calculationsLoading
  const error = heroesError || corporationsError || newsError || calculationsError

  if (loading) {
    return (
      <section className="page-card oraculo-dossier-page">
        <p className="oraculo-dossier-state">Cargando dossier ORÁCULO...</p>
      </section>
    )
  }

  if (error && !hero) {
    return (
      <section className="page-card oraculo-dossier-page">
        <p className="oraculo-dossier-state oraculo-dossier-state--error">No fue posible cargar el dossier.</p>
      </section>
    )
  }

  if (!hero) {
    return (
      <section className="page-card oraculo-dossier-page">
        <p className="oraculo-dossier-state">No se encontró el héroe solicitado.</p>
      </section>
    )
  }

  const corporationName = getCorporationName(hero, getCorporationById)
  const publicPowers = getPublicPowers(hero)
  const publicBio = hero.publicBio || 'Biografía pública pendiente de actualización.'
  const internalFields = getInternalFields(hero)

  return (
    <section className="page-card oraculo-dossier-page">
      <nav className="oraculo-dossier-actions" aria-label="Navegación del dossier">
        <button onClick={() => onNavigate?.('hero-profile', { heroId: hero.id })} type="button">
          Ver perfil público
        </button>
        <button onClick={() => onNavigate?.('gm-manager')} type="button">
          Volver a GM Manager
        </button>
        <button onClick={() => onNavigate?.('ranking')} type="button">
          Volver al Ranking
        </button>
        <button onClick={() => onNavigate?.('mission-calculator')} type="button">
          Volver a Mission Calculator
        </button>
      </nav>

      <header className="oraculo-dossier-cover">
        {hero.bannerUrl ? (
          <img
            alt={`Portada interna de ${displayName}`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.hidden = true
            }}
            src={hero.bannerUrl}
          />
        ) : null}
        <div className="oraculo-dossier-cover__content">
          <span className="oraculo-dossier-avatar">
            <span>{getInitials(displayName)}</span>
            {hero.avatarUrl ? (
              <img
                alt={`Avatar interno de ${displayName}`}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.hidden = true
                }}
                src={hero.avatarUrl}
              />
            ) : null}
          </span>
          <div>
            <span className="oraculo-dossier-access">Acceso ORÁCULO</span>
            <p className="page-card__kicker">Dossier ORÁCULO</p>
            <h2>{displayName}</h2>
            <p className="oraculo-dossier-subtitle">
              Registro interno de evaluación, exposición pública y control operativo.
            </p>
            <div className="oraculo-dossier-tags">
              <span>{getHeroTitle(hero)}</span>
              <span>{corporationName}</span>
              <span>{hero.active === false ? 'Inactivo' : 'Activo'}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="oraculo-dossier-grid">
        <main className="oraculo-dossier-main">
          <section className="oraculo-dossier-panel">
            <h3>Resumen público observado</h3>
            <div className="oraculo-dossier-summary-grid">
              <div>
                <span>Puntos HeroIndex</span>
                <strong>{getNumericValue(hero.rankingPoints)}</strong>
              </div>
              <div>
                <span>Aprobación ciudadana</span>
                <strong>{getNumericValue(hero.approval)}</strong>
              </div>
              <div>
                <span>Tier público</span>
                <strong>{getHeroTier(hero.rankingPoints)}</strong>
              </div>
              <div>
                <span>Afiliación</span>
                <strong>{corporationName}</strong>
              </div>
            </div>
            <dl className="oraculo-dossier-public-list">
              <div>
                <dt>Título heroico</dt>
                <dd>{getHeroTitle(hero)}</dd>
              </div>
              <div>
                <dt>Poderes visibles</dt>
                <dd>{publicPowers.length > 0 ? publicPowers.join(', ') : 'Sin poderes públicos registrados.'}</dd>
              </div>
              <div>
                <dt>Biografía pública</dt>
                <dd>{publicBio}</dd>
              </div>
            </dl>
          </section>

          <section className="oraculo-dossier-panel">
            <h3>Evaluaciones ORÁCULO</h3>
            {relatedCalculations.length > 0 ? (
              <div className="oraculo-dossier-assessments">
                {relatedCalculations.map((calculation) => (
                  <article key={calculation.id}>
                    <div>
                      <span>{statusLabels[calculation.status] ?? calculation.status ?? 'Borrador'}</span>
                      <h4>{calculation.missionName || 'Misión sin nombre'}</h4>
                      <p>{calculation.classification || 'Clasificación pendiente'}</p>
                    </div>
                    <dl>
                      <div>
                        <dt>Puntos sugeridos</dt>
                        <dd>{getNumericValue(calculation.suggestedRankingPoints)}</dd>
                      </div>
                      <div>
                        <dt>Aplicación</dt>
                        <dd>{calculation.applied ? 'Aplicada al ranking' : 'Pendiente de aplicación'}</dd>
                      </div>
                      <div>
                        <dt>Creada</dt>
                        <dd>{formatDate(calculation.createdAt)}</dd>
                      </div>
                      {calculation.appliedAt ? (
                        <div>
                          <dt>Aplicada</dt>
                          <dd>{formatDate(calculation.appliedAt)}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <p>Sin evaluaciones ORÁCULO registradas para este héroe.</p>
            )}
          </section>

          <section className="oraculo-dossier-panel">
            <h3>Noticias relacionadas</h3>
            {relatedNews.length > 0 ? (
              <div className="oraculo-dossier-news">
                {relatedNews.map((newsItem) => (
                  <article
                    className={newsItem.active === false ? 'is-inactive' : ''}
                    key={newsItem.id}
                  >
                    <span>{newsItem.active === false ? 'Inactiva' : 'Activa'}</span>
                    <small>{newsItem.category || newsItem.layer || 'HeroIndex News'} · {formatDate(newsItem.createdAt)}</small>
                    <h4>{newsItem.title}</h4>
                    {newsItem.summary ? <p>{getSummary(newsItem.summary)}</p> : null}
                  </article>
                ))}
              </div>
            ) : (
              <p>Sin noticias relacionadas.</p>
            )}
          </section>
        </main>

        <aside className="oraculo-dossier-side">
          <section className="oraculo-dossier-panel oraculo-dossier-panel--internal">
            <h3>Datos internos ORÁCULO</h3>
            {internalFields.length > 0 ? (
              <dl>
                {internalFields.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p>Sin datos internos registrados.</p>
            )}
          </section>

          <section className="oraculo-dossier-panel oraculo-dossier-panel--notice">
            <h3>Separación de capas</h3>
            <p>
              El perfil público solo muestra identidad heroica, biografía, poderes visibles y métricas
              públicas. Este dossier ORÁCULO puede contener datos internos no visibles para civiles ni
              jugadores.
            </p>
          </section>

          <section className="oraculo-dossier-panel oraculo-dossier-panel--locked">
            <h3>Hoja privada RPG</h3>
            <p>Próximamente: atributos, poderes completos, talentos, drawbacks, Karma y notas privadas.</p>
          </section>
        </aside>
      </div>
    </section>
  )
}

export default OraculoHeroDossier
