export const mockHeroes = [
  {
    id: 'nova-sentinel',
    alias: 'Nova Sentinel',
    publicName: 'Nova Sentinel',
    codename: 'NS-01',
    heroTitle: 'Centinela Dorado',
    name: 'Nova Sentinel',
    corporationId: 'aegis-dynamics',
    approval: 98.7,
    rankingPoints: 128,
    publicPowers: ['Vuelo orbital', 'Escudos de evacuación', 'Rescate de alta velocidad'],
    publicBio:
      'Figura de respuesta aérea reconocida por evacuaciones rápidas y coordinación visible en zonas urbanas.',
    powerClass: 'S',
    description:
      'Figura de respuesta aérea reconocida por evacuaciones rápidas y coordinación visible en zonas urbanas.',
    powers: ['Vuelo orbital', 'Escudos de evacuación', 'Rescate de alta velocidad'],
    visiblePowers: ['Vuelo orbital', 'Escudos de evacuación', 'Rescate de alta velocidad'],
    avatarUrl: '',
    bannerUrl: '',
    active: true,
    createdAt: '2026-05-30T00:00:00.000Z',
    updatedAt: '2026-05-30T00:00:00.000Z',
  },
  {
    id: 'onyx-vale',
    alias: 'Onyx Vale',
    publicName: 'Onyx Vale',
    codename: 'OV-17',
    heroTitle: 'Vigilante Espectral',
    name: 'Onyx Vale',
    corporationId: 'umbra-works',
    approval: 96.2,
    rankingPoints: 116,
    publicPowers: ['Paso sombrío', 'Contención táctica', 'Intercepción silenciosa'],
    publicBio:
      'Especialista de intervención discreta con presencia destacada en contención de enjambres automatizados.',
    powerClass: 'A',
    description:
      'Especialista de intervención discreta con presencia destacada en contención de enjambres automatizados.',
    powers: ['Paso sombrío', 'Contención táctica', 'Intercepción silenciosa'],
    visiblePowers: ['Paso sombrío', 'Contención táctica', 'Intercepción silenciosa'],
    avatarUrl: '',
    bannerUrl: '',
    active: true,
    createdAt: '2026-05-30T00:00:00.000Z',
    updatedAt: '2026-05-30T00:00:00.000Z',
  },
  {
    id: 'sol-archer',
    alias: 'Sol Archer',
    publicName: 'Sol Archer',
    codename: 'SUN-09',
    heroTitle: 'Héroe Ígneo',
    name: 'Sol Archer',
    corporationId: 'helios-league',
    approval: 94.8,
    rankingPoints: 104,
    publicPowers: ['Arquería solar', 'Cobertura de rescate', 'Contención luminosa'],
    publicBio:
      'Especialista solar de precisión reconocido por cobertura de rescate y respuesta ejemplar a distancia.',
    powerClass: 'A',
    description:
      'Especialista solar de precisión reconocido por cobertura de rescate y respuesta ejemplar a distancia.',
    powers: ['Arquería solar', 'Cobertura de rescate', 'Contención luminosa'],
    visiblePowers: ['Arquería solar', 'Cobertura de rescate', 'Contención luminosa'],
    avatarUrl: '',
    bannerUrl: '',
    active: true,
    createdAt: '2026-05-30T00:00:00.000Z',
    updatedAt: '2026-05-30T00:00:00.000Z',
  },
  {
    id: 'echo-riot',
    alias: 'Echo Riot',
    publicName: 'Echo Riot',
    codename: 'ER-22',
    heroTitle: 'Protector Sónico',
    name: 'Echo Riot',
    corporationId: 'sonic-front',
    approval: 91.5,
    rankingPoints: 92,
    publicPowers: ['Escudos resonantes', 'Control de multitudes', 'Respuesta acústica'],
    publicBio:
      'Táctico de respuesta urbana conocido por escudos de resonancia y actividad destacada en ejercicios costeros.',
    powerClass: 'B',
    description:
      'Táctico de respuesta urbana conocido por escudos de resonancia y actividad destacada en ejercicios costeros.',
    powers: ['Escudos resonantes', 'Control de multitudes', 'Respuesta acústica'],
    visiblePowers: ['Escudos resonantes', 'Control de multitudes', 'Respuesta acústica'],
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
