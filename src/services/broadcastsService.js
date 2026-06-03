import { onValue, push, ref, remove, set, update } from 'firebase/database'
import { getFirebaseClient } from '../firebase/firebaseClient.js'

export const BROADCASTS_PATH = 'broadcasts'

const fallbackBroadcasts = [
  {
    id: 'fallback-confidence-home-feature',
    title: 'Canal verificado HeroIndex',
    subtitle: 'Presencia pública organizada.',
    body: 'HeroIndex conecta a la ciudadanía con figuras verificadas dentro del ecosistema heroico moderno.',
    placement: 'home-feature',
    tone: 'institutional',
    category: 'Señal pública',
    active: true,
    priority: 90,
  },
  {
    id: 'fallback-active-network-home-rail',
    title: 'Red de protección activa',
    subtitle: 'Respuesta ejemplar para una ciudad en movimiento.',
    body: 'Cada intervención registrada fortalece la confianza pública y el estándar de seguridad HeroIndex.',
    placement: 'home-rail',
    tone: 'civic',
    category: 'Canal verificado',
    active: true,
    priority: 80,
  },
  {
    id: 'fallback-feed-home',
    title: 'Seguridad para el mañana',
    subtitle: 'Cobertura HeroIndex para una ciudadanía informada.',
    body: 'Las señales públicas verificadas ayudan a reconocer trayectorias, presencia y compromiso heroico.',
    placement: 'home-feed',
    tone: 'safety',
    category: 'Cobertura destacada',
    active: true,
    priority: 70,
  },
  {
    id: 'fallback-ranking-standard',
    title: 'Estándar HeroIndex',
    subtitle: 'La excelencia heroica, organizada para una ciudadanía más segura.',
    body: 'El estándar HeroIndex reconoce trayectoria, presencia pública y compromiso con la protección ciudadana.',
    placement: 'ranking-feature',
    tone: 'heroic',
    category: 'Señal destacada',
    active: true,
    priority: 85,
  },
  {
    id: 'fallback-ranking-rail',
    title: 'Referentes visibles',
    subtitle: 'Las figuras verificadas inspiran confianza.',
    body: 'La ciudadanía merece referentes heroicos visibles, activos y comprometidos con el orden público.',
    placement: 'ranking-rail',
    tone: 'institutional',
    category: 'Red de protección',
    active: true,
    priority: 65,
  },
  {
    id: 'fallback-profiles-feature',
    title: 'Tu presencia importa',
    subtitle: 'El reconocimiento comienza con visibilidad.',
    body: 'Los héroes verificados construyen confianza a través de actividad pública, trayectoria y compromiso.',
    placement: 'profiles-feature',
    tone: 'recruitment',
    category: 'Canal verificado',
    active: true,
    priority: 82,
  },
  {
    id: 'fallback-profiles-grid',
    title: 'Red oficial de protección',
    subtitle: 'Perfiles activos para una ciudad protegida.',
    body: 'Explora héroes verificados dentro de una red moderna de presencia pública y respuesta ejemplar.',
    placement: 'profiles-grid',
    tone: 'civic',
    category: 'Señal pública',
    active: true,
    priority: 62,
  },
  {
    id: 'fallback-hero-profile-rail',
    title: 'Perfil verificado por HeroIndex',
    subtitle: 'Presencia heroica confiable.',
    body: 'Una trayectoria pública visible fortalece la confianza ciudadana dentro del ecosistema certificado.',
    placement: 'hero-profile-rail',
    tone: 'heroic',
    category: 'Resumen HeroIndex',
    active: true,
    priority: 76,
  },
  {
    id: 'fallback-news-feature',
    title: 'Cobertura verificada',
    subtitle: 'Información pública para una ciudadanía protegida.',
    body: 'Respuesta activa, señales oficiales y actividad destacada dentro del ecosistema heroico certificado.',
    placement: 'news-feature',
    tone: 'civic',
    category: 'Noticias HeroIndex',
    active: true,
    priority: 84,
  },
  {
    id: 'fallback-news-feed',
    title: 'Actualización ciudadana',
    subtitle: 'Señales verificadas del ecosistema heroico.',
    body: 'HeroIndex organiza la actividad pública relevante para sostener una comunidad más informada y segura.',
    placement: 'news-feed',
    tone: 'safety',
    category: 'Alerta ciudadana',
    active: true,
    priority: 58,
  },
  {
    id: 'fallback-corporations-feature',
    title: 'Afiliación certificada',
    subtitle: 'Corporaciones que impulsan la nueva era heroica.',
    body: 'Infraestructura, innovación y liderazgo al servicio de una ciudadanía protegida.',
    placement: 'corporations-feature',
    tone: 'corporate',
    category: 'Alianzas certificadas',
    active: true,
    priority: 86,
  },
  {
    id: 'fallback-corporations-grid',
    title: 'Alianzas para el futuro',
    subtitle: 'Protección moderna con respaldo institucional.',
    body: 'Las organizaciones afiliadas fortalecen la red oficial de protección, respuesta y seguridad ciudadana.',
    placement: 'corporations-grid',
    tone: 'corporate',
    category: 'Infraestructura heroica',
    active: true,
    priority: 60,
  },
]

function sortBroadcasts(firstBroadcast, secondBroadcast) {
  const priorityDifference = Number(secondBroadcast.priority ?? 0) - Number(firstBroadcast.priority ?? 0)

  if (priorityDifference !== 0) return priorityDifference

  return Number(secondBroadcast.createdAt ?? 0) - Number(firstBroadcast.createdAt ?? 0)
}

function normalizeBroadcasts(snapshotValue) {
  if (!snapshotValue) return []

  return Object.entries(snapshotValue)
    .filter(([, item]) => item && typeof item === 'object')
    .map(([id, item]) => ({ id, ...item }))
    .sort(sortBroadcasts)
}

export function getFallbackBroadcasts(placement) {
  const items = placement
    ? fallbackBroadcasts.filter((broadcast) => broadcast.placement === placement)
    : fallbackBroadcasts

  return [...items].sort(sortBroadcasts)
}

export function subscribeToBroadcasts(callback, onError) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    callback?.([])
    return () => {}
  }

  return onValue(
    ref(database, BROADCASTS_PATH),
    (snapshot) => callback?.(normalizeBroadcasts(snapshot.val())),
    (error) => onError?.(error),
  )
}

export function subscribeToBroadcastsByPlacement(placement, callback, onError) {
  return subscribeToBroadcasts((items) => {
    const activeItems = items
      .filter((item) => item.active !== false && item.placement === placement)
      .sort(sortBroadcasts)

    callback?.(activeItems.length > 0 ? activeItems : getFallbackBroadcasts(placement))
  }, onError)
}

export async function createBroadcast(data) {
  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  const timestamp = Date.now()
  const itemRef = push(ref(database, BROADCASTS_PATH))
  const payload = {
    title: data.title ?? '',
    subtitle: data.subtitle ?? '',
    body: data.body ?? '',
    imageUrl: data.imageUrl ?? '',
    ctaLabel: data.ctaLabel ?? '',
    ctaUrl: data.ctaUrl ?? '',
    placement: data.placement ?? 'home-feature',
    tone: data.tone ?? 'institutional',
    category: data.category ?? '',
    corporationId: data.corporationId ?? '',
    heroId: data.heroId ?? '',
    active: data.active ?? true,
    priority: Number(data.priority ?? 0),
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await set(itemRef, payload)

  return { id: itemRef.key, ...payload }
}

export async function updateBroadcast(id, data) {
  const { database, isConfigured } = getFirebaseClient()

  if (!id) {
    throw new Error('Broadcast id is required')
  }

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  await update(ref(database, `${BROADCASTS_PATH}/${id}`), {
    ...data,
    priority: Number(data.priority ?? 0),
    updatedAt: Date.now(),
  })
}

export async function deleteBroadcast(id) {
  const { database, isConfigured } = getFirebaseClient()

  if (!id) {
    throw new Error('Broadcast id is required')
  }

  if (!isConfigured || !database) {
    throw new Error('Firebase is not configured')
  }

  await remove(ref(database, `${BROADCASTS_PATH}/${id}`))
}
