import { equalTo, get, onValue, orderByChild, push, query, ref, remove, set } from 'firebase/database'
import { getFirebaseClient } from '../firebase/firebaseClient.js'

export const PROFILE_POSTS_PATH = 'profilePosts'
export const PROFILE_POST_CONTENT_LIMIT = 800

function requireClient() {
  const client = getFirebaseClient()

  if (!client.isConfigured || !client.database || !client.auth) {
    throw new Error('La red HeroIndex no está disponible.')
  }

  return client
}

function normalizePost(id, post = {}) {
  return {
    id,
    heroId: String(post.heroId ?? ''),
    userId: String(post.userId ?? ''),
    authorAlias: post.authorAlias || 'Identidad HeroIndex',
    authorAvatarUrl: post.authorAvatarUrl || '',
    content: String(post.content ?? '').trim(),
    imageUrl: post.imageUrl || '',
    visibility: post.visibility === 'public' ? 'public' : 'private',
    type: post.type || 'hero-update',
    createdAt: Number(post.createdAt ?? 0),
    updatedAt: Number(post.updatedAt ?? 0) || null,
  }
}

export function normalizeProfilePostsSnapshot(snapshotValue) {
  if (!snapshotValue) return []

  return Object.entries(snapshotValue)
    .filter(([, post]) => post && typeof post === 'object')
    .map(([id, post]) => normalizePost(id, post))
    .sort((firstPost, secondPost) => secondPost.createdAt - firstPost.createdAt)
}

export function subscribeToProfilePostsByHero(heroId, { onData, onError, publicOnly = false } = {}) {
  if (!heroId) {
    onData?.([])
    return () => {}
  }

  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) {
    onData?.([])
    return () => {}
  }

  const postsQuery = query(ref(database, PROFILE_POSTS_PATH), orderByChild('heroId'), equalTo(String(heroId)))

  return onValue(
    postsQuery,
    (snapshot) => {
      const posts = normalizeProfilePostsSnapshot(snapshot.val())
      onData?.(publicOnly ? posts.filter((post) => post.visibility === 'public') : posts)
    },
    (error) => onError?.(error),
  )
}

export async function getProfilePostsByHero(heroId, { publicOnly = false } = {}) {
  if (!heroId) return []

  const { database, isConfigured } = getFirebaseClient()

  if (!isConfigured || !database) return []

  const postsQuery = query(ref(database, PROFILE_POSTS_PATH), orderByChild('heroId'), equalTo(String(heroId)))
  const snapshot = await get(postsQuery)
  const posts = normalizeProfilePostsSnapshot(snapshot.val())

  return publicOnly ? posts.filter((post) => post.visibility === 'public') : posts
}

export async function createProfilePost({ heroId, userId, authorAlias, authorAvatarUrl = '', content, imageUrl = '' }) {
  const trimmedContent = String(content ?? '').trim()

  if (!heroId || !userId) throw new Error('Completa tu perfil heroico antes de publicar actualizaciones.')
  if (!trimmedContent) throw new Error('Escribe una actualización antes de publicar.')
  if (trimmedContent.length > PROFILE_POST_CONTENT_LIMIT) throw new Error(`La actualización no puede superar ${PROFILE_POST_CONTENT_LIMIT} caracteres.`)

  const { auth, database } = requireClient()

  if (!auth.currentUser || auth.currentUser.uid !== String(userId)) {
    throw new Error('No tienes permiso para publicar en este perfil.')
  }

  const [heroSnapshot, userSnapshot] = await Promise.all([
    get(ref(database, `heroes/${heroId}`)),
    get(ref(database, `users/${userId}`)),
  ])
  const hero = heroSnapshot.exists() ? heroSnapshot.val() : null
  const userProfile = userSnapshot.exists() ? userSnapshot.val() : null
  const ownsByHero = [hero?.ownerUid, hero?.createdByUid].filter(Boolean).map(String).includes(String(userId))
  const ownsByProfile = String(userProfile?.heroId ?? '') === String(heroId)

  if (!hero || (!ownsByHero && !ownsByProfile)) {
    throw new Error('Solo el dueño del perfil puede publicar actualizaciones para este héroe.')
  }

  const timestamp = Date.now()
  const postReference = push(ref(database, PROFILE_POSTS_PATH))
  const payload = {
    heroId: String(heroId),
    userId: String(userId),
    authorAlias: String(authorAlias || 'Identidad HeroIndex').trim(),
    authorAvatarUrl: String(authorAvatarUrl || '').trim(),
    content: trimmedContent,
    imageUrl: String(imageUrl || '').trim(),
    visibility: 'public',
    type: 'hero-update',
    createdAt: timestamp,
    updatedAt: null,
  }

  await set(postReference, payload)

  return normalizePost(postReference.key, payload)
}

export async function deleteProfilePost(postId, currentUserId) {
  if (!postId || !currentUserId) throw new Error('No fue posible validar la publicación.')

  const { auth, database } = requireClient()

  if (!auth.currentUser || auth.currentUser.uid !== String(currentUserId)) {
    throw new Error('No tienes permiso para eliminar esta publicación.')
  }

  const postReference = ref(database, `${PROFILE_POSTS_PATH}/${postId}`)
  const snapshot = await get(postReference)
  const post = snapshot.exists() ? normalizePost(postId, snapshot.val()) : null

  if (!post || post.userId !== String(currentUserId)) {
    throw new Error('Solo puedes eliminar publicaciones propias.')
  }

  await remove(postReference)
}
