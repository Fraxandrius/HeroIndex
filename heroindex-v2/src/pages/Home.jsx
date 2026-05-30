import AdSlot from '../components/ads/AdSlot.jsx'
import { mockClips } from '../data/mockClips.js'
import {
  mockFeaturedHero,
  mockHeroStories,
} from '../data/mockHeroes.js'
import { useCorporations } from '../hooks/useCorporations.js'
import { useNews } from '../hooks/useNews.js'

function Home() {
  const { feedNews, trendingNews } = useNews()
  const { corporations } = useCorporations()
  const featuredCorporations = corporations.slice(0, 3)

  return (
    <div className="home-page">
      <section className="story-rail" aria-label="Hero stories">
        {mockHeroStories.map((story) => (
          <button className="story-card" key={story.id} type="button">
            <span className={`story-card__avatar story-card__avatar--${story.tone}`}>
              {story.name
                .split(' ')
                .map((part) => part[0])
                .join('')}
            </span>
            <strong>{story.name}</strong>
            <small>{story.ring}</small>
          </button>
        ))}
      </section>

      <div className="home-grid">
        <div className="home-main" aria-label="HeroIndex news feed">
          <section className="hero-feature">
            <div className="hero-feature__copy">
              <p className="page-card__kicker">{mockFeaturedHero.kicker}</p>
              <h2>{mockFeaturedHero.title}</h2>
              <p>{mockFeaturedHero.description}</p>
              <div className="hero-feature__actions" aria-label="Featured hero stats">
                {mockFeaturedHero.stats.map((stat) => (
                  <span key={stat}>{stat}</span>
                ))}
              </div>
            </div>
            <div className="hero-feature__poster" aria-hidden="true">
              <span className="hero-feature__sigil">{mockFeaturedHero.sigil}</span>
            </div>
          </section>

          <AdSlot slotId="home-sponsor" />

          <section className="feed-panel">
            <div className="section-heading">
              <p className="page-card__kicker">News feed</p>
              <h2>Live from the HeroIndex newsroom</h2>
            </div>

            {feedNews.map((item) => (
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
                  <p className="feed-card__tag">{item.tag}</p>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <footer>{item.metric}</footer>
                  {item.inlinePlacementSlotId ? (
                    <AdSlot slotId={item.inlinePlacementSlotId} />
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        </div>

        <aside className="home-sidebar" aria-label="Home sidebar">
          <section className="side-panel">
            <div className="section-heading">
              <p className="page-card__kicker">Trending news</p>
              <h2>Rising now</h2>
            </div>
            <ol className="trending-list">
              {trendingNews.map((newsItem) => (
                <li key={newsItem.id}>
                  <span>{newsItem.title}</span>
                  <strong>{newsItem.metric}</strong>
                  <small>{newsItem.movement}</small>
                </li>
              ))}
            </ol>
          </section>

          <AdSlot slotId="sidebar-rail" />


          <section className="side-panel">
            <div className="section-heading">
              <p className="page-card__kicker">Corporations</p>
              <h2>Trusted operators</h2>
            </div>
            <div className="corporation-mini-list">
              {featuredCorporations.map((corporation) => (
                <article className="corporation-mini-card" key={corporation.id}>
                  <strong>{corporation.name}</strong>
                  <span>{corporation.sector}</span>
                  <small>
                    {corporation.country} · {corporation.approval} approval ·{' '}
                    {corporation.trustScore} trust
                  </small>
                </article>
              ))}
            </div>
          </section>

          <section className="side-panel">
            <div className="section-heading">
              <p className="page-card__kicker">Featured clips</p>
              <h2>Watch next</h2>
            </div>
            <div className="clips-list">
              {mockClips.map((clip) => (
                <article className="clip-card" key={clip.id}>
                  <div className="clip-card__thumb" aria-hidden="true">
                    ▶
                  </div>
                  <div>
                    <strong>{clip.title}</strong>
                    <span>
                      {clip.duration} · {clip.views} views
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default Home