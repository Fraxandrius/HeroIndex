import {
  PUBLIC_CONTENT_DEFINITIONS,
  PUBLIC_CONTENT_FALLBACK_DEFINITION,
  getPublicContentDefinition,
  hasPublicContentDefinition,
} from './publicContentRegistry.js'

export const VISUAL_SLOT_DEFINITIONS = Object.fromEntries(
  Object.entries(PUBLIC_CONTENT_DEFINITIONS).filter(([, definition]) => definition.type !== 'signal'),
)

export const VISUAL_SLOT_FALLBACK_DEFINITION = PUBLIC_CONTENT_FALLBACK_DEFINITION

export function hasVisualSlotDefinition(slotId) {
  return hasPublicContentDefinition(slotId) && getPublicContentDefinition(slotId).type !== 'signal'
}

export function getVisualSlotDefinition(slotId) {
  const definition = getPublicContentDefinition(slotId)

  if (definition.type === 'signal') return VISUAL_SLOT_FALLBACK_DEFINITION

  return definition
}
