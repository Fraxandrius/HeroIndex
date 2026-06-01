import { useState } from 'react'

function AdImageFallback({ ad }) {
  return (
    <div className="broadcast-card__image-fallback" aria-hidden="true">
      <strong>{ad.brand ?? 'Broadcast'}</strong>
      <span>{ad.headline ?? ad.slotId}</span>
    </div>
  )
}

function AdCard({ ad }) {
  const [imageErrorState, setImageErrorState] = useState({ imageUrl: null, hasError: false })
  const label = ad.label ?? ad.slotId
  const hasImageError = imageErrorState.imageUrl === ad.imageUrl && imageErrorState.hasError
  const shouldRenderImage = Boolean(ad.imageUrl) && !hasImageError
  const specs = [
    { label: 'Placement', value: ad.placement },
    { label: 'Ratio', value: ad.aspectRatioLabel },
    { label: 'Size', value: ad.recommendedSize },
  ].filter((spec) => Boolean(spec.value))

  return (
    <article className="broadcast-card" data-broadcast-slot={ad.slotId} aria-label={label}>
      <div className="broadcast-card__media" aria-label="Broadcast creative">
        {shouldRenderImage ? (
          <img
            src={ad.imageUrl}
            alt=""
            onError={() => setImageErrorState({ imageUrl: ad.imageUrl, hasError: true })}
          />
        ) : (
          <AdImageFallback ad={ad} />
        )}
      </div>
      <div className="broadcast-card__content">
        <div className="broadcast-card__eyebrow">
          <span>{ad.brand ?? 'Broadcast'}</span>
          <small>{label}</small>
        </div>
        <h3>{ad.headline ?? label}</h3>
        <p>{ad.body ?? ''}</p>
        {specs.length > 0 ? (
          <dl className="broadcast-card__meta" aria-label="Broadcast creative specs">
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