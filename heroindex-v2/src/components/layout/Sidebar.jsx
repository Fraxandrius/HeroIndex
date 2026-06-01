const navSections = [
  { id: 'public', label: 'Público', description: 'Noticias · Perfiles · Ranking' },
  { id: 'player', label: 'Jugador', description: 'Mi Perfil · Karma' },
  { id: 'oracle', label: 'ORÁCULO', description: 'Herramientas GM' },
]

function Sidebar({ activeRouteId, onNavigate, routes }) {
  const visibleRoutes = routes.filter((route) => route.hiddenFromNav !== true)

  return (
    <aside className="sidebar" aria-label="Navegación HeroIndex">
      <div className="sidebar__brand">
        <span className="sidebar__logo" aria-hidden="true">
          HI
        </span>
        <div>
          <strong>HeroIndex</strong>
          <small>Centro HeroIndex v2</small>
        </div>
      </div>

      <nav className="sidebar__nav">
        {navSections.map((section) => {
          const sectionRoutes = visibleRoutes.filter(
            (route) => (route.navGroup ?? 'public') === section.id,
          )

          if (sectionRoutes.length === 0) {
            return null
          }

          return (
             <section className={`sidebar__section sidebar__section--${section.id}`} key={section.id}>
              <div className="sidebar__section-header">
                <span>{section.label}</span>
                <small>{section.description}</small>
              </div>

              <div className="sidebar__section-links">
                {sectionRoutes.map((route) => (
                  <button
                    aria-current={activeRouteId === route.id ? 'page' : undefined}
                    className="sidebar__link"
                    key={route.id}
                    onClick={() => onNavigate(route.id)}
                    type="button"
                  >
                    {route.label}
                  </button>
                ))}
              </div>
            </section>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar