import { useAuth } from '../../hooks/useAuth.js'
import { canSeeOraculoTools } from '../../utils/roles.js'

export function RequireOraculo({ children, onNavigate }) {
  const { loading, userProfile } = useAuth()

  if (loading) {
    return (
      <section className="hi-page hi-page-wide hi-state-card">
        <p>Verificando acceso HeroIndex...</p>
      </section>
    )
  }

  if (canSeeOraculoTools(userProfile)) {
    return children
  }

  return (
    <section className="hi-page hi-page-wide hi-state-card">
      <p className="page-card__kicker">Acceso restringido</p>
      <h2>Acceso restringido</h2>
      <p>Esta sección pertenece a la capa interna de HeroIndex.</p>
      <button className="hi-button hi-button-primary" onClick={() => onNavigate?.('home')} type="button">
        Volver al inicio
      </button>
    </section>
  )
}

export function RequirePlayer({ children, onNavigate }) {
  const { isLoggedIn, loading } = useAuth()

  if (loading) {
    return (
      <section className="hi-page hi-page-wide hi-state-card">
        <p>Restaurando sesión HeroIndex...</p>
      </section>
    )
  }

  if (isLoggedIn || import.meta.env.VITE_PLAYER_HERO_ID) {
    return children
  }

  return (
    <section className="hi-page hi-page-wide hi-state-card">
      <p className="page-card__kicker">Identidad HeroIndex</p>
      <h2>Inicia sesión para continuar</h2>
      <p>Necesitas una cuenta HeroIndex para acceder a esta sección de jugador.</p>
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
