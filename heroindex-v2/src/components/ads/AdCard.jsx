import { useEffect, useState } from 'react'

function AdImageFallback({ ad }) {
  return (
    <div className="sponsor-card__image-fallback" aria-hidden="true">
      <strong>{ad.brand ?? 'Sponsored'}</strong>
      <span>{ad.headline ?? ad.slotId}</span>
    </div>
  )
}

function AdCard({ ad }) {
  const [hasImageError, setHasImageError] = useState(false)
  const label = ad.label ?? ad.slotId

  useEffect(() => {
    setHasImageError(false)
  }, [ad.imageUrl])

  const shouldRenderImage = Boolean(ad.imageUrl) && !hasImageError
  const specs = [
    { label: 'Placement', value: ad.placement },
    { label: 'Ratio', value: ad.aspectRatioLabel },
    { label: 'Size', value: ad.recommendedSize },
  ].filter((spec) => Boolean(spec.value))

  return (
    <article className="sponsor-card" data-placement-slot={ad.slotId} aria-label={label}>
      <div className="sponsor-card__media" aria-label="Sponsor creative">
        {shouldRenderImage ? (
          <img src={ad.imageUrl} alt="" onError={() => setHasImageError(true)} />
        ) : (
          <AdImageFallback ad={ad} />
        )}
      </div>
      <div className="sponsor-card__content">
        <div className="sponsor-card__eyebrow">
          <span>{ad.brand ?? 'Sponsored'}</span>
          <small>{label}</small>
        </div>
        <h3>{ad.headline ?? label}</h3>
        <p>{ad.body ?? ''}</p>
        {specs.length > 0 ? (
          <dl className="sponsor-card__meta" aria-label="Sponsor creative specs">
            {specs.map((spec) => (
              <div key={spec.label}>
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </article>
  )
}

export default AdCard