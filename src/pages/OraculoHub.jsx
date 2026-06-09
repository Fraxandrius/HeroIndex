import { useAuth } from '../hooks/useAuth.js'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { useNews } from '../hooks/useNews.js'

const moduleSections = [
  {
    id: 'editorial',
    kicker: 'EDITORIAL Y SEÑALES',
    title: 'Narrativa pública',
    description: 'Controla coberturas, portada y señales visibles del ecosistema.',
    tools: [
      {
        kicker: 'MESA EDITORIAL',
        title: 'Mesa Editorial',
        description: 'Controla portada, coberturas y piezas visuales públicas.',
        routeId: 'oraculo-newsroom',
        state: 'ACTIVO',
      },
      {
        kicker: 'SEÑALES',
        title: 'Señales públicas',
        description: 'Gestiona comunicados institucionales visibles en la capa pública.',
        routeId: 'oraculo-broadcasts',
        state: 'ORÁCULO',
      },
    ],
  },
  {
    id: 'dossiers',
    kicker: 'HÉROES Y DOSSIERS',
    title: 'Registro reputacional',
    description: 'Mantiene identidades, operadores, expedientes y figuras no jugadoras.',
    tools: [
      {
        kicker: 'CONTROL GENERAL',
        title: 'GM Manager',
        description: 'Gestiona contenido público, héroes, corporaciones y noticias.',
        routeId: 'gm-manager',
        state: 'ORÁCULO',
      },
      {
        kicker: 'DOSSIER INTERNO',
        title: 'Dossier ORÁCULO',
        description: 'Abre el expediente interno de la figura heroica prioritaria.',
        routeId: 'oraculo-hero-dossier',
        state: 'INTERNO',
        needsHero: true,
      },
       {
        kicker: 'CRISIS REPUTACIONAL',
        title: 'Crisis Reputacional',
        description: 'Aplica ajustes masivos a ranking, confianza y aprobación pública.',
        routeId: 'oraculo-reputation-crisis',
        state: 'INTERNO',
      },
      {
        kicker: 'NPC',
        title: 'Creador de NPC',
        description: 'Crea figuras no jugadoras con perfil público y hoja privada.',
        routeId: 'oraculo-npc-builder',
        state: 'ACTIVO',
      },
      {
        kicker: 'IMPORTACIÓN',
        title: 'Importador de NPCs',
        description: 'Registra múltiples identidades narrativas desde archivo operativo.',
        routeId: 'oraculo-npc-import',
        state: 'INTERNO',
      },
    ],
  },
  {
    id: 'players',
    kicker: 'JUGADORES Y PROGRESO',
    title: 'Avance de campaña',
    description: 'Coordina recompensas, solicitudes y consecuencias de misión.',
    tools: [
      {
        kicker: 'PROGRESO',
        title: 'Gestor de Karma',
        description: 'Administra progreso, recompensas y avances de jugadores.',
        routeId: 'oraculo-karma-manager',
        state: 'ACTIVO',
      },
      {
        kicker: 'JUGADORES',
        title: 'Solicitudes de jugadores',
        description: 'Revisa vínculos de identidad heroica enviados por jugadores.',
        routeId: 'oraculo-player-requests',
        state: 'INTERNO',
      },
      {
        kicker: 'MISIÓN',
        title: 'Calculadora de misión',
        description: 'Calcula impacto narrativo, recompensas y proyección de ranking.',
        routeId: 'mission-calculator',
        state: 'ACTIVO',
      },
    ],
  },
  {
    id: 'campaign',
    kicker: 'CAMPAÑA Y CONTINUIDAD',
    title: 'Memoria narrativa',
    description: 'Conserva continuidad, consecuencias y control operativo reservado.',
    tools: [
      {
        kicker: 'CONTINUIDAD',
        title: 'Registro de Campaña',
        description: 'Consulta eventos internos, crisis aplicadas y consecuencias del ecosistema.',
        routeId: 'oraculo-campaign-log',
        state: 'INTERNO',
      },
      {
        kicker: 'PANEL GM',
        title: 'GM Panel',
        description: 'Acceso reservado a controles heredados de operación interna.',
        routeId: 'gm-panel',
        state: 'ORÁCULO',
      },
    ],
  },
]

function getActiveItems(items = []) {
  return items.filter((item) => item.active !== false)
}

function getStatusValue({ count, fallback, loading }) {
  if (loading) return 'Sincronizando'
  if (typeof count === 'number') return String(count)

  return fallback
}

function getHeroDisplayName(hero = {}) {
  return hero.alias || hero.publicName || hero.codename || hero.name || 'identidad prioritaria'
}

function buildActivityEvents({ activeCorporations, activeHeroes, activeNews, currentUser, headlineNews }) {
  const events = []

  if (currentUser) {
    events.push({
      kicker: 'ACCESO VERIFICADO',
      title: 'Sesión ORÁCULO verificada.',
      description: 'La capa operativa interna está disponible para control narrativo.',
      time: 'Ahora',
    })
  }

  if (headlineNews) {
    events.push({
      kicker: 'MESA EDITORIAL',
      title: 'Portada principal sincronizada desde Mesa Editorial.',
      description: headlineNews.title || 'Cobertura principal lista para la capa pública.',
      time: 'Ciclo activo',
    })
  }

  if (activeNews.length > 0) {
    events.push({
      kicker: 'COBERTURAS',
      title: 'Coberturas públicas activas en la Red HeroIndex.',
      description: 'La narrativa pública mantiene señales editoriales en circulación.',
      time: 'En monitoreo',
    })
  }

  if (activeHeroes.length > 0) {
    events.push({
      kicker: 'REGISTRO HEROICO',
      title: 'Registros heroicos disponibles para evaluación.',
      description: 'Los perfiles internos pueden cruzarse con reputación pública y continuidad.',
      time: 'En monitoreo',
    })
  }

  if (activeCorporations.length > 0) {
    events.push({
      kicker: 'OPERADORES',
      title: 'Operadores corporativos vinculados al ecosistema.',
      description: 'La red institucional mantiene presencia en el sistema reputacional.',
      time: 'Ciclo activo',
    })
  }

  return events.length > 0
    ? events.slice(0, 5)
    : [{
        kicker: 'REGISTRO OPERATIVO',
        title: 'Registro operativo en espera de señales.',
        description: 'ORÁCULO activará eventos cuando existan datos internos disponibles.',
        time: 'En espera',
      }]
}

function OraculoHub({ onNavigate }) {
  const { currentUser, userProfile } = useAuth()
  const { feedNews, loading: newsLoading } = useNews()
  const { heroes, loading: heroesLoading } = useHeroes()
  const { corporations, loading: corporationsLoading } = useCorporations()

  const activeNews = getActiveItems(feedNews).filter((item) => item.homePlacement !== 'hidden')
  const activeHeroes = getActiveItems(heroes)
  const activeCorporations = getActiveItems(corporations)
  const headlineNews = activeNews.find((item) => item.homePlacement === 'hero')
  const primaryHero = activeHeroes[0]
  const userName = userProfile?.displayName || userProfile?.username
  const isSyncing = newsLoading || heroesLoading || corporationsLoading
  const activityEvents = buildActivityEvents({
    activeCorporations,
    activeHeroes,
    activeNews,
    currentUser,
    headlineNews,
  })

  const ecosystemStatus = [
    {
      kicker: 'HÉROES ACTIVOS',
      value: getStatusValue({ count: activeHeroes.length, loading: heroesLoading }),
      label: activeHeroes.length === 1 ? 'registro heroico' : 'registros heroicos',
      detail: activeHeroes.length > 0 ? 'Identidades disponibles para evaluación interna.' : 'Registros heroicos en consolidación.',
    },
    {
      kicker: 'COBERTURAS ACTIVAS',
      value: getStatusValue({ count: activeNews.length, loading: newsLoading }),
      label: activeNews.length === 1 ? 'cobertura pública' : 'coberturas públicas',
      detail: activeNews.length > 0 ? 'Mesa Editorial sincronizada con la capa pública.' : 'Coberturas en espera de activación.',
      hot: Boolean(headlineNews),
    },
    {
      kicker: 'PORTADA EDITORIAL',
      value: newsLoading ? 'Sincronizando' : headlineNews ? 'Sincronizada' : 'En espera',
      label: 'control de portada',
      detail: headlineNews?.title || 'La portada se activa con cobertura principal y prioridad editorial.',
      hot: Boolean(headlineNews),
    },
    
    {
      kicker: 'USUARIO ORÁCULO',
      value: currentUser ? 'Verificado' : 'En espera',
      label: userName || 'sesión interna',
      detail: currentUser ? 'Acceso interno disponible bajo permisos ORÁCULO.' : 'La capa interna espera una sesión autorizada.',
      hot: Boolean(currentUser),
    },
    {
      kicker: 'CORPORACIONES',
      value: getStatusValue({ count: activeCorporations.length, loading: corporationsLoading }),
      label: activeCorporations.length === 1 ? 'operador activo' : 'operadores activos',
      detail: activeCorporations.length > 0 ? 'Operadores vinculados al ecosistema reputacional.' : 'Operadores en revisión interna.',
    },
    {
      kicker: 'SOLICITUDES',
      value: 'Seguimiento',
      label: 'módulo habilitado',
      detail: 'Las solicitudes de jugadores se revisan desde su módulo ORÁCULO.',
    },
    {
      kicker: 'SEÑALES PÚBLICAS',
      value: 'Canal activo',
      label: 'emisión disponible',
      detail: 'Las señales públicas se gestionan desde su módulo interno.',
    },
  ]

  const handleOpenTool = (tool) => {
    if (tool.needsHero) {
      if (!primaryHero?.id) return
      onNavigate?.(tool.routeId, { heroId: primaryHero.id })
      return
    }

    onNavigate?.(tool.routeId)
  }

  return (
    <section className="page-card oraculo-hub-page oraculo-os">
      <header className="oraculo-os__header">
        <div className="oraculo-os__header-copy">
          <p className="page-card__kicker">ACCESO ORÁCULO</p>
          <h2>Sistema Operativo HeroIndex</h2>
          <p>
            Capa interna de control reputacional, editorial y narrativo del ecosistema HeroIndex.
          </p>
          <div className="oraculo-os__chips" aria-label="Estado de acceso ORÁCULO">
            <span>CAPA INTERNA</span>
            <span>GM ACTIVO</span>
            <span>DATOS NO PÚBLICOS</span>
            <span>CONTROL NARRATIVO</span>
          </div>
        </div>
        <aside className="oraculo-os__operator" aria-label="Operador ORÁCULO">
          <span>OPERADOR</span>
          <strong>{userName || 'Acceso verificado'}</strong>
          <small>{isSyncing ? 'Sincronizando capa ORÁCULO…' : 'Sistema interno en línea'}</small>
        </aside>
      </header>

      <section className="oraculo-os__status-grid" aria-label="Estado del ecosistema">
        {ecosystemStatus.map((item) => (
          <article className={`oraculo-os__status-card ${item.hot ? 'oraculo-os__status-card--hot' : ''}`.trim()} key={item.kicker}>
            <p>{item.kicker}</p>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <small>{item.detail}</small>
          </article>
        ))}
      </section>

      <section className="oraculo-os__activity" aria-label="Registro operativo ORÁCULO">
        <div className="oraculo-os__section-heading">
          <p className="page-card__kicker">ACTIVIDAD INTERNA</p>
          <h3>Registro operativo ORÁCULO</h3>
          <span>{isSyncing ? 'Sincronizando capa ORÁCULO…' : 'Ciclo interno activo'}</span>
        </div>
        <div className="oraculo-os__timeline">
          {activityEvents.map((event) => (
            <article key={`${event.kicker}-${event.title}`}>
              <span>{event.time}</span>
              <div>
                <p>{event.kicker}</p>
                <strong>{event.title}</strong>
                <small>{event.description}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="oraculo-os__modules" aria-label="Módulos ORÁCULO">
        <div className="oraculo-os__section-heading">
          <p className="page-card__kicker">HERRAMIENTAS ORÁCULO</p>
          <h3>Módulos de operación interna</h3>
          <span>Accesos agrupados por capa de control</span>
        </div>

        {moduleSections.map((section) => (
          <section className="oraculo-os__module-section" key={section.id}>
            <div className="oraculo-os__module-heading">
              <div>
                <p>{section.kicker}</p>
                <h4>{section.title}</h4>
              </div>
              <span>{section.description}</span>
            </div>
            <div className="oraculo-os__module-grid">
              {section.tools.map((tool) => {
                const isLocked = tool.needsHero && !primaryHero?.id
                const description = tool.needsHero && primaryHero?.id
                  ? `${tool.description} Prioridad actual: ${getHeroDisplayName(primaryHero)}.`
                  : tool.description

                return (
                  <button
                    className="oraculo-os__module-card"
                    disabled={isLocked}
                    key={`${section.id}-${tool.routeId}-${tool.title}`}
                    onClick={() => handleOpenTool(tool)}
                    type="button"
                  >
                    <span className="oraculo-os__module-kicker">{tool.kicker}</span>
                    <strong>{tool.title}</strong>
                    <small>{isLocked ? 'Requiere un registro heroico activo para abrir expediente.' : description}</small>
                    <span className="oraculo-os__module-footer">
                      <em>Estado: {isLocked ? 'EN ESPERA' : tool.state}</em>
                      <b>{isLocked ? 'Sin expediente' : 'Abrir módulo'}</b>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </section>

      <section className="oraculo-os__warning" aria-label="Advertencia interna ORÁCULO">
        <strong>Los datos internos no son visibles para perfiles públicos ni jugadores sin autorización ORÁCULO.</strong>
        <p>
          Mantén separadas la señal pública, la reputación visible y la continuidad privada antes de publicar cambios de campaña.
        </p>
      </section>
    </section>
  )
}

export default OraculoHub
