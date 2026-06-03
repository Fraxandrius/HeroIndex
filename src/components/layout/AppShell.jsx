import { useEffect, useState } from 'react'
import MobileAppShell from './MobileAppShell.jsx'
import Sidebar from './Sidebar.jsx'
import TopBar from './TopBar.jsx'

const MOBILE_QUERY = '(max-width: 768px)'

function useIsMobileShell() {
  const [isMobile, setIsMobile] = useState(() => (
    typeof window === 'undefined' ? false : window.matchMedia(MOBILE_QUERY).matches
  ))

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia(MOBILE_QUERY)
    const handleChange = (event) => setIsMobile(event.matches)

    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isMobile
}

function AppShell({ activeRouteId, children, onNavigate, routes }) {
  const activeRoute = routes.find((route) => route.id === activeRouteId)
  const isMobile = useIsMobileShell()
  const currentSection = activeRoute?.label ?? 'HeroIndex'

  return (
    <div className={`app-shell ${isMobile ? 'app-shell--mobile' : 'app-shell--desktop'}`}>
      {isMobile ? (
        <MobileAppShell
          activeRouteId={activeRouteId}
          currentSection={currentSection}
          onNavigate={onNavigate}
          routes={routes}
        />
      ) : (
        <Sidebar
          activeRouteId={activeRouteId}
          onNavigate={onNavigate}
          routes={routes}
        />
      )}
      <div className="app-shell__workspace">
        {!isMobile ? <TopBar currentSection={currentSection} /> : null}
        <main className="app-shell__content">{children}</main>
      </div>
    </div>
  )
}

export default AppShell