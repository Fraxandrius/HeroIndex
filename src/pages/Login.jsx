import { useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { getUserProfile, loginWithHeroIndexUsername } from '../services/authService.js'

function Login({ onNavigate }) {
  const { isLoggedIn, loading: sessionLoading, logout, userProfile } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const passwordRef = useRef(null)

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

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!username.trim() || !password) {
      setError('Usuario o contraseña incorrectos.')
      setMessage('')
      return
    }

    setSaving(true)
    setError('')
    setMessage('Verificando identidad HeroIndex...')

    try {
      const user = await loginWithHeroIndexUsername({ password, username })
      const profile = await getUserProfile(user.uid).catch(() => null)
      onNavigate?.(profile?.heroId ? 'my-profile' : 'onboarding')
    } catch (loginError) {
      setMessage('')
      setError(loginError.message || 'No fue posible iniciar sesión.')
    } finally {
      setSaving(false)
    }
  }

  if (sessionLoading) {
    return (
      <section className="auth-page hi-page hi-page-wide hi-state-card">
        <p>Restaurando sesión HeroIndex...</p>
      </section>
    )
  }

  if (isLoggedIn) {
    return (
      <section className="auth-page hi-page hi-page-wide">
        <div className="auth-card auth-card--active-session hi-card hi-card-player">
          <p className="page-card__kicker">Sesión HeroIndex</p>
          <h2>Ya tienes una sesión activa.</h2>
          <p>{userProfile?.displayName || userProfile?.username || 'Jugador HeroIndex'} ya forma parte del ecosistema HeroIndex en este dispositivo.</p>
          <div className="account-social-badges">
            <span className="hi-chip">Cuenta HeroIndex activa</span>
            <span className="hi-chip">{userProfile?.heroId ? 'Héroe vinculado' : 'Vinculación pendiente'}</span>
          </div>
          <div className="account-actions">
            <button className="hi-button hi-button-primary" onClick={() => onNavigate?.(userProfile?.heroId ? 'my-profile' : 'onboarding')} type="button">
              Ir a Mi Perfil
            </button>
            <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('account')} type="button">
              Mi Cuenta
            </button>
            <button className="hi-button hi-button-danger" disabled={saving} onClick={handleLogout} type="button">
              Cerrar sesión
            </button>
          </div>
          {error ? <p className="hi-state-card hi-state-card--error">{error}</p> : null}
        </div>
      </section>
    )
  }

  return (
    <section className="auth-page hi-page hi-page-wide">
      <form className="auth-card hi-card hi-card-player hi-form" onSubmit={handleSubmit}>
        <header className="auth-card__header">
          <p className="page-card__kicker">Acceso HeroIndex</p>
          <h2>Iniciar sesión</h2>
          <p>Accede con tu identidad HeroIndex y continúa tu presencia dentro del sistema heroico.</p>
        </header>

        <label className="hi-field">
          <span className="hi-label">Usuario HeroIndex</span>
          <input
            className="hi-input"
            onChange={(event) => setUsername(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                passwordRef.current?.focus()
              }
            }}
            placeholder="Tu usuario HeroIndex"
            type="text"
            value={username}
          />
        </label>
        <label className="hi-field">
          <span className="hi-label">Contraseña</span>
          <input
            className="hi-input"
            onChange={(event) => setPassword(event.target.value)}
            ref={passwordRef}
            type="password"
            value={password}
          />
        </label>

        {message ? <p className="hi-state-card hi-state-card--success">{message}</p> : null}
        {error ? <p className="hi-state-card hi-state-card--error">{error}</p> : null}

        <button className="hi-button hi-button-primary" disabled={saving} type="submit">
          {saving ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
        <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('register')} type="button">
          Crear cuenta HeroIndex
        </button>
      </form>
    </section>
  )
}

export default Login