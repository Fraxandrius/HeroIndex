import { useState } from 'react'
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

const primaryOracleRouteIds = ['oraculo-hub', 'oraculo-newsroom', 'oraculo-karma-manager']

function getInitials(value = 'HI') {
  return value
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function Sidebar({ activeRouteId, onNavigate, routes }) {
  const [isOracleExpanded, setIsOracleExpanded] = useState(false)

  const { isLoggedIn, loading, logout, userProfile } = useAuth()
  const canViewOracle = isOraculoMode && canSeeOraculoTools(userProfile)
  const visibleRoutes = routes.filter((route) => route.hiddenFromNav !== true)

  const publicRoutes = visibleRoutes.filter((route) => (route.navGroup ?? 'public') === 'public')
  const accessRoutes = visibleRoutes.filter((route) => route.navGroup === 'access')
  const oracleRoutes = visibleRoutes.filter((route) => route.navGroup === 'oracle')
  const primaryOracleRoutes = oracleRoutes.filter((route) => primaryOracleRouteIds.includes(route.id))
  const secondaryOracleRoutes = oracleRoutes.filter((route) => !primaryOracleRouteIds.includes(route.id))
  const displayedOracleRoutes = isOracleExpanded ? oracleRoutes : primaryOracleRoutes

  const userName = userProfile?.displayName || userProfile?.username || 'Jugador HeroIndex'

  const handleLogout = async () => {
    await logout()
    onNavigate('login')
  }

  return (
    <aside className="sidebar" aria-label="Navegación HeroIndex">
      <button className="sidebar__brand" aria-label="Ir al inicio de HeroIndex" onClick={() => onNavigate('home')} type="button">
  <BrandLogo className="sidebar__brand-mark" size="sidebarSymbol" variant="symbol" />
  <div className="sidebar__brand-copy">
    <strong>HeroIndex</strong>
    <small>Red de reputación heroica</small>
  </div>
</button>

<nav className="sidebar__nav">
  <section className="sidebar__section sidebar__section--public">
    <div className="sidebar__section-header">
      <span>Público</span>
      <small>Noticias · Perfiles · Ranking</small>
    </div>

    <div className="sidebar__section-links">
      {publicRoutes.map((route) => (
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

  {!isLoggedIn && !loading ? (
    <section className="sidebar__section sidebar__section--access">
      <div className="sidebar__section-header">
        <span>Acceso</span>
        <small>Iniciar sesión · Crear cuenta</small>
      </div>

      <div className="sidebar__section-links">
        {accessRoutes.map((route) => (
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
  ) : null}

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
              {userProfile?.avatarUrl ? (
                <img alt="Avatar de cuenta" src={userProfile.avatarUrl} />
              ) : (
                <span>{getInitials(userName)}</span>
              )}
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

  {canViewOracle ? (
    <section className="sidebar__section sidebar__section--oracle">
      <div className="sidebar__section-header">
        <span>ORÁCULO</span>
        <small>Herramientas internas</small>
      </div>

      <div className="sidebar__section-links">
        {displayedOracleRoutes.map((route) => (
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

        {secondaryOracleRoutes.length > 0 ? (
          <button
            className="sidebar__link sidebar__link--subtle sidebar__link--compact"
            onClick={() => setIsOracleExpanded((currentValue) => !currentValue)}
            type="button"
          >
            {isOracleExpanded ? 'Ocultar herramientas' : 'Ver más herramientas'}
          </button>
        ) : null}
      </div>
    </section>
  ) : null}
</nav>

      <SidebarVisualSlot canSeeOraculoTools={canViewOracle} />
    </aside>
  )
}

export default Sidebar