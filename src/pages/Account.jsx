function Account({ onNavigate }) {
  return (
    <section className="account-page page-card hi-card hi-card-player account-handoff">
      <p className="page-card__kicker">Configuración de cuenta</p>
      <h2>La configuración de cuenta ahora vive en Mi Perfil.</h2>
      <p>
        Gestiona tu usuario HeroIndex, sesión e información no sensible desde la pestaña Cuenta dentro
        de Mi Perfil.
      </p>
      <button className="hi-button hi-button-primary" onClick={() => onNavigate?.('my-profile')} type="button">
        Ir a configuración de Mi Perfil
      </button>
    </section>
  )
}

export default Account
