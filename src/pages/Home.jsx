import { useState } from 'react'
import BrandLogo from '../components/BrandLogo.jsx'
import InlineVisualSlot from '../components/visual/InlineVisualSlot.jsx'
import PublicSignalSlot from '../components/visual/PublicSignalSlot.jsx'
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
  return newsItem.summary ?? newsItem.body ?? ''
}

function getNewsTitle(newsItem) {
  return newsItem.title ?? ''
}

function getShortNewsSummary(newsItem) {
  return getNewsSummary(newsItem).split('. ').slice(0, 1).join('. ')
}

function getNewsType(newsItem) {
  return newsItem.kicker ?? newsItem.category ?? newsItem.layer ?? newsItem.tag ?? 'Canal verificado'
}

function getNewsTimestamp(newsItem) {
  const timestamp = Number(newsItem.updatedAt ?? newsItem.createdAt ?? 0)

  return Number.isNaN(timestamp) ? 0 : timestamp
}

function getNewsPriority(newsItem) {
  const priority = Number(newsItem.priority ?? 0)

  return Number.isNaN(priority) ? 0 : priority
}

function sortEditorialNews(firstNewsItem, secondNewsItem) {
  const priorityDifference = getNewsPriority(secondNewsItem) - getNewsPriority(firstNewsItem)

  if (priorityDifference !== 0) return priorityDifference

  return getNewsTimestamp(secondNewsItem) - getNewsTimestamp(firstNewsItem)
}

function getNewsImageScale(newsItem) {
  const scale = Number(newsItem?.imageScale ?? 1)

  return Number.isNaN(scale) ? 1 : Math.max(scale, 1)
}

function getHeroOverlayStrength(newsItem) {
  const strength = Number(newsItem?.imageOverlayStrength ?? 0.55)

  if (Number.isNaN(strength)) return 0.14

  return Math.min(Math.max(strength * 0.28, 0.06), 0.2)
}

function getHeroDisplayName(hero) {
  return hero.alias ?? hero.publicName ?? hero.codename ?? hero.name ?? 'Figura HeroIndex'
}

function getScore(value) {
  const score = Number(value ?? 0)

  return Number.isNaN(score) ? 0 : score
}

function Home({ onNavigate }) {
  const [isVisualEditorOpen, setIsVisualEditorOpen] = useState(false)
  const [activeVisualSlotId, setActiveVisualSlotId] = useState(null)
  const { feedNews, loading: newsLoading, trendingNews } = useNews()
  const {
    corporations,
    getCorporationById,
    loading: corporationsLoading,
  } = useCorporations()
  const { loading: heroesLoading, rankingHeroes } = useHeroes()
  const publicNews = feedNews.filter((item) => item.active !== false && item.homePlacement !== 'hidden')
  const heroNews = publicNews.filter((item) => item.homePlacement === 'hero').sort(sortEditorialNews)
  const topStory = heroNews[0] ?? null
  const recentNews = publicNews
    .filter((item) => item.homePlacement === 'feed' && item.id !== topStory?.id)
    .sort(sortEditorialNews)
    .slice(0, 5)
  const visibleTrendingNews = trendingNews
    .filter((item) => item.active !== false && item.homePlacement !== 'hidden' && item.id !== topStory?.id)
    .sort(sortEditorialNews)
    .slice(0, 3)
  const topStoryVisualStyle = topStory?.imageUrl
    ? {
        '--home-hero-overlay-strength': getHeroOverlayStrength(topStory),
        backgroundImage: `url(${topStory.imageUrl})`,
        backgroundPosition: `${topStory.imagePositionX ?? 50}% ${topStory.imagePositionY ?? 50}%`,
        backgroundSize: `${getNewsImageScale(topStory) * 100}%`,
      }
    : undefined
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

    const handleVisualEditorOpen = (slotId) => {
    setIsVisualEditorOpen(true)
    setActiveVisualSlotId(slotId)
  }

  const handleVisualEditorClose = () => {
    setIsVisualEditorOpen(false)
    setActiveVisualSlotId(null)
  }

  return (
<div className={`home-page ${isVisualEditorOpen ? 'home-page--visual-editor-open' : ''}`.trim()}>
      <section className="story-rail" aria-label="Figuras en tendencia">
        <InlineVisualSlot
          activeVisualSlotId={activeVisualSlotId}
          className="story-card story-card--visual-signal"
          isVisualEditorOpen={isVisualEditorOpen}
          onVisualEditorClose={handleVisualEditorClose}
          onVisualEditorOpen={handleVisualEditorOpen}
          section="Señal destacada del strip"
          slotId="homeTrendSignal"
        >
          <span className="story-card__visual-copy"><strong>HeroIndex Live</strong><small>Cobertura activa de figuras verificadas.</small></span>
        </InlineVisualSlot>
        {heroesLoading || corporationsLoading ? <p>Cargando héroes HeroIndex...</p> : null}
        {!heroesLoading && !corporationsLoading
          ? featuredHeroes.map((hero, index) => {
              const corporationName = getCorporationById(hero.corporationId)?.name ?? hero.corporationId ?? 'Independiente'
              const badge = index === 0 ? 'TOP GLOBAL' : index === 1 ? 'EN TENDENCIA' : 'VERIFICADO'
return <button className="story-card story-card--compact" key={hero.id} onClick={() => onNavigate?.('hero-profile', { heroId: hero.id })} type="button"><span className="story-card__avatar"><span>{getInitials(getHeroDisplayName(hero))}</span>{hero.avatarUrl ? <img alt={getHeroDisplayName(hero)} loading="lazy" onError={(event) => { event.currentTarget.hidden = true }} src={hero.avatarUrl} /> : null}</span><span className="story-card__copy"><strong>{getHeroDisplayName(hero)}</strong><small>{hero.heroTitle ?? `Aprobación ciudadana ${getScore(hero.approval)}`}</small><em>{corporationName}</em></span><span className={`story-card__badge story-card__badge--${index === 0 ? 'gold' : index === 1 ? 'live' : 'cyan'}`}>{badge}</span></button>        
            })
          : null}
      </section>

      <div className="home-grid">
        <div className="home-main" aria-label="Feed de noticias HeroIndex">
          <section className={`hero-feature hero-feature--news${topStory?.storyMode === 'visual' ? ' hero-feature--visual-story' : ''}`} style={topStoryVisualStyle}>
            {newsLoading ? <p>Cargando noticias HeroIndex...</p> : null}
            {!newsLoading && topStory ? (
              <div className="hero-feature__editorial-panel">
                <div className="hero-feature__brand-seal"><BrandLogo size="sm" variant="symbol" /><span>Mesa Editorial HeroIndex</span></div>
                <div className="hero-feature__badges" aria-label="Estado editorial"><span>PORTADA PRINCIPAL</span><span>CANAL VERIFICADO</span></div>
                <p className="page-card__kicker">{getNewsType(topStory)}</p>
                 {getNewsTitle(topStory) ? <h2>{getNewsTitle(topStory)}</h2> : null}
                {getNewsSummary(topStory) ? <p>{getNewsSummary(topStory)}</p> : null}
                {!getNewsTitle(topStory) && !getNewsSummary(topStory) ? <strong className="hero-feature__visual-label">Cobertura visual prioritaria</strong> : null}
                <div className="hero-feature__actions" aria-label="Metadatos de noticia destacada"><span>{topStory.sourceLabel ?? topStory.source ?? 'Mesa Editorial HeroIndex'}</span>{topStory.time ? <span>{topStory.time}</span> : null}</div>
              </div>
            ) : null}
            {!newsLoading && !topStory ? <div className="hero-feature__editorial-panel"><div className="hero-feature__brand-seal"><BrandLogo size="sm" variant="symbol" /><span>Mesa Editorial HeroIndex</span></div><p className="page-card__kicker">Canal verificado</p><h2>Sin portada principal activa</h2><p>Marca una cobertura como Portada principal en Mesa Editorial para ocupar este espacio.</p></div> : null}
          </section>

          <InlineVisualSlot
          activeVisualSlotId={activeVisualSlotId}
            className="home-visual-placement home-visual-placement--wide hi-card hi-card-public"
            isVisualEditorOpen={isVisualEditorOpen}
            onVisualEditorClose={handleVisualEditorClose}
            onVisualEditorOpen={handleVisualEditorOpen}
            section="Visual horizontal principal"
            slotId="homeWideVisual"
          />

          <PublicSignalSlot
            activeVisualSlotId={activeVisualSlotId}
            className="home-signal home-signal--primary hi-card hi-card-public"
            isVisualEditorOpen={isVisualEditorOpen}
            onVisualEditorClose={handleVisualEditorClose}
            onVisualEditorOpen={handleVisualEditorOpen}
            signalId="homePrimarySignal"
          />

          <PublicSignalSlot
            activeVisualSlotId={activeVisualSlotId}
            className="home-signal home-signal--secondary hi-card hi-card-public"
            isVisualEditorOpen={isVisualEditorOpen}
            onVisualEditorClose={handleVisualEditorClose}
            onVisualEditorOpen={handleVisualEditorOpen}
            signalId="homeSecondarySignal"
          />

          <section className="feed-panel">
            <div className="section-heading">
              <p className="page-card__kicker">Feed HeroIndex</p>
              <h2>Cobertura reciente HeroIndex</h2>
            </div>

            {newsLoading ? <p>Cargando noticias HeroIndex...</p> : null}
            {!newsLoading
              ? recentNews.map((item) => {
                  const hasImage = Boolean(item.imageUrl)

                  return (
                    <article className={`feed-card ${hasImage ? 'feed-card--visual' : 'feed-card--compact'}`} key={item.id}>
                      <div className="feed-card__avatar" aria-hidden="true">
                        HI
                      </div>
                      <div className="feed-card__body">
                        <header>
                          <div>
                            <strong>{item.sourceLabel ?? item.source ?? item.author ?? 'Mesa Editorial HeroIndex'}</strong>
                            <span>{item.handle ?? 'Canal público verificado'}</span>
                          </div>
                          <time>{item.time}</time>
                        </header>
                        <p className="feed-card__tag">{getNewsType(item)}</p>
                        {hasImage ? (
                          <img
                            alt={item.title ?? 'Noticia HeroIndex'}
                            className="feed-card__image"
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.hidden = true
                            }}
                            src={item.imageUrl}
                          />
                        ) : null}
                        {getNewsTitle(item) ? <h3>{getNewsTitle(item)}</h3> : null}
                        {getNewsSummary(item) ? <p>{hasImage ? getNewsSummary(item) : getShortNewsSummary(item)}</p> : <p className="feed-card__visual-fallback">Cobertura visual HeroIndex</p>}
                        {item.metric ? <footer>{item.metric}</footer> : null}
                      </div>
                    </article>
                  )
                })
              : null}
            {!newsLoading && recentNews.length === 0 ? <p>No hay noticias activas por el momento.</p> : null}
          </section>
        </div>

        <aside className="home-sidebar" aria-label="Panel editorial HeroIndex">
          <section className="side-panel side-panel--activity">
            <div className="section-heading">
              <p className="page-card__kicker">Actividad destacada</p>
              <h2>Actualizaciones en vivo</h2>
            </div>
            <ol className="trending-list">
              {newsLoading ? <li>Cargando...</li> : null}
              {!newsLoading
                ? visibleTrendingNews.map((newsItem) => (
                    <li key={newsItem.id}>
                      <span>{newsItem.title || 'Pieza visual HeroIndex'}</span>
                      <strong>{newsItem.metric}</strong>
                      <small>{newsItem.movement}</small>
                    </li>
                  ))
                : null}
            </ol>
          </section>

          <section className="side-panel home-trending-module">
            <div className="home-trending-module__heading">
              <p className="page-card__kicker">Figuras en tendencia</p>
              <p>Top reconocimiento público del ciclo</p>
            </div>
            <ol className="home-trending-module__list">
              {heroesLoading ? <li className="home-trending-module__state">Cargando figuras HeroIndex...</li> : null}
              {!heroesLoading
                ? citizenFeaturedHeroes.map((hero, index) => (
                    <li className="home-trending-item" key={hero.id}>
                      <span className="home-trending-item__rank" aria-label={`Posición ${index + 1}`}>#{index + 1}</span>
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
                      <span className="home-trending-item__meta">
                        <strong>{getHeroDisplayName(hero)}</strong>
                        <small>{hero.heroTitle ?? 'Figura HeroIndex'}</small>
                      </span>
                      <span className="home-trending-item__approval">
                        <small>Aprobación</small>
                        <strong>{getScore(hero.approval)}</strong>
                      </span>
                      <button
                        className="home-trending-item__action"
                        onClick={() => onNavigate?.('hero-profile', { heroId: hero.id })}
                        type="button"
                      >
                        Ver perfil
                      </button>
                    </li>
                  ))
                : null}
             </ol>
          </section>

          <section className="side-panel">
            <div className="section-heading">
               <p className="page-card__kicker">Operadores verificados</p>
              <h2>Corporaciones activas</h2>
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
