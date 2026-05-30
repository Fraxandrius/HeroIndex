const stories = [
  { id: 'nova', name: 'Nova Sentinel', ring: 'Live', tone: 'cyan' },
  { id: 'onyx', name: 'Onyx Vale', ring: 'New', tone: 'violet' },
  { id: 'sol', name: 'Sol Archer', ring: 'Watch', tone: 'gold' },
  { id: 'echo', name: 'Echo Riot', ring: 'Hot', tone: 'pink' },
  { id: 'terra', name: 'Terra Forge', ring: 'Intel', tone: 'green' },
]

const feedItems = [
  {
    id: 'feed-1',
    author: 'Sentinel Dispatch',
    handle: '@sentinelwire',
    time: '12m',
    title: 'Nova Sentinel breaks the skyline patrol record',
    body: 'The north loop was cleared in under six minutes with zero civilian alerts triggered.',
    metric: '24.8K cheers',
    tag: 'City Watch',
  },
  {
    id: 'feed-2',
    author: 'HeroIndex Studio',
    handle: '@heroindex',
    time: '34m',
    title: 'Featured clip: Onyx Vale disables a rogue drone swarm',
    body: 'A clean shadow-step sequence is trending across tactical breakdown channels today.',
    metric: '8.2K reposts',
    tag: 'Clip Drop',
  },
  {
    id: 'feed-3',
    author: 'Karma Council',
    handle: '@karmawatch',
    time: '1h',
    title: 'Community karma spikes after waterfront rescue chain',
    body: 'Local heroes coordinated shelter, transport, and medical triage in a single public thread.',
    metric: '+19 karma avg',
    tag: 'Reputation',
  },
]

const trendingHeroes = [
  { id: 'trend-1', name: 'Nova Sentinel', score: '98.7', move: '+4' },
  { id: 'trend-2', name: 'Onyx Vale', score: '96.2', move: '+7' },
  { id: 'trend-3', name: 'Sol Archer', score: '94.8', move: '+2' },
  { id: 'trend-4', name: 'Echo Riot', score: '91.5', move: '+11' },
]

const clips = [
  { id: 'clip-1', title: 'Rooftop intercept', duration: '0:42', views: '1.8M' },
  { id: 'clip-2', title: 'Harbor shield wall', duration: '1:17', views: '940K' },
  { id: 'clip-3', title: 'Metro rescue route', duration: '0:58', views: '712K' },
]

function AdSlot({ id, label }) {
  return (
    <aside className="ad-slot" data-ad-slot={id} aria-label={`${label} ad slot`}>
      <span>Mock ad slot</span>
      <strong>{id}</strong>
      <small>{label}</small>
    </aside>
  )
}

function Home() {
  return (
 <div className="home-page">
      <section className="story-rail" aria-label="Hero stories">
        {stories.map((story) => (
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

      <AdSlot id="home-sponsor" label="Homepage sponsor" />

      <div className="home-grid">
        <div className="home-main" aria-label="HeroIndex social feed">
          <section className="hero-feature">
            <div className="hero-feature__copy">
              <p className="page-card__kicker">Hero feature</p>
              <h2>Nova Sentinel leads the weekly HeroIndex pulse</h2>
              <p>
                A mock editorial spotlight for the v2 home experience, combining
                social traction, public trust, and highlight clips into one media hub.
              </p>
              <div className="hero-feature__actions" aria-label="Featured hero stats">
                <span>98.7 Index</span>
                <span>24K Mentions</span>
                <span>4 Live Clips</span>
              </div>
            </div>
            <div className="hero-feature__poster" aria-hidden="true">
              <span className="hero-feature__sigil">NS</span>
            </div>
          </section>

          <section className="feed-panel">
            <div className="section-heading">
              <p className="page-card__kicker">Social feed</p>
              <h2>Live from the HeroIndex network</h2>
            </div>

            {feedItems.map((item, index) => (
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
                  {index === 1 ? (
                    <AdSlot id="news-inline" label="Inline news placement" />
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
              {trendingHeroes.map((hero) => (
                <li key={hero.id}>
                  <span>{hero.name}</span>
                  <strong>{hero.score}</strong>
                  <small>{hero.move}</small>
                </li>
              ))}
            </ol>
          </section>

          <AdSlot id="sidebar-rail" label="Sidebar rail sponsor" />

          <section className="side-panel">
            <div className="section-heading">
              <p className="page-card__kicker">Featured clips</p>
              <h2>Watch next</h2>
            </div>
            <div className="clips-list">
              {clips.map((clip) => (
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