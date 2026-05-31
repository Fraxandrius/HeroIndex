import { useCorporations } from '../hooks/useCorporations.js'

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
}

function Corporations() {
  const { corporations, loading, source } = useCorporations()

  return (
    <section className="page-card corporations-page">
      <p className="page-card__kicker">Corporations · {source}</p>
      <h2>Corporations</h2>
      <div className="corporations-list">
        {loading ? <p>Loading...</p> : null}
        {!loading
          ? corporations.map((corporation) => (
              <article className="corporation-card" key={corporation.id}>
                <div className="corporation-card__logo">
                  <span>{getInitials(corporation.name)}</span>
                  {corporation.logoUrl ? (
                    <img
                      src={corporation.logoUrl}
                      alt={corporation.name}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.hidden = true
                      }}
                    />
                  ) : null}
                </div>
                <div>
                  {corporation.bannerUrl ? (
                    <img
                      alt={corporation.name}
                      className="corporation-card__cover"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.hidden = true
                      }}
                      src={corporation.bannerUrl}
                    />
                  ) : null}
                  <p className="page-card__kicker">{corporation.sector}</p>
                  <h3>{corporation.name}</h3>
                  <strong>{corporation.tagline}</strong>
                  <p>{corporation.description}</p>
                  <dl className="corporation-card__stats">
                    <div>
                      <dt>Country</dt>
                      <dd>{corporation.country}</dd>
                    </div>
                    <div>
                      <dt>Approval</dt>
                      <dd>{corporation.approval}</dd>
                    </div>
                    <div>
                      <dt>Trust</dt>
                      <dd>{corporation.trustScore}</dd>
                    </div>
                  </dl>
                </div>
              </article>
            ))
          : null}
      </div>
    </section>
  )
}

export default Corporations