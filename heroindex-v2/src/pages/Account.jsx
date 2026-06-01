import { useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { updateUserProfile } from '../services/authService.js'

function getHeroDisplayName(hero = {}) {
  return hero.alias || hero.publicName || hero.codename || hero.name || 'Identidad HeroIndex'
}

function getHeroTitle(hero = {}) {
  return hero.heroTitle || 'Figura HeroIndex'
}

function Account({ onNavigate }) {
  const { currentUser, isLoggedIn, loading: authLoading, logout, userProfile } = useAuth()
  const { heroes, loading: heroesLoading } = useHeroes()
  const [displayName, setDisplayName] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [heroId, setHeroId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const activeHeroes = useMemo(
    () => heroes.filter((hero) => hero.active !== false),
    [heroes],
  )
  const resolvedDisplayName = displayName ?? userProfile?.displayName ?? ''
  const resolvedAvatarUrl = avatarUrl ?? userProfile?.avatarUrl ?? ''
  const resolvedHeroId = heroId ?? userProfile?.heroId ?? ''
  const linkedHero = activeHeroes.find((hero) => String(hero.id) === String(resolvedHeroId))

  const handleSave = async (event) => {
    event.preventDefault()

    if (!currentUser?.uid) return

    setSaving(true)
    setError('')
    setMessage('Guardando cuenta...')

    try {
      await updateUserProfile(currentUser.uid, {
        avatarUrl: resolvedAvatarUrl.trim(),
        displayName: resolvedDisplayName.trim() || userProfile?.username || 'Jugador HeroIndex',
        heroId: resolvedHeroId,
      })
      setMessage('Cuenta guardada correctamente.')
    } catch {
      setMessage('')
      setError('No fue posible guardar la cuenta.')
    } finally {
      setSaving(false)
    }
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
        <p>Cargando cuenta HeroIndex...</p>
      </section>
    )
  }

  if (!isLoggedIn) {
    return (
      <section className="account-page hi-page hi-page-wide hi-state-card account-empty-state">
        <p className="page-card__kicker">Identidad HeroIndex</p>
        <h2>Mi Cuenta</h2>
        <p>Inicia sesión o crea una cuenta interna para vincular tu héroe.</p>
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
    <section className="account-page hi-page hi-page-wide">
      <header className="account-hero hi-card hi-card-player">
        <div>
          <p className="page-card__kicker">Identidad interna HeroIndex</p>
          <h2>Mi Cuenta</h2>
          <p>Gestiona tu identidad de usuario y vínculo heroico.</p>
        </div>
        <div className="account-identity-card">
          {resolvedAvatarUrl ? <img alt="Avatar de cuenta" src={resolvedAvatarUrl} /> : <span>{(resolvedDisplayName || userProfile?.username || 'HI').slice(0, 2).toUpperCase()}</span>}
          <strong>{resolvedDisplayName || userProfile?.displayName || userProfile?.username}</strong>
          <small>{userProfile?.username}</small>
        </div>
      </header>

      <div className="account-layout">
        <form className="account-form hi-card hi-card-player hi-form" onSubmit={handleSave}>
          <div className="account-section-heading">
            <p className="page-card__kicker">Configuración de usuario</p>
            <h3>Perfil interno</h3>
          </div>

          <label className="hi-field">
            <span className="hi-label">Nombre visible</span>
            <input className="hi-input" onChange={(event) => setDisplayName(event.target.value)} value={resolvedDisplayName} />
          </label>
          <label className="hi-field">
            <span className="hi-label">Avatar URL</span>
            <input className="hi-input" onChange={(event) => setAvatarUrl(event.target.value)} value={resolvedAvatarUrl} />
          </label>
          <label className="hi-field">
            <span className="hi-label">Héroe vinculado</span>
            <select className="hi-select" disabled={heroesLoading} onChange={(event) => setHeroId(event.target.value)} value={resolvedHeroId}>
              <option value="">Sin héroe vinculado</option>
              {activeHeroes.map((hero) => (
                <option key={hero.id} value={hero.id}>
                  {getHeroDisplayName(hero)} · {getHeroTitle(hero)}
                </option>
              ))}
            </select>
          </label>

          <div className="account-internal-id">
            <span>ID interno HeroIndex</span>
            <strong>{userProfile?.authEmail || currentUser.email}</strong>
          </div>
          <p className="account-help">La vinculación definitiva de héroes podrá ser revisada por ORÁCULO/GM.</p>

          {message ? <p className="hi-state-card hi-state-card--success">{message}</p> : null}
          {error ? <p className="hi-state-card hi-state-card--error">{error}</p> : null}

          <div className="account-actions">
            <button className="hi-button hi-button-primary" disabled={saving} type="submit">
              {saving ? 'Guardando...' : 'Guardar cuenta'}
            </button>
            <button className="hi-button hi-button-secondary" disabled={!resolvedHeroId} onClick={() => onNavigate?.('my-profile')} type="button">
              Ir a Mi Perfil
            </button>
            <button className="hi-button hi-button-subtle" onClick={handleLogout} type="button">
              Cerrar sesión
            </button>
          </div>
        </form>

        <aside className="account-linked-hero hi-card hi-card-player">
          <p className="page-card__kicker">Vínculo heroico</p>
          {linkedHero ? (
            <>
              <h3>{getHeroDisplayName(linkedHero)}</h3>
              <p>{getHeroTitle(linkedHero)}</p>
              <span className="hi-chip">{linkedHero.corporationId || 'Independiente'}</span>
              <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('hero-profile', { heroId: linkedHero.id })} type="button">
                Ver perfil público
              </button>
            </>
          ) : (
            <>
              <h3>Sin héroe vinculado</h3>
              <p>Selecciona un héroe activo para activar Mi Perfil y Karma desde tu cuenta.</p>
            </>
          )}
        </aside>
      </div>
    </section>
  )
}

export default Account