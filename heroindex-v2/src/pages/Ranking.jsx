import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
}

function getNumericValue(value) {
  const numberValue = Number(value ?? 0)

  return Number.isNaN(numberValue) ? 0 : numberValue
}

function sortHeroesByRankingValue(firstHero, secondHero) {
  const rankingDifference =
    getNumericValue(secondHero.rankingPoints) - getNumericValue(firstHero.rankingPoints)

  if (rankingDifference !== 0) {
    return rankingDifference
  }

  const trustDifference = getNumericValue(secondHero.trustScore) - getNumericValue(firstHero.trustScore)

  if (trustDifference !== 0) {
    return trustDifference
  }

  return getNumericValue(secondHero.approval) - getNumericValue(firstHero.approval)
}

function Ranking() {
  const { heroes, loading: heroesLoading, source } = useHeroes()
  const {
    getCorporationById,
    loading: corporationsLoading,
    source: corporationsSource,
  } = useCorporations()

  const rankedHeroes = [...heroes].sort(sortHeroesByRankingValue)

  return (
    <section className="page-card ranking-page">
      <p className="page-card__kicker">
        Leaderboard · {source} heroes · {corporationsSource} corporations
      </p>
      <h2>Ranking</h2>
      <p>Valor HeroIndex: puntos de ranking mediáticos y comerciales. No son Karma.</p>
      <ol className="hero-ranking-list">
        {heroesLoading || corporationsLoading ? <li>Loading...</li> : null}
        {!heroesLoading && !corporationsLoading
          ? rankedHeroes.map((hero) => (
              <li key={hero.id}>
                <span className="hero-ranking-list__avatar">
                  <span>{getInitials(hero.name)}</span>
                  {hero.avatarUrl ? (
                    <img
                      alt={hero.alias ?? hero.name}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.hidden = true
                      }}
                      src={hero.avatarUrl}
                    />
                  ) : null}
                </span>
                <span>{hero.name}</span>
                <strong>{getNumericValue(hero.rankingPoints)} puntos</strong>
                <small>{hero.powerClass}</small>
                <small>Aprobación: {getNumericValue(hero.approval)}</small>
                <small>Confianza: {getNumericValue(hero.trustScore)}</small>
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