import { useRef, useState } from 'react'
import { buildHeroIndexEmail, normalizeHeroIndexUsername, registerWithHeroIndexUsername } from '../services/authService.js'

function Register({ onNavigate }) {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const displayNameRef = useRef(null)
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
      await registerWithHeroIndexUsername({ displayName, password, username })
      setMessage('Cuenta creada correctamente.')
      onNavigate?.('account')
    } catch (registerError) {
      setMessage('')
      setError(registerError.message || 'No fue posible crear la cuenta.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="auth-page hi-page hi-page-wide">
      <form className="auth-card hi-card hi-card-player hi-form" onSubmit={handleSubmit}>
        <header className="auth-card__header">
          <p className="page-card__kicker">Comunidad HeroIndex</p>
          <h2>Crear cuenta HeroIndex</h2>
          <p>Registra tu identidad interna y únete a la comunidad HeroIndex.</p>
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
                displayNameRef.current?.focus()
              }
            }}
            placeholder="Ej: Viento Sur"
            type="text"
            value={username}
          />
        </label>
        <label className="hi-field">
          <span className="hi-label">Nombre visible</span>
          <input
            className="hi-input"
            onChange={(event) => setDisplayName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                passwordRef.current?.focus()
              }
            }}
            placeholder="Cómo aparecerás dentro de HeroIndex"
            ref={displayNameRef}
            type="text"
            value={displayName}
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