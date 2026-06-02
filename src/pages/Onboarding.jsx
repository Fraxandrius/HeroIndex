import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { updateUserProfile } from '../services/authService.js'

function Onboarding({ onNavigate }) {
  const { currentUser, isLoggedIn, loading: authLoading, logout, userProfile } = useAuth()
  const [displayNameDraft, setDisplayNameDraft] = useState(null)
  const [avatarUrlDraft, setAvatarUrlDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const resolvedDisplayName = displayNameDraft ?? userProfile?.displayName ?? userProfile?.heroName ?? ''
  const resolvedAvatarUrl = avatarUrlDraft ?? userProfile?.avatarUrl ?? ''

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
        heroId: userProfile?.heroId ?? '',
        heroName: resolvedDisplayName.trim() || userProfile?.heroName || userProfile?.username || 'Jugador HeroIndex',
      })
      setMessage('Identidad guardada correctamente. Completa Mi Perfil para crear tu héroe público.')
    } catch {
      setMessage('')
      setError('No fue posible guardar la identidad.')
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
        <span className="section-kicker">Onboarding HeroIndex</span>
        <h2>Inicia sesión para continuar</h2>
        <p>Necesitas una cuenta HeroIndex para completar tu perfil heroico.</p>
        <div className="onboarding-actions">
          <button className="hi-button hi-button-primary" onClick={() => onNavigate?.('login')} type="button">Iniciar sesión</button>
          <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('register')} type="button">Crear cuenta</button>
        </div>
      </section>
    )
  }

  return (
    <section className="onboarding-page hi-page hi-page-wide">
      <header className="onboarding-hero hi-card hi-card-player">
        <div>
          <span className="section-kicker">Onboarding HeroIndex</span>
          <h2>Completa tu identidad heroica</h2>
          <p className="onboarding-hero__lead">Tu héroe se crea y se edita desde Mi Perfil.</p>
          <p>Completa tu identidad de cuenta y entra a Mi Perfil para construir tu existencia pública dentro del ecosistema HeroIndex.</p>
        </div>
        <div className="onboarding-header-actions">
          <button className="hi-button hi-button-primary" onClick={() => onNavigate?.('my-profile')} type="button">Completar mi perfil heroico</button>
          <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('account')} type="button">Mi Cuenta</button>
          <button className="hi-button hi-button-subtle" disabled={saving} onClick={handleLogout} type="button">Cerrar sesión</button>
        </div>
      </header>

      {message ? <p className="hi-state-card hi-state-card--success">{message}</p> : null}
      {error ? <p className="hi-state-card hi-state-card--error">{error}</p> : null}

      <div className="onboarding-grid">
        <article className="onboarding-panel hi-card hi-card-player">
          <div className="onboarding-panel__header">
            <span className="section-kicker">Identidad</span>
            <h3>Cuenta HeroIndex</h3>
            <p>Tu nombre de héroe será la base de tu perfil público. Puedes terminar la creación completa en Mi Perfil.</p>
          </div>

          <label className="hi-field">
            <span className="hi-label">Nombre de héroe</span>
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
            <span className="section-kicker">Mi Perfil</span>
            <h3>Centro de creación del héroe</h3>
            <p>No necesitas buscar un héroe existente. Crea tu héroe, edita su biografía, poderes visibles e imagen pública desde Mi Perfil.</p>
          </div>
          <button className="hi-button hi-button-primary" onClick={() => onNavigate?.('my-profile')} type="button">
            Completar mi perfil heroico
          </button>
        </article>

        <article className="onboarding-panel onboarding-panel--confirmation hi-card hi-card-player">
          <div className="onboarding-panel__header">
            <span className="section-kicker">Estado</span>
            <h3>{userProfile?.heroId ? 'Perfil heroico activo' : 'Perfil heroico incompleto'}</h3>
            <p>{userProfile?.heroId ? 'Tu héroe ya existe dentro de HeroIndex.' : 'Completa Mi Perfil para crear tu héroe público.'}</p>
          </div>
          <div className="onboarding-actions">
            <button className="hi-button hi-button-primary" onClick={() => onNavigate?.('my-profile')} type="button">Ir a Mi Perfil</button>
            <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('home')} type="button">Volver al inicio</button>
          </div>
        </article>
      </div>
    </section>
  )
}

export default Onboarding
