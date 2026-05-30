function News() {
  const { feedNews, source } = useNews()

  return (
    <section className="page-card news-page">
      <p className="page-card__kicker">Updates · {source}</p>
      <h2>News</h2>
      <div className="news-list">
        {feedNews.map((newsItem) => (
          <article className="news-list__item" key={newsItem.id}>
            <p className="feed-card__tag">{newsItem.tag}</p>
            <h3>{newsItem.title}</h3>
            <p>{newsItem.body}</p>
            <footer>
              {newsItem.source} · {newsItem.time}
            </footer>
          </article>
        ))}
      </div>
    </section>
  )
}

export default News