import BrandLogo from '../BrandLogo.jsx'
import SidebarVisualSlot from '../visual/SidebarVisualSlot.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { canSeeOraculoTools } from '../../utils/roles.js'

const isOraculoMode = import.meta.env.VITE_ORACULO_MODE === 'true'

const navSections = [
  { id: 'public', label: 'Público', description: 'Noticias · Perfiles · Ranking' },
  { id: 'access', label: 'Acceso', description: 'Iniciar sesión · Crear cuenta', requiresGuest: true },
  { id: 'oracle', label: 'ORÁCULO', description: 'Herramientas internas', requiresOracle: true },
]

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
  const canViewOracle = isOraculoMode && canSeeOraculoTools(userProfile)
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

          if (section.requiresGuest && (isLoggedIn || loading)) {
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
              {section.id === 'access' ? <SidebarVisualSlot canSeeOraculoTools={canViewOracle} /> : null}
            </section>
          )
        })}
      </nav>

      {isLoggedIn ? <SidebarVisualSlot canSeeOraculoTools={canViewOracle} /> : null}

      {loading || isLoggedIn ? (
        <section className="sidebar__user sidebar__section sidebar__section--player" aria-label="Cuenta de jugador">
          <div className="sidebar__section-header">
            <span>Jugador</span>
            <small>Mi Perfil · Karma · Cuenta</small>
          </div>
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
                <button className="sidebar__link sidebar__link--highlight" onClick={() => onNavigate('my-profile')} type="button">
                  Completar Mi Perfil
                </button>
              ) : null}
              <div className="sidebar-user-actions">
                <button className="sidebar__link" onClick={() => onNavigate('my-profile')} type="button">
                  Mi Perfil
                </button>
                <button className="sidebar__link" onClick={() => onNavigate('karma')} type="button">
                  Karma
                </button>
                <button className="sidebar__link" onClick={() => onNavigate('account')} type="button">
                  Mi Cuenta
                </button>
                <button className="sidebar__link sidebar__link--subtle" onClick={handleLogout} type="button">
                  Cerrar sesión
                </button>
              </div>
            </>
          ) : null}
        </section>
      ) : null}
    </aside>
  )
}

export default Sidebar