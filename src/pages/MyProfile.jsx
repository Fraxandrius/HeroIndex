import { useMemo, useState } from 'react'
import VisualImageEditor from '../components/visual/VisualImageEditor.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { createHero, updateHero, uploadHeroMediaImage } from '../services/heroesService.js'
import { updateUserProfile } from '../services/authService.js'
import { canSeeOraculoTools } from '../utils/roles.js'

const tabItems = [
  { id: 'perfil', label: 'Perfil' },
  { id: 'apariencia', label: 'Apariencia' },
  { id: 'poderes', label: 'Poderes' },
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
  const [activeTab, setActiveTab] = useState('perfil')
  const [draftPatch, setDraftPatch] = useState({})
  const [createdHeroId, setCreatedHeroId] = useState('')
  const [mediaOverrides, setMediaOverrides] = useState({})
  const [editorTarget, setEditorTarget] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const accountHeroId = createdHeroId || userProfile?.heroId || ''
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
  const tabs = canViewOraculoLayer ? [...tabItems, { id: 'oraculo', label: 'Capa ORÁCULO' }] : tabItems

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
      setActiveTab('perfil')
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
        <p>Cargando Mi Perfil...</p>
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
    <section className="profileHub-page hi-page hi-page-wide">
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

      <div className="profileHub-layout">
        <aside className="profileHub-summary hi-card hi-card-player">
          <p className="page-card__kicker">Resumen heroico</p>
          <h3>{displayName}</h3>
          <p>{draft.publicQuote || 'La frase pública de tu héroe aparecerá aquí.'}</p>
          <dl>
            <div>
              <dt>Afiliación</dt>
              <dd>{corporationName || 'Independiente'}</dd>
            </div>
            <div>
              <dt>Ranking</dt>
              <dd>{formatNumber(hero?.rankingPoints)}</dd>
            </div>
            <div>
              <dt>Aprobación</dt>
              <dd>{formatNumber(hero?.citizenApproval ?? hero?.approval)}%</dd>
            </div>
          </dl>
        </aside>

        <main className="profileHub-workspace hi-card hi-card-player">
          <nav className="profileHub-tabs" aria-label="Secciones de Mi Perfil">
            {tabs.map((tab) => (
              <button
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className="profileHub-tab"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === 'perfil' ? (
            <div className="profileHub-form-grid">
              <label className="hi-field">
                <span className="hi-label">Nombre de héroe / alias</span>
                <input className="hi-input" onChange={(event) => updateDraft('alias', event.target.value)} value={draft.alias} />
              </label>
              <label className="hi-field">
                <span className="hi-label">Título heroico</span>
                <input className="hi-input" onChange={(event) => updateDraft('heroTitle', event.target.value)} value={draft.heroTitle} />
              </label>
              <label className="hi-field profileHub-wide-field">
                <span className="hi-label">Biografía pública</span>
                <textarea className="hi-textarea" onChange={(event) => updateDraft('publicBio', event.target.value)} rows="5" value={draft.publicBio} />
              </label>
              <label className="hi-field profileHub-wide-field">
                <span className="hi-label">Frase pública</span>
                <input className="hi-input" onChange={(event) => updateDraft('publicQuote', event.target.value)} value={draft.publicQuote} />
              </label>
              <label className="hi-field">
                <span className="hi-label">Afiliación visible</span>
                <input className="hi-input" onChange={(event) => updateDraft('affiliationLabel', event.target.value)} value={draft.affiliationLabel} />
              </label>
              <label className="hi-field">
                <span className="hi-label">Visibilidad pública</span>
                <select className="hi-select" onChange={(event) => updateDraft('visibility', event.target.value)} value={draft.visibility}>
                  <option value="public">Pública</option>
                  <option value="private">Privada</option>
                </select>
              </label>
            </div>
          ) : null}

          {activeTab === 'apariencia' ? (
            <div className="profileHub-appearance">
              <button className="profileHub-media-card" onClick={() => setEditorTarget('cover')} type="button">
                <strong>Portada superior</strong>
                <span>{coverVisual.imageUrl ? 'Cambiar portada' : 'Subir portada'}</span>
              </button>
              <button className="profileHub-media-card" onClick={() => setEditorTarget('avatar')} type="button">
                <strong>Foto de perfil</strong>
                <span>{avatarVisual.imageUrl ? 'Cambiar foto' : 'Subir foto'}</span>
              </button>
              <p>Estos slots guardan archivos en Storage y ajustes visuales seguros en tu héroe.</p>
            </div>
          ) : null}

          {activeTab === 'poderes' ? (
            <div className="profileHub-form-grid">
              <label className="hi-field profileHub-wide-field">
                <span className="hi-label">Poderes visibles</span>
                <input className="hi-input" onChange={(event) => updateDraft('publicPowers', event.target.value)} placeholder="Separados por coma" value={draft.publicPowers} />
              </label>
              <label className="hi-field">
                <span className="hi-label">Especialidad pública</span>
                <input className="hi-input" onChange={(event) => updateDraft('publicSpecialty', event.target.value)} value={draft.publicSpecialty} />
              </label>
              <label className="hi-field profileHub-wide-field">
                <span className="hi-label">Descripción de habilidades</span>
                <textarea className="hi-textarea" onChange={(event) => updateDraft('publicAbilities', event.target.value)} rows="5" value={draft.publicAbilities} />
              </label>
              <label className="hi-field profileHub-wide-field">
                <span className="hi-label">Limitaciones públicas o estilo heroico</span>
                <textarea className="hi-textarea" onChange={(event) => updateDraft('publicLimitations', event.target.value)} rows="4" value={draft.publicLimitations} />
              </label>
            </div>
          ) : null}

          {activeTab === 'cuenta' ? (
            <div className="profileHub-account-panel">
              <dl>
                <div><dt>Usuario HeroIndex</dt><dd>@{userProfile?.username || 'sin usuario'}</dd></div>
                <div><dt>ID interno HeroIndex</dt><dd>{currentUser?.uid || '—'}</dd></div>
                <div><dt>Nombre de héroe base</dt><dd>{userProfile?.heroName || draft.alias || '—'}</dd></div>
                <div><dt>Estado de sesión</dt><dd>{isLoggedIn ? 'Sesión activa' : 'Sin sesión activa'}</dd></div>
                <div><dt>Correo interno</dt><dd>{userProfile?.authEmail || currentUser?.email || '—'}</dd></div>
              </dl>
              <button className="hi-button hi-button-danger" onClick={handleLogout} type="button">
                Cerrar sesión
              </button>
            </div>
          ) : null}

          {activeTab === 'oraculo' && canViewOraculoLayer ? (
            <div className="profileHub-oraculo hi-card-oracle">
              <p className="page-card__kicker">Capa ORÁCULO</p>
              <h3>Información interna separada</h3>
              <dl>
                <div><dt>ownerUid</dt><dd>{hero?.ownerUid || '—'}</dd></div>
                <div><dt>createdByUid</dt><dd>{hero?.createdByUid || '—'}</dd></div>
                <div><dt>gmNotes</dt><dd>{hero?.gmNotes || '—'}</dd></div>
                <div><dt>risk</dt><dd>{hero?.risk || '—'}</dd></div>
                <div><dt>flags</dt><dd>{normalizeList(hero?.flags).join(', ') || '—'}</dd></div>
                <div><dt>Estado interno</dt><dd>{hero?.internalStatus || hero?.status || '—'}</dd></div>
              </dl>
              <div className="profileHub-oraculo__links">
                <button className="hi-button hi-button-secondary" disabled={!accountHeroId} onClick={() => onNavigate?.('oraculo-hero-dossier', { heroId: accountHeroId })} type="button">
                  Ir al Dossier ORÁCULO
                </button>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {editorTarget ? (
        <VisualImageEditor
          onClose={() => setEditorTarget(null)}
          onSave={handleSaveMedia}
          showOverlayControl={editorTarget === 'cover'}
          title={editorTarget === 'cover' ? 'Editar portada' : 'Editar foto de perfil'}
          visual={editorTarget === 'cover' ? coverVisual : avatarVisual}
        />
      ) : null}
    </section>
  )
}

export default MyProfile
