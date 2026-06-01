import { useMemo, useState } from 'react'
import AdsDebugPanel from './components/debug/AdsDebugPanel.jsx'
import AppShell from './components/layout/AppShell.jsx'
import Corporations from './pages/Corporations.jsx'
import GMManager from './pages/GMManager.jsx'
import GMPanel from './pages/GMPanel.jsx'
import HeroProfile from './pages/HeroProfile.jsx'
import Home from './pages/Home.jsx'
import Karma from './pages/Karma.jsx'
import MissionCalculator from './pages/MissionCalculator.jsx'
import News from './pages/News.jsx'
import OraculoHeroDossier from './pages/OraculoHeroDossier.jsx'
import OraculoHub from './pages/OraculoHub.jsx'
import OraculoNpcBuilder from './pages/OraculoNpcBuilder.jsx'
import Profiles from './pages/Profiles.jsx'
import Ranking from './pages/Ranking.jsx'

const routes = [
  { id: 'home', label: 'Home', path: '/', component: Home, navGroup: 'public' },
  { id: 'ranking', label: 'Ranking', path: '/ranking', component: Ranking, navGroup: 'public' },
  { id: 'profiles', label: 'Perfiles', path: '/profiles', component: Profiles, navGroup: 'public' },
  {
    id: 'hero-profile',
    label: 'Perfil HeroIndex',
    path: '/heroes/:heroId',
    component: HeroProfile,
    hiddenFromNav: true,
    navGroup: 'public',
  },
  {
    id: 'corporations',
    label: 'Corporations',
    path: '/corporations',
    component: Corporations,
    navGroup: 'public',
  },
  { id: 'news', label: 'News', path: '/news', component: News, navGroup: 'public' },
  { id: 'karma', label: 'Karma', path: '/karma', component: Karma, navGroup: 'player' },
  { id: 'oraculo-hub', label: 'ORÁCULO Hub', path: '/oraculo', component: OraculoHub, navGroup: 'oracle' },
  {
    id: 'oraculo-npc-builder',
    label: 'Creador de NPC',
    path: '/oraculo/npc-builder',
    component: OraculoNpcBuilder,
    navGroup: 'oracle',
  },
  {
    id: 'oraculo-hero-dossier',
    label: 'Dossier ORÁCULO',
    path: '/oraculo/heroes/:heroId',
    component: OraculoHeroDossier,
    hiddenFromNav: true,
    navGroup: 'oracle',
  },
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

function getInitialRouteState() {
  const oraculoHeroMatch = window.location.pathname.match(/^\/oraculo\/heroes\/([^/]+)$/)

  if (oraculoHeroMatch) {
    return { id: 'oraculo-hero-dossier', params: { heroId: decodeURIComponent(oraculoHeroMatch[1]) } }
  }

  const heroMatch = window.location.pathname.match(/^\/heroes\/([^/]+)$/)

  if (heroMatch) {
    return { id: 'hero-profile', params: { heroId: decodeURIComponent(heroMatch[1]) } }
  }

  const route = routes.find((item) => item.path === window.location.pathname)

  return { id: route?.id ?? 'home', params: {} }
}

function getRoutePath(routeId, params = {}) {
  if (routeId === 'oraculo-hero-dossier' && params.heroId) {
    return `/oraculo/heroes/${encodeURIComponent(params.heroId)}`
  }

  if (routeId === 'hero-profile' && params.heroId) {
    return `/heroes/${encodeURIComponent(params.heroId)}`
  }

  return routes.find((route) => route.id === routeId)?.path ?? '/'
}

function App() {
  const [activeRouteState, setActiveRouteState] = useState(getInitialRouteState)

  const activeRoute = useMemo(
    () => routes.find((route) => route.id === activeRouteState.id) ?? routes[0],
    [activeRouteState.id],
  )
  const ActivePage = activeRoute.component

  const handleNavigate = (routeId, params = {}) => {
    const nextPath = getRoutePath(routeId, params)

    window.history.pushState({}, '', nextPath)
    setActiveRouteState({ id: routeId, params })
  }

  return (
    <AppShell
      activeRouteId={activeRoute.id}
      routes={routes}
      onNavigate={handleNavigate}
    >
      <ActivePage onNavigate={handleNavigate} routeParams={activeRouteState.params} />
      <AdsDebugPanel />
    </AppShell>
  )
}

export default App