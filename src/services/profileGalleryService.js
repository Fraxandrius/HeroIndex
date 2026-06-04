import { equalTo, get, onValue, orderByChild, push, query, ref, remove, set, update } from 'firebase/database'
import { getFirebaseClient } from '../firebase/firebaseClient.js'
import { uploadImageWithPath } from './storageService.js'

export const PROFILE_GALLERY_PATH = 'profileGallery'
export const PROFILE_GALLERY_MAX_FILE_SIZE = 5 * 1024 * 1024

function requireClient() {
  const client = getFirebaseClient()
  if (!client.isConfigured || !client.database || !client.auth) throw new Error('La red HeroIndex no está disponible.')
  return client
}

function normalizeImage(id, image = {}) {
  return {
    id,
    heroId: String(image.heroId ?? ''),
    userId: String(image.userId ?? ''),
    imageUrl: String(image.imageUrl ?? ''),
    caption: String(image.caption ?? '').trim(),
    visibility: image.visibility === 'public' ? 'public' : 'private',
    isFeatured: image.isFeatured === true,
    createdAt: Number(image.createdAt ?? 0),
    updatedAt: Number(image.updatedAt ?? 0) || null,
  }
}

async function assertHeroOwnership(database, heroId, userId) {
  const [heroSnapshot, userSnapshot] = await Promise.all([
    get(ref(database, `heroes/${heroId}`)),
    get(ref(database, `users/${userId}`)),
  ])
  const hero = heroSnapshot.exists() ? heroSnapshot.val() : null
  const userProfile = userSnapshot.exists() ? userSnapshot.val() : null
  const ownsByHero = [hero?.ownerUid, hero?.createdByUid].filter(Boolean).map(String).includes(String(userId))
  const ownsByProfile = String(userProfile?.heroId ?? '') === String(heroId)

  if (!hero || (!ownsByHero && !ownsByProfile)) throw new Error('Solo el dueño del perfil puede gestionar esta galería.')
}

export function normalizeProfileGallerySnapshot(snapshotValue) {
  if (!snapshotValue) return []
  return Object.entries(snapshotValue)
    .filter(([, image]) => image && typeof image === 'object')
    .map(([id, image]) => normalizeImage(id, image))
    .sort((firstImage, secondImage) => secondImage.createdAt - firstImage.createdAt)
}

export function subscribeToProfileGalleryByHero(heroId, { onData, onError, publicOnly = false } = {}) {
  if (!heroId) { onData?.([]); return () => {} }
  const { database, isConfigured } = getFirebaseClient()
  if (!isConfigured || !database) { onData?.([]); return () => {} }
  const galleryQuery = query(ref(database, PROFILE_GALLERY_PATH), orderByChild('heroId'), equalTo(String(heroId)))
  return onValue(galleryQuery, (snapshot) => {
    const images = normalizeProfileGallerySnapshot(snapshot.val())
    onData?.(publicOnly ? images.filter((image) => image.visibility === 'public') : images)
  }, (error) => onError?.(error))
}

export async function getProfileGalleryByHero(heroId, { publicOnly = false } = {}) {
  if (!heroId) return []
  const { database, isConfigured } = getFirebaseClient()
  if (!isConfigured || !database) return []
  const snapshot = await get(query(ref(database, PROFILE_GALLERY_PATH), orderByChild('heroId'), equalTo(String(heroId))))
  const images = normalizeProfileGallerySnapshot(snapshot.val())
  return publicOnly ? images.filter((image) => image.visibility === 'public') : images
}

export async function uploadProfileGalleryImage(heroId, currentUserId, file) {
  if (!heroId || !currentUserId) throw new Error('Completa tu perfil heroico antes de construir tu galería pública.')
  if (!file?.type?.startsWith('image/')) throw new Error('El archivo debe ser una imagen válida.')
  if (file.size > PROFILE_GALLERY_MAX_FILE_SIZE) throw new Error('La imagen supera el tamaño permitido de 5 MB.')
  const { auth, database } = requireClient()
  if (!auth.currentUser || auth.currentUser.uid !== String(currentUserId)) throw new Error('No tienes permiso para gestionar esta galería.')
  await assertHeroOwnership(database, heroId, currentUserId)
  return uploadImageWithPath(file, `hero-media/${heroId}/gallery`)
}

export async function createProfileGalleryImage({ heroId, userId, imageUrl, caption = '' }) {
  if (!heroId || !userId) throw new Error('Completa tu perfil heroico antes de construir tu galería pública.')
  if (!String(imageUrl ?? '').trim()) throw new Error('Selecciona una imagen antes de añadirla a la galería.')
  const { auth, database } = requireClient()
  if (!auth.currentUser || auth.currentUser.uid !== String(userId)) throw new Error('No tienes permiso para gestionar esta galería.')
  await assertHeroOwnership(database, heroId, userId)
  const timestamp = Date.now()
  const imageReference = push(ref(database, PROFILE_GALLERY_PATH))
  const payload = { heroId: String(heroId), userId: String(userId), imageUrl: String(imageUrl).trim(), caption: String(caption).trim(), visibility: 'public', isFeatured: false, createdAt: timestamp, updatedAt: null }
  await set(imageReference, payload)
  return normalizeImage(imageReference.key, payload)
}

export async function deleteProfileGalleryImage(imageId, currentUserId) {
  const { auth, database } = requireClient()
  if (!imageId || !currentUserId || !auth.currentUser || auth.currentUser.uid !== String(currentUserId)) throw new Error('No tienes permiso para eliminar esta imagen.')
  const imageReference = ref(database, `${PROFILE_GALLERY_PATH}/${imageId}`)
  const snapshot = await get(imageReference)
  const image = snapshot.exists() ? normalizeImage(imageId, snapshot.val()) : null
  if (!image || image.userId !== String(currentUserId)) throw new Error('Solo puedes eliminar imágenes propias.')
  await remove(imageReference)
}

async function setGalleryImageAsHeroMedia(heroId, imageSource, currentUserId, field) {
  const { auth, database } = requireClient()
  if (!heroId || !imageSource || !currentUserId || !auth.currentUser || auth.currentUser.uid !== String(currentUserId)) throw new Error('No tienes permiso para actualizar esta imagen pública.')
  await assertHeroOwnership(database, heroId, currentUserId)
  const visualDefaults = field === 'coverUrl'
    ? { coverPositionX: 50, coverPositionY: 50, coverScale: 1 }
    : { avatarPositionX: 50, avatarPositionY: 50, avatarScale: 1 }
  await update(ref(database, `heroes/${heroId}`), { ...visualDefaults, [field]: String(imageSource), updatedAt: Date.now() })
}

export function setGalleryImageAsCover(heroId, imageSource, currentUserId) { return setGalleryImageAsHeroMedia(heroId, imageSource, currentUserId, 'coverUrl') }
export function setGalleryImageAsAvatar(heroId, imageSource, currentUserId) { return setGalleryImageAsHeroMedia(heroId, imageSource, currentUserId, 'avatarUrl') }
