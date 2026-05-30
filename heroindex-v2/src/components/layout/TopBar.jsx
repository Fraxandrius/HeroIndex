function TopBar({ currentSection }) {
  return (
    <header className="topbar">
      <div>
        <span className="topbar__eyebrow">HeroIndex v2</span>
        <h1>{currentSection}</h1>
      </div>
      <div className="topbar__status" role="status">
        Firebase pending
      </div>
    </header>
  )
}

export default TopBar