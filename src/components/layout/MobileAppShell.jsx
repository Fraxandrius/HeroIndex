import { useState } from 'react'
import BrandLogo from '../BrandLogo.jsx'
import { useAuth } from '../../hooks/useAuth.js'

const isOraculoMode = import.meta.env.VITE_ORACULO_MODE === 'true'

const bottomNavItems = [
  { id: 'home', label: 'Inicio' },
  { id: 'ranking', label: 'Ranking' },
  { id: 'news', label: 'Noticias' },
]

function MobileAppShell({ activeRouteId, currentSection = 'HeroIndex', onNavigate, routes }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isLoggedIn, logout } = useAuth()
  const visibleRoutes = routes.filter((route) => route.hiddenFromNav !== true)
  const publicMenuRoutes = visibleRoutes.filter((route) => ['profiles', 'corporations'].includes(route.id))
  const oracleMenuRoutes = isOraculoMode
    ? visibleRoutes.filter((route) => (route.navGroup ?? 'public') === 'oracle')
    : []

  const closeMenu = () => setIsMenuOpen(false)

  const navigateTo = (routeId) => {
    onNavigate?.(routeId)
    closeMenu()
  }

  const handleLogout = async () => {
    await logout()
    navigateTo('login')
  }

  const profileRouteId = isLoggedIn ? 'my-profile' : 'login'

  return (
    <>
      <header className="mobile-shell-top" aria-label="Navegación móvil HeroIndex">
        <button className="mobile-shell-brand" aria-label="Ir al inicio de HeroIndex" onClick={() => navigateTo('home')} type="button">
          <BrandLogo size="sm" variant="symbol" />
          <span>HeroIndex</span>
        </button>
        <div className="mobile-shell-current" aria-live="polite">
          {currentSection}
        </div>
        <button
          aria-expanded={isMenuOpen}
          aria-controls="mobile-shell-menu"
          className="mobile-shell-menu-button"
          onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
          type="button"
        >
          Menú
        </button>
      </header>

      {isMenuOpen ? (
        <div className="mobile-shell-menu" id="mobile-shell-menu" role="dialog" aria-label="Menú de navegación móvil">
          <div className="mobile-shell-menu__panel">
            <section>
              <p className="mobile-shell-menu__label">Explorar</p>
              <div className="mobile-shell-menu__links">
                {publicMenuRoutes.map((route) => (
                  <button key={route.id} onClick={() => navigateTo(route.id)} type="button">
                    {route.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="mobile-shell-menu__label">Cuenta</p>
              <div className="mobile-shell-menu__links">
                {isLoggedIn ? (
                  <>
                    <button onClick={() => navigateTo('my-profile')} type="button">Mi Perfil</button>
                    <button onClick={() => navigateTo('karma')} type="button">Karma</button>
                    <button onClick={handleLogout} type="button">Cerrar sesión</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => navigateTo('login')} type="button">Iniciar sesión</button>
                    <button onClick={() => navigateTo('register')} type="button">Crear cuenta</button>
                  </>
                )}
              </div>
            </section>

            {oracleMenuRoutes.length > 0 ? (
              <section>
                <p className="mobile-shell-menu__label">ORÁCULO</p>
                <div className="mobile-shell-menu__links">
                  {oracleMenuRoutes.map((route) => (
                    <button key={route.id} onClick={() => navigateTo(route.id)} type="button">
                      {route.label}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
          <button className="mobile-shell-menu__scrim" aria-label="Cerrar menú" onClick={closeMenu} type="button" />
        </div>
      ) : null}

      <nav className="mobile-shell-bottom" aria-label="Navegación principal móvil">
        {bottomNavItems.map((item) => (
          <button
            aria-current={activeRouteId === item.id ? 'page' : undefined}
            key={item.id}
            onClick={() => navigateTo(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
        <button
          aria-current={activeRouteId === profileRouteId || (isLoggedIn && activeRouteId === 'account') ? 'page' : undefined}
          onClick={() => navigateTo(profileRouteId)}
          type="button"
        >
          Perfil
        </button>
      </nav>
    </>
  )
}

export default MobileAppShell