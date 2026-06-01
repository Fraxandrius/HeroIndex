import { useRef, useState } from 'react'
import { getUserProfile, loginWithHeroIndexUsername } from '../services/authService.js'

function Login({ onNavigate }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const passwordRef = useRef(null)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!username.trim() || !password) {
      setError('Usuario o contraseña incorrectos.')
      setMessage('')
      return
    }

    setSaving(true)
    setError('')
    setMessage('Iniciando sesión...')

    try {
      const user = await loginWithHeroIndexUsername({ password, username })
      const profile = await getUserProfile(user.uid).catch(() => null)
      onNavigate?.(profile?.heroId ? 'my-profile' : 'account')
    } catch (loginError) {
      setMessage('')
      setError(loginError.message || 'No fue posible iniciar sesión.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="auth-page hi-page hi-page-wide">
      <form className="auth-card hi-card hi-card-player hi-form" onSubmit={handleSubmit}>
        <header className="auth-card__header">
          <p className="page-card__kicker">Acceso HeroIndex</p>
          <h2>Iniciar sesión</h2>
          <p>Inicia sesión con tu identidad HeroIndex.</p>
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