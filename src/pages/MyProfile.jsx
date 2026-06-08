import { useEffect, useMemo, useRef, useState } from 'react'
import VisualImageEditor from '../components/visual/VisualImageEditor.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useCorporations } from '../hooks/useCorporations.js'
import { useProfileGallery } from '../hooks/useProfileGallery.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { useProfilePosts } from '../hooks/useProfilePosts.js'
import { createHero, updateHero, uploadHeroMediaImage } from '../services/heroesService.js'
import { createProfilePost, deleteProfilePost, PROFILE_POST_CONTENT_LIMIT } from '../services/profilePostsService.js'
import { createProfileGalleryImage, deleteProfileGalleryImage, PROFILE_GALLERY_MAX_FILE_SIZE, setGalleryImageAsAvatar, setGalleryImageAsCover, uploadProfileGalleryImage } from '../services/profileGalleryService.js'
import { updateUserProfile } from '../services/authService.js'
import { canSeeOraculoTools } from '../utils/roles.js'

const tabItems = [
  { id: 'actividad', label: 'Actividad' },
  { id: 'presentacion', label: 'Presentación' },
  { id: 'galeria', label: 'Galería' },
  { id: 'poderes', label: 'Poderes' },
  { id: 'apariencia', label: 'Apariencia' },
  { id: 'cuenta', label: 'Cuenta' },
]

const defaultHeroDraft = {
  alias: '',
  heroTitle: '',
  publicBio: '',
  publicQuote: '',
  affiliationLabel: '',
  visibility: 'public',
  publicPowers: '',
  publicSpecialty: '',
  publicAbilities: '',
  publicLimitations: '',
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function listToText(value) {
  return normalizeList(value).join(', ')
}

function getHeroDisplayName(hero = {}, userProfile = {}) {
  const profile = userProfile ?? {}

  return (
    hero.alias ||
    hero.publicName ||
    hero.codename ||
    hero.name ||
    profile.heroName ||
    profile.displayName ||
    'Identidad HeroIndex'
  )
}

function getHeroTitle(hero = {}) {
  return hero.heroTitle || 'Figura HeroIndex'
}

function getInitials(value = '') {
  return (
    value
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('') || 'HI'
  )
}

function formatNumber(value) {
  const numberValue = Number(value ?? 0)

  return Number.isNaN(numberValue) ? '0' : numberValue.toLocaleString('es')
}

function formatPostDate(value) {
  if (!value) return 'Actualización reciente'

  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function createDraftFromHero(hero = {}, userProfile = {}) {
  const profile = userProfile ?? {}

  return {
    alias: hero.alias ?? hero.publicName ?? profile.heroName ?? profile.displayName ?? '',
    heroTitle: hero.heroTitle ?? '',
    publicBio: hero.publicBio ?? '',
    publicQuote: hero.publicQuote ?? hero.tagline ?? '',
    affiliationLabel: hero.affiliationLabel ?? hero.corporationName ?? '',
    visibility: hero.visibility ?? 'public',
    publicPowers: listToText(hero.publicPowers ?? hero.visiblePowers),
    publicSpecialty: hero.publicSpecialty ?? hero.specialty ?? '',
    publicAbilities: hero.publicAbilities ?? hero.abilitiesDescription ?? '',
    publicLimitations: hero.publicLimitations ?? hero.styleNotes ?? '',
  }
}

function getCoverUrl(hero = {}, mediaOverrides = {}) {
  return mediaOverrides.coverUrl ?? hero.coverUrl ?? hero.imageUrl ?? hero.visualUrl ?? ''
}

function getCoverVisual(hero = {}, mediaOverrides = {}) {
  return {
    imageUrl: getCoverUrl(hero, mediaOverrides),
    imagePositionX: mediaOverrides.coverPositionX ?? hero.coverPositionX ?? 50,
    imagePositionY: mediaOverrides.coverPositionY ?? hero.coverPositionY ?? 50,
    imageScale: mediaOverrides.coverScale ?? hero.coverScale ?? 1,
    imageOverlayStrength: mediaOverrides.coverOverlayStrength ?? hero.coverOverlayStrength ?? 0.35,
    altText: `Portada de ${getHeroDisplayName(hero)}`,
    active: true,
  }
}

function getAvatarVisual(hero = {}, mediaOverrides = {}) {
  return {
    imageUrl: mediaOverrides.avatarUrl ?? hero.avatarUrl ?? '',
    imagePositionX: mediaOverrides.avatarPositionX ?? hero.avatarPositionX ?? 50,
    imagePositionY: mediaOverrides.avatarPositionY ?? hero.avatarPositionY ?? 50,
    imageScale: mediaOverrides.avatarScale ?? hero.avatarScale ?? 1,
    imageOverlayStrength: 0,
    altText: `Foto de ${getHeroDisplayName(hero)}`,
    active: true,
  }
}

function MyProfile({ onNavigate }) {
  const { currentUser, isLoggedIn, loading: authLoading, logout, userProfile } = useAuth()
  const { heroes, loading: heroesLoading, error: heroesError } = useHeroes()
  const { getCorporationById, loading: corporationsLoading, error: corporationsError } = useCorporations()
  const [activeTab, setActiveTab] = useState('actividad')
  const [draftPatch, setDraftPatch] = useState({})
  const [createdHeroId, setCreatedHeroId] = useState('')
  const [mediaOverrides, setMediaOverrides] = useState({})
  const [editorTarget, setEditorTarget] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [postDraft, setPostDraft] = useState('')
   const [postImageUrl, setPostImageUrl] = useState('')
  const [isPublishingPost, setIsPublishingPost] = useState(false)
  const [deletingPostId, setDeletingPostId] = useState('')
  const [postMessage, setPostMessage] = useState('')
  const [postError, setPostError] = useState('')
  const [galleryFile, setGalleryFile] = useState(null)
  const [galleryImageUrl, setGalleryImageUrl] = useState('')
  const [galleryCaption, setGalleryCaption] = useState('')
  const [galleryDropActive, setGalleryDropActive] = useState(false)
  const [galleryBusyId, setGalleryBusyId] = useState('')
  const [galleryMessage, setGalleryMessage] = useState('')
  const [galleryError, setGalleryError] = useState('')
  const galleryFileInputRef = useRef(null)

  const accountHeroId = createdHeroId || userProfile?.heroId || ''
  const { error: postsError, loading: postsLoading, posts: profilePosts } = useProfilePosts(accountHeroId)
  const { error: galleryLoadError, loading: galleryLoading, images: galleryImages } = useProfileGallery(accountHeroId)
  const hero = useMemo(
    () => heroes.find((item) => String(item.id) === String(accountHeroId)),
    [accountHeroId, heroes],
  )
  const isCreating = !accountHeroId
  const isLoading = authLoading || (!isCreating && (heroesLoading || corporationsLoading))
  const canViewOraculoLayer = canSeeOraculoTools(userProfile)
  const draft = { ...defaultHeroDraft, ...createDraftFromHero(hero, userProfile), ...draftPatch }
  const displayHero = { ...hero, ...draft, ...mediaOverrides }
  const displayName = getHeroDisplayName(displayHero, userProfile)
  const corporation = hero?.corporationId ? getCorporationById(hero.corporationId) : null
  const corporationName = corporation?.name ?? draft.affiliationLabel ?? hero?.corporationName ?? 'Independiente'
  const coverVisual = getCoverVisual(displayHero, mediaOverrides)
  const avatarVisual = getAvatarVisual(displayHero, mediaOverrides)
  const loadError = heroesError || corporationsError
  const tabs = tabItems
  const visiblePowers = normalizeList(draft.publicPowers)
  const galleryPreviewUrl = useMemo(() => galleryFile ? URL.createObjectURL(galleryFile) : galleryImageUrl.trim(), [galleryFile, galleryImageUrl])

  useEffect(() => () => { if (galleryFile && galleryPreviewUrl) URL.revokeObjectURL(galleryPreviewUrl) }, [galleryFile, galleryPreviewUrl])

  const updateDraft = (field, value) => {
    setDraftPatch((currentDraft) => ({ ...currentDraft, [field]: value }))
  }

  const buildHeroPayload = () => {
    const alias = draft.alias.trim()

    return {
      alias,
      heroTitle: draft.heroTitle.trim(),
      publicBio: draft.publicBio.trim(),
      publicQuote: draft.publicQuote.trim(),
      affiliationLabel: draft.affiliationLabel.trim(),
      visibility: draft.visibility || 'public',
      publicPowers: normalizeList(draft.publicPowers),
      publicSpecialty: draft.publicSpecialty.trim(),
      publicAbilities: draft.publicAbilities.trim(),
      publicLimitations: draft.publicLimitations.trim(),
    }
  }

  const ensureHeroProfile = async () => {
    if (accountHeroId) return accountHeroId

    if (!currentUser?.uid) {
      throw new Error('Necesitas iniciar sesión para crear tu perfil heroico.')
    }

    const payload = buildHeroPayload()
    const fallbackAlias = userProfile?.heroName || userProfile?.displayName || userProfile?.username || 'Nuevo héroe'
    const createdHero = await createHero({
      ...payload,
      alias: payload.alias || fallbackAlias,
      active: true,
      createdByUid: currentUser.uid,
      isPlayerHero: true,
      ownerUid: currentUser.uid,
      visibility: payload.visibility || 'public',
    })

    await updateUserProfile(currentUser.uid, {
      avatarUrl: userProfile?.avatarUrl ?? '',
      displayName: userProfile?.displayName || createdHero.alias,
      heroId: createdHero.id,
      heroName: createdHero.alias,
    })

    setCreatedHeroId(createdHero.id)
    setMessage('Perfil heroico creado.')

    return createdHero.id
  }

  const handleSaveProfile = async () => {
    if (!isLoggedIn || !currentUser?.uid) {
      setErrorMessage('Inicia sesión para guardar Mi Perfil.')
      return
    }

    const payload = buildHeroPayload()

    if (!payload.alias) {
      setErrorMessage('Ingresa un nombre de héroe o alias.')
      setActiveTab('presentacion')
      return
    }

    setIsSaving(true)
    setMessage('Guardando…')
    setErrorMessage('')

    try {
      if (isCreating) {
        const nextHeroId = await ensureHeroProfile()
        await updateHero(nextHeroId, payload)
      } else {
        await updateHero(accountHeroId, payload)
        await updateUserProfile(currentUser.uid, {
          avatarUrl: avatarVisual.imageUrl || userProfile?.avatarUrl || '',
          displayName: userProfile?.displayName || payload.alias,
          heroId: accountHeroId,
          heroName: payload.alias,
        })
        setMessage('Perfil actualizado.')
      }

      setDraftPatch({})
    } catch {
      setMessage('')
      setErrorMessage('No se pudo guardar. Intenta nuevamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveMedia = async ({ file, visual }) => {
    const nextHeroId = await ensureHeroProfile()
    const isCover = editorTarget === 'cover'
    const uploadChannel = isCover ? 'cover' : 'avatar'
    const uploadedMedia = file ? await uploadHeroMediaImage(nextHeroId, uploadChannel, file) : null

    if (isCover) {
      const coverPayload = {
        coverUrl: uploadedMedia?.imageUrl ?? coverVisual.imageUrl,
        coverPositionX: Number(visual.imagePositionX ?? 50),
        coverPositionY: Number(visual.imagePositionY ?? 50),
        coverScale: Number(visual.imageScale ?? 1),
        coverOverlayStrength: Number(visual.imageOverlayStrength ?? 0.35),
      }

      await updateHero(nextHeroId, coverPayload)
      setMediaOverrides((currentMedia) => ({ ...currentMedia, ...coverPayload }))
      setMessage('Portada actualizada.')
    } else {
      const avatarPayload = {
        avatarUrl: uploadedMedia?.imageUrl ?? avatarVisual.imageUrl,
        avatarPositionX: Number(visual.imagePositionX ?? 50),
        avatarPositionY: Number(visual.imagePositionY ?? 50),
        avatarScale: Number(visual.imageScale ?? 1),
      }

      await updateHero(nextHeroId, avatarPayload)

      if (currentUser?.uid) {
        await updateUserProfile(currentUser.uid, {
          avatarUrl: avatarPayload.avatarUrl,
          displayName: userProfile?.displayName || draft.alias || displayName,
          heroId: nextHeroId,
          heroName: draft.alias || displayName,
        })
      }

      setMediaOverrides((currentMedia) => ({ ...currentMedia, ...avatarPayload }))
      setMessage('Foto actualizada.')
    }
  }

  const handlePublishUpdate = async () => {
    if (!accountHeroId) {
      setPostError('Completa tu perfil heroico antes de publicar actualizaciones.')
      return
    }

    if (!postDraft.trim() || !currentUser?.uid) return

    setIsPublishingPost(true)
    setPostError('')
    setPostMessage('Publicando actualización…')

    try {
      await createProfilePost({
        heroId: accountHeroId,
        userId: currentUser.uid,
        authorAlias: displayName,
        authorAvatarUrl: avatarVisual.imageUrl,
        content: postDraft,
        imageUrl: postImageUrl,
      })
      setPostDraft('')
      setPostImageUrl('')
      setPostMessage('Actualización publicada.')
    } catch (error) {
      setPostMessage('')
      setPostError(error?.message || 'No fue posible publicar la actualización.')
    } finally {
      setIsPublishingPost(false)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!currentUser?.uid || !window.confirm('Eliminar esta actualización pública.')) return

    setDeletingPostId(postId)
    setPostError('')

    try {
      await deleteProfilePost(postId, currentUser.uid)
      setPostMessage('Actualización eliminada.')
    } catch (error) {
      setPostError(error?.message || 'No fue posible eliminar la actualización.')
    } finally {
      setDeletingPostId('')
    }
  }

  const selectGalleryFile = (file) => {
    setGalleryError('')
    if (!file?.type?.startsWith('image/')) { setGalleryFile(null); setGalleryError('El archivo debe ser una imagen válida.'); return }
    if (file.size > PROFILE_GALLERY_MAX_FILE_SIZE) { setGalleryFile(null); setGalleryError('La imagen supera el tamaño permitido de 5 MB.'); return }
    setGalleryFile(file)
    setGalleryImageUrl('')
  }

  const resetGalleryComposer = () => {
    setGalleryFile(null)
    setGalleryImageUrl('')
    setGalleryCaption('')
    if (galleryFileInputRef.current) galleryFileInputRef.current.value = ''
  }

  const handleAddGalleryImage = async () => {
    if (!accountHeroId || !currentUser?.uid) { setGalleryError('Completa tu perfil heroico antes de construir tu galería pública.'); return }
    if (!galleryFile && !galleryImageUrl.trim()) { setGalleryError('Selecciona una imagen antes de añadirla a la galería.'); return }
    setGalleryBusyId('create'); setGalleryError(''); setGalleryMessage('Añadiendo imagen…')
    try {
      const uploaded = galleryFile ? await uploadProfileGalleryImage(accountHeroId, currentUser.uid, galleryFile) : null
      await createProfileGalleryImage({ heroId: accountHeroId, userId: currentUser.uid, imageUrl: uploaded?.imageUrl || galleryImageUrl, caption: galleryCaption })
      resetGalleryComposer(); setGalleryMessage('Imagen añadida a tu galería pública.')
    } catch (error) { setGalleryMessage(''); setGalleryError(error?.message || 'No fue posible añadir la imagen.') } finally { setGalleryBusyId('') }
  }

  const handleDeleteGalleryImage = async (imageId) => {
    if (!currentUser?.uid || !window.confirm('Eliminar esta imagen de tu galería pública.')) return
    setGalleryBusyId(imageId); setGalleryError('')
    try { await deleteProfileGalleryImage(imageId, currentUser.uid); setGalleryMessage('Imagen eliminada.') }
    catch (error) { setGalleryError(error?.message || 'No fue posible eliminar la imagen.') }
    finally { setGalleryBusyId('') }
  }

  const handleUseGalleryImage = async (image, target) => {
    if (!accountHeroId || !currentUser?.uid) return
    setGalleryBusyId(`${target}-${image.id}`); setGalleryError('')
    try {
      if (target === 'cover') {
        await setGalleryImageAsCover(accountHeroId, image.imageUrl, currentUser.uid)
        setMediaOverrides((current) => ({ ...current, coverUrl: image.imageUrl, coverPositionX: 50, coverPositionY: 50, coverScale: 1 }))
        setGalleryMessage('Portada pública actualizada.')
      } else {
        await setGalleryImageAsAvatar(accountHeroId, image.imageUrl, currentUser.uid)
        await updateUserProfile(currentUser.uid, { avatarUrl: image.imageUrl, heroId: accountHeroId, heroName: draft.alias || displayName })
        setMediaOverrides((current) => ({ ...current, avatarUrl: image.imageUrl, avatarPositionX: 50, avatarPositionY: 50, avatarScale: 1 }))
        setGalleryMessage('Avatar público actualizado.')
      }
    } catch (error) { setGalleryError(error?.message || 'No fue posible actualizar la imagen pública.') }
    finally { setGalleryBusyId('') }
  }

  const handleLogout = async () => {
    await logout()
    onNavigate?.('login')
  }

  if (!isLoggedIn && !authLoading) {
    return (
      <section className="page-card my-profile-page my-profile-state">
        <p className="section-kicker">Módulo de jugador</p>
        <h2>Mi Perfil</h2>
        <p>Inicia sesión o crea una cuenta para construir tu perfil heroico público.</p>
        <div className="my-profile-state__actions">
          <button className="hi-button hi-button-primary" onClick={() => onNavigate?.('login')} type="button">
            Iniciar sesión
          </button>
          <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('register')} type="button">
            Crear cuenta
          </button>
        </div>
      </section>
    )
  }

  if (isLoading) {
    return (
      <section className="page-card my-profile-page my-profile-state">
        <p className="section-kicker">Módulo de jugador</p>
        <h2>Mi Perfil</h2>
        <p>Sincronizando tu identidad heroica…</p>
      </section>
    )
  }

  if (loadError) {
    return (
      <section className="page-card my-profile-page my-profile-state my-profile-state--error">
        <p className="section-kicker">Módulo de jugador</p>
        <h2>Mi Perfil</h2>
        <p>No fue posible cargar Mi Perfil.</p>
      </section>
    )
  }

  return (
    <section className="profileHub-page player-profile-page hi-page hi-page-wide">
      <header className="profileHub-cover-card hi-card hi-card-player">
        <button className="profileHub-cover" onClick={() => setEditorTarget('cover')} type="button">
          {coverVisual.imageUrl ? (
            <img
              alt={coverVisual.altText}
              src={coverVisual.imageUrl}
              style={{
                objectPosition: `${coverVisual.imagePositionX}% ${coverVisual.imagePositionY}%`,
                transform: `scale(${coverVisual.imageScale})`,
              }}
            />
          ) : (
            <span className="profileHub-cover__empty">
              <strong>Subir portada</strong>
              <small>Haz clic para definir la imagen principal de tu identidad heroica.</small>
            </span>
          )}
          <span className="profileHub-cover__overlay" style={{ opacity: coverVisual.imageOverlayStrength }} />
          <span className="profileHub-cover__action">Cambiar portada</span>
        </button>

        <div className="profileHub-identity">
          <button className="profileHub-avatar" onClick={() => setEditorTarget('avatar')} type="button">
            {avatarVisual.imageUrl ? (
              <img
                alt={avatarVisual.altText}
                src={avatarVisual.imageUrl}
                style={{
                  objectPosition: `${avatarVisual.imagePositionX}% ${avatarVisual.imagePositionY}%`,
                  transform: `scale(${avatarVisual.imageScale})`,
                }}
              />
            ) : (
              <span>{getInitials(displayName)}</span>
            )}
            <em>{avatarVisual.imageUrl ? 'Cambiar foto' : 'Subir foto'}</em>
          </button>

          <div className="profileHub-title">
            <p className="page-card__kicker">{isCreating ? 'Crear perfil heroico' : 'Mi Perfil'}</p>
            <h2>{displayName}</h2>
            <p>{draft.heroTitle || getHeroTitle(hero)}</p>
            <div className="profileHub-status-line" aria-label="Estado del perfil">
              <span>{corporationName || 'Independiente'}</span>
              <span>{draft.visibility === 'public' ? 'Perfil público' : 'Perfil privado'}</span>
              <span>Puntos {formatNumber(hero?.rankingPoints)}</span>
              <span>Aprobación {formatNumber(hero?.citizenApproval ?? hero?.approval)}%</span>
            </div>
          </div>

          <div className="profileHub-actions">
            <button className="hi-button hi-button-primary" disabled={isSaving} onClick={handleSaveProfile} type="button">
              {isSaving ? 'Guardando…' : isCreating ? 'Crear perfil heroico' : 'Guardar cambios'}
            </button>
            <button
              className="hi-button hi-button-secondary"
              disabled={!accountHeroId}
              onClick={() => onNavigate?.('hero-profile', { heroId: accountHeroId })}
              type="button"
            >
              Ver perfil público
            </button>
          </div>
        </div>
      </header>

      {message ? <p className="profileHub-feedback profileHub-feedback--success">{message}</p> : null}
      {errorMessage ? <p className="profileHub-feedback profileHub-feedback--error">{errorMessage}</p> : null}

      <div className="profileHub-layout player-profile-layout">
        <aside className="profileHub-summary player-profile-summary hi-card hi-card-player">
          <p className="page-card__kicker">IDENTIDAD SOCIAL</p>
          <h3>{displayName}</h3>
          <p className="player-profile-summary__quote">{draft.publicQuote || 'La frase pública de tu héroe aparecerá aquí.'}</p>
          <dl>
             <div><dt>Afiliación</dt><dd>{corporationName || 'Independiente'}</dd></div>
            <div><dt>Puntos HeroIndex</dt><dd>{formatNumber(hero?.rankingPoints)}</dd></div>
            <div><dt>Aprobación ciudadana</dt><dd>{formatNumber(hero?.citizenApproval ?? hero?.approval)}%</dd></div>
          </dl>
          <div className="player-profile-presence">
            <span>Canal personal activo</span>
            <small>Tu presentación pública se refleja en el ecosistema HeroIndex.</small>
          </div>
       </aside>

        <main className="profileHub-workspace player-profile-workspace hi-card hi-card-player">
          <nav className="profileHub-tabs player-profile-tabs" aria-label="Secciones de Mi Perfil">
            {tabs.map((tab) => (
              <button
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className="profileHub-tab player-profile-tab"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === 'actividad' ? (
            <section className="profile-feed" aria-label="Actividad pública del héroe">
              <article className="profile-composer profile-editor-card">
                <div className="profile-composer__identity">
                  <span className="profile-composer__avatar">
                    {avatarVisual.imageUrl ? <img alt="" src={avatarVisual.imageUrl} /> : getInitials(displayName)}
                  </span>
                  <div>
                    <p className="page-card__kicker">SEÑAL DEL HÉROE</p>
                    <h3>¿Qué comunica tu héroe hoy?</h3>
                  </div>
                </div>
                <textarea
                  className="hi-textarea profile-composer__textarea"
                  maxLength={PROFILE_POST_CONTENT_LIMIT}
                  onChange={(event) => setPostDraft(event.target.value)}
                  placeholder="Comparte una señal pública, patrullaje, declaración o actualización heroica..."
                  rows="4"
                  value={postDraft}
                />
                <label className="hi-field profile-composer__image-field">
                  <span className="hi-label">Imagen pública opcional</span>
                  <input className="hi-input" onChange={(event) => setPostImageUrl(event.target.value)} placeholder="URL de imagen visible en tu actualización" type="url" value={postImageUrl} />
                </label>
                <div className="profile-composer__actions">
                  <span>Público · {postDraft.length}/{PROFILE_POST_CONTENT_LIMIT}</span>
                  <button className="hi-button hi-button-primary" disabled={!accountHeroId || !postDraft.trim() || isPublishingPost} onClick={handlePublishUpdate} type="button">
                    {isPublishingPost ? 'Publicando…' : 'Publicar actualización'}
                  </button>
                </div>
                {!accountHeroId ? <small>Completa tu perfil heroico antes de publicar actualizaciones.</small> : null}
                {postMessage ? <small className="profile-post-feedback profile-post-feedback--success">{postMessage}</small> : null}
                {postError || postsError ? <small className="profile-post-feedback profile-post-feedback--error">{postError || 'No fue posible cargar las actualizaciones.'}</small> : null}
              </article>

              <div className="profile-feed__stream">
                {profilePosts.map((post) => (
                  <article className="profile-post" key={post.id}>
                    <header>
                      <span className="profile-composer__avatar">
                        {post.authorAvatarUrl || avatarVisual.imageUrl ? <img alt="" src={post.authorAvatarUrl || avatarVisual.imageUrl} /> : getInitials(post.authorAlias || displayName)}
                      </span>
                      <div><strong>{post.authorAlias || displayName}</strong><span>{formatPostDate(post.createdAt)} · Actualización pública</span></div>
                      <em>Señal del héroe</em>
                    </header>
                    <p>{post.content}</p>
                    {post.imageUrl ? <img className="profile-post__image" alt={`Actualización pública de ${post.authorAlias || displayName}`} loading="lazy" src={post.imageUrl} /> : null}
                    {post.userId === currentUser?.uid ? <div className="profile-post__actions"><button disabled={deletingPostId === post.id} onClick={() => handleDeletePost(post.id)} type="button">{deletingPostId === post.id ? 'Eliminando…' : 'Eliminar'}</button></div> : null}
                  </article>
                ))}
                {postsLoading ? <div className="profile-feed__empty"><strong>Sincronizando actualizaciones públicas…</strong></div> : null}
                {!postsLoading && profilePosts.length === 0 ? (
                  <div className="profile-feed__empty">
                    <strong>Este héroe aún no ha emitido actualizaciones públicas.</strong>
                    <span>Publica una señal para empezar a construir tu presencia heroica.</span>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {activeTab === 'presentacion' ? (
            <section className="profile-editor-card">
              <div className="profile-editor-card__heading">
                <div><p className="page-card__kicker">PRESENTACIÓN PÚBLICA</p><h3>Identidad visible</h3></div>
                <span>Define cómo te reconoce la ciudad.</span>
              </div>
              <div className="profileHub-form-grid">
                <label className="hi-field"><span className="hi-label">Identidad pública</span><input className="hi-input" onChange={(event) => updateDraft('alias', event.target.value)} value={draft.alias} /></label>
                <label className="hi-field"><span className="hi-label">Título heroico</span><input className="hi-input" onChange={(event) => updateDraft('heroTitle', event.target.value)} value={draft.heroTitle} /></label>
                <label className="hi-field profileHub-wide-field"><span className="hi-label">Declaración heroica</span><input className="hi-input" onChange={(event) => updateDraft('publicQuote', event.target.value)} value={draft.publicQuote} /></label>
                <label className="hi-field profileHub-wide-field"><span className="hi-label">Biografía visible</span><textarea className="hi-textarea" onChange={(event) => updateDraft('publicBio', event.target.value)} rows="5" value={draft.publicBio} /></label>
                <label className="hi-field"><span className="hi-label">Afiliación pública</span><input className="hi-input" onChange={(event) => updateDraft('affiliationLabel', event.target.value)} value={draft.affiliationLabel} /></label>
                <label className="hi-field"><span className="hi-label">Visibilidad pública</span><select className="hi-select" onChange={(event) => updateDraft('visibility', event.target.value)} value={draft.visibility}><option value="public">Pública</option><option value="private">Privada</option></select></label>
              </div>
            </section>
          ) : null}

          {activeTab === 'galeria' ? (
            <section className="profile-gallery">
              <div className="profile-editor-card__heading"><div><p className="page-card__kicker">GALERÍA PÚBLICA</p><h3>Construye tu presencia visual</h3></div><span>Construye la presencia visual de tu héroe dentro de HeroIndex.</span></div>
              <div className="profile-gallery__composer">
                <input accept="image/*" hidden onChange={(event) => selectGalleryFile(event.target.files?.[0])} ref={galleryFileInputRef} type="file" />
                <button className={`profile-gallery__dropzone${galleryDropActive ? ' profile-gallery__dropzone--active' : ''}`} disabled={!accountHeroId} onClick={() => galleryFileInputRef.current?.click()} onDragEnter={(event) => { event.preventDefault(); setGalleryDropActive(true) }} onDragLeave={() => setGalleryDropActive(false)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setGalleryDropActive(false); selectGalleryFile(event.dataTransfer.files?.[0]) }} type="button">
                  <strong>Arrastra una imagen aquí o haz click para subir</strong><span>Formatos recomendados: JPG, PNG o WEBP · Máximo 5 MB.</span>
                </button>
                {galleryPreviewUrl ? <div className="profile-gallery__preview"><img alt="Vista previa para galería pública" src={galleryPreviewUrl} /><button onClick={resetGalleryComposer} type="button">Quitar imagen</button></div> : null}
                <div className="profile-gallery__composer-fields">
                  <label className="hi-field"><span className="hi-label">Descripción opcional</span><input className="hi-input" onChange={(event) => setGalleryCaption(event.target.value)} value={galleryCaption} /></label>
                  <label className="hi-field"><span className="hi-label">O pegar URL de imagen</span><input className="hi-input" disabled={Boolean(galleryFile)} onChange={(event) => setGalleryImageUrl(event.target.value)} type="url" value={galleryImageUrl} /></label>
                </div>
                <div className="profile-gallery__composer-actions"><span>{accountHeroId ? 'Galería pública · Red HeroIndex' : 'Completa tu perfil heroico antes de construir tu galería pública.'}</span><button className="hi-button hi-button-primary" disabled={!accountHeroId || (!galleryFile && !galleryImageUrl.trim()) || galleryBusyId === 'create'} onClick={handleAddGalleryImage} type="button">{galleryBusyId === 'create' ? 'Añadiendo…' : 'Añadir a galería'}</button></div>
                {galleryMessage ? <p className="profile-post-feedback profile-post-feedback--success">{galleryMessage}</p> : null}
                {galleryError || galleryLoadError ? <p className="profile-post-feedback profile-post-feedback--error">{galleryError || 'No fue posible cargar la galería.'}</p> : null}
              </div>
              <div className="profile-gallery__grid profile-gallery__grid--persistent">
                {galleryImages.map((image) => <article className="profile-gallery__card" key={image.id}><div className="profile-gallery__image-wrap"><img alt={image.caption || `Galería pública de ${displayName}`} className="profile-gallery__image" loading="lazy" src={image.imageUrl} /><div className="profile-gallery__current-chips">{image.imageUrl === coverVisual.imageUrl ? <span>Portada actual</span> : null}{image.imageUrl === avatarVisual.imageUrl ? <span>Avatar actual</span> : null}</div></div><div className="profile-gallery__card-body"><p>{image.caption || 'Imagen pública sin descripción.'}</p><small>{formatPostDate(image.createdAt)}</small><div className="profile-gallery__actions"><button disabled={Boolean(galleryBusyId)} onClick={() => handleUseGalleryImage(image, 'cover')} type="button">Usar como portada</button><button disabled={Boolean(galleryBusyId)} onClick={() => handleUseGalleryImage(image, 'avatar')} type="button">Usar como avatar</button><button className="profile-gallery__delete" disabled={Boolean(galleryBusyId)} onClick={() => handleDeleteGalleryImage(image.id)} type="button">Eliminar</button></div></div></article>)}
                {galleryLoading ? <div className="profile-gallery__empty"><strong>Sincronizando galería pública…</strong></div> : null}
                {!galleryLoading && galleryImages.length === 0 ? <div className="profile-gallery__empty"><strong>Tu galería pública aún no tiene imágenes.</strong><span>Añade una imagen para comenzar a construir tu presencia visual.</span></div> : null}
              </div>
            </section>
          ) : null}

          {activeTab === 'poderes' ? (
            <section className="profile-editor-card">
              <div className="profile-editor-card__heading"><div><p className="page-card__kicker">CAPACIDADES VISIBLES</p><h3>Poderes públicos</h3></div><span>Estos poderes son visibles en tu perfil público. No representan parámetros internos.</span></div>
              {visiblePowers.length > 0 ? <div className="profile-public-power-list">{visiblePowers.map((power) => <span key={power}>{power}</span>)}</div> : null}
              <div className="profileHub-form-grid">
                <label className="hi-field profileHub-wide-field"><span className="hi-label">Poderes visibles</span><input className="hi-input" onChange={(event) => updateDraft('publicPowers', event.target.value)} placeholder="Separados por coma" value={draft.publicPowers} /></label>
                <label className="hi-field"><span className="hi-label">Especialidad pública</span><input className="hi-input" onChange={(event) => updateDraft('publicSpecialty', event.target.value)} value={draft.publicSpecialty} /></label>
                <label className="hi-field profileHub-wide-field"><span className="hi-label">Descripción de habilidades</span><textarea className="hi-textarea" onChange={(event) => updateDraft('publicAbilities', event.target.value)} rows="5" value={draft.publicAbilities} /></label>
                <label className="hi-field profileHub-wide-field"><span className="hi-label">Limitaciones públicas o estilo heroico</span><textarea className="hi-textarea" onChange={(event) => updateDraft('publicLimitations', event.target.value)} rows="4" value={draft.publicLimitations} /></label>
              </div>
            </section>
          ) : null}

          {activeTab === 'apariencia' ? (
            <section className="profile-customization">
              <div className="profile-editor-card__heading"><div><p className="page-card__kicker">PERSONALIZACIÓN DEL PERFIL</p><h3>Apariencia pública</h3></div><span>Define cómo se presenta tu héroe ante la red HeroIndex.</span></div>
              <div className="profile-customization__grid">
                <button className="profileHub-media-card" onClick={() => setEditorTarget('cover')} type="button"><strong>Portada superior</strong><span>{coverVisual.imageUrl ? 'Editar portada actual' : 'Subir portada'}</span></button>
                <button className="profileHub-media-card" onClick={() => setEditorTarget('avatar')} type="button"><strong>Avatar heroico</strong><span>{avatarVisual.imageUrl ? 'Editar avatar actual' : 'Subir avatar'}</span></button>
                <article className="profile-customization__future"><strong>Color de acento</strong><span>Preparado para una futura fase de personalización.</span></article>
                <article className="profile-customization__future"><strong>Tema del perfil</strong><span>Estilo institucional HeroIndex activo.</span></article>
              </div>
            </section>
          ) : null}

          {activeTab === 'cuenta' ? (
            <section className="profileHub-account-panel profile-editor-card">
              <div className="profile-editor-card__heading"><div><p className="page-card__kicker">CUENTA DE JUGADOR</p><h3>Configuración básica</h3></div><span>Tu cuenta permanece separada de la identidad pública.</span></div>
              <dl>
                <div><dt>Usuario HeroIndex</dt><dd>@{userProfile?.username || 'sin usuario'}</dd></div>
                <div><dt>Nombre de héroe base</dt><dd>{userProfile?.heroName || draft.alias || '—'}</dd></div>
                <div><dt>Estado de sesión</dt><dd>{isLoggedIn ? 'Sesión activa' : 'Sin sesión activa'}</dd></div>
                <div><dt>Correo de cuenta</dt><dd>{userProfile?.authEmail || currentUser?.email || '—'}</dd></div>
              </dl>
              <button className="hi-button hi-button-danger" onClick={handleLogout} type="button">Cerrar sesión</button>
            </section>
          ) : null}
        </main>
      </div>

      {canViewOraculoLayer ? (
        <aside className="profileHub-oraculo player-profile-oraculo hi-card hi-card-oracle">
          <div><p className="page-card__kicker">HERRAMIENTAS ORÁCULO</p><h3>Datos internos no visibles en el perfil público</h3></div>
          <button className="hi-button hi-button-secondary" disabled={!accountHeroId} onClick={() => onNavigate?.('oraculo-hero-dossier', { heroId: accountHeroId })} type="button">Ir al Dossier ORÁCULO</button>
        </aside>
      ) : null}

      {editorTarget ? (
        <VisualImageEditor
          onClose={() => setEditorTarget(null)}
          onSave={handleSaveMedia}
          showOverlayControl={editorTarget === 'cover'}
          slotId={editorTarget === 'cover' ? 'profileCover' : 'profileAvatar'}
          title={editorTarget === 'cover' ? 'Editar portada' : 'Editar foto de perfil'}
          visual={editorTarget === 'cover' ? coverVisual : avatarVisual}
        />
      ) : null}
    </section>
  )
}

export default MyProfile
