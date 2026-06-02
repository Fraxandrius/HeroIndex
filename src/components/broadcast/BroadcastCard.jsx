const toneLabels = {
  alert: 'Alerta ciudadana',
  civic: 'Canal cívico',
  corporate: 'Afiliación certificada',
  heroic: 'Estándar heroico',
  institutional: 'Mensaje institucional',
  recruitment: 'Comunidad HeroIndex',
  safety: 'Red de protección',
}

function BroadcastCard({ broadcast, variant = 'inline' }) {
  const toneLabel = toneLabels[broadcast.tone] ?? 'Señal HeroIndex'
  const hasAction = Boolean(broadcast.ctaLabel && broadcast.ctaUrl)
  const cardStyle = broadcast.imageUrl
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(3, 7, 18, 0.82), rgba(8, 15, 31, 0.6)), url(${broadcast.imageUrl})`,
      }
    : undefined

  return (
    <article className={`broadcast-card broadcast-card--${variant} broadcast-card--${broadcast.tone ?? 'institutional'}`} style={cardStyle}>
      <div className="broadcast-card__content">
        <p className="broadcast-card__label">{broadcast.category || toneLabel}</p>
        <h3>{broadcast.title || 'Señal HeroIndex pendiente'}</h3>
        {broadcast.subtitle ? <strong>{broadcast.subtitle}</strong> : null}
        <p>{broadcast.body || 'Canal verificado en preparación para la comunidad HeroIndex.'}</p>
        {hasAction ? (
          <a className="broadcast-card__action" href={broadcast.ctaUrl} rel="noreferrer" target={broadcast.ctaUrl.startsWith('http') ? '_blank' : undefined}>
            {broadcast.ctaLabel}
          </a>
        ) : null}
      </div>
    </article>
  )
}

export default BroadcastCard
