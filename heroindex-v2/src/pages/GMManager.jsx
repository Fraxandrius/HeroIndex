import { useRef, useState } from 'react'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { useNews } from '../hooks/useNews.js'
import { createCorporation } from '../services/corporationsService.js'
import { createHero } from '../services/heroesService.js'
import { createNews } from '../services/newsService.js'

const emptyNewsForm = {
  active: true,
  body: '',
  category: '',
  imageUrl: '',
  layer: '',
  summary: '',
  title: '',
}

const emptyHeroForm = {
  active: true,
  alias: '',
  approval: '',
  avatarUrl: '',
  bannerUrl: '',
  corporationId: '',
  description: '',
  name: '',
  powerClass: '',
  powers: '',
  trustScore: '',
}

const emptyCorporationForm = {
  active: true,
  approval: '',
  bannerUrl: '',
  country: '',
  description: '',
  logoUrl: '',
  name: '',
  sector: '',
  tagline: '',
  trustScore: '',
}

function getStatus({ error, loading }) {
  if (loading) {
    return 'loading'
  }

  if (error) {
    return 'error'
  }

  return 'ready'
}

function getValue(value) {
  if (value === undefined || value === null || value === '') {
    return '—'
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  return value
}

function getDetailValue(value) {
  if (value === undefined || value === null || value === '') {
    return '—'
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  if (Array.isArray(value) || typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}

function GMManagerSummary({ count, error, label, loading }) {
  const status = getStatus({ error, loading })

  return (
    <article className="gm-manager-summary">
      <p className="page-card__kicker">{label}</p>
      <strong>{count}</strong>
      <span>Status: {status}</span>
      {error ? <small>{error.message ?? String(error)}</small> : null}
    </article>
  )
}

function GMManagerSection({ children, title }) {
  return (
    <section className="gm-manager-section">
      <div className="gm-manager-title">
        <p className="page-card__kicker">Review</p>
        <h3>{title}</h3>
      </div>
      <div className="gm-manager-table-wrap">{children}</div>
    </section>
  )
}

function GMManager() {
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedType, setSelectedType] = useState(null)
  const [newsForm, setNewsForm] = useState(emptyNewsForm)
  const [newsFormError, setNewsFormError] = useState('')
  const [newsFormSuccess, setNewsFormSuccess] = useState('')
  const [isCreatingNews, setIsCreatingNews] = useState(false)
  const [heroForm, setHeroForm] = useState(emptyHeroForm)
  const [heroFormError, setHeroFormError] = useState('')
  const [heroFormSuccess, setHeroFormSuccess] = useState('')
  const [isCreatingHero, setIsCreatingHero] = useState(false)
  const [corporationForm, setCorporationForm] = useState(emptyCorporationForm)
  const [corporationFormError, setCorporationFormError] = useState('')
  const [corporationFormSuccess, setCorporationFormSuccess] = useState('')
  const [isCreatingCorporation, setIsCreatingCorporation] = useState(false)
  const detailRef = useRef(null)
  const { error: newsError, feedNews, loading: newsLoading } = useNews()
  const { error: heroesError, heroes, loading: heroesLoading } = useHeroes()
  const {
    corporations,
    error: corporationsError,
    loading: corporationsLoading,
  } = useCorporations()

  const handleViewDetail = (type, item) => {
    setSelectedType(type)
    setSelectedItem(item)
    
    window.setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  const closeDetail = () => {
    setSelectedType(null)
    setSelectedItem(null)
  }

const handleNewsFieldChange = (event) => {
    const { checked, name, type, value } = event.target

    setNewsForm((currentForm) => ({
      ...currentForm,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setNewsFormError('')
    setNewsFormSuccess('')
  }

  const handleCreateNews = async (event) => {
    event.preventDefault()

    if (!newsForm.title.trim() || !newsForm.summary.trim()) {
      setNewsFormError('Title and summary are required.')
      setNewsFormSuccess('')
      return
    }

    setIsCreatingNews(true)
    setNewsFormError('')
    setNewsFormSuccess('')

    try {
      await createNews({
        active: newsForm.active,
        body: newsForm.body.trim(),
        category: newsForm.category.trim(),
        imageUrl: newsForm.imageUrl.trim(),
        layer: newsForm.layer.trim(),
        summary: newsForm.summary.trim(),
        title: newsForm.title.trim(),
      })
      setNewsForm(emptyNewsForm)
      setNewsFormSuccess('News created successfully.')
    } catch (error) {
      setNewsFormError(error.message ?? String(error))
    } finally {
      setIsCreatingNews(false)
    }
  }

  const handleHeroFieldChange = (event) => {
    const { checked, name, type, value } = event.target

    setHeroForm((currentForm) => ({
      ...currentForm,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setHeroFormError('')
    setHeroFormSuccess('')
  }

  const handleCreateHero = async (event) => {
    event.preventDefault()

    if (!heroForm.name.trim() || !heroForm.powerClass.trim()) {
      setHeroFormError('Name and powerClass are required.')
      setHeroFormSuccess('')
      return
    }

    const approval = heroForm.approval.trim()
    const trustScore = heroForm.trustScore.trim()
    const parsedApproval = approval === '' ? null : Number(approval)
    const parsedTrustScore = trustScore === '' ? null : Number(trustScore)

    if (
      (approval !== '' && Number.isNaN(parsedApproval)) ||
      (trustScore !== '' && Number.isNaN(parsedTrustScore))
    ) {
      setHeroFormError('Approval and trustScore must be valid numbers.')
      setHeroFormSuccess('')
      return
    }

    const heroPayload = {
      active: heroForm.active,
      alias: heroForm.alias.trim(),
      avatarUrl: heroForm.avatarUrl.trim(),
      bannerUrl: heroForm.bannerUrl.trim(),
      corporationId: heroForm.corporationId.trim(),
      description: heroForm.description.trim(),
      name: heroForm.name.trim(),
      powerClass: heroForm.powerClass.trim(),
      powers: heroForm.powers
        .split(',')
        .map((power) => power.trim())
        .filter(Boolean),
    }

    if (approval !== '') {
      heroPayload.approval = parsedApproval
    }

    if (trustScore !== '') {
      heroPayload.trustScore = parsedTrustScore
    }

    setIsCreatingHero(true)
    setHeroFormError('')
    setHeroFormSuccess('')

    try {
      await createHero(heroPayload)
      setHeroForm(emptyHeroForm)
      setHeroFormSuccess('Hero created successfully.')
    } catch (error) {
      setHeroFormError(error.message ?? String(error))
    } finally {
      setIsCreatingHero(false)
    }
  }


  const handleCorporationFieldChange = (event) => {
    const { checked, name, type, value } = event.target

    setCorporationForm((currentForm) => ({
      ...currentForm,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setCorporationFormError('')
    setCorporationFormSuccess('')
  }

  const handleCreateCorporation = async (event) => {
    event.preventDefault()

    if (!corporationForm.name.trim() || !corporationForm.sector.trim()) {
      setCorporationFormError('Name and sector are required.')
      setCorporationFormSuccess('')
      return
    }

    const approval = corporationForm.approval.trim()
    const trustScore = corporationForm.trustScore.trim()
    const parsedApproval = approval === '' ? null : Number(approval)
    const parsedTrustScore = trustScore === '' ? null : Number(trustScore)

    if (
      (approval !== '' && Number.isNaN(parsedApproval)) ||
      (trustScore !== '' && Number.isNaN(parsedTrustScore))
    ) {
      setCorporationFormError('Approval and trustScore must be valid numbers.')
      setCorporationFormSuccess('')
      return
    }

    const corporationPayload = {
      active: corporationForm.active,
      bannerUrl: corporationForm.bannerUrl.trim(),
      country: corporationForm.country.trim(),
      description: corporationForm.description.trim(),
      logoUrl: corporationForm.logoUrl.trim(),
      name: corporationForm.name.trim(),
      sector: corporationForm.sector.trim(),
      tagline: corporationForm.tagline.trim(),
    }

    if (approval !== '') {
      corporationPayload.approval = parsedApproval
    }

    if (trustScore !== '') {
      corporationPayload.trustScore = parsedTrustScore
    }

    setIsCreatingCorporation(true)
    setCorporationFormError('')
    setCorporationFormSuccess('')

    try {
      await createCorporation(corporationPayload)
      setCorporationForm(emptyCorporationForm)
      setCorporationFormSuccess('Corporation created successfully.')
    } catch (error) {
      setCorporationFormError(error.message ?? String(error))
    } finally {
      setIsCreatingCorporation(false)
    }
  }

  return (
    <section className="page-card gm-manager-page">
      <p className="page-card__kicker">Internal</p>
      <h2>GM Manager</h2>
      <p>Panel interno de gestión de HeroIndex.</p>

      <div className="gm-manager-grid">
        <GMManagerSummary
          count={feedNews.length}
          error={newsError}
          label="News"
          loading={newsLoading}
        />
        <GMManagerSummary
          count={heroes.length}
          error={heroesError}
          label="Heroes"
          loading={heroesLoading}
        />
        <GMManagerSummary
          count={corporations.length}
          error={corporationsError}
          label="Corporations"
          loading={corporationsLoading}
        />
      </div>
      
      <section className="gm-manager-create">
        <div className="gm-manager-title">
          <p className="page-card__kicker">Create</p>
          <h3>Crear News</h3>
        </div>
        <form className="gm-manager-form" onSubmit={handleCreateNews}>
          <label>
            <span>Title *</span>
            <input
              name="title"
              onChange={handleNewsFieldChange}
              type="text"
              value={newsForm.title}
            />
          </label>
          <label>
            <span>Summary *</span>
            <textarea
              name="summary"
              onChange={handleNewsFieldChange}
              rows="3"
              value={newsForm.summary}
            />
          </label>
          <label>
            <span>Body</span>
            <textarea
              name="body"
              onChange={handleNewsFieldChange}
              rows="4"
              value={newsForm.body}
            />
          </label>
          <div className="gm-manager-form__grid">
            <label>
              <span>Category</span>
              <input
                name="category"
                onChange={handleNewsFieldChange}
                type="text"
                value={newsForm.category}
              />
            </label>
            <label>
              <span>Layer</span>
              <input
                name="layer"
                onChange={handleNewsFieldChange}
                type="text"
                value={newsForm.layer}
              />
            </label>
          </div>
          <label>
            <span>Image URL</span>
            <input
              name="imageUrl"
              onChange={handleNewsFieldChange}
              type="url"
              value={newsForm.imageUrl}
            />
          </label>
          <label className="gm-manager-check">
            <input
              checked={newsForm.active}
              name="active"
              onChange={handleNewsFieldChange}
              type="checkbox"
            />
            <span>Active</span>
          </label>
          {newsFormError ? <p className="gm-manager-message gm-manager-message--error">{newsFormError}</p> : null}
          {newsFormSuccess ? <p className="gm-manager-message gm-manager-message--success">{newsFormSuccess}</p> : null}
          <button className="gm-manager-action" disabled={isCreatingNews} type="submit">
            {isCreatingNews ? 'Creating…' : 'Crear News'}
          </button>
        </form>
      </section>

<section className="gm-manager-create">
        <div className="gm-manager-title">
          <p className="page-card__kicker">Create</p>
          <h3>Crear Hero</h3>
        </div>
        <form className="gm-manager-form" onSubmit={handleCreateHero}>
          <div className="gm-manager-form__grid">
            <label>
              <span>Name *</span>
              <input
                name="name"
                onChange={handleHeroFieldChange}
                type="text"
                value={heroForm.name}
              />
            </label>
            <label>
              <span>Alias</span>
              <input
                name="alias"
                onChange={handleHeroFieldChange}
                type="text"
                value={heroForm.alias}
              />
            </label>
          </div>
          <div className="gm-manager-form__grid">
            <label>
              <span>Corporation ID</span>
              <input
                name="corporationId"
                onChange={handleHeroFieldChange}
                type="text"
                value={heroForm.corporationId}
              />
            </label>
            <label>
              <span>Power Class *</span>
              <input
                name="powerClass"
                onChange={handleHeroFieldChange}
                type="text"
                value={heroForm.powerClass}
              />
            </label>
          </div>
          <div className="gm-manager-form__grid">
            <label>
              <span>Approval</span>
              <input
                name="approval"
                onChange={handleHeroFieldChange}
                type="number"
                value={heroForm.approval}
              />
            </label>
            <label>
              <span>Trust Score</span>
              <input
                name="trustScore"
                onChange={handleHeroFieldChange}
                type="number"
                value={heroForm.trustScore}
              />
            </label>
          </div>
          <label>
            <span>Description</span>
            <textarea
              name="description"
              onChange={handleHeroFieldChange}
              rows="4"
              value={heroForm.description}
            />
          </label>
          <label>
            <span>Powers</span>
            <input
              name="powers"
              onChange={handleHeroFieldChange}
              placeholder="Flight, strength, tactical analysis"
              type="text"
              value={heroForm.powers}
            />
          </label>
          <div className="gm-manager-form__grid">
            <label>
              <span>Avatar URL</span>
              <input
                name="avatarUrl"
                onChange={handleHeroFieldChange}
                type="url"
                value={heroForm.avatarUrl}
              />
            </label>
            <label>
              <span>Cover URL</span>
              <input
                name="bannerUrl"
                onChange={handleHeroFieldChange}
                type="url"
                value={heroForm.bannerUrl}
              />
            </label>
          </div>
          <label className="gm-manager-check">
            <input
              checked={heroForm.active}
              name="active"
              onChange={handleHeroFieldChange}
              type="checkbox"
            />
            <span>Active</span>
          </label>
          {heroFormError ? <p className="gm-manager-message gm-manager-message--error">{heroFormError}</p> : null}
          {heroFormSuccess ? <p className="gm-manager-message gm-manager-message--success">{heroFormSuccess}</p> : null}
          <button className="gm-manager-action" disabled={isCreatingHero} type="submit">
            {isCreatingHero ? 'Creating…' : 'Crear Hero'}
          </button>
        </form>
      </section>

 <section className="gm-manager-create">
        <div className="gm-manager-title">
          <p className="page-card__kicker">Create</p>
          <h3>Crear Corporation</h3>
        </div>
        <form className="gm-manager-form" onSubmit={handleCreateCorporation}>
          <div className="gm-manager-form__grid">
            <label>
              <span>Name *</span>
              <input
                name="name"
                onChange={handleCorporationFieldChange}
                type="text"
                value={corporationForm.name}
              />
            </label>
            <label>
              <span>Sector *</span>
              <input
                name="sector"
                onChange={handleCorporationFieldChange}
                type="text"
                value={corporationForm.sector}
              />
            </label>
          </div>
          <div className="gm-manager-form__grid">
            <label>
              <span>Tagline</span>
              <input
                name="tagline"
                onChange={handleCorporationFieldChange}
                type="text"
                value={corporationForm.tagline}
              />
            </label>
            <label>
              <span>Country</span>
              <input
                name="country"
                onChange={handleCorporationFieldChange}
                type="text"
                value={corporationForm.country}
              />
            </label>
          </div>
          <label>
            <span>Description</span>
            <textarea
              name="description"
              onChange={handleCorporationFieldChange}
              rows="4"
              value={corporationForm.description}
            />
          </label>
          <div className="gm-manager-form__grid">
            <label>
              <span>Logo URL</span>
              <input
                name="logoUrl"
                onChange={handleCorporationFieldChange}
                type="url"
                value={corporationForm.logoUrl}
              />
            </label>
            <label>
              <span>Cover URL</span>
              <input
                name="bannerUrl"
                onChange={handleCorporationFieldChange}
                type="url"
                value={corporationForm.bannerUrl}
              />
            </label>
          </div>
          <div className="gm-manager-form__grid">
            <label>
              <span>Approval</span>
              <input
                name="approval"
                onChange={handleCorporationFieldChange}
                type="number"
                value={corporationForm.approval}
              />
            </label>
            <label>
              <span>Trust Score</span>
              <input
                name="trustScore"
                onChange={handleCorporationFieldChange}
                type="number"
                value={corporationForm.trustScore}
              />
            </label>
          </div>
          <label className="gm-manager-check">
            <input
              checked={corporationForm.active}
              name="active"
              onChange={handleCorporationFieldChange}
              type="checkbox"
            />
            <span>Active</span>
          </label>
          {corporationFormError ? <p className="gm-manager-message gm-manager-message--error">{corporationFormError}</p> : null}
          {corporationFormSuccess ? <p className="gm-manager-message gm-manager-message--success">{corporationFormSuccess}</p> : null}
          <button className="gm-manager-action" disabled={isCreatingCorporation} type="submit">
            {isCreatingCorporation ? 'Creating…' : 'Crear Corporation'}
          </button>
        </form>
      </section>

      {selectedItem && (
        <aside className="gm-manager-detail" aria-label="Detalle" ref={detailRef}>
          <div className="gm-manager-detail__top">
            <div>
              <p className="page-card__kicker">Detalle</p>
              <h3>{selectedType}</h3>
              <small>ID: {getValue(selectedItem.id)}</small>
            </div>
            <button
              className="gm-manager-action"
              onClick={closeDetail}
              type="button"
            >
              Cerrar detalle
            </button>
          </div>

          <dl className="gm-manager-detail__fields">
            {Object.entries(selectedItem).map(([field, value]) => (
              <div key={field}>
                <dt>{field}</dt>
                <dd>
                  {Array.isArray(value) ||
                  (typeof value === 'object' && value !== null) ? (
                    <pre>{getDetailValue(value)}</pre>
                  ) : (
                    getDetailValue(value)
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      )}

      <GMManagerSection title="News">
        <table className="gm-manager-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category / Type</th>
              <th>Active</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {feedNews.map((newsItem) => (
              <tr key={newsItem.id}>
                <td>{getValue(newsItem.title)}</td>
                <td>{getValue(newsItem.category ?? newsItem.type)}</td>
                <td>{getValue(newsItem.active)}</td>
                <td>{getValue(newsItem.createdAt)}</td>
                <td>
                  <button
                    className="gm-manager-action"
                    onClick={() => handleViewDetail('news', newsItem)}
                    type="button"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GMManagerSection>

      <GMManagerSection title="Heroes">
        <table className="gm-manager-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Alias</th>
              <th>Corporation</th>
              <th>Approval</th>
              <th>Trust</th>
              <th>Active</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {heroes.map((hero) => (
              <tr key={hero.id}>
                <td>{getValue(hero.name)}</td>
                <td>{getValue(hero.alias)}</td>
                <td>{getValue(hero.corporationId)}</td>
                <td>{getValue(hero.approval)}</td>
                <td>{getValue(hero.trustScore)}</td>
                <td>{getValue(hero.active)}</td>
                <td>
                  <button
                    className="gm-manager-action"
                     onClick={() => handleViewDetail('hero', hero)}
                    type="button"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GMManagerSection>

      <GMManagerSection title="Corporations">
        <table className="gm-manager-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Sector</th>
              <th>Country</th>
              <th>Approval</th>
              <th>Trust</th>
              <th>Active</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {corporations.map((corporation) => (
              <tr key={corporation.id}>
                <td>{getValue(corporation.name)}</td>
                <td>{getValue(corporation.sector)}</td>
                <td>{getValue(corporation.country)}</td>
                <td>{getValue(corporation.approval)}</td>
                <td>{getValue(corporation.trustScore)}</td>
                <td>{getValue(corporation.active)}</td>
                 <td>
                  <button
                    className="gm-manager-action"
                     onClick={() => handleViewDetail('corporation', corporation)}
                    type="button"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GMManagerSection>
    </section>
  )
}

export default GMManager