import { useRef, useState } from 'react'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { useNews } from '../hooks/useNews.js'
import {
  createCorporation,
  toggleCorporationActive,
  updateCorporation,
} from '../services/corporationsService.js'
import { createHero, toggleHeroActive, updateHero } from '../services/heroesService.js'
import { createNews, toggleNewsActive, updateNews } from '../services/newsService.js'
import { uploadImage } from '../services/storageService.js'

const emptyNewsForm = {
  active: true,
  body: '',
  category: '',
  imageUrl: '',
  layer: '',
  summary: '',
  title: '',
}

function getNewsFormValues(newsItem = {}) {
  return {
    active: newsItem.active ?? true,
    body: newsItem.body ?? '',
    category: newsItem.category ?? '',
    imageUrl: newsItem.imageUrl ?? '',
    layer: newsItem.layer ?? '',
    summary: newsItem.summary ?? newsItem.body ?? '',
    title: newsItem.title ?? '',
  }
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

function getHeroFormValues(hero = {}) {
  return {
    active: hero.active ?? true,
    alias: hero.alias ?? '',
    approval: hero.approval ?? '',
    avatarUrl: hero.avatarUrl ?? '',
    bannerUrl: hero.bannerUrl ?? '',
    corporationId: hero.corporationId ?? '',
    description: hero.description ?? '',
    name: hero.name ?? '',
    powerClass: hero.powerClass ?? '',
    powers: Array.isArray(hero.powers) ? hero.powers.join(', ') : hero.powers ?? '',
    trustScore: hero.trustScore ?? '',
  }
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

function getCorporationFormValues(corporation = {}) {
  return {
    active: corporation.active ?? true,
    approval: corporation.approval ?? '',
    bannerUrl: corporation.bannerUrl ?? '',
    country: corporation.country ?? '',
    description: corporation.description ?? '',
    logoUrl: corporation.logoUrl ?? '',
    name: corporation.name ?? '',
    sector: corporation.sector ?? '',
    tagline: corporation.tagline ?? '',
    trustScore: corporation.trustScore ?? '',
  }
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

const statusFilters = [
  { id: 'all', label: 'Todos' },
  { id: 'active', label: 'Activos' },
  { id: 'inactive', label: 'Inactivos' },
]

const imageFolderOptions = ['news', 'heroes', 'corporations', 'uploads']

function getSearchValue(item, fields) {
  return fields
    .map((field) => item[field])
    .filter((value) => value !== undefined && value !== null && value !== '')
    .join(' ')
    .toLowerCase()
}

function itemMatchesStatus(item, statusFilter) {
  if (statusFilter === 'active') {
    return item.active !== false
  }

  if (statusFilter === 'inactive') {
    return item.active === false
  }

  return true
}

function filterReviewItems(items, searchQuery, statusFilter, fields) {
  const query = searchQuery.trim().toLowerCase()

  return items.filter((item) => {
    const matchesText = query ? getSearchValue(item, fields).includes(query) : true

    return matchesText && itemMatchesStatus(item, statusFilter)
  })
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

function GMManagerTab({ active, children, onClick }) {
  return (
    <button
      aria-pressed={active}
      className={`gm-manager-tab${active ? ' gm-manager-tab--active' : ''}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function GMManagerMediaPreview({ label, url }) {
  if (!url) {
    return null
  }

  return (
    <div className="gm-manager-file-preview">
      <span>{label}</span>
      <img alt={label} src={url} />
    </div>
  )
}

function GMManager() {
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedType, setSelectedType] = useState(null)
  const [activeCreatePanel, setActiveCreatePanel] = useState('news')
  const [activeReviewPanel, setActiveReviewPanel] = useState('news')
  const [reviewSearch, setReviewSearch] = useState('')
  const [reviewStatusFilter, setReviewStatusFilter] = useState('all')
  const [newsForm, setNewsForm] = useState(emptyNewsForm)
  const [newsFormError, setNewsFormError] = useState('')
  const [newsFormSuccess, setNewsFormSuccess] = useState('')
  const [isCreatingNews, setIsCreatingNews] = useState(false)
  const [editingNewsId, setEditingNewsId] = useState(null)
  const [editNewsForm, setEditNewsForm] = useState(emptyNewsForm)
  const [editNewsError, setEditNewsError] = useState('')
  const [editNewsSuccess, setEditNewsSuccess] = useState('')
  const [isUpdatingNews, setIsUpdatingNews] = useState(false)
  const [heroForm, setHeroForm] = useState(emptyHeroForm)
  const [heroFormError, setHeroFormError] = useState('')
  const [heroFormSuccess, setHeroFormSuccess] = useState('')
  const [isCreatingHero, setIsCreatingHero] = useState(false)
  const [editingHeroId, setEditingHeroId] = useState(null)
  const [editHeroForm, setEditHeroForm] = useState(emptyHeroForm)
  const [editHeroError, setEditHeroError] = useState('')
  const [editHeroSuccess, setEditHeroSuccess] = useState('')
  const [isUpdatingHero, setIsUpdatingHero] = useState(false)
  const [corporationForm, setCorporationForm] = useState(emptyCorporationForm)
  const [corporationFormError, setCorporationFormError] = useState('')
  const [corporationFormSuccess, setCorporationFormSuccess] = useState('')
  const [isCreatingCorporation, setIsCreatingCorporation] = useState(false)
  const [editingCorporationId, setEditingCorporationId] = useState(null)
  const [editCorporationForm, setEditCorporationForm] = useState(emptyCorporationForm)
  const [editCorporationError, setEditCorporationError] = useState('')
  const [editCorporationSuccess, setEditCorporationSuccess] = useState('')
  const [isUpdatingCorporation, setIsUpdatingCorporation] = useState(false)
  const [toggleStatusMessage, setToggleStatusMessage] = useState('')
  const [toggleErrorMessage, setToggleErrorMessage] = useState('')
  const [togglingItemKey, setTogglingItemKey] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imageFolder, setImageFolder] = useState('uploads')
  const [imageUploadError, setImageUploadError] = useState('')
  const [imageUploadSuccess, setImageUploadSuccess] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [latestUploadedImageUrl, setLatestUploadedImageUrl] = useState('')
  const detailRef = useRef(null)
  const imageInputRef = useRef(null)
  const { error: newsError, feedNews, loading: newsLoading } = useNews()
  const { error: heroesError, firebaseHeroes, heroes, loading: heroesLoading } = useHeroes()
  const {
    corporations,
    error: corporationsError,
    firebaseCorporations,
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

  const handleImageFileChange = (event) => {
    setImageFile(event.target.files?.[0] ?? null)
    setImageUploadError('')
    setImageUploadSuccess('')
  }

  const handleUploadImage = async (event) => {
    event.preventDefault()

    if (!imageFile) {
      setImageUploadError('Selecciona una imagen antes de subirla.')
      setImageUploadSuccess('')
      return
    }

    setIsUploadingImage(true)
    setImageUploadError('')
    setImageUploadSuccess('')

    try {
      const downloadURL = await uploadImage(imageFile, imageFolder)
      setLatestUploadedImageUrl(downloadURL)
      setImageFile(null)
      setImageUploadSuccess('Imagen subida correctamente.')

      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    } catch (error) {
      setImageUploadError(error.message ?? String(error))
    } finally {
      setIsUploadingImage(false)
    }
  }

const handleUseLatestImage = (setForm, field) => {
    if (!latestUploadedImageUrl) {
      setImageUploadError('Sube una imagen antes de usarla en un formulario.')
      return
    }

    setForm((currentForm) => ({
      ...currentForm,
      [field]: latestUploadedImageUrl,
    }))
    setImageUploadError('')
  }

  const handleToggleActive = async (type, item) => {
    const toggleHandlers = {
      corporation: toggleCorporationActive,
      hero: toggleHeroActive,
      news: toggleNewsActive,
    }
    const toggleHandler = toggleHandlers[type]
    const itemKey = `${type}-${item.id}`

    setTogglingItemKey(itemKey)
    setToggleStatusMessage('')
    setToggleErrorMessage('')

    try {
      const nextActive = await toggleHandler(item.id, item.active)
      setToggleStatusMessage(
        `${type} ${nextActive ? 'activated' : 'deactivated'} successfully.`,
      )
    } catch (error) {
      setToggleErrorMessage(error.message ?? String(error))
    } finally {
      setTogglingItemKey(null)
    }
  }

  const getToggleLabel = (item) => (item.active === false ? 'Activar' : 'Desactivar')

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

  const handleEditNewsFieldChange = (event) => {
    const { checked, name, type, value } = event.target

    setEditNewsForm((currentForm) => ({
      ...currentForm,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setEditNewsError('')
    setEditNewsSuccess('')
  }

  const handleStartEditNews = (newsItem) => {
    setEditingNewsId(newsItem.id)
    setEditNewsForm(getNewsFormValues(newsItem))
    setEditNewsError('')
    setEditNewsSuccess('')
    setActiveReviewPanel('news')
  }

  const handleCancelEditNews = () => {
    setEditingNewsId(null)
    setEditNewsForm(emptyNewsForm)
    setEditNewsError('')
  }

  const handleUpdateNews = async (event) => {
    event.preventDefault()

    if (!editNewsForm.title.trim() || !editNewsForm.summary.trim()) {
      setEditNewsError('Title and summary are required.')
      setEditNewsSuccess('')
      return
    }

    setIsUpdatingNews(true)
    setEditNewsError('')
    setEditNewsSuccess('')

    try {
      await updateNews(editingNewsId, {
        active: editNewsForm.active,
        body: editNewsForm.body.trim(),
        category: editNewsForm.category.trim(),
        imageUrl: editNewsForm.imageUrl.trim(),
        layer: editNewsForm.layer.trim(),
        summary: editNewsForm.summary.trim(),
        title: editNewsForm.title.trim(),
      })
      setEditingNewsId(null)
      setEditNewsForm(emptyNewsForm)
      setEditNewsSuccess('News updated successfully.')
    } catch (error) {
      setEditNewsError(error.message ?? String(error))
    } finally {
      setIsUpdatingNews(false)
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

  const handleEditHeroFieldChange = (event) => {
    const { checked, name, type, value } = event.target

    setEditHeroForm((currentForm) => ({
      ...currentForm,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setEditHeroError('')
    setEditHeroSuccess('')
  }

  const handleStartEditHero = (hero) => {
    setEditingHeroId(hero.id)
    setEditHeroForm(getHeroFormValues(hero))
    setEditHeroError('')
    setEditHeroSuccess('')
    setActiveReviewPanel('hero')
  }

  const handleCancelEditHero = () => {
    setEditingHeroId(null)
    setEditHeroForm(emptyHeroForm)
    setEditHeroError('')
  }

  const handleUpdateHero = async (event) => {
    event.preventDefault()

    if (!editHeroForm.name.trim() || !editHeroForm.powerClass.trim()) {
      setEditHeroError('Name and powerClass are required.')
      setEditHeroSuccess('')
      return
    }

    const approval = String(editHeroForm.approval).trim()
    const trustScore = String(editHeroForm.trustScore).trim()
    const parsedApproval = approval === '' ? null : Number(approval)
    const parsedTrustScore = trustScore === '' ? null : Number(trustScore)

    if (
      (approval !== '' && Number.isNaN(parsedApproval)) ||
      (trustScore !== '' && Number.isNaN(parsedTrustScore))
    ) {
      setEditHeroError('Approval and trustScore must be valid numbers.')
      setEditHeroSuccess('')
      return
    }

    const heroPayload = {
      active: editHeroForm.active,
      alias: editHeroForm.alias.trim(),
      avatarUrl: editHeroForm.avatarUrl.trim(),
      bannerUrl: editHeroForm.bannerUrl.trim(),
      corporationId: editHeroForm.corporationId.trim(),
      description: editHeroForm.description.trim(),
      name: editHeroForm.name.trim(),
      powerClass: editHeroForm.powerClass.trim(),
      powers: editHeroForm.powers
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

    setIsUpdatingHero(true)
    setEditHeroError('')
    setEditHeroSuccess('')

    try {
      await updateHero(editingHeroId, heroPayload)
      setEditingHeroId(null)
      setEditHeroForm(emptyHeroForm)
      setEditHeroSuccess('Hero updated successfully.')
    } catch (error) {
      setEditHeroError(error.message ?? String(error))
    } finally {
      setIsUpdatingHero(false)
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

  const handleEditCorporationFieldChange = (event) => {
    const { checked, name, type, value } = event.target

    setEditCorporationForm((currentForm) => ({
      ...currentForm,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setEditCorporationError('')
    setEditCorporationSuccess('')
  }

  const handleStartEditCorporation = (corporation) => {
    setEditingCorporationId(corporation.id)
    setEditCorporationForm(getCorporationFormValues(corporation))
    setEditCorporationError('')
    setEditCorporationSuccess('')
    setActiveReviewPanel('corporation')
  }

  const handleCancelEditCorporation = () => {
    setEditingCorporationId(null)
    setEditCorporationForm(emptyCorporationForm)
    setEditCorporationError('')
  }

  const handleUpdateCorporation = async (event) => {
    event.preventDefault()

    if (!editCorporationForm.name.trim() || !editCorporationForm.sector.trim()) {
      setEditCorporationError('Name and sector are required.')
      setEditCorporationSuccess('')
      return
    }

    const approval = String(editCorporationForm.approval).trim()
    const trustScore = String(editCorporationForm.trustScore).trim()
    const parsedApproval = approval === '' ? null : Number(approval)
    const parsedTrustScore = trustScore === '' ? null : Number(trustScore)

    if (
      (approval !== '' && Number.isNaN(parsedApproval)) ||
      (trustScore !== '' && Number.isNaN(parsedTrustScore))
    ) {
      setEditCorporationError('Approval and trustScore must be valid numbers.')
      setEditCorporationSuccess('')
      return
    }

    const corporationPayload = {
      active: editCorporationForm.active,
      bannerUrl: editCorporationForm.bannerUrl.trim(),
      country: editCorporationForm.country.trim(),
      description: editCorporationForm.description.trim(),
      logoUrl: editCorporationForm.logoUrl.trim(),
      name: editCorporationForm.name.trim(),
      sector: editCorporationForm.sector.trim(),
      tagline: editCorporationForm.tagline.trim(),
    }

    if (approval !== '') {
      corporationPayload.approval = parsedApproval
    }

    if (trustScore !== '') {
      corporationPayload.trustScore = parsedTrustScore
    }

    setIsUpdatingCorporation(true)
    setEditCorporationError('')
    setEditCorporationSuccess('')

    try {
      await updateCorporation(editingCorporationId, corporationPayload)
      setEditingCorporationId(null)
      setEditCorporationForm(emptyCorporationForm)
      setEditCorporationSuccess('Corporation updated successfully.')
    } catch (error) {
      setEditCorporationError(error.message ?? String(error))
    } finally {
      setIsUpdatingCorporation(false)
    }
  }

   const reviewHeroes = firebaseHeroes.length > 0 ? firebaseHeroes : heroes
  const reviewCorporations =
    firebaseCorporations.length > 0 ? firebaseCorporations : corporations
  const filteredNews = filterReviewItems(feedNews, reviewSearch, reviewStatusFilter, [
    'title',
    'summary',
    'category',
    'layer',
  ])
  const filteredHeroes = filterReviewItems(reviewHeroes, reviewSearch, reviewStatusFilter, [
    'name',
    'alias',
    'powerClass',
    'corporationId',
    'description',
  ])
  const filteredCorporations = filterReviewItems(
    reviewCorporations,
    reviewSearch,
    reviewStatusFilter,
    ['name', 'tagline', 'sector', 'country', 'description'],
  )
  const canUseLatestImage = Boolean(latestUploadedImageUrl)

  return (
    <section className="page-card gm-manager-page">
      <div className="gm-manager-hero">
        <p className="page-card__kicker">Internal</p>
        <h2>GM Manager</h2>
        <p>Panel interno de gestión de HeroIndex.</p>
        <p className="gm-manager-hero__note">
          Herramienta interna para gestionar contenido público de HeroIndex.
        </p>
      </div>
      
       <section className="gm-manager-workspace gm-manager-workspace--overview">
        <div className="gm-manager-workspace__top">
          <p className="page-card__kicker">Overview</p>
          <h3>Overview</h3>
        </div>
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
      </section>

<section className="gm-manager-workspace">
        <div className="gm-manager-workspace__top">
          <p className="page-card__kicker">Subir imagen</p>
          <h3>Subir imagen</h3>
          <p>Sube una imagen a Firebase Storage y copia su downloadURL para usarla manualmente.</p>
        </div>
        <form className="gm-manager-form" onSubmit={handleUploadImage}>
          <div className="gm-manager-form__grid">
            <label>
              <span>Carpeta</span>
              <select
                name="imageFolder"
                onChange={(event) => setImageFolder(event.target.value)}
                value={imageFolder}
              >
                {imageFolderOptions.map((folder) => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Imagen</span>
              <input
                accept="image/*"
                onChange={handleImageFileChange}
                ref={imageInputRef}
                type="file"
              />
            </label>
          </div>
          {imageFile ? <p className="gm-manager-count">Archivo seleccionado: {imageFile.name}</p> : null}
          {imageUploadError ? <p className="gm-manager-message gm-manager-message--error">{imageUploadError}</p> : null}
          {imageUploadSuccess ? <p className="gm-manager-message gm-manager-message--success">{imageUploadSuccess}</p> : null}
          <button className="gm-manager-action" disabled={isUploadingImage} type="submit">
            {isUploadingImage ? 'Subiendo…' : 'Subir imagen'}
          </button>
        </form>
        {latestUploadedImageUrl ? (
          <div className="gm-manager-file-result">
            <label>
              <span>Download URL</span>
              <input
                onFocus={(event) => event.target.select()}
                readOnly
                type="text"
                  value={latestUploadedImageUrl}
              />
            </label>
            <a href={latestUploadedImageUrl} rel="noreferrer" target="_blank">
              Abrir imagen
            </a>
            <img alt="Preview de imagen subida" src={latestUploadedImageUrl} />
          </div>
        ) : null}
      </section>

      <section className="gm-manager-workspace">
        <div className="gm-manager-workspace__top">
          <p className="page-card__kicker">Crear contenido</p>
          <h3>Crear contenido</h3>
          <p>Elige un tipo de contenido y conserva el foco en un solo formulario.</p>
        </div>
        <div className="gm-manager-tabs" aria-label="Crear contenido">
          <GMManagerTab
            active={activeCreatePanel === 'news'}
            onClick={() => setActiveCreatePanel('news')}
          >
            Crear News
          </GMManagerTab>
          <GMManagerTab
            active={activeCreatePanel === 'hero'}
            onClick={() => setActiveCreatePanel('hero')}
          >
            Crear Hero
          </GMManagerTab>
          <GMManagerTab
            active={activeCreatePanel === 'corporation'}
            onClick={() => setActiveCreatePanel('corporation')}
          >
            Crear Corporation
          </GMManagerTab>
        </div>
        {activeCreatePanel === 'news' ? (

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
          <div className="gm-manager-file-actions">
            <button
              className="gm-manager-action"
              disabled={!canUseLatestImage}
              onClick={() => handleUseLatestImage(setNewsForm, 'imageUrl')}
              type="button"
            >
              Usar última imagen subida
            </button>
          </div>
          <GMManagerMediaPreview label="Preview de News" url={newsForm.imageUrl} />
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
) : null}
        {activeCreatePanel === 'hero' ? (
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
            <div className="gm-manager-file-actions">
            <button
              className="gm-manager-action"
              disabled={!canUseLatestImage}
              onClick={() => handleUseLatestImage(setHeroForm, 'avatarUrl')}
              type="button"
            >
              Usar última imagen como avatar
            </button>
            <button
              className="gm-manager-action"
              disabled={!canUseLatestImage}
              onClick={() => handleUseLatestImage(setHeroForm, 'bannerUrl')}
              type="button"
            >
              Usar última imagen como portada
            </button>
          </div>
          <div className="gm-manager-file-previews">
            <GMManagerMediaPreview label="Preview de avatar" url={heroForm.avatarUrl} />
            <GMManagerMediaPreview label="Preview de portada" url={heroForm.bannerUrl} />
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
 ) : null}
        {activeCreatePanel === 'corporation' ? (
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
           <div className="gm-manager-file-actions">
            <button
              className="gm-manager-action"
              disabled={!canUseLatestImage}
              onClick={() => handleUseLatestImage(setCorporationForm, 'logoUrl')}
              type="button"
            >
              Usar última imagen como logo
            </button>
            <button
              className="gm-manager-action"
              disabled={!canUseLatestImage}
              onClick={() => handleUseLatestImage(setCorporationForm, 'bannerUrl')}
              type="button"
            >
              Usar última imagen como portada
            </button>
          </div>
          <div className="gm-manager-file-previews">
            <GMManagerMediaPreview label="Preview de logo" url={corporationForm.logoUrl} />
            <GMManagerMediaPreview label="Preview de portada" url={corporationForm.bannerUrl} />
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
   ) : null}
      </section>

<section className="gm-manager-workspace">
        <div className="gm-manager-workspace__top">
          <p className="page-card__kicker">Revisar contenido</p>
          <h3>Revisar contenido</h3>
          <p>Consulta registros, abre el detalle y activa o desactiva contenido.</p>
        </div>
 {toggleErrorMessage ? <p className="gm-manager-message gm-manager-message--error">{toggleErrorMessage}</p> : null}
      <div className="gm-manager-tools">
          <label className="gm-manager-search">
            <span>Buscar</span>
            <input
              onChange={(event) => setReviewSearch(event.target.value)}
              placeholder="Buscar contenido por texto"
              type="search"
              value={reviewSearch}
            />
          </label>
          <div className="gm-manager-filter" aria-label="Filtro por estado">
            {statusFilters.map((filter) => (
              <GMManagerTab
                active={reviewStatusFilter === filter.id}
                key={filter.id}
                onClick={() => setReviewStatusFilter(filter.id)}
              >
                {filter.label}
              </GMManagerTab>
            ))}
          </div>
        </div>
      {toggleStatusMessage ? <p className="gm-manager-message gm-manager-message--success">{toggleStatusMessage}</p> : null}
       <div className="gm-manager-tabs" aria-label="Revisar contenido">
          <GMManagerTab
            active={activeReviewPanel === 'news'}
            onClick={() => setActiveReviewPanel('news')}
          >
            News
          </GMManagerTab>
          <GMManagerTab
            active={activeReviewPanel === 'hero'}
            onClick={() => setActiveReviewPanel('hero')}
          >
            Heroes
          </GMManagerTab>
          <GMManagerTab
            active={activeReviewPanel === 'corporation'}
            onClick={() => setActiveReviewPanel('corporation')}
          >
            Corporations
          </GMManagerTab>
        </div>
          {editNewsSuccess ? <p className="gm-manager-message gm-manager-message--success">{editNewsSuccess}</p> : null}
        {editingNewsId ? (
          <section className="gm-manager-create">
            <div className="gm-manager-title">
              <p className="page-card__kicker">Edit</p>
              <h3>Editar News</h3>
            </div>
            <form className="gm-manager-form" onSubmit={handleUpdateNews}>
              <label>
                <span>Title *</span>
                <input
                  name="title"
                  onChange={handleEditNewsFieldChange}
                  type="text"
                  value={editNewsForm.title}
                />
              </label>
              <label>
                <span>Summary *</span>
                <textarea
                  name="summary"
                  onChange={handleEditNewsFieldChange}
                  rows="3"
                  value={editNewsForm.summary}
                />
              </label>
              <label>
                <span>Body</span>
                <textarea
                  name="body"
                  onChange={handleEditNewsFieldChange}
                  rows="4"
                  value={editNewsForm.body}
                />
              </label>
              <div className="gm-manager-form__grid">
                <label>
                  <span>Category</span>
                  <input
                    name="category"
                    onChange={handleEditNewsFieldChange}
                    type="text"
                    value={editNewsForm.category}
                  />
                </label>
                <label>
                  <span>Layer</span>
                  <input
                    name="layer"
                    onChange={handleEditNewsFieldChange}
                    type="text"
                    value={editNewsForm.layer}
                  />
                </label>
              </div>
              <label>
                <span>Image URL</span>
                <input
                  name="imageUrl"
                  onChange={handleEditNewsFieldChange}
                  type="url"
                  value={editNewsForm.imageUrl}
                />
              </label>
               <div className="gm-manager-file-actions">
                <button
                  className="gm-manager-action"
                  disabled={!canUseLatestImage}
                  onClick={() => handleUseLatestImage(setEditNewsForm, 'imageUrl')}
                  type="button"
                >
                  Usar última imagen subida
                </button>
              </div>
              <GMManagerMediaPreview label="Preview de News" url={editNewsForm.imageUrl} />
              <label className="gm-manager-check">
                <input
                  checked={editNewsForm.active}
                  name="active"
                  onChange={handleEditNewsFieldChange}
                  type="checkbox"
                />
                <span>Active</span>
              </label>
              {editNewsError ? <p className="gm-manager-message gm-manager-message--error">{editNewsError}</p> : null}
              <div className="gm-manager-actions">
                <button className="gm-manager-action" disabled={isUpdatingNews} type="submit">
                  {isUpdatingNews ? 'Saving…' : 'Guardar News'}
                </button>
                <button
                  className="gm-manager-action"
                  disabled={isUpdatingNews}
                  onClick={handleCancelEditNews}
                  type="button"
                >
                  Cancelar edición
                </button>
              </div>
            </form>
          </section>
        ) : null}
        {activeReviewPanel === 'news' ? (
      <GMManagerSection title="News">
        <p className="gm-manager-count">Mostrando {filteredNews.length} de {feedNews.length}</p>
        {filteredNews.length > 0 ? (
        <table className="gm-manager-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category / Type</th>
              <th>Active</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredNews.map((newsItem) => (
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
                   <button
                    className="gm-manager-action"
                    onClick={() => handleStartEditNews(newsItem)}
                    type="button"
                  >
                    Editar
                  </button>
                   <button
                    className="gm-manager-action"
                    disabled={togglingItemKey === `news-${newsItem.id}`}
                    onClick={() => handleToggleActive('news', newsItem)}
                    type="button"
                  >
                    {togglingItemKey === `news-${newsItem.id}` ? 'Guardando…' : getToggleLabel(newsItem)}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
         ) : (
          <p className="gm-manager-empty">No hay resultados para los filtros actuales.</p>
        )}
      </GMManagerSection>
      ) : null}
         {editHeroSuccess ? <p className="gm-manager-message gm-manager-message--success">{editHeroSuccess}</p> : null}
        {editingHeroId ? (
          <section className="gm-manager-create">
            <div className="gm-manager-title">
              <p className="page-card__kicker">Edit</p>
              <h3>Editar Hero</h3>
            </div>
            <form className="gm-manager-form" onSubmit={handleUpdateHero}>
              <div className="gm-manager-form__grid">
                <label>
                  <span>Name *</span>
                  <input
                    name="name"
                    onChange={handleEditHeroFieldChange}
                    type="text"
                    value={editHeroForm.name}
                  />
                </label>
                <label>
                  <span>Alias</span>
                  <input
                    name="alias"
                    onChange={handleEditHeroFieldChange}
                    type="text"
                    value={editHeroForm.alias}
                  />
                </label>
              </div>
              <div className="gm-manager-form__grid">
                <label>
                  <span>Corporation ID</span>
                  <input
                    name="corporationId"
                    onChange={handleEditHeroFieldChange}
                    type="text"
                    value={editHeroForm.corporationId}
                  />
                </label>
                <label>
                  <span>Power Class *</span>
                  <input
                    name="powerClass"
                    onChange={handleEditHeroFieldChange}
                    type="text"
                    value={editHeroForm.powerClass}
                  />
                </label>
              </div>
              <div className="gm-manager-form__grid">
                <label>
                  <span>Approval</span>
                  <input
                    name="approval"
                    onChange={handleEditHeroFieldChange}
                    type="number"
                    value={editHeroForm.approval}
                  />
                </label>
                <label>
                  <span>Trust Score</span>
                  <input
                    name="trustScore"
                    onChange={handleEditHeroFieldChange}
                    type="number"
                    value={editHeroForm.trustScore}
                  />
                </label>
              </div>
              <label>
                <span>Description</span>
                <textarea
                  name="description"
                  onChange={handleEditHeroFieldChange}
                  rows="4"
                  value={editHeroForm.description}
                />
              </label>
              <label>
                <span>Powers</span>
                <input
                  name="powers"
                  onChange={handleEditHeroFieldChange}
                  placeholder="Flight, strength, tactical analysis"
                  type="text"
                  value={editHeroForm.powers}
                />
              </label>
              <div className="gm-manager-form__grid">
                <label>
                  <span>Avatar URL</span>
                  <input
                    name="avatarUrl"
                    onChange={handleEditHeroFieldChange}
                    type="url"
                    value={editHeroForm.avatarUrl}
                  />
                </label>
                <label>
                  <span>Cover URL</span>
                  <input
                    name="bannerUrl"
                    onChange={handleEditHeroFieldChange}
                    type="url"
                    value={editHeroForm.bannerUrl}
                  />
                </label>
              </div>
                <div className="gm-manager-file-actions">
                <button
                  className="gm-manager-action"
                  disabled={!canUseLatestImage}
                  onClick={() => handleUseLatestImage(setEditHeroForm, 'avatarUrl')}
                  type="button"
                >
                  Usar última imagen como avatar
                </button>
                <button
                  className="gm-manager-action"
                  disabled={!canUseLatestImage}
                  onClick={() => handleUseLatestImage(setEditHeroForm, 'bannerUrl')}
                  type="button"
                >
                  Usar última imagen como portada
                </button>
              </div>
              <div className="gm-manager-file-previews">
                <GMManagerMediaPreview label="Preview de avatar" url={editHeroForm.avatarUrl} />
                <GMManagerMediaPreview label="Preview de portada" url={editHeroForm.bannerUrl} />
              </div>
              <label className="gm-manager-check">
                <input
                  checked={editHeroForm.active}
                  name="active"
                  onChange={handleEditHeroFieldChange}
                  type="checkbox"
                />
                <span>Active</span>
              </label>
              {editHeroError ? <p className="gm-manager-message gm-manager-message--error">{editHeroError}</p> : null}
              <div className="gm-manager-actions">
                <button className="gm-manager-action" disabled={isUpdatingHero} type="submit">
                  {isUpdatingHero ? 'Saving…' : 'Guardar Hero'}
                </button>
                <button
                  className="gm-manager-action"
                  disabled={isUpdatingHero}
                  onClick={handleCancelEditHero}
                  type="button"
                >
                  Cancelar edición
                </button>
              </div>
            </form>
          </section>
        ) : null}
        {activeReviewPanel === 'hero' ? (
      <GMManagerSection title="Heroes">
          <p className="gm-manager-count">Mostrando {filteredHeroes.length} de {reviewHeroes.length}</p>
        {filteredHeroes.length > 0 ? (
        <table className="gm-manager-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Alias</th>
              <th>Corporation</th>
              <th>Approval</th>
              <th>Trust</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
             {filteredHeroes.map((hero) => (
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
                  <button
                    className="gm-manager-action"
                    onClick={() => handleStartEditHero(hero)}
                    type="button"
                  >
                    Editar
                  </button>
                   <button
                    className="gm-manager-action"
                    disabled={togglingItemKey === `hero-${hero.id}`}
                    onClick={() => handleToggleActive('hero', hero)}
                    type="button"
                  >
                    {togglingItemKey === `hero-${hero.id}` ? 'Guardando…' : getToggleLabel(hero)}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
         ) : (
          <p className="gm-manager-empty">No hay resultados para los filtros actuales.</p>
        )}
      </GMManagerSection>
 ) : null}
    {editCorporationSuccess ? <p className="gm-manager-message gm-manager-message--success">{editCorporationSuccess}</p> : null}
        {editingCorporationId ? (
          <section className="gm-manager-create">
            <div className="gm-manager-title">
              <p className="page-card__kicker">Edit</p>
              <h3>Editar Corporation</h3>
            </div>
            <form className="gm-manager-form" onSubmit={handleUpdateCorporation}>
              <div className="gm-manager-form__grid">
                <label>
                  <span>Name *</span>
                  <input
                    name="name"
                    onChange={handleEditCorporationFieldChange}
                    type="text"
                    value={editCorporationForm.name}
                  />
                </label>
                <label>
                  <span>Sector *</span>
                  <input
                    name="sector"
                    onChange={handleEditCorporationFieldChange}
                    type="text"
                    value={editCorporationForm.sector}
                  />
                </label>
              </div>
              <div className="gm-manager-form__grid">
                <label>
                  <span>Tagline</span>
                  <input
                    name="tagline"
                    onChange={handleEditCorporationFieldChange}
                    type="text"
                    value={editCorporationForm.tagline}
                  />
                </label>
                <label>
                  <span>Country</span>
                  <input
                    name="country"
                    onChange={handleEditCorporationFieldChange}
                    type="text"
                    value={editCorporationForm.country}
                  />
                </label>
              </div>
              <label>
                <span>Description</span>
                <textarea
                  name="description"
                  onChange={handleEditCorporationFieldChange}
                  rows="4"
                  value={editCorporationForm.description}
                />
              </label>
              <div className="gm-manager-form__grid">
                <label>
                  <span>Logo URL</span>
                  <input
                    name="logoUrl"
                    onChange={handleEditCorporationFieldChange}
                    type="url"
                    value={editCorporationForm.logoUrl}
                  />
                </label>
                <label>
                  <span>Cover URL</span>
                  <input
                    name="bannerUrl"
                    onChange={handleEditCorporationFieldChange}
                    type="url"
                    value={editCorporationForm.bannerUrl}
                  />
                </label>
              </div>
               <div className="gm-manager-file-actions">
                <button
                  className="gm-manager-action"
                  disabled={!canUseLatestImage}
                  onClick={() => handleUseLatestImage(setEditCorporationForm, 'logoUrl')}
                  type="button"
                >
                  Usar última imagen como logo
                </button>
                <button
                  className="gm-manager-action"
                  disabled={!canUseLatestImage}
                  onClick={() => handleUseLatestImage(setEditCorporationForm, 'bannerUrl')}
                  type="button"
                >
                  Usar última imagen como portada
                </button>
              </div>
              <div className="gm-manager-file-previews">
                <GMManagerMediaPreview label="Preview de logo" url={editCorporationForm.logoUrl} />
                <GMManagerMediaPreview label="Preview de portada" url={editCorporationForm.bannerUrl} />
              </div>
              <div className="gm-manager-form__grid">
                <label>
                  <span>Approval</span>
                  <input
                    name="approval"
                    onChange={handleEditCorporationFieldChange}
                    type="number"
                    value={editCorporationForm.approval}
                  />
                </label>
                <label>
                  <span>Trust Score</span>
                  <input
                    name="trustScore"
                    onChange={handleEditCorporationFieldChange}
                    type="number"
                    value={editCorporationForm.trustScore}
                  />
                </label>
              </div>
              <label className="gm-manager-check">
                <input
                  checked={editCorporationForm.active}
                  name="active"
                  onChange={handleEditCorporationFieldChange}
                  type="checkbox"
                />
                <span>Active</span>
              </label>
              {editCorporationError ? <p className="gm-manager-message gm-manager-message--error">{editCorporationError}</p> : null}
              <div className="gm-manager-actions">
                <button className="gm-manager-action" disabled={isUpdatingCorporation} type="submit">
                  {isUpdatingCorporation ? 'Saving…' : 'Guardar Corporation'}
                </button>
                <button
                  className="gm-manager-action"
                  disabled={isUpdatingCorporation}
                  onClick={handleCancelEditCorporation}
                  type="button"
                >
                  Cancelar edición
                </button>
              </div>
            </form>
          </section>
        ) : null}
        {activeReviewPanel === 'corporation' ? (
      <GMManagerSection title="Corporations">
        <p className="gm-manager-count">Mostrando {filteredCorporations.length} de {reviewCorporations.length}</p>
        {filteredCorporations.length > 0 ? (
        <table className="gm-manager-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Sector</th>
              <th>Country</th>
              <th>Approval</th>
              <th>Trust</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCorporations.map((corporation) => (
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
                  <button
                    className="gm-manager-action"
                    onClick={() => handleStartEditCorporation(corporation)}
                    type="button"
                  >
                    Editar
                  </button>
                  <button
                    className="gm-manager-action"
                    disabled={togglingItemKey === `corporation-${corporation.id}`}
                    onClick={() => handleToggleActive('corporation', corporation)}
                    type="button"
                  >
                    {togglingItemKey === `corporation-${corporation.id}` ? 'Guardando…' : getToggleLabel(corporation)}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        ) : (
          <p className="gm-manager-empty">No hay resultados para los filtros actuales.</p>
        )}
      </GMManagerSection>
      ) : null}
      </section>

      <section className="gm-manager-workspace gm-manager-workspace--detail">
        <div className="gm-manager-workspace__top">
          <p className="page-card__kicker">Detalle seleccionado</p>
          <h3>Detalle seleccionado</h3>
          <p>Abre un registro desde Revisar contenido para inspeccionar todos sus campos.</p>
        </div>
        {selectedItem ? (

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
        ) : (
          <p className="gm-manager-empty">Selecciona “Ver detalle” en una fila para revisar el registro completo.</p>
        )}
      </section>
    </section>
  )
}

export default GMManager