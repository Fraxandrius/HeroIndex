export const isGMMode = false

export const mockAds = [
  {
    slotId: 'home-sponsor',
    placement: 'home-feature-below',
    label: 'Homepage sponsor',
    aspectRatioLabel: 'Wide banner · 16:5',
    recommendedSize: '1280 × 400 px',
    imageUrl: '/favicon.svg',
    headline: 'Patrol-ready gear for elite city guardians',
    brand: 'Aegis Outfitters',
    body: 'Mock campaign card reserved for the primary Home sponsor placement.',
    active: true,
  },
  {
    slotId: 'sidebar-rail',
    placement: 'home-sidebar-rail',
    label: 'Sidebar rail sponsor',
    aspectRatioLabel: 'Rail card · 4:5',
    recommendedSize: '640 × 800 px',
    imageUrl: '/icons.svg',
    headline: 'Upgrade your command room signal',
    brand: 'Signal Tower Labs',
    body: 'A compact mock ad designed for the right column rail experience.',
    active: true,
  },
  {
    slotId: 'news-inline',
    placement: 'feed-inline-news',
    label: 'Inline news placement',
    aspectRatioLabel: 'Inline card · 3:2',
    recommendedSize: '900 × 600 px',
    imageUrl: '/favicon.svg',
    headline: 'Sponsored intel between live network updates',
    brand: 'Civic Watch Network',
    body: 'Mock inline placement that appears between social and news-style posts.',
    active: true,
  },
]

export const mockAdsBySlotId = mockAds.reduce(
  (adsBySlotId, ad) => ({
    ...adsBySlotId,
    [ad.slotId]: ad,
  }),
  {},
)

export function getActiveMockAdBySlotId(slotId) {
  const ad = mockAdsBySlotId[slotId]

  if (!ad?.active) {
    return null
  }

  return ad
}
