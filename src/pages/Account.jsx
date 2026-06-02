import { useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { updateUserProfile } from '../services/authService.js'

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

function Account({ onNavigate }) {
  const { currentUser, isLoggedIn, loading: authLoading, logout, userProfile } = useAuth()
  const { getCorporationById } = useCorporations()
  const { heroes } = useHeroes()
  const [displayName, setDisplayName] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const activeHeroes = useMemo(
    () => heroes.filter((hero) => hero.active !== false),
    [heroes],
  )
  const resolvedDisplayName = displayName ?? userProfile?.displayName ?? ''
  const resolvedAvatarUrl = avatarUrl ?? userProfile?.avatarUrl ?? ''
  const linkedHeroId = userProfile?.heroId ?? ''
  const resolvedHeroId = linkedHeroId
  const linkedHero = activeHeroes.find((hero) => String(hero.id) === String(linkedHeroId))
  const userName = resolvedDisplayName || userProfile?.displayName || userProfile?.username || 'Jugador HeroIndex'

  const getCorporationName = (hero) => {
    if (!hero?.corporationId || hero.corporationId === 'independent' || hero.independent === true) {
      return 'Independiente'
    }

    return getCorporationById(hero.corporationId)?.name || hero.corporationName || hero.corporationId
  }

  const saveProfile = async (nextHeroId = linkedHeroId, successMessage = 'Cuenta guardada correctamente.') => {
    if (!currentUser?.uid) return

    setSaving(true)
    setError('')
    setMessage('Guardando cuenta...')

    try {
      await updateUserProfile(currentUser.uid, {
        avatarUrl: resolvedAvatarUrl.trim(),
        displayName: resolvedDisplayName.trim() || userProfile?.username || 'Jugador HeroIndex',
        heroId: nextHeroId,
      })
      setMessage(successMessage)
    } catch {
      setMessage('')
      setError('No fue posible guardar la cuenta.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveIdentity = (event) => {
    event.preventDefault()
    saveProfile(resolvedHeroId, 'Identidad guardada correctamente.')
  }


  const handleLogout = async () => {
    setSaving(true)
    setMessage('Cerrando sesión...')
    setError('')

    try {
      await logout()
      onNavigate?.('login')
    } catch {
      setMessage('')
      setError('No fue posible cerrar sesión.')
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <section className="account-page hi-page hi-page-wide hi-state-card">
        <p>Restaurando sesión HeroIndex...</p>
      </section>
    )
  }

  if (!isLoggedIn) {
    return (
      <section className="account-page hi-page hi-page-wide hi-state-card account-empty-state">
        <p className="page-card__kicker">Identidad HeroIndex</p>
        <h2>Mi Cuenta</h2>
        <p>Inicia sesión o crea una cuenta interna para completar tu perfil heroico.</p>
        <div className="account-actions">
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


  return (
    <section className="account-page account-page--social hi-page hi-page-wide">
      <header className="account-social-hero hi-card hi-card-player hi-user-panel">
        <div className="account-social-identity">
          <div className="account-social-avatar">
            {resolvedAvatarUrl ? <img alt="Avatar de cuenta" src={resolvedAvatarUrl} /> : <span>{getInitials(userName)}</span>}
          </div>
          <div>
            <p className="page-card__kicker">Tu identidad dentro del ecosistema HeroIndex</p>
            <h2>Mi Cuenta</h2>
            <p>Gestiona tu identidad HeroIndex y el estado de tu perfil heroico.</p>
            <div className="account-social-badges">
              <span className="hi-chip">Cuenta activa</span>
              <span className="hi-chip">Jugador</span>
              <span className="hi-chip">{resolvedHeroId ? 'Perfil heroico activo' : 'Perfil heroico incompleto'}</span>
            </div>
          </div>
        </div>
        <aside className="account-social-summary">
          <strong>{userName}</strong>
          <span>@{userProfile?.username}</span>
          <small>Identidad interna: {userProfile?.authEmail || currentUser.email}</small>
        </aside>
      </header>

      <div className="account-social-layout">
        <main className="account-social-main">
          <form className="account-social-card hi-card hi-card-player hi-form" onSubmit={handleSaveIdentity}>
            <div className="account-section-heading">
              <p className="page-card__kicker">Identidad de usuario</p>
              <h3>Una cuenta, una presencia, una trayectoria pública.</h3>
            </div>

            <label className="hi-field">
             <span className="hi-label">Nombre de héroe</span>
              <input className="hi-input" onChange={(event) => setDisplayName(event.target.value)} value={resolvedDisplayName} />
            </label>
            <label className="hi-field">
              <span className="hi-label">Avatar URL</span>
              <input className="hi-input" onChange={(event) => setAvatarUrl(event.target.value)} value={resolvedAvatarUrl} />
            </label>

            {message ? <p className="hi-state-card hi-state-card--success">{message}</p> : null}
            {error ? <p className="hi-state-card hi-state-card--error">{error}</p> : null}

            <button className="hi-button hi-button-primary" disabled={saving} type="submit">
              {saving ? 'Guardando...' : 'Guardar identidad'}
            </button>
          </form>

          <section className="account-social-card hi-card hi-card-player">
            <div className="account-section-heading">
              <p className="page-card__kicker">Perfil heroico</p>
              <h3>{linkedHero ? getHeroDisplayName(linkedHero) : 'Tu perfil heroico aún está incompleto.'}</h3>
              <p>Completa Mi Perfil para crear o editar tu existencia pública dentro de HeroIndex.</p>
            </div>

            {linkedHero ? (
              <article className="account-hero-card">
                {linkedHero.avatarUrl ? <img alt={`Avatar de ${getHeroDisplayName(linkedHero)}`} src={linkedHero.avatarUrl} /> : <span>{getInitials(getHeroDisplayName(linkedHero))}</span>}
                <div>
                  <strong>{getHeroDisplayName(linkedHero)}</strong>
                  <p>{getHeroTitle(linkedHero)}</p>
                  <span className="hi-chip">{getCorporationName(linkedHero)}</span>
                </div>
              </article>
            ) : (
              <div className="account-link-callout hi-state-card">
                <strong>Tu perfil heroico aún está incompleto.</strong>
                <p>Completa Mi Perfil para crear tu héroe público y activar tu centro de jugador.</p>
              </div>
            )}

            <div className="account-actions">
              {linkedHero ? (
                <>
                  <button className="hi-button hi-button-primary" onClick={() => onNavigate?.('my-profile')} type="button">
                    Ir a Mi Perfil
                  </button>
                  <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('hero-profile', { heroId: linkedHero.id })} type="button">
                    Ver perfil público
                  </button>
                </>
              ) : (
                <>
                  <button className="hi-button hi-button-primary" onClick={() => onNavigate?.('my-profile')} type="button">
                    Completar Mi Perfil
                  </button>
                </>
              )}
            </div>

          </section>
        </main>

        <aside className="account-social-side">
          <section className="account-social-card hi-card hi-card-player">
            <p className="page-card__kicker">Acciones rápidas</p>
            <h3>Tu acceso HeroIndex</h3>
            <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('my-profile')} type="button">
              Mi Perfil
            </button>
            <button className="hi-button hi-button-secondary" disabled={!resolvedHeroId} onClick={() => onNavigate?.('karma')} type="button">
              Karma
            </button>
            <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('my-profile')} type="button">
              Completar Mi Perfil
            </button>
          </section>

          <section className="account-social-card hi-card hi-card-player account-security-card">
            <p className="page-card__kicker">Seguridad de cuenta</p>
            <h3>Sesión HeroIndex</h3>
            <p>Tu cuenta utiliza una identidad interna HeroIndex. Guarda tu contraseña en un lugar seguro.</p>
            <button className="hi-button hi-button-danger" disabled={saving} onClick={handleLogout} type="button">
              Cerrar sesión
            </button>
          </section>
        </aside>
      </div>
    </section>
  )
}

export default Account
