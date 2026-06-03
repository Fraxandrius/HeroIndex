const warnedMissingDefinitions = new Set()

function createDefinition({
  allowImage = true,
  allowOverlay = true,
  allowText = false,
  typeLabel,
  ...definition
}) {
  return {
    allowImage,
    allowOverlay,
    allowText,
    allowTextContent: allowText,
    typeLabel: typeLabel ?? getTypeLabel(definition.type),
    ...definition,
  }
}

function getTypeLabel(type) {
  if (type === 'signal') return 'Señal Pública'
  if (type === 'profileVisual') return 'Visual de Perfil'
  if (type === 'editorialImage') return 'Imagen editorial'
  if (type === 'cardVisual') return 'Visual de card'
  return 'Visual Publicitario'
}

export const PUBLIC_CONTENT_DEFINITIONS = {
  sidebarAccessVisual: createDefinition({
    id: 'sidebarAccessVisual',
    legacyId: 'sidebarAccountVisual',
    type: 'visual',
    label: 'Visual lateral de acceso',
    placementLabel: 'Sidebar / Acceso',
    recommendedWidth: 800,
    recommendedHeight: 1000,
    aspectRatio: '4 / 5',
    aspectRatioLabel: '4:5',
    helperText: 'Ideal para piezas verticales o llamados de registro.',
    allowText: false,
    visualMode: 'vertical-rail',
  }),
  sidebarAccountVisual: createDefinition({
    id: 'sidebarAccountVisual',
    type: 'visual',
    label: 'Visual lateral de acceso heredado',
    placementLabel: 'Sidebar / Acceso',
    recommendedWidth: 800,
    recommendedHeight: 1000,
    aspectRatio: '4 / 5',
    aspectRatioLabel: '4:5',
    helperText: 'Definición heredada del visual lateral. Usa piezas verticales o llamados de registro.',
    allowText: false,
    visualMode: 'vertical-rail',
  }),
  homeWideVisual: createDefinition({
    id: 'homeWideVisual',
    type: 'visual',
    label: 'Visual horizontal principal',
    placementLabel: 'Inicio / Franja visual',
    recommendedWidth: 1920,
    recommendedHeight: 480,
    aspectRatio: '4 / 1',
    aspectRatioLabel: '4:1',
    helperText: 'Ideal para piezas panorámicas. Mantén el texto importante al centro.',
    allowText: false,
    visualMode: 'wide-strip',
  }),
  homePrimarySignal: createDefinition({
    id: 'homePrimarySignal',
    type: 'signal',
    label: 'Señal pública principal',
    placementLabel: 'Inicio / Señales Públicas',
    recommendedWidth: 1600,
    recommendedHeight: 700,
    aspectRatio: '16 / 7',
    aspectRatioLabel: '16:7',
    helperText: 'Ideal para anuncios con texto e imagen opcional.',
    allowText: true,
    visualMode: 'feature-card',
  }),
  homeSecondarySignal: createDefinition({
    id: 'homeSecondarySignal',
    type: 'signal',
    label: 'Señal pública secundaria',
    placementLabel: 'Inicio / Señales Públicas',
    recommendedWidth: 1200,
    recommendedHeight: 600,
    aspectRatio: '2 / 1',
    aspectRatioLabel: '2:1',
    helperText: 'Ideal para comunicados compactos con texto o imagen.',
    allowText: true,
    visualMode: 'feature-card',
  }),
  rankingFeaturedSignal: createDefinition({
    id: 'rankingFeaturedSignal',
    type: 'visual',
    label: 'Visual destacado de ranking',
    placementLabel: 'Ranking / Franja destacada',
    recommendedWidth: 1920,
    recommendedHeight: 360,
    aspectRatio: '16 / 3',
    aspectRatioLabel: '16:3',
    helperText: 'Ideal para piezas horizontales anchas. Mantén el contenido importante centrado verticalmente.',
    allowText: false,
    visualMode: 'wide-strip',
  }),
  'ranking-feature-visual': createDefinition({
    id: 'ranking-feature-visual',
    type: 'visual',
    label: 'Visual destacado de ranking',
    placementLabel: 'Ranking / Franja destacada',
    recommendedWidth: 1920,
    recommendedHeight: 360,
    aspectRatio: '16 / 3',
    aspectRatioLabel: '16:3',
    helperText: 'Ideal para piezas horizontales anchas. Mantén el contenido importante centrado verticalmente.',
    allowText: false,
    visualMode: 'wide-strip',
  }),
  rankingPublicSignal: createDefinition({
    id: 'rankingPublicSignal',
    type: 'signal',
    label: 'Señal pública de ranking',
    placementLabel: 'Ranking / Señal destacada',
    recommendedWidth: 1200,
    recommendedHeight: 600,
    aspectRatio: '2 / 1',
    aspectRatioLabel: '2:1',
    helperText: 'Ideal para comunicar cambios, rachas o reconocimientos del ranking.',
    allowText: true,
    visualMode: 'feature-card',
  }),
  'profiles-feature-visual': createDefinition({
    id: 'profiles-feature-visual',
    type: 'visual',
    label: 'Visual destacado de perfiles',
    placementLabel: 'Perfiles / Franja destacada',
    recommendedWidth: 1920,
    recommendedHeight: 520,
    aspectRatio: '24 / 7',
    aspectRatioLabel: '24:7',
    helperText: 'Ideal para una franja amplia de catálogo de perfiles.',
    allowText: false,
    visualMode: 'wide-strip',
  }),
  'corporations-feature-visual': createDefinition({
    id: 'corporations-feature-visual',
    type: 'visual',
    label: 'Visual destacado de corporaciones',
    placementLabel: 'Corporaciones / Cabecera',
    recommendedWidth: 1920,
    recommendedHeight: 540,
    aspectRatio: '32 / 9',
    aspectRatioLabel: '32:9',
    helperText: 'Ideal para una cabecera corporativa horizontal.',
    allowText: false,
    visualMode: 'wide-strip',
  }),
  'hero-profile-feature-visual': createDefinition({
    id: 'hero-profile-feature-visual',
    type: 'visual',
    label: 'Visual destacado de perfil público',
    placementLabel: 'Perfil público / Canal verificado',
    recommendedWidth: 1400,
    recommendedHeight: 520,
    aspectRatio: '14 / 5',
    aspectRatioLabel: '14:5',
    helperText: 'Ideal para una pieza horizontal dentro del perfil público.',
    allowText: false,
    visualMode: 'feature-card',
  }),
  profileCover: createDefinition({
    id: 'profileCover',
    type: 'profileVisual',
    label: 'Portada de perfil',
    placementLabel: 'Mi Perfil / Portada',
    recommendedWidth: 1600,
    recommendedHeight: 500,
    aspectRatio: '16 / 5',
    aspectRatioLabel: '16:5',
    helperText: 'Ideal para una imagen amplia detrás del héroe.',
    allowText: false,
    allowOverlay: true,
    visualMode: 'profile-cover',
  }),
  profileAvatar: createDefinition({
    id: 'profileAvatar',
    type: 'profileVisual',
    label: 'Foto de perfil',
    placementLabel: 'Mi Perfil / Avatar',
    recommendedWidth: 800,
    recommendedHeight: 800,
    aspectRatio: '1 / 1',
    aspectRatioLabel: '1:1',
    helperText: 'Usa una imagen cuadrada y centrada.',
    allowText: false,
    allowOverlay: false,
    visualMode: 'square-avatar',
  }),
}

export const PUBLIC_CONTENT_FALLBACK_DEFINITION = createDefinition({
  id: 'publicContent',
  type: 'visual',
  label: 'Slot visual sin definir',
  placementLabel: 'Ubicación sin definir',
  recommendedWidth: 1200,
  recommendedHeight: 600,
  aspectRatio: '2 / 1',
  aspectRatioLabel: '2:1',
  helperText: 'Este espacio usa una definición genérica. Agrega su slotId al registry.',
  allowText: false,
  allowOverlay: true,
  visualMode: 'feature-card',
})

export function hasPublicContentDefinition(contentId) {
  return Boolean(PUBLIC_CONTENT_DEFINITIONS[contentId])
}

export function getPublicContentDefinition(contentId) {
  const definition = PUBLIC_CONTENT_DEFINITIONS[contentId]

  if (definition) return definition

  if (import.meta.env.DEV && !warnedMissingDefinitions.has(contentId || 'sin-slotId')) {
    warnedMissingDefinitions.add(contentId || 'sin-slotId')
    console.warn('[HeroIndex] Visual slot sin definición:', contentId)
  }

  return {
    ...PUBLIC_CONTENT_FALLBACK_DEFINITION,
    id: contentId || PUBLIC_CONTENT_FALLBACK_DEFINITION.id,
  }
}
