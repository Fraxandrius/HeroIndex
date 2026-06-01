function shouldShowRuntimeStatus() {
return import.meta.env.VITE_DEBUG_BROADCAST === 'true'
}

function TopBar({ currentSection }) {
  return (
    <header className="topbar">
      <div>
        <span className="topbar__eyebrow">HeroIndex v2</span>
        <h1>{currentSection}</h1>
      </div>
      {shouldShowRuntimeStatus() ? (
        <div className="topbar__status" role="status">
          Modo de diagnóstico activo
        </div>
      ) : null}
    </header>
  )
}

export default TopBar