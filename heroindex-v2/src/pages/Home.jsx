import BroadcastSlot from '../components/broadcast/BroadcastSlot.jsx'
import InlineVisualSlot from '../components/visual/InlineVisualSlot.jsx'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { useNews } from '../hooks/useNews.js'

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
}

function getNewsSummary(newsItem) {
  return newsItem.summary ?? newsItem.body ?? 'Actualización editorial de HeroIndex.'
}

function getHeroDisplayName(hero) {
  return hero.alias ?? hero.publicName ?? hero.codename ?? hero.name ?? 'Figura HeroIndex'
}

function getScore(value) {
  const score = Number(value ?? 0)

  return Number.isNaN(score) ? 0 : score
}

function Home({ onNavigate }) {
  const { feedNews, loading: newsLoading, trendingNews } = useNews()
  const {
    corporations,
    getCorporationById,
    loading: corporationsLoading,
  } = useCorporations()
  const { loading: heroesLoading, rankingHeroes } = useHeroes()
  const visibleFeedNews = feedNews.filter((item) => item.active !== false)
  const topStory = visibleFeedNews[0] ?? null
  const recentNews =
    visibleFeedNews.length > 3 ? visibleFeedNews.slice(1, 6) : visibleFeedNews.slice(0, 5)
  const visibleTrendingNews = trendingNews.filter((item) => item.active !== false)
  const featuredHeroes = rankingHeroes.slice(0, 5)
  const citizenFeaturedHeroes = rankingHeroes
    .filter((hero) => hero.active !== false)
    .sort((firstHero, secondHero) => getScore(secondHero.approval) - getScore(firstHero.approval))
    .slice(0, 3)
  const featuredCorporations = [...corporations]
    .sort(
      (firstCorporation, secondCorporation) =>
      getScore(secondCorporation.approval) - getScore(firstCorporation.approval),
    )
    .slice(0, 3)

  return (
    <div className="home-page">
       <section className="story-rail" aria-label="Héroes destacados">
        <article className="story-card story-card--statement">
          <strong>HeroIndex</strong>
          <small>La red que conecta a la ciudadanía con los héroes que protegen el mañana.</small>
        </article>
        {heroesLoading || corporationsLoading ? <p>Cargando héroes HeroIndex...</p> : null}
        {!heroesLoading && !corporationsLoading
          ? featuredHeroes.map((hero) => {
              const corporationName =
                getCorporationById(hero.corporationId)?.name ??
                hero.corporationId ??
                'Independiente'

              return (
                <article className="story-card" key={hero.id}>
                  <span className="story-card__avatar">
                    <span>{getInitials(getHeroDisplayName(hero))}</span>
                    {hero.avatarUrl ? (
                      <img
                        alt={getHeroDisplayName(hero)}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.hidden = true
                        }}
                        src={hero.avatarUrl}
                      />
                    ) : null}
                  </span>
                  <strong>{getHeroDisplayName(hero)}</strong>
                  {hero.heroTitle ? <small>{hero.heroTitle}</small> : null}
                  <small>
                    {corporationName} · Aprobación ciudadana {getScore(hero.approval)}
                  </small>
                </article>
              )
            })
          : null}
      </section>

      <div className="home-grid">
        <div className="home-main" aria-label="Feed de noticias HeroIndex">
          <InlineVisualSlot className="hero-feature" page="home" section="Portada HeroIndex" slotId="home-hero-visual">
             {newsLoading ? <p>Cargando noticias HeroIndex...</p> : null}
            {!newsLoading && topStory ? (
              <>
                <div className="hero-feature__copy">
                  <p className="page-card__kicker">
                    {topStory.category ?? topStory.layer ?? topStory.tag}
                  </p>
                  <h2>{topStory.title}</h2>
                  <p>{getNewsSummary(topStory)}</p>
                  <div className="hero-feature__actions" aria-label="Metadatos de noticia destacada">
                    <span>{topStory.source}</span>
                    <span>{topStory.time}</span>
                    <span>{topStory.metric}</span>
                  </div>
                </div>
                <div className="hero-feature__poster" aria-hidden={!topStory.imageUrl}>
                  {topStory.imageUrl ? (
                    <img
                      alt={topStory.title ?? 'HeroIndex news'}
                      className="hero-feature__image"
                      loading="eager"
                      onError={(event) => {
                        event.currentTarget.hidden = true
                      }}
                      src={topStory.imageUrl}
                    />
                  ) : (
                    <span className="hero-feature__sigil">HI</span>
                  )}
                </div>
              </>
            ) : null}
            {!newsLoading && !topStory ? (
              <div className="hero-feature__copy">
                <p className="page-card__kicker">HeroIndex</p>
                 <h2>Sin actualizaciones activas por ahora</h2>
                <p>La cobertura pública de HeroIndex aparecerá aquí cuando esté disponible.</p>
              </div>
            ) : null}
           </InlineVisualSlot>

 <InlineVisualSlot className="home-visual-signal hi-card hi-card-public" page="home" section="Mensaje institucional" slotId="home-signal-visual">
            <p className="page-card__kicker">Mensaje institucional</p>
            <h3>Héroes registrados. Protección visible. Confianza certificada.</h3>
            <p>Cobertura verificada para una ciudadanía más segura y conectada con la red oficial de protección HeroIndex.</p>
           </InlineVisualSlot>

           <BroadcastSlot className="home-broadcast-channel" placement="home-feature" variant="feature" />

          <section className="feed-panel">
            <div className="section-heading">
               <p className="page-card__kicker">Feed de noticias</p>
              <h2>Cobertura reciente HeroIndex</h2>
            </div>

            {newsLoading ? <p>Cargando noticias HeroIndex...</p> : null}
            {!newsLoading
              ? recentNews.map((item, index) => (
                  <article className="feed-card" key={item.id}>
                    <div className="feed-card__avatar" aria-hidden="true">
                      {item.author[0]}
                    </div>
                    <div className="feed-card__body">
                      <header>
                        <div>
                          <strong>{item.author}</strong>
                          <span>{item.handle}</span>
                        </div>
                        <time>{item.time}</time>
                      </header>
                      <p className="feed-card__tag">{item.category ?? item.layer ?? item.tag}</p>
                      <h3>{item.title}</h3>
                      <p>{getNewsSummary(item)}</p>
                      {item.imageUrl ? (
                        <img
                          alt={item.title ?? 'HeroIndex news'}
                          className="feed-card__image"
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.hidden = true
                          }}
                          src={item.imageUrl}
                        />
                      ) : null}
                      <footer>{item.metric}</footer>
                      {index === 1 ? (
                        <BroadcastSlot className="home-feed-signal" placement="home-feed" variant="inline" />
                      ) : null}
                    </div>
                  </article>
                ))
              : null}
             {!newsLoading && recentNews.length === 0 ? <p>No hay noticias activas por el momento.</p> : null}
          </section>
        </div>

        <aside className="home-sidebar" aria-label="Home sidebar">
          <section className="side-panel">
            <div className="section-heading">
              <p className="page-card__kicker">Noticias destacadas</p>
              <h2>Actividad destacada</h2>
            </div>
            <ol className="trending-list">
              {newsLoading ? <li>Cargando...</li> : null}
              {!newsLoading
                ? visibleTrendingNews.map((newsItem) => (
                    <li key={newsItem.id}>
                      <span>{newsItem.title}</span>
                      <strong>{newsItem.metric}</strong>
                      <small>{newsItem.movement}</small>
                    </li>
                  ))
                : null}
            </ol>
          </section>

          <BroadcastSlot className="home-rail-signal" placement="home-rail" variant="rail" />

          <section className="side-panel">
            <div className="section-heading">
               <p className="page-card__kicker">Reconocimiento ciudadano</p>
              <h2>Héroes destacados por la ciudadanía</h2>
              <p>Figuras con alto reconocimiento público dentro de HeroIndex.</p>
            </div>
            <div className="home-hero-list">
              {heroesLoading || corporationsLoading ? <p>Cargando héroes HeroIndex...</p> : null}
              {!heroesLoading && !corporationsLoading
                ? citizenFeaturedHeroes.map((hero) => (
                    <article className="home-hero-card" key={hero.id}>
                      <span className="home-hero-card__avatar">
                        <span>{getInitials(getHeroDisplayName(hero))}</span>
                        {hero.avatarUrl ? (
                          <img
                            alt={getHeroDisplayName(hero)}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.hidden = true
                            }}
                            src={hero.avatarUrl}
                          />
                        ) : null}
                      </span>
                      <div>
                        <strong>{getHeroDisplayName(hero)}</strong>
                        <span>{hero.heroTitle ?? 'Figura HeroIndex'}</span>
                        <small>
                          {getCorporationById(hero.corporationId)?.name ??
                            hero.corporationId ??
                            'Independiente'}{' '}
                          · Aprobación ciudadana {getScore(hero.approval)}
                        </small>
                        <button
                          onClick={() => onNavigate?.('hero-profile', { heroId: hero.id })}
                          type="button"
                        >
                          Ver perfil
                        </button>
                      </div>
                    </article>
                  ))
                : null}
            </div>
          </section>

          <section className="side-panel">
            <div className="section-heading">
               <p className="page-card__kicker">Corporaciones</p>
              <h2>Operadores verificados</h2>
            </div>
            <div className="corporation-mini-list">
              {corporationsLoading ? <p>Cargando corporaciones HeroIndex...</p> : null}
              {!corporationsLoading
                ? featuredCorporations.map((corporation) => (
                    <article className="corporation-mini-card" key={corporation.id}>
                      <span className="corporation-mini-card__logo">
                        <span>{getInitials(corporation.name)}</span>
                        {corporation.logoUrl ? (
                          <img
                            alt={corporation.name}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.hidden = true
                            }}
                            src={corporation.logoUrl}
                          />
                        ) : null}
                      </span>
                      <div>
                        <strong>{corporation.name}</strong>
                        <span>{corporation.sector}</span>
                        <small>
                          {corporation.tagline} · Aprobación {getScore(corporation.approval)}
                        </small>
                      </div>
                    </article>
                  ))
                : null}
            </div>
          </section>
</aside>
      </div>
    </div>
  )
}

export default Home
