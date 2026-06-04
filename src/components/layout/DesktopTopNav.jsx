import { useEffect, useRef, useState } from 'react'
import BrandLogo from '../BrandLogo.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { canSeeOraculoTools } from '../../utils/roles.js'

const isOraculoMode = import.meta.env.VITE_ORACULO_MODE === 'true'
const publicRouteIds = ['home', 'ranking', 'profiles', 'news', 'corporations']
const playerRouteIds = ['my-profile', 'karma', 'account']

function DesktopTopNav({ activeRouteId, onNavigate, routes }) {
  const [isOracleOpen, setIsOracleOpen] = useState(false)
  const oracleMenuRef = useRef(null)
  const { isLoggedIn, loading, logout, userProfile } = useAuth()
  const canViewOracle = isOraculoMode && canSeeOraculoTools(userProfile)
  const visibleRoutes = routes.filter((route) => route.hiddenFromNav !== true)
  const publicRoutes = publicRouteIds
    .map((routeId) => visibleRoutes.find((route) => route.id === routeId))
    .filter(Boolean)
  const accessRoutes = visibleRoutes.filter((route) => route.navGroup === 'access')
  const playerRoutes = playerRouteIds
    .map((routeId) => visibleRoutes.find((route) => route.id === routeId))
    .filter(Boolean)
  const oracleRoutes = visibleRoutes.filter((route) => route.navGroup === 'oracle')

  useEffect(() => {
    if (!isOracleOpen) return undefined

    const closeOracleMenu = (event) => {
      const pressedEscape = event.type === 'keydown' && event.key === 'Escape'
      const clickedOutside = event.type === 'pointerdown' && !oracleMenuRef.current?.contains(event.target)

      if (pressedEscape || clickedOutside) setIsOracleOpen(false)
    }

    document.addEventListener('keydown', closeOracleMenu)
    document.addEventListener('pointerdown', closeOracleMenu)

    return () => {
      document.removeEventListener('keydown', closeOracleMenu)
      document.removeEventListener('pointerdown', closeOracleMenu)
    }
  }, [isOracleOpen])

  const navigateTo = (routeId) => {
    setIsOracleOpen(false)
    onNavigate?.(routeId)
  }

  const handleLogout = async () => {
    await logout()
    navigateTo('login')
  }

  const renderRouteButton = (route, variant = '') => (
    <button
      aria-current={activeRouteId === route.id ? 'page' : undefined}
      className={`desktop-topnav__link ${variant}`.trim()}
      key={route.id}
      onClick={() => navigateTo(route.id)}
      type="button"
    >
      {route.label}
    </button>
  )

  return (
    <header className="desktop-topnav" aria-label="Navegación principal HeroIndex">
      <div className="desktop-topnav__inner">
        <button className="desktop-topnav__brand" aria-label="Ir al inicio de HeroIndex" onClick={() => navigateTo('home')} type="button">
          <BrandLogo size="sm" variant="symbol" />
          <span>
            <strong>HeroIndex</strong>
            <small>Red de reputación heroica</small>
          </span>
        </button>

        <nav className="desktop-topnav__links" aria-label="Explorar HeroIndex">
          {publicRoutes.map((route) => renderRouteButton(route))}
        </nav>

        <div className="desktop-topnav__actions">
          {!loading && !isLoggedIn ? accessRoutes.map((route) => renderRouteButton(route, 'desktop-topnav__link--access')) : null}
          {loading ? <span className="desktop-topnav__session-state">Restaurando sesión...</span> : null}
          {!loading && isLoggedIn ? (
            <>
              {playerRoutes.map((route) => renderRouteButton(route, 'desktop-topnav__link--player'))}
              <button className="desktop-topnav__link desktop-topnav__link--session" onClick={handleLogout} type="button">
                Cerrar sesión
              </button>
            </>
          ) : null}

          {canViewOracle ? (
            <div className="desktop-topnav__oracle" ref={oracleMenuRef}>
              <button
                aria-controls="desktop-topnav-oracle-menu"
                aria-current={oracleRoutes.some((route) => route.id === activeRouteId) ? 'page' : undefined}
                aria-expanded={isOracleOpen}
                className="desktop-topnav__link desktop-topnav__link--oracle"
                onClick={() => setIsOracleOpen((currentValue) => !currentValue)}
                type="button"
              >
                ORÁCULO <span aria-hidden="true">▾</span>
              </button>
              {isOracleOpen ? (
                <div className="desktop-topnav__oracle-menu" id="desktop-topnav-oracle-menu" role="menu">
                  <div>
                    <span>Herramientas internas</span>
                    <small>Acceso ORÁCULO verificado</small>
                  </div>
                  {oracleRoutes.map((route) => (
                    <button
                      aria-current={activeRouteId === route.id ? 'page' : undefined}
                      key={route.id}
                      onClick={() => navigateTo(route.id)}
                      role="menuitem"
                      type="button"
                    >
                      {route.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export default DesktopTopNav