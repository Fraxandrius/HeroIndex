import BrandLogo from '../BrandLogo.jsx'
import { useAuth } from '../../hooks/useAuth.js'

const navSections = [
  { id: 'public', label: 'Público', description: 'Noticias · Perfiles · Ranking' },
   { id: 'player', label: 'Jugador', description: 'Mi Perfil · Karma', requiresLogin: true },
  { id: 'oracle', label: 'ORÁCULO', description: 'Herramientas GM', requiresOracle: true },
]

const isOraculoMode = import.meta.env.VITE_ORACULO_MODE === 'true'

function getInitials(value = 'HI') {
  return value
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function Sidebar({ activeRouteId, onNavigate, routes }) {
  const { isLoggedIn, loading, logout, userProfile } = useAuth()
  const canViewOracle = userProfile?.role === 'oraculo' || isOraculoMode
  const visibleRoutes = routes.filter((route) => route.hiddenFromNav !== true)
 const userName = userProfile?.displayName || userProfile?.username || 'Jugador HeroIndex'

  const handleLogout = async () => {
    await logout()
    onNavigate('login')
  }

  return (
    <aside className="sidebar" aria-label="Navegación HeroIndex">
      <button className="sidebar__brand" aria-label="Ir al inicio de HeroIndex" onClick={() => onNavigate('home')} type="button">
        <BrandLogo className="sidebar__brand-mark" size="sidebar" variant="full" />
      </button>

      <nav className="sidebar__nav">
        {navSections.map((section) => {
          if (section.requiresLogin && !isLoggedIn) {
            return null
          }

          if (section.requiresOracle && !canViewOracle) {
            return null
          }

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
          <span>Restaurando sesión HeroIndex...</span>
        ) : isLoggedIn ? (
          <>
            <div className="sidebar-user-card">
              <div className="sidebar-user-card__avatar">
                {userProfile?.avatarUrl ? <img alt="Avatar de cuenta" src={userProfile.avatarUrl} /> : <span>{getInitials(userName)}</span>}
              </div>
              <div>
                <strong>{userName}</strong>
                <small>Cuenta HeroIndex activa</small>
              </div>
            </div>
             {!userProfile?.heroId ? (
              <button className="sidebar__link sidebar__link--highlight" onClick={() => onNavigate('onboarding')} type="button">
                Completar onboarding
              </button>
            ) : null}
            <div className="sidebar-user-actions">
              <button className="sidebar__link" disabled={!userProfile?.heroId} onClick={() => onNavigate('my-profile')} type="button">
                Mi Perfil
              </button>
              <button className="sidebar__link" onClick={() => onNavigate('account')} type="button">
                Mi Cuenta
              </button>
              <button className="sidebar__link" disabled={!userProfile?.heroId} onClick={() => onNavigate('karma')} type="button">
                Karma
              </button>
              <button className="sidebar__link sidebar__link--subtle" onClick={handleLogout} type="button">
                Cerrar sesión
              </button>
            </div>
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