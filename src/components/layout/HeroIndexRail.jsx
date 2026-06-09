import SidebarVisualSlot from '../visual/SidebarVisualSlot.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useCorporations } from '../../hooks/useCorporations.js'
import { useHeroes } from '../../hooks/useHeroes.js'
import { useNews } from '../../hooks/useNews.js'
import { canSeeOraculoTools } from '../../utils/roles.js'

const isOraculoMode = import.meta.env.VITE_ORACULO_MODE === 'true'

const oracleRouteIds = new Set(['gm-manager', 'gm-panel', 'mission-calculator'])

const fallbackCards = [
  {
    kicker: 'SEÑAL PÚBLICA',
    title: 'Red HeroIndex operativa',
    body: 'Ranking, perfiles y señales verificadas disponibles para consulta ciudadana.',
  },
  {
    kicker: 'ACTIVIDAD DESTACADA',
    title: 'Presencia heroica en aumento',
    body: 'Actualizaciones de reputación y confianza pública en ciclo activo.',
    hot: true,
  },
  {
    kicker: 'CANAL VERIFICADO',
    title: 'Ecosistema bajo monitoreo',
    body: 'HeroIndex consolida datos públicos de actividad, respuesta y reconocimiento.',
  },
]

function getRailContext(activeRouteId) {
  if (activeRouteId === 'home') {
    return { id: 'home', kicker: 'HEROINDEX LIVE', subtitle: 'Portada pública activa', variant: 'home' }
  }

  if (activeRouteId === 'ranking') {
    return { id: 'ranking', kicker: 'RADAR DE RANKING', subtitle: 'Reconocimiento público', variant: 'ranking' }
  }

  if (activeRouteId === 'news') {
    return { id: 'news', kicker: 'MESA EDITORIAL', subtitle: 'Cobertura verificada', variant: 'news' }
  }

  if (activeRouteId === 'profiles' || activeRouteId === 'hero-profile') {
    return { id: 'profiles', kicker: 'DIRECTORIO HEROICO', subtitle: 'Identidades públicas', variant: 'profiles' }
  }

  if (activeRouteId === 'corporations') {
    return { id: 'corporations', kicker: 'OPERADORES', subtitle: 'Ecosistema corporativo', variant: 'corporations' }
  }

  if (activeRouteId === 'my-profile' || activeRouteId === 'karma' || activeRouteId === 'account') {
    return { id: 'player', kicker: 'TU PRESENCIA', subtitle: 'Identidad HeroIndex', variant: 'player' }
  }

  if (activeRouteId?.startsWith('oraculo-') || oracleRouteIds.has(activeRouteId)) {
    return { id: 'oracle', kicker: 'ACCESO ORÁCULO', subtitle: 'Capa interna', variant: 'oracle' }
  }

  return { id: 'fallback', kicker: 'CANAL HEROINDEX', subtitle: 'Transmisión continua', variant: 'fallback' }
}

function getHeroName(hero) {
  return hero?.alias ?? hero?.publicName ?? hero?.codename ?? hero?.name ?? null
}

function getCorporationName(corporation) {
  return corporation?.name ?? null
}

function getNewsTitle(newsItem) {
  return newsItem?.title?.trim() || (newsItem?.storyMode === 'visual' ? 'Pieza visual activa' : null)
}

function getScore(value) {
  const score = Number(value ?? 0)

  return Number.isNaN(score) ? 0 : score
}

function getMovementValue(hero) {
  return hero?.rankChange ?? hero?.movement ?? hero?.move ?? hero?.rankingMovement ?? null
}

function hasPositiveMovement(hero) {
  const movement = getMovementValue(hero)

  if (typeof movement === 'number') return movement > 0
  if (typeof movement !== 'string') return false

  const normalizedMovement = movement.trim().toLowerCase()

  return normalizedMovement.startsWith('+') || normalizedMovement.includes('sube') || normalizedMovement.includes('ascenso')
}

function getActiveNews(newsItems) {
  return newsItems.filter((newsItem) => newsItem.active !== false && newsItem.homePlacement !== 'hidden')
}

function getHeroLeader(rankingHeroes) {
  return rankingHeroes.find((hero) => hero.active !== false) ?? null
}

function getFeaturedHero(rankingHeroes) {
  return [...rankingHeroes]
    .filter((hero) => hero.active !== false)
    .sort((firstHero, secondHero) => {
      const pointDifference = getScore(secondHero.rankingPoints) - getScore(firstHero.rankingPoints)

      if (pointDifference !== 0) return pointDifference

      return getScore(secondHero.approval) - getScore(firstHero.approval)
    })[0] ?? null
}

function getFeaturedCorporation(corporations) {
  return [...corporations]
    .filter((corporation) => corporation.active !== false)
    .sort((firstCorporation, secondCorporation) => {
      const approvalDifference = getScore(secondCorporation.approval) - getScore(firstCorporation.approval)

      if (approvalDifference !== 0) return approvalDifference

      return getScore(secondCorporation.trustScore) - getScore(firstCorporation.trustScore)
    })[0] ?? null
}

function getContextCards({ contextId, corporations, feedNews, loading, rankingHeroes, userProfile }) {
  const activeNews = getActiveNews(feedNews)
  const latestNews = activeNews[0] ?? null
  const mainStory = activeNews.find((newsItem) => newsItem.homePlacement === 'hero') ?? null
  const topHero = getHeroLeader(rankingHeroes)
  const risingHero = rankingHeroes.find(hasPositiveMovement)
  const featuredHero = getFeaturedHero(rankingHeroes)
  const featuredCorporation = getFeaturedCorporation(corporations)
  const heroCount = rankingHeroes.filter((hero) => hero.active !== false).length
  const userDisplayName = userProfile?.heroName || userProfile?.displayName || userProfile?.username

  if (contextId === 'home') {
    return [
      {
        kicker: 'PORTADA EDITORIAL',
        title: getNewsTitle(mainStory) ?? (loading.news ? 'Sincronizando Red HeroIndex…' : 'Portada en consolidación'),
        body: 'Cobertura principal sincronizada con Mesa Editorial.',
        hot: Boolean(mainStory),
      },
      {
        kicker: 'SEÑALES PÚBLICAS',
        title: latestNews ? 'Actividad registrada' : 'Sin señales públicas activas',
        body: 'Actividad ciudadana y heroica bajo monitoreo.',
      },
      {
        kicker: 'RED ACTIVA',
        title: 'Canal público en línea',
        body: 'Canal HeroIndex transmitiendo en ciclo público.',
      },
    ]
  }

  if (contextId === 'ranking') {
    return [
      {
        kicker: 'TOP ACTUAL',
        title: getHeroName(topHero) ?? (loading.heroes ? 'Sincronizando Red HeroIndex…' : 'Registros en consolidación'),
        body: topHero ? 'Figura de mayor reconocimiento público en el ciclo activo.' : 'El índice público se actualizará cuando existan identidades verificadas.',
        hot: Boolean(topHero),
      },
      {
        kicker: 'EN ASCENSO',
        title: getHeroName(risingHero) ?? 'Tendencia en revisión',
        body: risingHero ? 'Movimiento detectado en reconocimiento ciudadano.' : 'Sin ascensos públicos confirmados durante este ciclo.',
      },
      {
        kicker: 'MATRIZ PÚBLICA',
        title: 'Lectura D–SSS',
        body: 'Evaluaciones D–SSS disponibles en perfiles de ranking.',
      },
    ]
  }

  if (contextId === 'news') {
    return [
      {
        kicker: 'ÚLTIMA COBERTURA',
        title: getNewsTitle(latestNews) ?? (loading.news ? 'Sincronizando Red HeroIndex…' : 'Registros en consolidación'),
        body: latestNews ? 'Cobertura reciente disponible para consulta pública.' : 'La Mesa Editorial no registra coberturas activas.',
        hot: Boolean(latestNews),
      },
      {
        kicker: 'PORTADA PRINCIPAL',
        title: getNewsTitle(mainStory) ?? 'Portada en consolidación',
        body: mainStory ? 'Señal editorial destacada en la portada pública.' : 'Marca una cobertura principal para ocupar este espacio.',
      },
      {
        kicker: 'CANAL VERIFICADO',
        title: 'Mesa Editorial activa',
        body: 'La Mesa Editorial mantiene cobertura pública activa.',
      },
    ]
  }

  if (contextId === 'profiles') {
    return [
      {
        kicker: 'FIGURAS VERIFICADAS',
        title: loading.heroes ? 'Sincronizando Red HeroIndex…' : heroCount > 0 ? `${heroCount} identidades activas` : 'Registros en consolidación',
        body: heroCount > 0 ? 'Perfiles públicos disponibles para consulta ciudadana.' : 'No hay identidades heroicas verificadas para este ciclo.',
        hot: heroCount > 0,
      },
      {
        kicker: 'PERFIL DESTACADO',
        title: getHeroName(featuredHero) ?? 'Destacado en revisión',
        body: featuredHero ? 'Perfil con mayor presencia en reconocimiento público.' : 'El directorio destacará perfiles cuando existan señales suficientes.',
      },
      {
        kicker: 'PRESENCIA PÚBLICA',
        title: 'Identidad visible',
        body: 'Perfiles, poderes visibles y reputación ciudadana.',
      },
    ]
  }

  if (contextId === 'corporations') {
    return [
      {
        kicker: 'OPERADOR DESTACADO',
        title: getCorporationName(featuredCorporation) ?? (loading.corporations ? 'Sincronizando Red HeroIndex…' : 'Registros en consolidación'),
        body: featuredCorporation ? 'Operador con mayor aprobación pública en el ciclo activo.' : 'La red corporativa se actualizará con nuevos operadores verificados.',
        hot: Boolean(featuredCorporation),
      },
      {
        kicker: 'AFILIACIONES ACTIVAS',
        title: 'Red vinculada',
        body: 'Red corporativa vinculada a perfiles heroicos.',
      },
      {
        kicker: 'INFRAESTRUCTURA HEROICA',
        title: 'Presencia institucional',
        body: 'Agencias y consorcios sostienen presencia pública.',
      },
    ]
  }

  if (contextId === 'player') {
    return [
      {
        kicker: 'PERFIL HEROICO',
        title: userDisplayName || 'Identidad en configuración',
        body: 'Mantén tu identidad pública actualizada.',
        hot: Boolean(userDisplayName),
      },
      {
        kicker: 'ACTIVIDAD PÚBLICA',
        title: 'Presencia social',
        body: 'Publicaciones, galería y presencia social.',
      },
      {
        kicker: 'KARMA',
        title: 'Ciclo de campaña',
        body: 'Progreso del personaje dentro del ciclo de campaña.',
      },
    ]
  }

  if (contextId === 'oracle') {
    return [
      {
        kicker: 'HERRAMIENTAS INTERNAS',
        title: 'Operación narrativa',
        body: 'Operación narrativa y control de campaña.',
        hot: true,
      },
      {
        kicker: 'MESA EDITORIAL',
        title: 'Control de cobertura',
        body: 'Portada, coberturas y señales bajo control ORÁCULO.',
      },
      {
        kicker: 'DOSSIER',
        title: 'Capa reservada',
        body: 'Datos internos no visibles para perfiles públicos.',
      },
    ]
  }

  return fallbackCards
}

function HeroIndexRail({ activeRouteId }) {
  const { userProfile } = useAuth()
  const { feedNews, loading: newsLoading } = useNews()
  const { loading: heroesLoading, rankingHeroes } = useHeroes()
  const { corporations, loading: corporationsLoading } = useCorporations()
  const canViewOracle = isOraculoMode && canSeeOraculoTools(userProfile)
  const requestedContext = getRailContext(activeRouteId)
  const context = requestedContext.id === 'oracle' && !canViewOracle
    ? getRailContext(null)
    : requestedContext
  const cards = getContextCards({
    contextId: context.id,
    corporations,
    feedNews,
    loading: {
      corporations: corporationsLoading,
      heroes: heroesLoading,
      news: newsLoading,
    },
    rankingHeroes,
    userProfile,
  })

  return (
    <aside className={`heroindex-rail heroindex-rail--${context.variant}`} aria-label="Canal lateral HeroIndex">
      <SidebarVisualSlot canSeeOraculoTools={canViewOracle} />

      <div className="heroindex-rail__heading">
        <span>{context.kicker}</span>
        <small>{context.subtitle}</small>
      </div>

      <div className="heroindex-rail__signals">
        {cards.map((card) => (
          <section className={`heroindex-rail__card ${card.hot ? 'heroindex-rail__card--hot' : ''}`.trim()} key={card.kicker}>
            <p className="heroindex-rail__kicker">{card.kicker}</p>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
            {card.meta ? <small className="heroindex-rail__meta">{card.meta}</small> : null}
          </section>
        ))}
      </div>
    </aside>
  )
}

export default HeroIndexRail