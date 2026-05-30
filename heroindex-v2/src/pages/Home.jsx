import { mockAdSlots, mockAdSlotsById } from '../data/mockAds.js'
import { mockClips } from '../data/mockClips.js'
import {
  mockFeaturedHero,
  mockHeroStories,
  mockTrendingHeroes,
} from '../data/mockHeroes.js'
import { mockNewsHighlights } from '../data/mockNews.js'
import { mockSocialPosts } from '../data/mockSocialPosts.js'

function AdSlot({ slot }) {
  const { id, label } = slot
  return (
    <aside className="ad-slot" data-ad-slot={id} aria-label={`${label} ad slot`}>
      <span>Mock ad slot</span>
      <strong>{id}</strong>
      <small>{label}</small>
    </aside>
  )
}

function Home() {
    const inlineNewsPlacement = mockNewsHighlights.find(
    (highlight) => highlight.adSlotId === mockAdSlots.newsInline.id,
  )

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

      <AdSlot slot={mockAdSlots.homeSponsor} />

      <div className="home-grid">
        <div className="home-main" aria-label="HeroIndex social feed">
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

          <section className="feed-panel">
            <div className="section-heading">
              <p className="page-card__kicker">Social feed</p>
              <h2>Live from the HeroIndex network</h2>
            </div>

            {mockSocialPosts.map((item) => (
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
                  {item.inlineAdSlotId && inlineNewsPlacement ? (
                    <AdSlot slot={mockAdSlotsById[item.inlineAdSlotId]} />
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        </div>

        <aside className="home-sidebar" aria-label="Home sidebar">
          <section className="side-panel">
            <div className="section-heading">
              <p className="page-card__kicker">Trending heroes</p>
              <h2>Rising now</h2>
            </div>
            <ol className="trending-list">
               {mockTrendingHeroes.map((hero) => (
                <li key={hero.id}>
                  <span>{hero.name}</span>
                  <strong>{hero.score}</strong>
                  <small>{hero.move}</small>
                </li>
              ))}
            </ol>
          </section>

           <AdSlot slot={mockAdSlots.sidebarRail} />

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