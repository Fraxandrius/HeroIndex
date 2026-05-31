import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'

function Ranking() {
  const { loading: heroesLoading, rankingHeroes, source } = useHeroes()
  const {
    getCorporationById,
    loading: corporationsLoading,
    source: corporationsSource,
  } = useCorporations()

  return (
    <section className="page-card ranking-page">
      <p className="page-card__kicker">
        Leaderboard · {source} heroes · {corporationsSource} corporations
      </p>
      <h2>Ranking</h2>
      <ol className="hero-ranking-list">
        {heroesLoading || corporationsLoading ? <li>Loading...</li> : null}
        {!heroesLoading && !corporationsLoading
          ? rankingHeroes.map((hero) => (
              <li key={hero.id}>
                <span>{hero.name}</span>
                <strong>{hero.approval}</strong>
                <small>{hero.powerClass}</small>
                <em>
                  {getCorporationById(hero.corporationId)?.name ?? hero.corporationId}
                </em>
              </li>
            ))
          : null}
      </ol>
    </section>
  )
}

export default Ranking