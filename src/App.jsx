import { useMemo, useState } from 'react'
import { RequireOraculo, RequirePlayer } from './components/auth/RouteGuards.jsx'
import AppShell from './components/layout/AppShell.jsx'
import Account from './pages/Account.jsx'
import Corporations from './pages/Corporations.jsx'
import GMManager from './pages/GMManager.jsx'
import GMPanel from './pages/GMPanel.jsx'
import HeroProfile from './pages/HeroProfile.jsx'
import Home from './pages/Home.jsx'
import Karma from './pages/Karma.jsx'
import Login from './pages/Login.jsx'
import MissionCalculator from './pages/MissionCalculator.jsx'
import MyProfile from './pages/MyProfile.jsx'
import News from './pages/News.jsx'
import OraculoBroadcasts from './pages/OraculoBroadcasts.jsx'
import OraculoCampaignLog from './pages/OraculoCampaignLog.jsx'
import OraculoHeroDossier from './pages/OraculoHeroDossier.jsx'
import OraculoHub from './pages/OraculoHub.jsx'
import OraculoKarmaManager from './pages/OraculoKarmaManager.jsx'
import OraculoNewsroom from './pages/OraculoNewsroom.jsx'
import OraculoNpcBuilder from './pages/OraculoNpcBuilder.jsx'
import OraculoNpcImport from './pages/OraculoNpcImport.jsx'
import OraculoPlayerRequests from './pages/OraculoPlayerRequests.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Profiles from './pages/Profiles.jsx'
import Register from './pages/Register.jsx'
import Ranking from './pages/Ranking.jsx'

const routeAliases = {
  '/noticias': 'news',
  '/perfiles': 'profiles',
  '/corporaciones': 'corporations',
}

const routes = [
  { id: 'home', label: 'Inicio', path: '/', component: Home, navGroup: 'public' },
  { id: 'ranking', label: 'Ranking', path: '/ranking', component: Ranking, navGroup: 'public' },
  { id: 'profiles', label: 'Perfiles', path: '/profiles', component: Profiles, navGroup: 'public' },
   { id: 'news', label: 'Noticias', path: '/news', component: News, navGroup: 'public' },
  {
    id: 'corporations',
    label: 'Corporaciones',
    path: '/corporations',
    component: Corporations,
    navGroup: 'public',
  },
  {
    id: 'hero-profile',
    label: 'Perfil HeroIndex',
    path: '/heroes/:heroId',
    component: HeroProfile,
    hiddenFromNav: true,
    navGroup: 'public',
  },
   { id: 'login', label: 'Iniciar sesión', path: '/login', component: Login, navGroup: 'access' },
  { id: 'register', label: 'Crear cuenta', path: '/register', component: Register, navGroup: 'access' },
  { id: 'onboarding', label: 'Onboarding', path: '/onboarding', component: Onboarding, hiddenFromNav: true, navGroup: 'player', requiresPlayer: true },
  { id: 'my-profile', label: 'Mi Perfil', path: '/mi-perfil', component: MyProfile, navGroup: 'player', requiresPlayer: true },
  { id: 'karma', label: 'Karma', path: '/karma', component: Karma, navGroup: 'player', requiresPlayer: true },
  { id: 'account', label: 'Mi Cuenta', path: '/cuenta', component: Account, navGroup: 'player', requiresPlayer: true },
  { id: 'oraculo-hub', label: 'ORÁCULO Hub', path: '/oraculo', component: OraculoHub, navGroup: 'oracle', requiresOracle: true },
  {
     id: 'gm-manager',
    label: 'GM Manager',
    path: '/gm-manager',
    component: GMManager,
    navGroup: 'oracle',
    requiresOracle: true,
  },
  {
    id: 'mission-calculator',
    label: 'Calculadora de misión',
    path: '/mission-calculator',
    component: MissionCalculator,
    hiddenFromNav: true,
    navGroup: 'oracle',
    requiresOracle: true,
  },
  {
    id: 'oraculo-karma-manager',
    label: 'Gestor de Karma',
    path: '/oraculo/karma-manager',
    component: OraculoKarmaManager,
    navGroup: 'oracle',
    requiresOracle: true,
  },
  {
    id: 'oraculo-broadcasts',
    label: 'Señales públicas',
    path: '/oraculo/broadcasts',
    component: OraculoBroadcasts,
    hiddenFromNav: true,
    navGroup: 'oracle',
    requiresOracle: true,
  },
  {
    id: 'oraculo-newsroom',
    label: 'Mesa Editorial',
    path: '/oraculo/newsroom',
    component: OraculoNewsroom,
    navGroup: 'oracle',
    requiresOracle: true,
  },
  {
    id: 'oraculo-player-requests',
    label: 'Solicitudes de jugadores',
    path: '/oraculo/player-requests',
    component: OraculoPlayerRequests,
    navGroup: 'oracle',
    requiresOracle: true,
  },
   {
    id: 'oraculo-campaign-log',
    label: 'Registro de Campaña',
    path: '/oraculo/campaign-log',
    component: OraculoCampaignLog,
    navGroup: 'oracle',
    requiresOracle: true,
  },
  {
    id: 'oraculo-npc-builder',
    label: 'Creador de NPC',
    path: '/oraculo/npc-builder',
    component: OraculoNpcBuilder,
    navGroup: 'oracle',
    requiresOracle: true,
  },
  {
    id: 'oraculo-npc-import',
    label: 'Importador de NPCs',
    path: '/oraculo/npc-import',
    component: OraculoNpcImport,
    navGroup: 'oracle',
    requiresOracle: true,
  },
  {
    id: 'oraculo-hero-dossier',
    label: 'Dossier ORÁCULO',
    path: '/oraculo/heroes/:heroId',
    component: OraculoHeroDossier,
    hiddenFromNav: true,
    navGroup: 'oracle',
    requiresOracle: true,
  },
  {
    id: 'gm-panel',
    label: 'GM Panel',
    path: '/gm-panel',
    component: GMPanel,
    hiddenFromNav: true,
    requiresOracle: true,
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
  const aliasRouteId = routeAliases[window.location.pathname]

  return { id: route?.id ?? aliasRouteId ?? 'home', params: {} }
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

  const page = <ActivePage onNavigate={handleNavigate} routeParams={activeRouteState.params} />
  const guardedPage = activeRoute.requiresOracle ? (
    <RequireOraculo onNavigate={handleNavigate}>{page}</RequireOraculo>
  ) : activeRoute.requiresPlayer ? (
    <RequirePlayer onNavigate={handleNavigate}>{page}</RequirePlayer>
  ) : page

  return (
    <AppShell
      activeRouteId={activeRoute.id}
      routes={routes}
      onNavigate={handleNavigate}
    >
      {guardedPage}
    </AppShell>
  )
}

export default App