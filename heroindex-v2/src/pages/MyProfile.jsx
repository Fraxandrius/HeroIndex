import { useEffect, useMemo, useState } from 'react'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { subscribeToCharacterSheet, updateCharacterSheet } from '../services/characterSheetsService.js'
import { updateHero } from '../services/heroesService.js'

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

function formatValue(value) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return String(value)
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
    avatarUrl: hero.avatarUrl ?? '',
    bannerUrl: hero.bannerUrl ?? '',
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
  const { heroes, loading: heroesLoading, error: heroesError } = useHeroes()
  const { getCorporationById, loading: corporationsLoading, error: corporationsError } = useCorporations()
  const [characterSheet, setCharacterSheet] = useState(null)
  const [sheetLoading, setSheetLoading] = useState(Boolean(playerHeroId))
  const [sheetError, setSheetError] = useState(null)
  const [isEditingPublic, setIsEditingPublic] = useState(false)
  const [isSavingPublic, setIsSavingPublic] = useState(false)
  const [publicForm, setPublicForm] = useState(createPublicForm())
const [publicMessage, setPublicMessage] = useState('')
  const [publicError, setPublicError] = useState('')
  const [isEditingSheet, setIsEditingSheet] = useState(false)
  const [isSavingSheet, setIsSavingSheet] = useState(false)
  const [sheetForm, setSheetForm] = useState(createSheetForm())
  const [sheetMessage, setSheetMessage] = useState('')
  const [sheetSaveError, setSheetSaveError] = useState('')

  useEffect(() => {
    if (!playerHeroId) {
      return undefined
    }

    return subscribeToCharacterSheet(
      playerHeroId,
      (sheet) => {
        setCharacterSheet(sheet)
        setSheetLoading(false)
      },
      (error) => {
        setSheetError(error)
        setSheetLoading(false)
      },
    )
  }, [])

  const hero = useMemo(
    () => heroes.find((item) => String(item.id) === String(playerHeroId)),
    [heroes],
  )
  const corporation = hero?.corporationId ? getCorporationById(hero.corporationId) : null
  const corporationName = corporation?.name ?? hero?.corporationName ?? 'Independiente'
  const publicPowers = getPublicPowers(hero)
  const isLoading = Boolean(playerHeroId) && (heroesLoading || corporationsLoading || sheetLoading)
  const loadError = heroesError || corporationsError || sheetError

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

    if (!hero?.id) return

    setIsSavingPublic(true)
    setPublicMessage('')
    setPublicError('')

    try {
      await updateHero(hero.id, {
        alias: publicForm.alias.trim(),
        publicName: publicForm.publicName.trim(),
        codename: publicForm.codename.trim(),
        heroTitle: publicForm.heroTitle.trim(),
        publicBio: publicForm.publicBio.trim(),
        publicPowers: normalizeList(publicForm.publicPowers),
        avatarUrl: publicForm.avatarUrl.trim(),
        bannerUrl: publicForm.bannerUrl.trim(),
      })

      setPublicMessage('Configuración pública guardada correctamente.')
      setIsEditingPublic(false)
    } catch {
      setPublicError('No fue posible guardar los cambios.')
    } finally {
      setIsSavingPublic(false)
    }
  }

  const handleStartEditSheet = () => {
    setSheetForm(createSheetForm(characterSheet))
    setSheetMessage('')
    setSheetSaveError('')
    setIsEditingSheet(true)
  }

  const handleCancelEditSheet = () => {
    setSheetForm(createSheetForm(characterSheet))
    setSheetSaveError('')
    setIsEditingSheet(false)
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

      setSheetMessage('Hoja RPG guardada correctamente.')
      setIsEditingSheet(false)
    } catch {
      setSheetSaveError('No fue posible guardar los cambios.')
    } finally {
      setIsSavingSheet(false)
    }
  }

  if (!playerHeroId) {
    return (
      <div className="page-card my-profile-page my-profile-state">
        <span className="section-kicker">Módulo de jugador</span>
        <h2>Mi Perfil</h2>
        <p>No hay héroe de jugador configurado.</p>
      </div>
    )
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
        <p>No se encontró el héroe configurado.</p>
      </div>
    )
  }

  return (
    <div className="my-profile-page">
      <header className="page-card my-profile-hero">
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
               Gestiona tu identidad heroica, tu presentación pública y tu hoja de personaje.
            </p>
            <p>
              Los datos públicos definen cómo apareces en HeroIndex. La hoja privada contiene tu
              información RPG de personaje.
            </p>
          </div>
        </div>
      </header>

      <section className="page-card my-profile-panel">
        <div className="my-profile-panel__header">
          <div>
            <span className="section-kicker">Vista pública</span>
            <h3>{getHeroDisplayName(hero)}</h3>
            <p>{getHeroTitle(hero)}</p>
          </div>
           <button type="button" onClick={() => onNavigate('hero-profile', { heroId: hero.id })}>
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

          <dl className="my-profile-metrics">
            <div>
              <dt>Corporación</dt>
              <dd>{corporationName}</dd>
            </div>
            <div>
              <dt>Puntos HeroIndex</dt>
              <dd>{formatNumber(hero.rankingPoints)}</dd>
            </div>
            <div>
              <dt>Aprobación ciudadana</dt>
              <dd>{formatNumber(hero.approval)}%</dd>
            </div>
            <div>
              <dt>Estado público</dt>
              <dd>{hero.active === false ? 'Inactivo' : 'Activo'}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="page-card my-profile-panel">
        <div className="my-profile-panel__header">
          <div>
            <span className="section-kicker">Configuración pública</span>
            <h3>Presentación en HeroIndex</h3>
            <p>Edita únicamente los campos públicos permitidos de tu identidad heroica.</p>
          </div>
          {!isEditingPublic && (
            <button type="button" onClick={handleStartEditPublic}>
              Editar presentación pública
            </button>
          )}
        </div>

        {publicMessage && <p className="my-profile-feedback my-profile-feedback--success">{publicMessage}</p>}
        {publicError && <p className="my-profile-feedback my-profile-feedback--error">{publicError}</p>}

        {isEditingPublic ? (
          <form className="my-profile-form" onSubmit={handleSavePublic}>
            <label>
              <span>Alias</span>
              <input
                value={publicForm.alias}
                onChange={(event) => handlePublicFormChange('alias', event.target.value)}
              />
            </label>
            <label>
              <span>Nombre público</span>
              <input
                value={publicForm.publicName}
                onChange={(event) => handlePublicFormChange('publicName', event.target.value)}
              />
            </label>
            <label>
              <span>Código / nombre clave</span>
              <input
                value={publicForm.codename}
                onChange={(event) => handlePublicFormChange('codename', event.target.value)}
              />
            </label>
            <label>
              <span>Título heroico</span>
              <input
                value={publicForm.heroTitle}
                onChange={(event) => handlePublicFormChange('heroTitle', event.target.value)}
              />
            </label>
            <label className="my-profile-form__wide">
              <span>Biografía pública</span>
              <textarea
                rows="5"
                value={publicForm.publicBio}
                onChange={(event) => handlePublicFormChange('publicBio', event.target.value)}
              />
            </label>
            <label className="my-profile-form__wide">
              <span>Poderes visibles</span>
              <input
                value={publicForm.publicPowers}
                onChange={(event) => handlePublicFormChange('publicPowers', event.target.value)}
                placeholder="Separados por coma"
              />
            </label>
            <label>
              <span>Avatar URL</span>
              <input
                value={publicForm.avatarUrl}
                onChange={(event) => handlePublicFormChange('avatarUrl', event.target.value)}
              />
            </label>
            <label>
              <span>Portada URL</span>
              <input
                value={publicForm.bannerUrl}
                onChange={(event) => handlePublicFormChange('bannerUrl', event.target.value)}
              />
            </label>

            <div className="my-profile-form__actions">
              <button type="submit" disabled={isSavingPublic}>
                 {isSavingPublic ? 'Guardando...' : 'Guardar configuración pública'}
              </button>
              <button type="button" onClick={handleCancelEditPublic} disabled={isSavingPublic}>
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

      <section className="page-card my-profile-karma">
        <span className="section-kicker">Progresión</span>
        <h3>Karma</h3>
        <strong>{formatOptionalNumber(characterSheet?.karma)}</strong>
        <p>Karma es tu recurso de progresión. Su asignación final depende de ORÁCULO/GM.</p>
        <p>
          Karma es el recurso de progresión utilizado para mejorar tu héroe. No modifica
          directamente el Ranking HeroIndex.
        </p>
      </section>

      <section className="page-card my-profile-panel">
        <div className="my-profile-panel__header">
          <div>
            <span className="section-kicker">Mi hoja RPG</span>
            <h3>Ficha privada de personaje</h3>
          </div>
          {characterSheet && !isEditingSheet && (
            <button type="button" onClick={handleStartEditSheet}>
              Editar hoja RPG
            </button>
          )}
        </div>
        <p className="my-profile-help-text">
          Esta información pertenece a tu hoja privada de personaje. Los campos mecánicos editables
          son parte de tu propia ficha; Karma y campos GM permanecen bloqueados.
        </p>

        {sheetMessage && <p className="my-profile-feedback my-profile-feedback--success">{sheetMessage}</p>}
        {sheetSaveError && <p className="my-profile-feedback my-profile-feedback--error">{sheetSaveError}</p>}

        {!characterSheet ? (
          <p className="my-profile-empty-state">
             No hay hoja RPG vinculada a este héroe. Contacta a ORÁCULO/GM.
          </p>
          ) : isEditingSheet ? (
          <form className="my-profile-form" onSubmit={handleSaveSheet}>
            <label>
              <span>Nombre real</span>
              <input
                value={sheetForm.realName}
                onChange={(event) => handleSheetFormChange('realName', event.target.value)}
              />
            </label>
            <label>
              <span>Rol</span>
              <input
                value={sheetForm.role}
                onChange={(event) => handleSheetFormChange('role', event.target.value)}
              />
            </label>
            <label>
              <span>Health</span>
              <input
                min="0"
                type="number"
                value={sheetForm.health}
                onChange={(event) => handleSheetFormChange('health', event.target.value)}
              />
            </label>
            <label>
              <span>Resolve</span>
              <input
                min="0"
                type="number"
                value={sheetForm.resolve}
                onChange={(event) => handleSheetFormChange('resolve', event.target.value)}
              />
            </label>

            <div className="my-profile-form__wide my-profile-edit-group">
              <h4>Atributos</h4>
              <div className="my-profile-edit-grid">
                {attributeLabels.map(([key, label]) => (
                  <label key={key}>
                    <span>{label}</span>
                    <input
                      max="10"
                      min="1"
                      type="number"
                      value={sheetForm.attributes[key]}
                      onChange={(event) => handleAttributeChange(key, event.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <label className="my-profile-form__wide">
              <span>Powers</span>
              <input
                value={sheetForm.powers}
                onChange={(event) => handleSheetFormChange('powers', event.target.value)}
                placeholder="Separados por coma"
              />
            </label>
            <label className="my-profile-form__wide">
              <span>Talents</span>
              <input
                value={sheetForm.talents}
                onChange={(event) => handleSheetFormChange('talents', event.target.value)}
                placeholder="Separados por coma"
              />
            </label>
            <label className="my-profile-form__wide">
              <span>Drawbacks</span>
              <input
                value={sheetForm.drawbacks}
                onChange={(event) => handleSheetFormChange('drawbacks', event.target.value)}
                placeholder="Separados por coma"
              />
            </label>

            {narrativeFields.map(([key, label]) => (
              <label className="my-profile-form__wide" key={key}>
                <span>{label}</span>
                <textarea
                  rows="3"
                  value={sheetForm[key]}
                  onChange={(event) => handleSheetFormChange(key, event.target.value)}
                />
              </label>
            ))}

            <div className="my-profile-form__actions">
              <button type="submit" disabled={isSavingSheet}>
                {isSavingSheet ? 'Guardando...' : 'Guardar hoja RPG'}
              </button>
              <button type="button" onClick={handleCancelEditSheet} disabled={isSavingSheet}>
                Cancelar edición
              </button>
            </div>
          </form>
        ) : (
          <div className="my-profile-sheet-grid">
            <dl className="my-profile-sheet-list">
              <div>
                <dt>Nombre real</dt>
                <dd>{formatValue(characterSheet.realName)}</dd>
              </div>
              <div>
                <dt>Rol</dt>
                <dd>{formatValue(characterSheet.role)}</dd>
              </div>
              <div>
                <dt>Health</dt>
                <dd>{formatOptionalNumber(characterSheet.health)}</dd>
              </div>
              <div>
                <dt>Resolve</dt>
                <dd>{formatOptionalNumber(characterSheet.resolve)}</dd>
              </div>
            </dl>

            <div className="my-profile-attributes">
              {attributeLabels.map(([key, label]) => (
                <article key={key}>
                  <span>{label}</span>
                  <strong>{formatNumber(characterSheet.attributes?.[key] ?? 1)}</strong>
                </article>
              ))}
            </div>

            <div className="my-profile-sheet-block">
              <h4>Powers</h4>
              <div className="my-profile-powers">
                {normalizeList(characterSheet.powers).length > 0 ? (
                  normalizeList(characterSheet.powers).map((power) => <span key={power}>{power}</span>)
                ) : (
                  <span>—</span>
                )}
              </div>
            </div>

            <div className="my-profile-sheet-block">
              <h4>Talents</h4>
              <div className="my-profile-powers">
                {normalizeList(characterSheet.talents).length > 0 ? (
                  normalizeList(characterSheet.talents).map((talent) => <span key={talent}>{talent}</span>)
                ) : (
                  <span>—</span>
                )}
              </div>
            </div>

            <div className="my-profile-sheet-block">
              <h4>Drawbacks</h4>
              <div className="my-profile-powers">
                {normalizeList(characterSheet.drawbacks).length > 0 ? (
                  normalizeList(characterSheet.drawbacks).map((drawback) => (
                    <span key={drawback}>{drawback}</span>
                  ))
                ) : (
                  <span>—</span>
                )}
              </div>
            </div>

            <dl className="my-profile-sheet-list my-profile-sheet-list--wide">
                {narrativeFields.map(([key, label]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>{formatValue(characterSheet[key])}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>
      
      <section className="page-card my-profile-panel my-profile-private-note">
        <span className="section-kicker">Privacidad de identidad</span>
        <h3>Tu identidad fuera de la capa pública</h3>
        <p>
          Tu nombre real forma parte de tu hoja privada. No aparece públicamente salvo que una
          futura configuración permita activarlo.
        </p>
      </section>
    </div>
  )
}

export default MyProfile
