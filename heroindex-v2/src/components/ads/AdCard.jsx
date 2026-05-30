function AdCard({ ad }) {
  return (
    <article className="ad-card" data-ad-slot={ad.slotId} aria-label={ad.label}>
      <div className="ad-card__media" aria-hidden="true">
        <img src={ad.imageUrl} alt="" />
      </div>
      <div className="ad-card__content">
        <div className="ad-card__eyebrow">
          <span>{ad.brand}</span>
          <small>{ad.label}</small>
        </div>
        <h3>{ad.headline}</h3>
        <p>{ad.body}</p>
        <dl className="ad-card__meta" aria-label="Ad creative specs">
          <div>
            <dt>Placement</dt>
            <dd>{ad.placement}</dd>
          </div>
          <div>
            <dt>Ratio</dt>
            <dd>{ad.aspectRatioLabel}</dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd>{ad.recommendedSize}</dd>
          </div>
        </dl>
      </div>
    </article>
  )
}

export default AdCard