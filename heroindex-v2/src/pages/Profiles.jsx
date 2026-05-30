import { useHeroes } from '../hooks/useHeroes.js'

function Profiles() {
  const { heroes, source } = useHeroes()

  return (
    <section className="page-card profiles-page">
      <p className="page-card__kicker">Players · {source}</p>
      <h2>Profiles</h2>
      <div className="profiles-list">
        {heroes.map((hero) => (
          <article className="profile-card" key={hero.id}>
            <div className="profile-card__avatar" aria-hidden="true">
              {hero.avatarUrl ? (
                <img src={hero.avatarUrl} alt="" />
              ) : (
                hero.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
              )}
            </div>
            <div>
              <p className="page-card__kicker">{hero.powerClass}</p>
              <h3>{hero.name}</h3>
              <p>{hero.description}</p>
              <small>{hero.corporationId}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Profiles