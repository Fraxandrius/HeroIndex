import { useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { updateUserProfile } from '../services/authService.js'
import { createPlayerHeroRequest } from '../services/playerHeroRequestsService.js'

function getHeroDisplayName(hero = {}) {
  return hero.alias || hero.publicName || hero.codename || hero.name || 'Identidad HeroIndex'
}

function getHeroTitle(hero = {}) {
  return hero.heroTitle || 'Figura HeroIndex'
}

function getInitials(value = 'HI') {
  return value
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function matchesHeroSearch(hero, searchTerm) {
  if (!searchTerm) return true

  const searchableText = [hero.alias, hero.publicName, hero.codename, hero.name, hero.heroTitle]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return searchableText.includes(searchTerm)
}

function Onboarding({ onNavigate }) {
  const { currentUser, isLoggedIn, loading: authLoading, logout, userProfile } = useAuth()
  const { heroes, loading: heroesLoading } = useHeroes()
  const { getCorporationById } = useCorporations()
  const [displayNameDraft, setDisplayNameDraft] = useState(null)
  const [avatarUrlDraft, setAvatarUrlDraft] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedHeroId, setSelectedHeroId] = useState('')
  const [requestedHeroName, setRequestedHeroName] = useState('')
  const [requestNotes, setRequestNotes] = useState('')
  const [requestSent, setRequestSent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const resolvedDisplayName = displayNameDraft ?? userProfile?.displayName ?? ''
  const resolvedAvatarUrl = avatarUrlDraft ?? userProfile?.avatarUrl ?? ''
  const resolvedHeroId = userProfile?.heroId ?? ''
  const normalizedSearch = searchQuery.trim().toLowerCase()

  const activeHeroes = useMemo(
    () => heroes.filter((hero) => hero.active !== false),
    [heroes],
  )
  const filteredHeroes = useMemo(
    () => activeHeroes.filter((hero) => matchesHeroSearch(hero, normalizedSearch)).slice(0, 12),
    [activeHeroes, normalizedSearch],
  )
  const selectedHero = activeHeroes.find((hero) => String(hero.id) === String(selectedHeroId))
  const linkedHero = activeHeroes.find((hero) => String(hero.id) === String(resolvedHeroId))

  const getCorporationName = (hero) => {
    if (!hero?.corporationId || hero.corporationId === 'independent' || hero.independent === true) {
      return 'Independiente'
    }

    return getCorporationById(hero.corporationId)?.name || hero.corporationName || hero.corporationId
  }

  const handleLogout = async () => {
    setSaving(true)
    setError('')
    setMessage('Cerrando sesión...')

    try {
      await logout()
      setMessage('')
      onNavigate?.('login')
    } catch {
      setMessage('')
      setError('No fue posible cerrar sesión.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveIdentity = async () => {
    if (!currentUser?.uid) return

    setSaving(true)
    setError('')
    setMessage('Guardando identidad HeroIndex...')

    try {
      await updateUserProfile(currentUser.uid, {
        avatarUrl: resolvedAvatarUrl.trim(),
        displayName: resolvedDisplayName.trim() || userProfile?.username || 'Jugador HeroIndex',
        heroId: resolvedHeroId,
      })
      setMessage('Identidad guardada correctamente.')
    } catch {
      setMessage('')
      setError('No fue posible guardar la identidad.')
    } finally {
      setSaving(false)
    }
  }

  const handleLinkHero = async () => {
    if (!currentUser?.uid || !selectedHeroId) return

    setSaving(true)
    setError('')
    setMessage('Vinculando héroe...')

    try {
      await updateUserProfile(currentUser.uid, {
        avatarUrl: resolvedAvatarUrl.trim(),
        displayName: resolvedDisplayName.trim() || userProfile?.username || 'Jugador HeroIndex',
        heroId: selectedHeroId,
      })
      setMessage('Héroe vinculado correctamente.')
    } catch {
      setMessage('')
      setError('No fue posible vincular el héroe.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitRequest = async (event) => {
    event.preventDefault()

    if (!currentUser?.uid) return

    if (!requestedHeroName.trim()) {
      setError('Ingresa el nombre del héroe solicitado.')
      setMessage('')
      return
    }

    setSaving(true)
    setError('')
    setMessage('Enviando solicitud...')

    try {
      await createPlayerHeroRequest({
        uid: currentUser.uid,
        username: userProfile?.username ?? '',
        displayName: resolvedDisplayName.trim() || userProfile?.displayName || userProfile?.username || 'Jugador HeroIndex',
        requestedHeroName: requestedHeroName.trim(),
        notes: requestNotes.trim(),
      })
      setRequestSent(true)
      setRequestedHeroName('')
      setRequestNotes('')
      setMessage('Solicitud enviada al equipo de revisión. Podrás completar tu perfil cuando tu héroe sea vinculado.')
    } catch {
      setMessage('')
      setError('No fue posible enviar la solicitud.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <section className="onboarding-page hi-page hi-page-wide hi-state-card">
        <p>Verificando identidad HeroIndex...</p>
      </section>
    )
  }

  if (!isLoggedIn) {
    return (
      <section className="onboarding-page hi-page hi-page-wide hi-state-card onboarding-empty-state">
        <p className="page-card__kicker">Entrada al ecosistema</p>
        <h2>Bienvenido a HeroIndex</h2>
        <p>Inicia sesión o crea una cuenta para completar tu identidad heroica.</p>
        <div className="onboarding-actions">
          <button className="hi-button hi-button-primary" onClick={() => onNavigate?.('login')} type="button">
            Iniciar sesión
          </button>
          <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('register')} type="button">
            Crear cuenta HeroIndex
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="onboarding-page hi-page hi-page-wide">
      <header className="onboarding-hero hi-card hi-card-player">
        <div>
          <p className="page-card__kicker">Comunidad HeroIndex</p>
          <h2>Bienvenido a HeroIndex</h2>
          <p className="onboarding-hero__lead">Completa tu identidad heroica y vincúlate al ecosistema de protección ciudadana.</p>
          <p>HeroIndex conecta a la comunidad con héroes verificados, perfiles públicos y señales de protección activa.</p>
        </div>
        <div className="onboarding-progress" aria-label="Progreso de onboarding">
          <span className="hi-chip">Identidad</span>
          <span className="hi-chip">Héroe</span>
          <span className="hi-chip">Confirmación</span>
          <div className="onboarding-header-actions">
            <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('home')} type="button">Home</button>
            <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('account')} type="button">Mi Cuenta</button>
            <button className="hi-button hi-button-subtle" disabled={saving} onClick={handleLogout} type="button">Cerrar sesión</button>
          </div>
        </div>
      </header>

      {message ? <p className="hi-state-card hi-state-card--success">{message}</p> : null}
      {error ? <p className="hi-state-card hi-state-card--error">{error}</p> : null}

      <div className="onboarding-grid">
        <article className="onboarding-panel hi-card hi-card-player">
          <div className="onboarding-panel__header">
            <span className="section-kicker">Paso 1</span>
            <h3>Identidad HeroIndex</h3>
            <p>Tu nombre visible aparecerá dentro de tu cuenta HeroIndex. La información pública de tu héroe se administra desde Mi Perfil.</p>
          </div>

          <div className="account-identity-card onboarding-identity-card">
            {resolvedAvatarUrl ? (
              <img alt="Avatar de cuenta" src={resolvedAvatarUrl} />
            ) : (
              <span>{getInitials(resolvedDisplayName || userProfile?.username || 'HI')}</span>
            )}
            <strong>{resolvedDisplayName || userProfile?.username || 'Jugador HeroIndex'}</strong>
            <small>{userProfile?.username}</small>
          </div>

          <label className="hi-field">
            <span className="hi-label">Nombre visible</span>
            <input className="hi-input" onChange={(event) => setDisplayNameDraft(event.target.value)} value={resolvedDisplayName} />
          </label>
          <label className="hi-field">
            <span className="hi-label">Avatar URL</span>
            <input className="hi-input" onChange={(event) => setAvatarUrlDraft(event.target.value)} value={resolvedAvatarUrl} />
          </label>
          <button className="hi-button hi-button-primary" disabled={saving} onClick={handleSaveIdentity} type="button">
            Guardar identidad
          </button>
        </article>

        <article className="onboarding-panel hi-card hi-card-player">
          <div className="onboarding-panel__header">
            <span className="section-kicker">Paso 2</span>
            <h3>Vincular héroe existente</h3>
            <p>Busca tu identidad heroica registrada y vincúlala con tu cuenta de jugador.</p>
          </div>

          <label className="hi-field">
            <span className="hi-label">Buscar héroe</span>
            <input
              className="hi-input"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Alias, nombre público o título heroico"
              value={searchQuery}
            />
          </label>

          <div className="onboarding-hero-list">
            {heroesLoading ? <p>Cargando héroes disponibles...</p> : null}
            {!heroesLoading && filteredHeroes.length === 0 ? <p>No hay héroes disponibles para esta búsqueda.</p> : null}
            {filteredHeroes.map((hero) => {
              const heroName = getHeroDisplayName(hero)
              const isSelected = String(hero.id) === String(selectedHeroId)

              return (
                <button
                  className={`onboarding-hero-option ${isSelected ? 'onboarding-hero-option--selected' : ''}`}
                  key={hero.id}
                  onClick={() => setSelectedHeroId(hero.id)}
                  type="button"
                >
                  {hero.avatarUrl ? <img alt={`Avatar de ${heroName}`} src={hero.avatarUrl} /> : <span>{getInitials(heroName)}</span>}
                  <div>
                    <strong>{heroName}</strong>
                    <small>{getHeroTitle(hero)} · {getCorporationName(hero)}</small>
                  </div>
                </button>
              )
            })}
          </div>

          <p className="account-help">La vinculación definitiva puede ser revisada por el equipo de revisión HeroIndex.</p>
          <button className="hi-button hi-button-primary" disabled={!selectedHeroId || saving} onClick={handleLinkHero} type="button">
            Vincular este héroe
          </button>
          {selectedHero ? <p className="onboarding-selected">Selección actual: {getHeroDisplayName(selectedHero)}</p> : null}
        </article>

        <article className="onboarding-panel hi-card hi-card-player">
          <div className="onboarding-panel__header">
            <span className="section-kicker">Solicitud alternativa</span>
            <h3>No encuentro mi héroe</h3>
            <p>Envía una solicitud para que el equipo de revisión valide tu vínculo heroico.</p>
          </div>

          <form className="hi-form" onSubmit={handleSubmitRequest}>
            <label className="hi-field">
              <span className="hi-label">Nombre del héroe solicitado</span>
              <input className="hi-input" onChange={(event) => setRequestedHeroName(event.target.value)} value={requestedHeroName} />
            </label>
            <label className="hi-field">
              <span className="hi-label">Notas para el equipo de revisión</span>
              <textarea className="hi-textarea" onChange={(event) => setRequestNotes(event.target.value)} rows="4" value={requestNotes} />
            </label>
            <button className="hi-button hi-button-secondary" disabled={saving} type="submit">
              Enviar solicitud
            </button>
          </form>
        </article>

        <article className="onboarding-panel onboarding-panel--confirmation hi-card hi-card-player">
          <div className="onboarding-panel__header">
            <span className="section-kicker">Paso 3</span>
            <h3>Confirmación</h3>
          </div>

          {linkedHero ? (
            <div className="onboarding-linked-hero">
              {linkedHero.avatarUrl ? <img alt={`Avatar de ${getHeroDisplayName(linkedHero)}`} src={linkedHero.avatarUrl} /> : <span>{getInitials(getHeroDisplayName(linkedHero))}</span>}
              <div>
                <h4>{getHeroDisplayName(linkedHero)}</h4>
                <p>{getHeroTitle(linkedHero)} · {getCorporationName(linkedHero)}</p>
                <p>Tu identidad HeroIndex está lista. Ya puedes administrar tu presencia heroica y revisar tu progreso.</p>
                <div className="onboarding-actions">
                  <button className="hi-button hi-button-primary" onClick={() => onNavigate?.('my-profile')} type="button">
                    Ir a Mi Perfil
                  </button>
                  <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('hero-profile', { heroId: linkedHero.id })} type="button">
                    Ver perfil público
                  </button>
                </div>
              </div>
            </div>
          ) : requestSent ? (
            <div className="onboarding-pending-request">
              <p>Solicitud pendiente de revisión.</p>
              <div className="onboarding-actions">
                <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('home')} type="button">
                  Volver a Home
                </button>
                <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('account')} type="button">
                  Mi Cuenta
                </button>
              </div>
            </div>
          ) : (
            <p>Vincula un héroe existente o envía una solicitud para completar tu acceso de jugador.</p>
          )}
        </article>
      </div>
    </section>
  )
}

export default Onboarding
