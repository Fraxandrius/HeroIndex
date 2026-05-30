import { useEffect, useState } from 'react'

function AdCard({ ad }) {
  const [hasImageError, setHasImageError] = useState(false)
  const label = ad.label ?? ad.slotId

  useEffect(() => {
    setHasImageError(false)
  }, [ad.imageUrl])
  const hasImage = Boolean(ad.imageUrl) && !hasImageError
  const specs = [
    { label: 'Placement', value: ad.placement },
    { label: 'Ratio', value: ad.aspectRatioLabel },
    { label: 'Size', value: ad.recommendedSize },
  ].filter((spec) => Boolean(spec.value))

  return (
    <article className="ad-card" data-ad-slot={ad.slotId} aria-label={label}>
      {hasImage ? (
        <div className="ad-card__media" aria-hidden="true">
          <img src={ad.imageUrl} alt="" onError={() => setHasImageError(true)} />
        </div>
      ) : null}
      <div className="ad-card__content">
        <div className="ad-card__eyebrow">
          <span>{ad.brand}</span>
          <small>{label}</small>
        </div>
        <h3>{ad.headline}</h3>
        <p>{ad.body}</p>
        {specs.length > 0 ? (
          <dl className="ad-card__meta" aria-label="Ad creative specs">
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