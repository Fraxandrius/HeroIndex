import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'

function Profiles() {
  const { heroes, loading: heroesLoading, source } = useHeroes()
  const {
    getCorporationById,
    loading: corporationsLoading,
    source: corporationsSource,
  } = useCorporations()

  return (
    <section className="page-card profiles-page">
      <p className="page-card__kicker">
        Players · {source} heroes · {corporationsSource} corporations
      </p>
      <h2>Profiles</h2>
      <div className="profiles-list">
        {heroesLoading || corporationsLoading ? <p>Loading...</p> : null}
        {!heroesLoading && !corporationsLoading
          ? heroes.map((hero) => (
              <article className="profile-card" key={hero.id}>
                <div className="profile-card__avatar">
                  {hero.avatarUrl ? (
                    <img
                      alt={hero.alias ? `${hero.alias} avatar` : `${hero.name} avatar`}
                      src={hero.avatarUrl}
                    />
                  ) : (
                    hero.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                  )}
                </div>
                <div>
                  {hero.bannerUrl ? (
                    <img
                      alt={hero.alias ? `${hero.alias} cover` : `${hero.name} cover`}
                      className="profile-card__cover"
                      src={hero.bannerUrl}
                    />
                  ) : null}
                  <p className="page-card__kicker">{hero.powerClass}</p>
                  <h3>{hero.name}</h3>
                  <p>{hero.description}</p>
                  <small>
                    {getCorporationById(hero.corporationId)?.name ?? hero.corporationId}
                  </small>
                </div>
              </article>
            ))
          : null}
      </div>
    </section>
  )
}

export default Profiles