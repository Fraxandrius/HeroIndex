function Sidebar({ activeRouteId, onNavigate, routes }) {
  return (
    <aside className="sidebar" aria-label="HeroIndex navigation">
      <div className="sidebar__brand">
        <span className="sidebar__logo" aria-hidden="true">
          HI
        </span>
        <div>
          <strong>HeroIndex</strong>
          <small>v2 Command Center</small>
        </div>
      </div>

      <nav className="sidebar__nav">
        {routes.map((route) => (
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
      </nav>
    </aside>
  )
}

export default Sidebar