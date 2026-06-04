import { useEffect, useState } from 'react'
import DesktopTopNav from './DesktopTopNav.jsx'
import HeroIndexRail from './HeroIndexRail.jsx'
import MobileAppShell from './MobileAppShell.jsx'

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

  if (isMobile) {
    return (
      <div className="app-shell app-shell--mobile">
        <MobileAppShell
          activeRouteId={activeRouteId}
          currentSection={currentSection}
          onNavigate={onNavigate}
          routes={routes}
        />
        <div className="app-shell__workspace">
          <main className="app-shell__content">{children}</main>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell app-shell--desktop">
      <DesktopTopNav activeRouteId={activeRouteId} onNavigate={onNavigate} routes={routes} />
      <div className="app-shell__desktop-layout">
        <main className="app-shell__content">{children}</main>
        <HeroIndexRail />
      </div>
    </div>
  )
}

export default AppShell