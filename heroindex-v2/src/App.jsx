import { useMemo, useState } from 'react'
import AppShell from './components/layout/AppShell.jsx'
import GMPanel from './pages/GMPanel.jsx'
import Home from './pages/Home.jsx'
import Karma from './pages/Karma.jsx'
import MissionCalculator from './pages/MissionCalculator.jsx'
import News from './pages/News.jsx'
import Profiles from './pages/Profiles.jsx'
import Ranking from './pages/Ranking.jsx'

const routes = [
  { id: 'home', label: 'Home', path: '/', component: Home },
  { id: 'ranking', label: 'Ranking', path: '/ranking', component: Ranking },
  { id: 'profiles', label: 'Profiles', path: '/profiles', component: Profiles },
  { id: 'news', label: 'News', path: '/news', component: News },
  {
    id: 'mission-calculator',
    label: 'Mission Calculator',
    path: '/mission-calculator',
    component: MissionCalculator,
  },
  { id: 'karma', label: 'Karma', path: '/karma', component: Karma },
  { id: 'gm-panel', label: 'GM Panel', path: '/gm-panel', component: GMPanel },
]

function App() {
  const [activeRouteId, setActiveRouteId] = useState('home')

  const activeRoute = useMemo(
    () => routes.find((route) => route.id === activeRouteId) ?? routes[0],
    [activeRouteId],
  )
  const ActivePage = activeRoute.component

  return (
    <AppShell
      activeRouteId={activeRoute.id}
      routes={routes}
      onNavigate={setActiveRouteId}
    >
      <ActivePage />
    </AppShell>
  )
}

export default App
