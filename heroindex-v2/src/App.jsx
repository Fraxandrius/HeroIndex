import { useMemo, useState } from 'react'
import AdsDebugPanel from './components/debug/AdsDebugPanel.jsx'
import AppShell from './components/layout/AppShell.jsx'
import Corporations from './pages/Corporations.jsx'
import GMManager from './pages/GMManager.jsx'
import GMPanel from './pages/GMPanel.jsx'
import Home from './pages/Home.jsx'
import Karma from './pages/Karma.jsx'
import MissionCalculator from './pages/MissionCalculator.jsx'
import News from './pages/News.jsx'
import Profiles from './pages/Profiles.jsx'
import Ranking from './pages/Ranking.jsx'

const routes = [
  { id: 'home', label: 'Home', path: '/', component: Home, navGroup: 'public' },
  { id: 'ranking', label: 'Ranking', path: '/ranking', component: Ranking, navGroup: 'public' },
  { id: 'profiles', label: 'Profiles', path: '/profiles', component: Profiles, navGroup: 'public' },
  {
    id: 'corporations',
    label: 'Corporations',
    path: '/corporations',
    component: Corporations,
    navGroup: 'public',
  },
  { id: 'news', label: 'News', path: '/news', component: News, navGroup: 'public' },
  { id: 'karma', label: 'Karma', path: '/karma', component: Karma, navGroup: 'player' },
  {
    id: 'gm-manager',
    label: 'GM Manager',
    path: '/gm-manager',
    component: GMManager,
    navGroup: 'oracle',
  },
  {
    id: 'mission-calculator',
    label: 'Mission Calculator',
    path: '/mission-calculator',
    component: MissionCalculator,
    navGroup: 'oracle',
  },
  {
    id: 'gm-panel',
    label: 'GM Panel',
    path: '/gm-panel',
    component: GMPanel,
    hiddenFromNav: true,
  },
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
      <AdsDebugPanel />
    </AppShell>
  )
}

export default App
