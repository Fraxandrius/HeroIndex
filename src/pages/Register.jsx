import { useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { buildHeroIndexEmail, normalizeHeroIndexUsername, registerWithHeroIndexUsername } from '../services/authService.js'

function Register({ onNavigate }) {
  const { isLoggedIn, loading: sessionLoading, logout, userProfile } = useAuth()
  const [username, setUsername] = useState('')
  const [heroName, setHeroName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const heroNameRef = useRef(null)
  const passwordRef = useRef(null)
  const confirmPasswordRef = useRef(null)

  const normalizedUsername = normalizeHeroIndexUsername(username)
  const internalEmail = normalizedUsername.length >= 3 ? buildHeroIndexEmail(username) : 'usuario@indexchile.cl'

  const validate = () => {
    if (normalizedUsername.length < 3) {
      return 'Ingresa un usuario válido de al menos 3 caracteres.'
    }

    if (!password || password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres.'
    }

    if (password !== confirmPassword) {
      return 'Las contraseñas no coinciden.'
    }

    return ''
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationError = validate()

    if (validationError) {
      setError(validationError)
      setMessage('')
      return
    }

    setSaving(true)
    setError('')
    setMessage('Creando cuenta HeroIndex...')

    try {
      await registerWithHeroIndexUsername({ heroName, password, username })
      setMessage('Cuenta creada correctamente.')
      onNavigate?.('my-profile')
    } catch (registerError) {
      setMessage('')
      setError(registerError.message || 'No fue posible crear la cuenta.')
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
          <p>{userProfile?.displayName || userProfile?.username || 'Jugador HeroIndex'} ya tiene identidad dentro del ecosistema HeroIndex.</p>
          <div className="account-social-badges">
            <span className="hi-chip">Cuenta HeroIndex activa</span>
            <span className="hi-chip">{userProfile?.heroId ? 'Perfil heroico activo' : 'Perfil heroico incompleto'}</span>
          </div>
          <div className="account-actions">
            <button className="hi-button hi-button-primary" onClick={() => onNavigate?.('my-profile')} type="button">
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
          <p className="page-card__kicker">Comunidad HeroIndex</p>
          <h2>Crear cuenta HeroIndex</h2>
          <p>Crea tu identidad HeroIndex. Tu nombre de héroe será la base de tu perfil público.</p>
        </header>

        <p className="auth-card__help">
          Tu cuenta se creará con una identidad interna de HeroIndex. No necesitas usar un correo real.
        </p>
        <p className="auth-card__warning">
          Guarda tu contraseña. La recuperación automática no está disponible para cuentas internas HeroIndex.
        </p>

        <label className="hi-field">
          <span className="hi-label">Usuario HeroIndex</span>
          <input
            className="hi-input"
            onChange={(event) => setUsername(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                heroNameRef.current?.focus()
              }
            }}
            placeholder="Ej: Viento Sur"
            type="text"
            value={username}
          />
        </label>
        <label className="hi-field">
          <span className="hi-label">Nombre de héroe</span>
          <input
            className="hi-input"
            onChange={(event) => setHeroName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                passwordRef.current?.focus()
              }
            }}
            placeholder="Ej: Cóndor Austral"
            ref={heroNameRef}
            type="text"
            value={heroName}
          />
        </label>
        <label className="hi-field">
          <span className="hi-label">Contraseña</span>
          <input
            className="hi-input"
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                confirmPasswordRef.current?.focus()
              }
            }}
            ref={passwordRef}
            type="password"
            value={password}
          />
        </label>
        <label className="hi-field">
          <span className="hi-label">Confirmar contraseña</span>
          <input
            className="hi-input"
            onChange={(event) => setConfirmPassword(event.target.value)}
            ref={confirmPasswordRef}
            type="password"
            value={confirmPassword}
          />
        </label>

        <div className="auth-card__internal-id">
          <span>ID interno HeroIndex</span>
          <strong>{internalEmail}</strong>
        </div>

        {message ? <p className="hi-state-card hi-state-card--success">{message}</p> : null}
        {error ? <p className="hi-state-card hi-state-card--error">{error}</p> : null}

        <button className="hi-button hi-button-primary" disabled={saving} type="submit">
          {saving ? 'Creando cuenta...' : 'Crear cuenta HeroIndex'}
        </button>
        <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('login')} type="button">
          Ya tengo cuenta
        </button>
      </form>
    </section>
  )
}

export default Register