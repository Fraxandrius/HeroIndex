import { useAuth } from '../../hooks/useAuth.js'

const navSections = [
  { id: 'public', label: 'Público', description: 'Noticias · Perfiles · Ranking' },
  { id: 'player', label: 'Jugador', description: 'Mi Perfil · Karma' },
  { id: 'oracle', label: 'ORÁCULO', description: 'Herramientas GM' },
]

function Sidebar({ activeRouteId, onNavigate, routes }) {
  const { isLoggedIn, loading, logout, userProfile } = useAuth()
  const visibleRoutes = routes.filter((route) => route.hiddenFromNav !== true)

  const handleLogout = async () => {
    await logout()
    onNavigate('login')
  }

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
      
      <section className="sidebar__user" aria-label="Cuenta de jugador">
        {loading ? (
          <span>Cargando cuenta...</span>
        ) : isLoggedIn ? (
          <>
            <strong>{userProfile?.displayName || userProfile?.username || 'Jugador HeroIndex'}</strong>
            <button className="sidebar__link" onClick={() => onNavigate('account')} type="button">
              Mi Cuenta
            </button>
            <button className="sidebar__link sidebar__link--subtle" onClick={handleLogout} type="button">
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <button className="sidebar__link" onClick={() => onNavigate('login')} type="button">
              Iniciar sesión
            </button>
            <button className="sidebar__link sidebar__link--subtle" onClick={() => onNavigate('register')} type="button">
              Crear cuenta
            </button>
          </>
        )}
      </section>
    </aside>
  )
}

export default Sidebar