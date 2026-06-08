import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { useNews } from '../hooks/useNews.js'

const commandTools = [
  {
    kicker: 'MESA EDITORIAL',
    title: 'Mesa Editorial',
    description: 'Controla portada, coberturas y piezas visuales públicas.',
    routeId: 'oraculo-newsroom',
    state: 'Activo',
  },
  {
    kicker: 'CONTROL GENERAL',
    title: 'GM Manager',
    description: 'Gestiona contenido público, héroes, corporaciones y noticias.',
    routeId: 'gm-manager',
    state: 'ORÁCULO',
  },
  {
    kicker: 'PROGRESO',
    title: 'Gestor de Karma',
    description: 'Administra progreso, recompensas y avances de jugadores.',
    routeId: 'oraculo-karma-manager',
    state: 'Interno',
  },
  {
    kicker: 'JUGADORES',
    title: 'Solicitudes de jugadores',
    description: 'Revisa vínculos de identidad heroica enviados por jugadores.',
    routeId: 'oraculo-player-requests',
    state: 'Activo',
  },
  {
    kicker: 'CONTINUIDAD',
    title: 'Registro de Campaña',
    description: 'Documenta eventos, consecuencias y continuidad narrativa.',
    routeId: 'oraculo-campaign-log',
    state: 'Interno',
  },
  {
    kicker: 'NPC',
    title: 'Creador de NPC',
    description: 'Crea figuras no jugadoras con perfil público y hoja privada.',
    routeId: 'oraculo-npc-builder',
    state: 'ORÁCULO',
  },
  {
    kicker: 'IMPORTACIÓN',
    title: 'Importador de NPCs',
    description: 'Registra múltiples identidades narrativas desde archivo operativo.',
    routeId: 'oraculo-npc-import',
    state: 'Interno',
  },
  {
    kicker: 'MISIÓN',
    title: 'Calculadora de misión',
    description: 'Calcula impacto narrativo, recompensas y proyección de ranking.',
    routeId: 'mission-calculator',
    state: 'Activo',
  },
  {
    kicker: 'SEÑALES',
    title: 'Señales públicas',
    description: 'Gestiona comunicados institucionales visibles en la capa pública.',
    routeId: 'oraculo-broadcasts',
    state: 'ORÁCULO',
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

function OraculoHub({ onNavigate }) {
  const { feedNews, loading: newsLoading } = useNews()
  const { heroes, loading: heroesLoading } = useHeroes()
  const { corporations, loading: corporationsLoading } = useCorporations()

  const activeNews = getActiveItems(feedNews).filter((item) => item.homePlacement !== 'hidden')
  const activeHeroes = getActiveItems(heroes)
  const activeCorporations = getActiveItems(corporations)
  const headlineNews = activeNews.find((item) => item.homePlacement === 'hero')
  const latestNews = activeNews[0]

  const operativeStatus = [
    {
      kicker: 'MESA EDITORIAL',
      value: getStatusValue({ count: activeNews.length, loading: newsLoading }),
      label: activeNews.length === 1 ? 'cobertura activa' : 'coberturas activas',
      detail: headlineNews?.title || latestNews?.title || 'Canal editorial listo para activar portada pública.',
      hot: Boolean(headlineNews),
    },
    {
      kicker: 'HÉROES REGISTRADOS',
      value: getStatusValue({ count: activeHeroes.length, loading: heroesLoading }),
      label: activeHeroes.length === 1 ? 'identidad activa' : 'identidades activas',
      detail: activeHeroes.length > 0 ? 'Directorio heroico disponible para seguimiento interno.' : 'Registros heroicos en consolidación.',
    },
    {
      kicker: 'CORPORACIONES',
      value: getStatusValue({ count: activeCorporations.length, loading: corporationsLoading }),
      label: activeCorporations.length === 1 ? 'operador activo' : 'operadores activos',
      detail: activeCorporations.length > 0 ? 'Ecosistema corporativo vinculado a presencia pública.' : 'Operadores en revisión interna.',
    },
    {
      kicker: 'SOLICITUDES / SEÑALES',
      value: newsLoading ? 'Sincronizando' : 'Canal activo',
      label: 'seguimiento habilitado',
      detail: 'Solicitudes, señales y coberturas se coordinan desde herramientas ORÁCULO.',
    },
  ]

  return (
    <section className="page-card oraculo-hub-page oraculo-command-center">
      <header className="oraculo-command-header">
        <div className="oraculo-command-header__content">
          <p className="page-card__kicker">ACCESO ORÁCULO</p>
          <h2>Centro de Control HeroIndex</h2>
          <p>
            Capa interna de operación, edición y seguimiento narrativo del ecosistema HeroIndex.
          </p>
          <div className="oraculo-command-header__chips" aria-label="Estado de acceso ORÁCULO">
            <span>CAPA INTERNA</span>
            <span>GM ACTIVO</span>
            <span>DATOS NO PÚBLICOS</span>
          </div>
        </div>
        <div className="oraculo-command-header__seal" aria-hidden="true">
          <span>ORÁCULO</span>
          <strong>CONTROL</strong>
        </div>
      </header>

      <section className="oraculo-status-grid" aria-label="Estado operativo ORÁCULO">
        {operativeStatus.map((item) => (
          <article className={`oraculo-status-card ${item.hot ? 'oraculo-status-card--hot' : ''}`.trim()} key={item.kicker}>
            <p>{item.kicker}</p>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <small>{item.detail}</small>
          </article>
        ))}
      </section>

      <section className="oraculo-internal-note" aria-label="Resumen narrativo interno">
        <div>
          <p className="page-card__kicker">CONTROL NARRATIVO</p>
          <h3>Capa invisible del ecosistema público</h3>
        </div>
        <p>
          ORÁCULO coordina la capa invisible del ecosistema HeroIndex: reputación, narrativa pública,
          control editorial y seguimiento de campaña.
        </p>
      </section>

      <section className="oraculo-tool-grid" aria-label="Accesos rápidos ORÁCULO">
        {commandTools.map((tool) => (
          <button className="oraculo-tool-card" key={tool.routeId} onClick={() => onNavigate?.(tool.routeId)} type="button">
            <span className="oraculo-tool-card__kicker">{tool.kicker}</span>
            <strong>{tool.title}</strong>
            <small>{tool.description}</small>
            <span className="oraculo-tool-card__footer">
              <em>{tool.state}</em>
              <b>Abrir herramienta</b>
            </span>
          </button>
        ))}
      </section>

      <section className="oraculo-warning-panel" aria-label="Advertencia interna ORÁCULO">
        <strong>Datos internos no visibles para perfiles civiles o usuarios sin autorización ORÁCULO.</strong>
        <p>
          Mantén la separación entre señal pública y control narrativo interno antes de publicar coberturas,
          cambios de reputación o consecuencias de campaña.
        </p>
      </section>
    </section>
  )
}

export default OraculoHub
