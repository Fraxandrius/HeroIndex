export const mockHeroes = [
  {
    id: 'nova-sentinel',
    name: 'Nova Sentinel',
    corporationId: 'aegis-dynamics',
    approval: 98.7,
    rankingPoints: 128,
    powerClass: 'S',
    description:
      'Skyline guardian known for rapid evacuation routes and high-trust patrol coordination.',
    avatarUrl: '',
    bannerUrl: '',
    active: true,
    createdAt: '2026-05-30T00:00:00.000Z',
    updatedAt: '2026-05-30T00:00:00.000Z',
  },
  {
    id: 'onyx-vale',
    name: 'Onyx Vale',
    corporationId: 'umbra-works',
    approval: 96.2,
    rankingPoints: 116,
    powerClass: 'A',
    description:
      'Shadow-step specialist with a clean record against rogue drone swarms and stealth incursions.',
    avatarUrl: '',
    bannerUrl: '',
    active: true,
    createdAt: '2026-05-30T00:00:00.000Z',
    updatedAt: '2026-05-30T00:00:00.000Z',
  },
  {
    id: 'sol-archer',
    name: 'Sol Archer',
    corporationId: 'helios-league',
    approval: 94.8,
    rankingPoints: 104,
    powerClass: 'A',
    description:
      'Solar marksman specializing in long-range rescue cover and precision containment.',
    avatarUrl: '',
    bannerUrl: '',
    active: true,
    createdAt: '2026-05-30T00:00:00.000Z',
    updatedAt: '2026-05-30T00:00:00.000Z',
  },
  {
    id: 'echo-riot',
    name: 'Echo Riot',
    corporationId: 'sonic-front',
    approval: 91.5,
    rankingPoints: 92,
    powerClass: 'B',
    description:
      'Crowd-control tactician whose resonance shields are trending after waterfront response drills.',
    avatarUrl: '',
    bannerUrl: '',
    active: true,
    createdAt: '2026-05-30T00:00:00.000Z',
    updatedAt: '2026-05-30T00:00:00.000Z',
  },
]

export const mockHeroStories = [
  { id: 'nova', name: 'Nova Sentinel', ring: 'Live', tone: 'cyan' },
  { id: 'onyx', name: 'Onyx Vale', ring: 'New', tone: 'violet' },
  { id: 'sol', name: 'Sol Archer', ring: 'Watch', tone: 'gold' },
  { id: 'echo', name: 'Echo Riot', ring: 'Hot', tone: 'pink' },
  { id: 'terra', name: 'Terra Forge', ring: 'Intel', tone: 'green' },
]

export const mockFeaturedHero = {
  id: 'nova-sentinel',
  kicker: 'Hero feature',
  name: 'Nova Sentinel',
  title: 'Nova Sentinel leads the weekly HeroIndex pulse',
  description:
    'A mock editorial spotlight for the v2 home experience, combining social traction, public trust, and highlight clips into one media hub.',
  sigil: 'NS',
  stats: ['98.7 Index', '24K Mentions', '4 Live Clips'],
}

export const mockTrendingHeroes = [
  { id: 'trend-1', name: 'Nova Sentinel', score: '98.7', move: '+4' },
  { id: 'trend-2', name: 'Onyx Vale', score: '96.2', move: '+7' },
  { id: 'trend-3', name: 'Sol Archer', score: '94.8', move: '+2' },
  { id: 'trend-4', name: 'Echo Riot', score: '91.5', move: '+11' },
]
