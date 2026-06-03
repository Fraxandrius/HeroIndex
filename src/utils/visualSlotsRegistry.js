export const VISUAL_SLOT_DEFINITIONS = {
  sidebarAccountVisual: {
    id: 'sidebarAccountVisual',
    label: 'Visual lateral de acceso',
    placementLabel: 'Sidebar / Acceso',
    recommendedWidth: 800,
    recommendedHeight: 1000,
    aspectRatioLabel: '4:5',
    aspectRatio: '4 / 5',
    helperText: 'Ideal para piezas verticales o llamados de registro.',
    allowOverlayText: false,
  },
  homePrimarySignal: {
    id: 'homePrimarySignal',
    label: 'Señal principal horizontal',
    placementLabel: 'Inicio / Franja superior',
    recommendedWidth: 1920,
    recommendedHeight: 480,
    aspectRatioLabel: '4:1',
    aspectRatio: '4 / 1',
    helperText: 'Ideal para visuales panorámicos. Las imágenes fuera de proporción pueden recortarse.',
    allowOverlayText: true,
  },
  homeInstitutionalSignal: {
    id: 'homeInstitutionalSignal',
    label: 'Señal institucional',
    placementLabel: 'Inicio / Bloque institucional',
    recommendedWidth: 1600,
    recommendedHeight: 500,
    aspectRatioLabel: '16:5',
    aspectRatio: '16 / 5',
    helperText: 'Ideal para mensajes institucionales con imagen horizontal.',
    allowOverlayText: true,
  },
  profileCover: {
    id: 'profileCover',
    label: 'Portada de perfil',
    placementLabel: 'Mi Perfil / Portada',
    recommendedWidth: 1600,
    recommendedHeight: 500,
    aspectRatioLabel: '3.2:1',
    aspectRatio: '16 / 5',
    helperText: 'Ideal para fondos amplios detrás del héroe.',
    allowOverlayText: false,
  },
  profileAvatar: {
    id: 'profileAvatar',
    label: 'Foto de perfil',
    placementLabel: 'Mi Perfil / Avatar',
    recommendedWidth: 800,
    recommendedHeight: 800,
    aspectRatioLabel: '1:1',
    aspectRatio: '1 / 1',
    helperText: 'Ideal para imagen cuadrada centrada.',
    allowOverlayText: false,
  },
}

export const VISUAL_SLOT_FALLBACK_DEFINITION = {
  id: 'visualSlot',
  label: 'Slot visual',
  placementLabel: 'Ubicación visual',
  recommendedWidth: 1200,
  recommendedHeight: 600,
  aspectRatioLabel: '2:1',
  aspectRatio: '2 / 1',
  helperText: 'Las imágenes fuera de esta proporción pueden recortarse. Usa posición y zoom para ajustar el encuadre.',
  allowOverlayText: false,
}

export function hasVisualSlotDefinition(slotId) {
  return Boolean(VISUAL_SLOT_DEFINITIONS[slotId])
}

export function getVisualSlotDefinition(slotId) {
  return VISUAL_SLOT_DEFINITIONS[slotId] ?? {
    ...VISUAL_SLOT_FALLBACK_DEFINITION,
    id: slotId || VISUAL_SLOT_FALLBACK_DEFINITION.id,
  }
}
