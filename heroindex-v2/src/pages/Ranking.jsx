import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'

function Ranking() {
  const { rankingHeroes, source } = useHeroes()
  const { getCorporationById, source: corporationsSource } = useCorporations()

  return (
    <section className="page-card ranking-page">
      <p className="page-card__kicker">
        Leaderboard · {source} heroes · {corporationsSource} corporations
      </p>
      <h2>Ranking</h2>
      <ol className="hero-ranking-list">
        {rankingHeroes.map((hero) => (
          <li key={hero.id}>
            <span>{hero.name}</span>
            <strong>{hero.approval}</strong>
            <small>{hero.powerClass}</small>
             <em>
              {getCorporationById(hero.corporationId)?.name ?? hero.corporationId}
            </em>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default Ranking