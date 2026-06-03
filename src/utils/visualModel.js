export const VISUAL_DEFAULTS = {
  imageUrl: '',
  imagePositionX: 50,
  imagePositionY: 50,
  imageScale: 1,
  imageOverlayStrength: 0.35,
  altText: 'Visual institucional HeroIndex',
  active: true,
  eyebrow: '',
  title: '',
  subtitle: '',
  body: '',
  ctaLabel: '',
  ctaRoute: '',
}

function toFiniteNumber(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function normalizeVisualData(visualData) {
  const source = visualData ?? {}

  return {
    ...VISUAL_DEFAULTS,
    ...source,
    imageUrl: source.imageUrl || VISUAL_DEFAULTS.imageUrl,
    imagePositionX: toFiniteNumber(source.imagePositionX, VISUAL_DEFAULTS.imagePositionX),
    imagePositionY: toFiniteNumber(source.imagePositionY, VISUAL_DEFAULTS.imagePositionY),
    imageScale: toFiniteNumber(source.imageScale, VISUAL_DEFAULTS.imageScale),
    imageOverlayStrength: toFiniteNumber(
      source.imageOverlayStrength,
      VISUAL_DEFAULTS.imageOverlayStrength,
    ),
    altText: source.altText || VISUAL_DEFAULTS.altText,
    active: source.active !== false,
    eyebrow: source.eyebrow ?? VISUAL_DEFAULTS.eyebrow,
    title: source.title ?? VISUAL_DEFAULTS.title,
    subtitle: source.subtitle ?? VISUAL_DEFAULTS.subtitle,
    body: source.body ?? VISUAL_DEFAULTS.body,
    ctaLabel: source.ctaLabel ?? VISUAL_DEFAULTS.ctaLabel,
    ctaRoute: source.ctaRoute ?? VISUAL_DEFAULTS.ctaRoute,
  }
}

export function getVisualImageStyle(visualData) {
  const visual = normalizeVisualData(visualData)

  return {
    objectPosition: `${visual.imagePositionX}% ${visual.imagePositionY}%`,
    transform: `scale(${visual.imageScale})`,
  }
}

export function getVisualOverlayStyle(visualData) {
  const visual = normalizeVisualData(visualData)

  return {
    opacity: visual.imageOverlayStrength,
  }
}

export function getVisualBackgroundStyle(visualData) {
  const visual = normalizeVisualData(visualData)

  if (!visual.imageUrl) return undefined

  return {
    backgroundImage: `url(${visual.imageUrl})`,
    backgroundPosition: `${visual.imagePositionX}% ${visual.imagePositionY}%`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${Math.max(visual.imageScale, 1) * 100}% auto`,
  }
}