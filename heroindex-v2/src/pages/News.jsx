import { useNews } from '../hooks/useNews.js'

function News() {
  const { feedNews, loading, source } = useNews()
  const visibleNews = feedNews.filter((item) => item.active !== false)

  return (
    <section className="page-card news-page">
      <p className="page-card__kicker">Updates · {source}</p>
      <h2>News</h2>
      <div className="news-list">
        {loading ? <p>Loading...</p> : null}
        {!loading
          ? visibleNews.map((newsItem) => (
              <article className="news-list__item" key={newsItem.id}>
                <p className="feed-card__tag">{newsItem.tag}</p>
                <h3>{newsItem.title}</h3>
                <p>{newsItem.body}</p>
                {newsItem.imageUrl ? (
                  <img
                    alt={newsItem.title ? `${newsItem.title} image` : 'HeroIndex news image'}
                    className="news-list__image"
                    src={newsItem.imageUrl}
                  />
                ) : null}
                <footer>
                  {newsItem.source} · {newsItem.time}
                </footer>
              </article>
            ))
          : null}
      </div>
    </section>
  )
}

export default News