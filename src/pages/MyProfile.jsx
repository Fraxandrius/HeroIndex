import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { subscribeToCharacterSheet, updateCharacterSheet } from '../services/characterSheetsService.js'
import { createHero, updateHero } from '../services/heroesService.js'
import { updateUserProfile } from '../services/authService.js'
import { canSeeOraculoTools } from '../utils/roles.js'

const playerHeroId = import.meta.env.VITE_PLAYER_HERO_ID ?? ''

const attributeLabels = [
  ['fighting', 'Fighting'],
  ['agility', 'Agility'],
  ['strength', 'Strength'],
  ['reason', 'Reason'],
  ['intuition', 'Intuition'],
  ['presence', 'Presence'],
]

const narrativeFields = [
  ['resources', 'Resources'],
  ['gear', 'Gear'],
  ['reputation', 'Reputation'],
  ['personality', 'Personality'],
  ['relationships', 'Relationships'],
]

function getHeroDisplayName(hero = {}) {
  return hero.alias ?? hero.publicName ?? hero.codename ?? hero.name ?? 'Identidad HeroIndex'
}

function getHeroTitle(hero = {}) {
  return hero.heroTitle ?? 'Figura HeroIndex'
}

function getInitials(value = '') {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('') || 'HI'
}

function getNumberValue(value, fallback = 0) {
  const numberValue = Number(value ?? fallback)

  return Number.isNaN(numberValue) ? fallback : numberValue
}

function formatNumber(value) {
  return getNumberValue(value).toLocaleString('es')
}

function formatOptionalNumber(value) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return formatNumber(value)
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

function getPublicPowers(hero = {}) {
  return normalizeList(hero.publicPowers ?? hero.visiblePowers)
}

function createPublicForm(hero = {}) {
  return {
    alias: hero.alias ?? '',
    publicName: hero.publicName ?? '',
    codename: hero.codename ?? '',
    heroTitle: hero.heroTitle ?? '',
    publicBio: hero.publicBio ?? '',
    publicPowers: listToText(hero.publicPowers ?? hero.visiblePowers),
    affiliationLabel: hero.affiliationLabel ?? hero.corporationName ?? '',
    avatarUrl: hero.avatarUrl ?? '',
    imageUrl: hero.imageUrl ?? hero.bannerUrl ?? '',
    visibility: hero.visibility ?? 'public',
  }
}

function createSheetForm(sheet = {}) {
  return {
    realName: sheet.realName ?? '',
    role: sheet.role ?? '',
    health: String(sheet.health ?? 0),
    resolve: String(sheet.resolve ?? 0),
    attributes: Object.fromEntries(
      attributeLabels.map(([key]) => [key, String(sheet.attributes?.[key] ?? 1)]),
    ),
    powers: listToText(sheet.powers),
    talents: listToText(sheet.talents),
    drawbacks: listToText(sheet.drawbacks),
    resources: sheet.resources ?? '',
    gear: sheet.gear ?? '',
    reputation: sheet.reputation ?? '',
    personality: sheet.personality ?? '',
    relationships: sheet.relationships ?? '',
  }
}

function MyProfile({ onNavigate }) {
  const { currentUser, isLoggedIn, loading: authLoading, userProfile } = useAuth()
  const { heroes, loading: heroesLoading, error: heroesError } = useHeroes()
  const { getCorporationById, loading: corporationsLoading, error: corporationsError } = useCorporations()
  const [characterSheet, setCharacterSheet] = useState(null)
  const accountHeroId = userProfile?.heroId ?? ''
  const resolvedHeroId = isLoggedIn ? accountHeroId : playerHeroId
  const isUsingFallbackHero = Boolean(!isLoggedIn && playerHeroId)
  const canViewOraculoLayer = canSeeOraculoTools(userProfile)
  const [sheetLoading, setSheetLoading] = useState(false)
  const [sheetError, setSheetError] = useState(null)
  const [isEditingPublic, setIsEditingPublic] = useState(false)
  const [isSavingPublic, setIsSavingPublic] = useState(false)
  const [publicForm, setPublicForm] = useState(createPublicForm())
  const [publicMessage, setPublicMessage] = useState('')
  const [publicError, setPublicError] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isSavingSheet, setIsSavingSheet] = useState(false)
  const [sheetForm, setSheetForm] = useState(createSheetForm())
  const [sheetMessage, setSheetMessage] = useState('')
  const [sheetSaveError, setSheetSaveError] = useState('')


  useEffect(() => {
    if (!resolvedHeroId) {
      return undefined
    }

    return subscribeToCharacterSheet(
      resolvedHeroId,
      (sheet) => {
        setCharacterSheet(sheet)
        setSheetLoading(false)
      },
      (error) => {
        setSheetError(error)
        setSheetLoading(false)
      },
    )
  }, [resolvedHeroId])

  useEffect(() => {
    if (!isSheetOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSheetForm(createSheetForm(characterSheet))
        setSheetSaveError('')
        setIsSheetOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [characterSheet, isSheetOpen])

  const hero = useMemo(
    () => heroes.find((item) => String(item.id) === String(resolvedHeroId)),
    [heroes, resolvedHeroId],
  )
  const corporation = hero?.corporationId ? getCorporationById(hero.corporationId) : null
  const corporationName = corporation?.name ?? hero?.affiliationLabel ?? hero?.corporationName ?? 'Independiente'
  const publicPowers = getPublicPowers(hero)
  const isLoading = authLoading || (Boolean(resolvedHeroId) && (heroesLoading || corporationsLoading || sheetLoading))
  const loadError = heroesError || corporationsError || sheetError
 const canEditCurrentHero = Boolean(
    isUsingFallbackHero ||
      canViewOraculoLayer ||
      (hero?.id && userProfile?.heroId && String(userProfile.heroId) === String(hero.id)) ||
      (hero?.ownerUid && currentUser?.uid && hero.ownerUid === currentUser.uid),
  )

  const closeSheetPanel = () => {
    setSheetForm(createSheetForm(characterSheet))
    setSheetSaveError('')
    setIsSheetOpen(false)
  }

  const handleOpenSheetPanel = () => {
    setSheetForm(createSheetForm(characterSheet))
    setSheetMessage('')
    setSheetSaveError('')
    setIsSheetOpen(true)
  }

  const handleStartEditPublic = () => {
    setPublicForm(createPublicForm(hero))
    setPublicMessage('')
    setPublicError('')
    setIsEditingPublic(true)
  }

  const handleCancelEditPublic = () => {
    setPublicForm(createPublicForm(hero))
    setPublicError('')
    setIsEditingPublic(false)
  }

  const handlePublicFormChange = (field, value) => {
    setPublicForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  const handleSavePublic = async (event) => {
    event.preventDefault()

    if (!hero?.id && !isLoggedIn) return

    setIsSavingPublic(true)
    setPublicMessage('')
    setPublicError('')

    try {
            const publicPayload = {
        alias: (publicForm.alias || userProfile?.heroName || userProfile?.displayName || '').trim(),
        publicName: publicForm.publicName.trim(),
        codename: publicForm.codename.trim(),
        heroTitle: publicForm.heroTitle.trim(),
        publicBio: publicForm.publicBio.trim(),
        publicPowers: normalizeList(publicForm.publicPowers),
        affiliationLabel: publicForm.affiliationLabel.trim(),
        avatarUrl: publicForm.avatarUrl.trim(),
        mageUrl: publicForm.imageUrl.trim(),
        bannerUrl: publicForm.imageUrl.trim(),
        visibility: publicForm.visibility || 'public',
      }

      if (!publicPayload.alias) {
        setPublicError('Ingresa un nombre de héroe o alias.')
        setIsSavingPublic(false)
        return
      }

      if (!hero?.id) {
        const createdHero = await createHero({
          ...publicPayload,
          active: true,
          citizenApproval: 50,
          createdByUid: currentUser.uid,
          isPlayerHero: true,
          ownerUid: currentUser.uid,
          rankingPoints: 0,
        })

        await updateUserProfile(currentUser.uid, {
          avatarUrl: userProfile?.avatarUrl ?? '',
          displayName: userProfile?.displayName || publicPayload.alias,
          heroId: createdHero.id,
          heroName: publicPayload.alias,
        })

        setPublicMessage('Perfil heroico creado.')
      } else if (!canEditCurrentHero) {
        setPublicError('No puedes editar este perfil.')
        return
      } else {
        await updateHero(hero.id, publicPayload)
        setPublicMessage('Perfil actualizado.')
      }

      setIsEditingPublic(false)
    } catch {
      setPublicError('No fue posible guardar los cambios.')
    } finally {
      setIsSavingPublic(false)
    }
  }

  const handleSheetFormChange = (field, value) => {
    setSheetForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  const handleAttributeChange = (field, value) => {
    setSheetForm((currentForm) => ({
      ...currentForm,
      attributes: {
        ...currentForm.attributes,
        [field]: value,
      },
    }))
  }

  const handleSaveSheet = async (event) => {
    event.preventDefault()

    if (!hero?.id || !characterSheet) return

    setIsSavingSheet(true)
    setSheetMessage('')
    setSheetSaveError('')

    try {
      await updateCharacterSheet(hero.id, {
        realName: sheetForm.realName.trim(),
        role: sheetForm.role.trim(),
        health: getNumberValue(sheetForm.health),
        resolve: getNumberValue(sheetForm.resolve),
        attributes: Object.fromEntries(
          attributeLabels.map(([key]) => [key, getNumberValue(sheetForm.attributes[key], 1)]),
        ),
        powers: normalizeList(sheetForm.powers),
        talents: normalizeList(sheetForm.talents),
        drawbacks: normalizeList(sheetForm.drawbacks),
        resources: sheetForm.resources.trim(),
        gear: sheetForm.gear.trim(),
        reputation: sheetForm.reputation.trim(),
        personality: sheetForm.personality.trim(),
        relationships: sheetForm.relationships.trim(),
      })

     setSheetMessage('Hoja guardada correctamente.')
    } catch {
      setSheetSaveError('No fue posible guardar los cambios.')
    } finally {
      setIsSavingSheet(false)
    }
  }

  if (isLoading) {
    return (
      <div className="page-card my-profile-page my-profile-state">
        <span className="section-kicker">Módulo de jugador</span>
        <h2>Mi Perfil</h2>
        <p>Cargando Mi Perfil...</p>
      </div>
    )
  }

  if (!resolvedHeroId) {
    if (!isLoggedIn) {
      return (
        <div className="page-card my-profile-page my-profile-state">
          <span className="section-kicker">Módulo de jugador</span>
          <h2>Mi Perfil</h2>
          <p>Inicia sesión o crea una cuenta para construir tu perfil heroico público.</p>
          <div className="my-profile-state__actions">
            <button className="hi-button hi-button-primary" onClick={() => onNavigate?.('login')} type="button">Iniciar sesión</button>
            <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('register')} type="button">Crear cuenta</button>
          </div>
        </div>
         )
    }

    return (
      <div className="my-profile-page hi-page hi-page-wide">
        <section className="page-card hi-card hi-card-player my-profile-panel">
          <span className="section-kicker">Crear Mi Perfil</span>
          <h2>Completa tu perfil heroico</h2>
          <p>Mi Perfil es donde nace tu existencia pública dentro de HeroIndex. Crea tu héroe y luego edita solo su información pública.</p>
          {publicMessage && <p className="my-profile-feedback my-profile-feedback--success hi-state-card hi-state-card--success">{publicMessage}</p>}
          {publicError && <p className="my-profile-feedback my-profile-feedback--error hi-state-card hi-state-card--error">{publicError}</p>}
          <form className="my-profile-form hi-form" onSubmit={handleSavePublic}>
            <label className="hi-field"><span className="hi-label">Nombre de héroe / alias</span><input className="hi-input" value={publicForm.alias || userProfile?.heroName || userProfile?.displayName || ''} onChange={(event) => handlePublicFormChange('alias', event.target.value)} /></label>
            <label className="hi-field"><span className="hi-label">Título heroico</span><input className="hi-input" value={publicForm.heroTitle} onChange={(event) => handlePublicFormChange('heroTitle', event.target.value)} /></label>
            <label className="hi-field my-profile-form__wide"><span className="hi-label">Biografía pública</span><textarea className="hi-textarea" rows="5" value={publicForm.publicBio} onChange={(event) => handlePublicFormChange('publicBio', event.target.value)} /></label>
            <label className="hi-field my-profile-form__wide"><span className="hi-label">Poderes visibles</span><input className="hi-input" value={publicForm.publicPowers} onChange={(event) => handlePublicFormChange('publicPowers', event.target.value)} placeholder="Separados por coma" /></label>
            <label className="hi-field"><span className="hi-label">Afiliación pública</span><input className="hi-input" value={publicForm.affiliationLabel} onChange={(event) => handlePublicFormChange('affiliationLabel', event.target.value)} /></label>
            <label className="hi-field"><span className="hi-label">Avatar URL</span><input className="hi-input" value={publicForm.avatarUrl} onChange={(event) => handlePublicFormChange('avatarUrl', event.target.value)} /></label>
            <label className="hi-field"><span className="hi-label">Imagen URL</span><input className="hi-input" value={publicForm.imageUrl} onChange={(event) => handlePublicFormChange('imageUrl', event.target.value)} /></label>
            <label className="hi-field"><span className="hi-label">Visibilidad pública</span><select className="hi-input" value={publicForm.visibility} onChange={(event) => handlePublicFormChange('visibility', event.target.value)}><option value="public">Pública</option><option value="private">Privada</option></select></label>
            <div className="my-profile-form__actions hi-quick-actions">
              <button className="hi-button hi-button-primary" type="submit" disabled={isSavingPublic}>{isSavingPublic ? 'Guardando...' : 'Crear perfil heroico'}</button>
              <button className="hi-button hi-button-secondary" type="button" onClick={() => onNavigate?.('account')} disabled={isSavingPublic}>Mi Cuenta</button>
            </div>
          </form>
        </section>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="page-card my-profile-page my-profile-state my-profile-state--error">
        <span className="section-kicker">Módulo de jugador</span>
        <h2>Mi Perfil</h2>
        <p>No fue posible cargar Mi Perfil.</p>
      </div>
    )
  }

  if (!hero) {
    return (
      <div className="page-card my-profile-page my-profile-state">
        <span className="section-kicker">Módulo de jugador</span>
        <h2>Mi Perfil</h2>
       <p>No se encontró el héroe asociado a tu cuenta. Puedes completar Mi Perfil para crear uno nuevo.</p>
      </div>
    )
  }

  return (
     <div className="my-profile-page hi-page hi-page-wide">
      <header className="page-card hi-page-header hi-card hi-card-player my-profile-hero">
        {hero.bannerUrl ? (
          <div
            aria-label="Portada pública del héroe"
            className="my-profile-cover"
            role="img"
            style={{ backgroundImage: `url(${hero.bannerUrl})` }}
          />
        ) : (
          <div className="my-profile-cover my-profile-cover--empty" aria-hidden="true" />
        )}

        <div className="my-profile-hero__content">
          {hero.avatarUrl ? (
            <img
              alt={`Avatar público de ${getHeroDisplayName(hero)}`}
              className="my-profile-avatar"
              src={hero.avatarUrl}
            />
          ) : (
            <div className="my-profile-avatar my-profile-avatar--initials" aria-hidden="true">
              {getInitials(getHeroDisplayName(hero))}
            </div>
          )}

          <div>
            <span className="section-kicker">Módulo de jugador</span>
            <h2>Mi Perfil</h2>
            <p className="my-profile-hero__subtitle">
               Tu identidad pública, tu progreso y tu ficha privada en un solo lugar.
            </p>
            <p>
              Los datos públicos definen cómo apareces en HeroIndex. La hoja privada contiene tu
              información RPG de personaje.
            </p>
          </div>
        </div>
      </header>

      {isUsingFallbackHero ? (
        <section className="hi-state-card my-profile-account-callout">
          <p>Usando el héroe de desarrollo configurado para esta sesión.</p>
          <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('login')} type="button">
            Iniciar sesión
          </button>
        </section>
      ) : null}


      <div className="hi-dashboard-grid my-profile-dashboard">
        <main className="hi-main-column my-profile-dashboard__main">
          <section className="page-card hi-card hi-card-player my-profile-panel">
            <div className="my-profile-panel__header">
              <div>
                <span className="section-kicker">Vista pública</span>
                <h3>{getHeroDisplayName(hero)}</h3>
                <p>{getHeroTitle(hero)}</p>
              </div>
              <button className="hi-button hi-button-secondary" type="button" onClick={() => onNavigate('hero-profile', { heroId: hero.id })}>
                Ver perfil público
              </button>
            </div>

            <div className="my-profile-layout">
              <div>
                <p className="my-profile-public-bio">
                  {hero.publicBio || 'Biografía pública pendiente de actualización.'}
                </p>
                <div className="my-profile-powers" aria-label="Poderes visibles">
                  {publicPowers.length > 0 ? (
                    publicPowers.map((power) => <span key={power}>{power}</span>)
                  ) : (
                    <span>Sin poderes públicos registrados.</span>
                  )}
                </div>
              </div>

              <dl className="my-profile-metrics hi-section-grid">
                <div className="hi-metric-card">
                  <dt>Corporación</dt>
                  <dd>{corporationName}</dd>
                </div>
                <div className="hi-metric-card">
                  <dt>Puntos HeroIndex</dt>
                  <dd>{formatNumber(hero.rankingPoints)}</dd>
                </div>
                <div className="hi-metric-card">
                  <dt>Aprobación ciudadana</dt>
                  <dd>{formatNumber(hero.approval)}%</dd>
                </div>
                <div className="hi-metric-card">
                  <dt>Estado público</dt>
                  <dd>{hero.active === false ? 'Inactivo' : 'Activo'}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="page-card hi-card hi-card-player my-profile-panel">
            <div className="my-profile-panel__header">
              <div>
                <span className="section-kicker">Configuración pública</span>
                <h3>Presentación en HeroIndex</h3>
                <p>Edita únicamente los campos públicos permitidos de tu identidad heroica.</p>
              </div>
              {!isEditingPublic && canEditCurrentHero && (
                <button className="hi-button hi-button-secondary" type="button" onClick={handleStartEditPublic}>
                  Editar presentación pública
                </button>
              )}
            </div>

            {publicMessage && <p className="my-profile-feedback my-profile-feedback--success hi-state-card hi-state-card--success">{publicMessage}</p>}
            {publicError && <p className="my-profile-feedback my-profile-feedback--error hi-state-card hi-state-card--error">{publicError}</p>}

            {isEditingPublic ? (
              <form className="my-profile-form hi-form" onSubmit={handleSavePublic}>
                <label className="hi-field">
                  <span className="hi-label">Nombre de héroe / alias</span>
                  <input className="hi-input" value={publicForm.alias} onChange={(event) => handlePublicFormChange('alias', event.target.value)} />
                </label>
                <label className="hi-field">
                  <span className="hi-label">Nombre público</span>
                  <input className="hi-input" value={publicForm.publicName} onChange={(event) => handlePublicFormChange('publicName', event.target.value)} />
                </label>
                <label className="hi-field">
                  <span className="hi-label">Código / nombre clave</span>
                  <input className="hi-input" value={publicForm.codename} onChange={(event) => handlePublicFormChange('codename', event.target.value)} />
                </label>
                <label className="hi-field">
                  <span className="hi-label">Título heroico</span>
                  <input className="hi-input" value={publicForm.heroTitle} onChange={(event) => handlePublicFormChange('heroTitle', event.target.value)} />
                </label>
                <label className="hi-field my-profile-form__wide">
                  <span className="hi-label">Biografía pública</span>
                  <textarea className="hi-textarea" rows="5" value={publicForm.publicBio} onChange={(event) => handlePublicFormChange('publicBio', event.target.value)} />
                </label>
                <label className="hi-field my-profile-form__wide">
                  <span className="hi-label">Poderes visibles</span>
                  <input className="hi-input" value={publicForm.publicPowers} onChange={(event) => handlePublicFormChange('publicPowers', event.target.value)} placeholder="Separados por coma" />
                </label>
                <label className="hi-field">
                  <span className="hi-label">Avatar URL</span>
                  <input className="hi-input" value={publicForm.avatarUrl} onChange={(event) => handlePublicFormChange('avatarUrl', event.target.value)} />
                </label>
                <label className="hi-field">
                   <span className="hi-label">Afiliación pública</span>
                  <input className="hi-input" value={publicForm.affiliationLabel} onChange={(event) => handlePublicFormChange('affiliationLabel', event.target.value)} />
                </label>
                <label className="hi-field">
                  <span className="hi-label">Imagen URL</span>
                  <input className="hi-input" value={publicForm.imageUrl} onChange={(event) => handlePublicFormChange('imageUrl', event.target.value)} />
                </label>
                <label className="hi-field">
                  <span className="hi-label">Visibilidad pública</span>
                  <select className="hi-input" value={publicForm.visibility} onChange={(event) => handlePublicFormChange('visibility', event.target.value)}><option value="public">Pública</option><option value="private">Privada</option></select>
                </label>

                <div className="my-profile-form__actions hi-quick-actions">
                  <button className="hi-button hi-button-primary" type="submit" disabled={isSavingPublic}>
                    {isSavingPublic ? 'Guardando...' : 'Guardar configuración pública'}
                  </button>
                  <button className="hi-button hi-button-secondary" type="button" onClick={handleCancelEditPublic} disabled={isSavingPublic}>
                    Cancelar cambios
                  </button>
                </div>
              </form>
            ) : (
              <p className="my-profile-help-text">
                La configuración pública puede actualizar tu alias, título heroico, biografía, poderes
                visibles e imágenes. Las métricas públicas permanecen bajo control de HeroIndex.
              </p>
            )}
          </section>
        </main>

        <aside className="hi-side-column my-profile-dashboard__side">
          <section className="page-card hi-card hi-actions-card my-profile-actions-panel">
            <span className="section-kicker">Acciones de jugador</span>
            <h3>Centro personal</h3>
            <p>Accede rápidamente a tu ficha RPG privada y configuración pública.</p>
            <div className="hi-quick-actions">
              {characterSheet ? (
                <button className="hi-button hi-button-primary" type="button" onClick={handleOpenSheetPanel}>
                  Abrir hoja de personaje
                </button>
              ) : (
                <p className="my-profile-empty-state hi-state-card hi-state-card--error">
                  No hay hoja RPG disponible para este héroe. Contacta a GM.
                </p>
              )}
              <button className="hi-button hi-button-secondary" type="button" onClick={handleStartEditPublic}>
                Editar presentación pública
              </button>
              <button className="hi-button hi-button-secondary" type="button" onClick={() => onNavigate('hero-profile', { heroId: hero.id })}>
                Ver perfil público
              </button>
              <button className="hi-button hi-button-ghost" type="button" onClick={() => onNavigate('home')}>
                Volver al inicio
              </button>
              <button className="hi-button hi-button-ghost" type="button" onClick={() => onNavigate('ranking')}>
                Ver ranking
              </button>
            </div>
          </section>

          <section className="page-card hi-card hi-card-player my-profile-karma">
            <span className="section-kicker">Progresión</span>
            <h3>Karma</h3>
            <strong>{formatOptionalNumber(characterSheet?.karma)}</strong>
            <p>Karma es tu recurso de progresión. Su asignación final depende de ORÁCULO/GM.</p>
             <button className="hi-button hi-button-secondary" type="button" onClick={() => onNavigate('karma')}>
              Ver historial de Karma
            </button>
          </section>

          <section className="page-card hi-card hi-card-player my-profile-status-card">
            <span className="section-kicker">Estado público</span>
            <h3>{hero.active === false ? 'Perfil inactivo' : 'Perfil activo'}</h3>
            <p>{corporationName}</p>
            <dl className="my-profile-side-metrics">
              <div>
                <dt>Puntos</dt>
                <dd>{formatNumber(hero.rankingPoints)}</dd>
              </div>
              <div>
                <dt>Aprobación</dt>
                <dd>{formatNumber(hero.approval)}%</dd>
              </div>
            </dl>
          </section>

{canViewOraculoLayer ? (
            <section className="page-card hi-card hi-card-oracle my-profile-private-note">
              <span className="section-kicker">Capa ORÁCULO</span>
              <h3>Dossier interno</h3>
              <p>Esta fase implementa role gate frontend para demo. Para producción, roles y propiedad deben reforzarse con Firebase Security Rules y/o custom claims.</p>
              <dl className="my-profile-side-metrics">
                <div><dt>Owner UID</dt><dd>{hero.ownerUid || '—'}</dd></div>
                <div><dt>Created by UID</dt><dd>{hero.createdByUid || '—'}</dd></div>
                <div><dt>Riesgo</dt><dd>{hero.risk || 'Sin señal'}</dd></div>
                <div><dt>Flags</dt><dd>{normalizeList(hero.flags).join(', ') || 'Sin flags'}</dd></div>
              </dl>
              {hero.gmNotes ? <p>{hero.gmNotes}</p> : null}
            </section>
          ) : null}

          <section className="page-card hi-card hi-card-player my-profile-private-note">
            <span className="section-kicker">Privacidad de identidad</span>
            <h3>Tu identidad fuera de la capa pública</h3>
            <p>
              Tu nombre real forma parte de tu hoja privada. No aparece públicamente salvo que una
              futura configuración permita activarlo.
            </p>
          </section>
        </aside>
      </div>
      
      {isSheetOpen && characterSheet && (
        <div
          className="hi-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSheetPanel()
            }
          }}
        >
          <section className="hi-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
            <header className="hi-sheet-panel__header">
              <div>
                <span className="section-kicker">Ficha privada RPG</span>
                <h3 id="sheet-title">Hoja de personaje</h3>
                <p>Ficha privada RPG del héroe.</p>
              </div>
              <button className="hi-button hi-button-secondary" type="button" onClick={closeSheetPanel}>Cerrar</button>
            </header>

            {sheetMessage && <p className="my-profile-feedback my-profile-feedback--success hi-state-card hi-state-card--success">{sheetMessage}</p>}
            {sheetSaveError && <p className="my-profile-feedback my-profile-feedback--error hi-state-card hi-state-card--error">{sheetSaveError}</p>}

            <form className="hi-form my-profile-sheet-form" onSubmit={handleSaveSheet}>
              <section className="hi-sheet-panel__section">
                <h4>Resumen</h4>
                <div className="my-profile-edit-grid">
                  <label className="hi-field"><span className="hi-label">Nombre real</span><input className="hi-input" value={sheetForm.realName} onChange={(event) => handleSheetFormChange('realName', event.target.value)} /></label>
                  <label className="hi-field"><span className="hi-label">Rol</span><input className="hi-input" value={sheetForm.role} onChange={(event) => handleSheetFormChange('role', event.target.value)} /></label>
                  <label className="hi-field"><span className="hi-label">Health</span><input className="hi-input" min="0" type="number" value={sheetForm.health} onChange={(event) => handleSheetFormChange('health', event.target.value)} /></label>
                  <label className="hi-field"><span className="hi-label">Resolve</span><input className="hi-input" min="0" type="number" value={sheetForm.resolve} onChange={(event) => handleSheetFormChange('resolve', event.target.value)} /></label>
                  <label className="hi-field"><span className="hi-label">Karma</span><input className="hi-input" readOnly value={formatOptionalNumber(characterSheet.karma)} aria-readonly="true" /></label>
                </div>
              </section>

              <section className="hi-sheet-panel__section">
                <h4>Atributos</h4>
                <div className="my-profile-attribute-editor">
                  {attributeLabels.map(([key, label]) => (
                    <label className="hi-field my-profile-attribute-card" key={key}>
                      <span className="hi-label">{label}</span>
                      <input className="hi-input" max="10" min="1" type="number" value={sheetForm.attributes[key]} onChange={(event) => handleAttributeChange(key, event.target.value)} />
                    </label>
                  ))}
                </div>
              </section>

              <section className="hi-sheet-panel__section">
                <h4>Poderes y rasgos</h4>
                <label className="hi-field"><span className="hi-label">Powers</span><input className="hi-input" value={sheetForm.powers} onChange={(event) => handleSheetFormChange('powers', event.target.value)} placeholder="Separados por coma" /></label>
                <label className="hi-field"><span className="hi-label">Talents</span><input className="hi-input" value={sheetForm.talents} onChange={(event) => handleSheetFormChange('talents', event.target.value)} placeholder="Separados por coma" /></label>
                <label className="hi-field"><span className="hi-label">Drawbacks</span><input className="hi-input" value={sheetForm.drawbacks} onChange={(event) => handleSheetFormChange('drawbacks', event.target.value)} placeholder="Separados por coma" /></label>
              </section>

              <section className="hi-sheet-panel__section">
                <h4>Equipo y recursos</h4>
                {narrativeFields.slice(0, 3).map(([key, label]) => (
                  <label className="hi-field" key={key}><span className="hi-label">{label}</span><textarea className="hi-textarea" rows="3" value={sheetForm[key]} onChange={(event) => handleSheetFormChange(key, event.target.value)} /></label>
                ))}
              </section>

              <section className="hi-sheet-panel__section">
                <h4>Narrativa</h4>
                {narrativeFields.slice(3).map(([key, label]) => (
                  <label className="hi-field" key={key}><span className="hi-label">{label}</span><textarea className="hi-textarea" rows="4" value={sheetForm[key]} onChange={(event) => handleSheetFormChange(key, event.target.value)} /></label>
                ))}
              </section>

              <footer className="hi-sheet-panel__footer">
                <button className="hi-button hi-button-primary" type="submit" disabled={isSavingSheet}>{isSavingSheet ? 'Guardando...' : 'Guardar hoja'}</button>
                <button className="hi-button hi-button-secondary" type="button" onClick={closeSheetPanel} disabled={isSavingSheet}>Cancelar cambios</button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default MyProfile
