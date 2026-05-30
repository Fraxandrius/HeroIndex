import { useHeroes } from '../hooks/useHeroes.js'

function Ranking() {
  const { rankingHeroes, source } = useHeroes()

  return (
    <section className="page-card ranking-page">
      <p className="page-card__kicker">Leaderboard · {source}</p>
      <h2>Ranking</h2>
      <ol className="hero-ranking-list">
        {rankingHeroes.map((hero) => (
          <li key={hero.id}>
            <span>{hero.name}</span>
            <strong>{hero.approval}</strong>
            <small>{hero.powerClass}</small>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default Ranking