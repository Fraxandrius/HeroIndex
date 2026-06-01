export const mockNews = [
  {
    id: 'news-skyline-patrol-record',
    source: 'Sentinel Dispatch',
    handle: '@sentinelwire',
    createdAt: '2026-05-30T08:48:00.000Z',
    time: '12m',
    title: 'Nova Sentinel breaks the skyline patrol record',
    summary:
      'The north loop was cleared in under six minutes with zero civilian alerts triggered.',
    metric: '24.8K cheers',
    tag: 'City Watch',
    trendingScore: 98,
    movement: '+12',
  },
  {
    id: 'news-onyx-vale-drone-swarm',
    source: 'HeroIndex Studio',
    handle: '@heroindex',
    createdAt: '2026-05-30T08:26:00.000Z',
    time: '34m',
    title: 'Featured clip: Onyx Vale disables a rogue drone swarm',
    summary:
      'A clean shadow-step sequence is trending across tactical breakdown channels today.',
    metric: '8.2K reposts',
    tag: 'Clip Drop',
    inlinePlacementSlotId: 'news-inline',
    trendingScore: 91,
    movement: '+8',
  },
  {
    id: 'news-waterfront-rescue-chain',
    source: 'Karma Council',
    handle: '@karmawatch',
    createdAt: '2026-05-30T08:00:00.000Z',
    time: '1h',
    title: 'Community karma spikes after waterfront rescue chain',
    summary:
      'Local heroes coordinated shelter, transport, and medical triage in a single public thread.',
    metric: '+19 karma avg',
    tag: 'Reputation',
    trendingScore: 84,
    movement: '+5',
  },
]

export const mockNewsHighlights = mockNews.map((newsItem) => ({
  id: `${newsItem.id}-highlight`,
  placementSlotId: newsItem.inlinePlacementSlotId ?? null,
  title: newsItem.title,
  source: newsItem.source,
}))
