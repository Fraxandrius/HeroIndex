import Sidebar from './Sidebar.jsx'
import TopBar from './TopBar.jsx'

function AppShell({ activeRouteId, children, onNavigate, routes }) {
  const activeRoute = routes.find((route) => route.id === activeRouteId)

  return (
    <div className="app-shell">
      <Sidebar
        activeRouteId={activeRouteId}
        onNavigate={onNavigate}
        routes={routes}
      />
      <div className="app-shell__workspace">
        <TopBar currentSection={activeRoute?.label ?? 'HeroIndex'} />
        <main className="app-shell__content">{children}</main>
      </div>
    </div>
  )
}

export default AppShell