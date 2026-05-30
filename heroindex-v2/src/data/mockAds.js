export const mockAdSlots = {
  homeSponsor: {
    id: 'home-sponsor',
    label: 'Homepage sponsor',
  },
  sidebarRail: {
    id: 'sidebar-rail',
    label: 'Sidebar rail sponsor',
  },
  newsInline: {
    id: 'news-inline',
    label: 'Inline news placement',
  },
}

export const mockAdSlotsById = Object.values(mockAdSlots).reduce(
  (slotsById, slot) => ({
    ...slotsById,
    [slot.id]: slot,
  }),
  {},
)
