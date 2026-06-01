import { useRef, useState } from 'react'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { useNews } from '../hooks/useNews.js'
import {
  createCorporation,
  deleteCorporation,
  deleteMultipleCorporations,
  toggleCorporationActive,
  updateCorporation,
} from '../services/corporationsService.js'
import { createHero, deleteHero, deleteMultipleHeroes, toggleHeroActive, updateHero } from '../services/heroesService.js'
import { createNews, deleteMultipleNews, deleteNews, toggleNewsActive, updateNews } from '../services/newsService.js'
import { uploadImage } from '../services/storageService.js'

const emptyNewsForm = {
  active: true,
  body: '',
  category: '',
  corporationIds: [],
  heroIds: [],
  imageUrl: '',
  layer: '',
  summary: '',
  title: '',
}

function normalizeRelationIds(value) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : []
}

function getNewsFormValues(newsItem = {}) {
  return {
    active: newsItem.active ?? true,
    body: newsItem.body ?? '',
    category: newsItem.category ?? '',
    corporationIds: normalizeRelationIds(newsItem.corporationIds),
    heroIds: normalizeRelationIds(newsItem.heroIds),
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
  codename: '',
  corporationId: '',
  heroTitle: '',
  name: '',
  powerClass: '',
  publicBio: '',
  publicName: '',
  publicPowers: '',
  rankingPoints: '',
  trustScore: '',
}

function stringifyListField(value) {
  return Array.isArray(value) ? value.join(', ') : value ?? ''
}

function getHeroFormValues(hero = {}) {
  return {
    active: hero.active ?? true,
    alias: hero.alias ?? '',
    approval: hero.approval ?? '',
    avatarUrl: hero.avatarUrl ?? '',
    bannerUrl: hero.bannerUrl ?? '',
    codename: hero.codename ?? '',
    corporationId: hero.corporationId ?? '',
    heroTitle: hero.heroTitle ?? '',
    name: hero.name ?? '',
    powerClass: hero.powerClass ?? '',
    publicBio: hero.publicBio ?? hero.description ?? '',
    publicName: hero.publicName ?? '',
    publicPowers: stringifyListField(hero.publicPowers ?? hero.visiblePowers ?? hero.powers),
    rankingPoints: hero.rankingPoints ?? '',
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
    return value ? 'Sí' : 'No'
  }

  return value
}

function getDetailValue(value) {
  if (value === undefined || value === null || value === '') {
    return '—'
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No'
  }

  if (Array.isArray(value) || typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}

function countActiveItems(items) {
  return items.filter((item) => item.active !== false).length
}

function countInactiveItems(items) {
  return items.filter((item) => item.active === false).length
}

function getReviewEmptyMessage(statusFilter) {
  if (statusFilter === 'active') return 'No hay registros activos.'
  if (statusFilter === 'inactive') return 'No hay registros inactivos.'

  return 'No hay registros disponibles.'
}

function getLatestUpdatedAt(items) {
  return items.reduce((latestDate, item) => {
    const rawDate = item.updatedAt ?? item.createdAt
    const timestamp = Number(rawDate) || Date.parse(rawDate) || 0

    return timestamp > latestDate ? timestamp : latestDate
  }, 0)
}

function formatManagerDate(value) {
  if (!value) {
    return 'Sin registro'
  }

  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}


function getPublicHeroIdentity(form) {
  return form.alias.trim() || form.publicName.trim() || form.codename.trim() || form.name.trim()
}

function parseCommaList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const statusFilters = [
  { id: 'active', label: 'Activos' },
  { id: 'inactive', label: 'Inactivos' },
  { id: 'all', label: 'Todos' },
]

const imageFolderOptions = ['news', 'heroes', 'corporations', 'uploads']

const contentTypeLabels = {
  corporation: 'Corporación',
  hero: 'Héroe',
  news: 'News',
}

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

function GMManagerSummary({ activeCount, count, error, inactiveCount, label, loading, updatedAt }) {
  const status = getStatus({ error, loading })
  const statusLabel = {
    error: 'Error',
    loading: 'Cargando',
    ready: 'Listo',
  }[status]

  return (
    <article className="gm-manager-summary">
      <p className="page-card__kicker">{label}</p>
      <strong>{count}</strong>
      <span>Estado: {statusLabel}</span>
      <dl className="gm-manager-summary__stats">
        <div>
          <dt>Activos</dt>
          <dd>{activeCount}</dd>
        </div>
        <div>
          <dt>Inactivos</dt>
          <dd>{inactiveCount}</dd>
        </div>
        <div>
          <dt>Actualización</dt>
          <dd>{formatManagerDate(updatedAt)}</dd>
        </div>
      </dl>
      {error ? <small>{error.message ?? String(error)}</small> : null}
    </article>
  )
}

function GMManagerSection({ children, title }) {
  return (
    <section className="gm-manager-section">
      <div className="gm-manager-title">
        <p className="page-card__kicker">Revisión</p>
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
      <img
        alt={label}
        loading="lazy"
        onError={(event) => {
          event.currentTarget.hidden = true
        }}
        src={url}
      />
    </div>
  )
}

function GMManagerRelationSelector({ getLabel, items, onToggle, selectedIds, title }) {
  const selectedSet = new Set(normalizeRelationIds(selectedIds))

  return (
    <fieldset className="gm-manager-relations">
      <legend>{title}</legend>
      {items.length > 0 ? (
        <div className="gm-manager-relations__grid">
          {items.map((item) => (
            <label className="gm-manager-relations__option" key={item.id}>
              <input
                checked={selectedSet.has(String(item.id))}
                onChange={() => onToggle(item.id)}
                type="checkbox"
              />
              <span>{getLabel(item)}</span>
            </label>
          ))}
        </div>
      ) : (
        <p className="gm-manager-empty">No hay registros disponibles para vincular.</p>
      )}
    </fieldset>
  )
}

function GMManager({ onNavigate }) {
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedType, setSelectedType] = useState(null)
  const [activeCreatePanel, setActiveCreatePanel] = useState('news')
  const [activeReviewPanel, setActiveReviewPanel] = useState('news')
  const [reviewSearch, setReviewSearch] = useState('')
  const [reviewStatusFilter, setReviewStatusFilter] = useState('active')
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
  const [deleteStatusMessage, setDeleteStatusMessage] = useState('')
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('')
  const [deletingItemKey, setDeletingItemKey] = useState(null)
  const [selectedReviewIds, setSelectedReviewIds] = useState({ corporation: [], hero: [], news: [] })
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

  const handleNewsRelationChange = (setForm, field, id) => {
    const relationId = String(id)

    setForm((currentForm) => {
      const currentIds = normalizeRelationIds(currentForm[field])
      const nextIds = currentIds.includes(relationId)
        ? currentIds.filter((currentId) => currentId !== relationId)
        : [...currentIds, relationId]

      return {
        ...currentForm,
        [field]: nextIds,
      }
    })
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
        `${contentTypeLabels[type] ?? 'Registro'} ${nextActive ? 'activado' : 'desactivado'} correctamente.`,
      )
    } catch (error) {
      setToggleErrorMessage(error.message ?? String(error))
    } finally {
      setTogglingItemKey(null)
    }
  }

  const getToggleLabel = (item) => (item.active === false ? 'Activar' : 'Desactivar')

  
  const getDeleteHandler = (type) => {
    const deleteHandlers = {
      corporation: deleteCorporation,
      hero: deleteHero,
      news: deleteNews,
    }

    return deleteHandlers[type]
  }

  const getBulkDeleteHandler = (type) => {
    const deleteHandlers = {
      corporation: deleteMultipleCorporations,
      hero: deleteMultipleHeroes,
      news: deleteMultipleNews,
    }

    return deleteHandlers[type]
  }

  const clearSelection = (type, message = 'Selección limpiada.') => {
    setSelectedReviewIds((currentSelection) => ({
      ...currentSelection,
      [type]: [],
    }))
    if (message) {
      setDeleteStatusMessage(message)
      setDeleteErrorMessage('')
    }
  }

  const toggleSelection = (type, itemId) => {
    setSelectedReviewIds((currentSelection) => {
      const currentIds = currentSelection[type] ?? []
      const nextIds = currentIds.includes(itemId)
        ? currentIds.filter((currentId) => currentId !== itemId)
        : [...currentIds, itemId]

      return {
        ...currentSelection,
        [type]: nextIds,
      }
    })
    setDeleteStatusMessage('')
    setDeleteErrorMessage('')
  }

  const selectVisibleItems = (type, items) => {
    setSelectedReviewIds((currentSelection) => ({
      ...currentSelection,
      [type]: items.map((item) => item.id),
    }))
    setDeleteStatusMessage(`${items.length} registros visibles seleccionados.`)
    setDeleteErrorMessage('')
  }

  const handleDeleteItem = async (type, item) => {
    const deleteHandler = getDeleteHandler(type)
    const label = contentTypeLabels[type] ?? 'Registro'

    if (!deleteHandler) return

    const deleteCharacterSheet =
      type === 'hero' &&
      window.confirm('¿Eliminar también hoja privada RPG? Aceptar elimina /characterSheets asociado; cancelar conserva la hoja.')
    const confirmationMessage =
      type === 'hero'
        ? 'Esta acción eliminará el héroe público. Las noticias y evaluaciones asociadas no se eliminarán automáticamente. No se puede deshacer.'
        : 'Esta acción eliminará permanentemente el registro. No se puede deshacer.'

    if (!window.confirm(confirmationMessage)) return

    setDeletingItemKey(`${type}-${item.id}`)
    setDeleteStatusMessage('Eliminando...')
    setDeleteErrorMessage('')

    try {
      await deleteHandler(item.id, { deleteCharacterSheet })
      clearSelection(type, '')
      setDeleteStatusMessage(`${label} eliminado correctamente.`)
      if (selectedItem?.id === item.id && selectedType === type) closeDetail()
    } catch {
      setDeleteErrorMessage('No fue posible eliminar el registro.')
      setDeleteStatusMessage('')
    } finally {
      setDeletingItemKey(null)
    }
  }

  const handleDeleteSelected = async (type) => {
    const selectedIds = selectedReviewIds[type] ?? []
    const deleteHandler = getBulkDeleteHandler(type)
    const label = contentTypeLabels[type] ?? 'Registros'

    if (!deleteHandler || selectedIds.length === 0) return

    const deleteCharacterSheet =
      type === 'hero' &&
      window.confirm('¿Eliminar también hojas privadas RPG asociadas? Aceptar elimina /characterSheets; cancelar conserva las hojas.')

    if (!window.confirm(`Eliminar ${selectedIds.length} registros seleccionados. Esta acción no se puede deshacer.`)) return

    setDeletingItemKey(`${type}-bulk`)
    setDeleteStatusMessage('Eliminando...')
    setDeleteErrorMessage('')

    try {
      await deleteHandler(selectedIds, { deleteCharacterSheet })
      clearSelection(type, '')
      setDeleteStatusMessage(`${label} eliminados correctamente.`)
    } catch {
      setDeleteErrorMessage('No fue posible eliminar el registro.')
      setDeleteStatusMessage('')
    } finally {
      setDeletingItemKey(null)
    }
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
      setNewsFormError('Título y resumen son obligatorios.')
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
         corporationIds: normalizeRelationIds(newsForm.corporationIds),
        heroIds: normalizeRelationIds(newsForm.heroIds),
        imageUrl: newsForm.imageUrl.trim(),
        layer: newsForm.layer.trim(),
        summary: newsForm.summary.trim(),
        title: newsForm.title.trim(),
      })
      setNewsForm(emptyNewsForm)
      setNewsFormSuccess('News creada correctamente.')
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
      setEditNewsError('Título y resumen son obligatorios.')
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
        corporationIds: normalizeRelationIds(editNewsForm.corporationIds),
        heroIds: normalizeRelationIds(editNewsForm.heroIds),
        imageUrl: editNewsForm.imageUrl.trim(),
        layer: editNewsForm.layer.trim(),
        summary: editNewsForm.summary.trim(),
        title: editNewsForm.title.trim(),
      })
      setEditingNewsId(null)
      setEditNewsForm(emptyNewsForm)
      setEditNewsSuccess('News actualizada correctamente.')
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

    const publicIdentity = getPublicHeroIdentity(heroForm)

    if (!publicIdentity) {
      setHeroFormError('Alias, nombre público o código es obligatorio.')
      setHeroFormSuccess('')
      return
    }

    const approval = heroForm.approval.trim()
    const trustScore = heroForm.trustScore.trim()
    const rankingPoints = heroForm.rankingPoints.trim()
    const parsedApproval = approval === '' ? null : Number(approval)
    const parsedTrustScore = trustScore === '' ? null : Number(trustScore)
    const parsedRankingPoints = rankingPoints === '' ? 0 : Number(rankingPoints)

    if (
      (approval !== '' && Number.isNaN(parsedApproval)) ||
      (trustScore !== '' && Number.isNaN(parsedTrustScore)) ||
      Number.isNaN(parsedRankingPoints)
    ) {
      setHeroFormError('Aprobación ciudadana, trustScore y Puntos HeroIndex deben ser números válidos.')
      setHeroFormSuccess('')
      return
    }

    const publicPowers = parseCommaList(heroForm.publicPowers)
    const publicBio = heroForm.publicBio.trim()
    const heroPayload = {
      active: heroForm.active,
      alias: heroForm.alias.trim(),
      avatarUrl: heroForm.avatarUrl.trim(),
      bannerUrl: heroForm.bannerUrl.trim(),
      codename: heroForm.codename.trim(),
      corporationId: heroForm.corporationId.trim(),
      description: publicBio,
      heroTitle: heroForm.heroTitle.trim(),
      name: heroForm.name.trim() || publicIdentity,
      powerClass: heroForm.powerClass.trim(),
      publicBio,
      publicName: heroForm.publicName.trim(),
      publicPowers,
      rankingPoints: parsedRankingPoints,
      powers: publicPowers,
      visiblePowers: publicPowers,
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
      setHeroFormSuccess('Hero creado correctamente.')
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

    const publicIdentity = getPublicHeroIdentity(editHeroForm)

    if (!publicIdentity) {
      setEditHeroError('Alias, nombre público o código es obligatorio.')
      setEditHeroSuccess('')
      return
    }

    const approval = String(editHeroForm.approval).trim()
    const trustScore = String(editHeroForm.trustScore).trim()
    const rankingPoints = String(editHeroForm.rankingPoints).trim()
    const parsedApproval = approval === '' ? null : Number(approval)
    const parsedTrustScore = trustScore === '' ? null : Number(trustScore)
    const parsedRankingPoints = rankingPoints === '' ? 0 : Number(rankingPoints)

    if (
      (approval !== '' && Number.isNaN(parsedApproval)) ||
      (trustScore !== '' && Number.isNaN(parsedTrustScore)) ||
      Number.isNaN(parsedRankingPoints)
    ) {
      setEditHeroError('Aprobación ciudadana, trustScore y Puntos HeroIndex deben ser números válidos.')
      setEditHeroSuccess('')
      return
    }

    const publicPowers = parseCommaList(editHeroForm.publicPowers)
    const publicBio = editHeroForm.publicBio.trim()
    const heroPayload = {
      active: editHeroForm.active,
      alias: editHeroForm.alias.trim(),
      avatarUrl: editHeroForm.avatarUrl.trim(),
      bannerUrl: editHeroForm.bannerUrl.trim(),
      codename: editHeroForm.codename.trim(),
      corporationId: editHeroForm.corporationId.trim(),
      description: publicBio,
      heroTitle: editHeroForm.heroTitle.trim(),
      name: editHeroForm.name.trim() || publicIdentity,
      powerClass: editHeroForm.powerClass.trim(),
      publicBio,
      publicName: editHeroForm.publicName.trim(),
      publicPowers,
      rankingPoints: parsedRankingPoints,
      powers: publicPowers,
      visiblePowers: publicPowers,
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
      setEditHeroSuccess('Hero actualizado correctamente.')
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
      setCorporationFormSuccess('Corporation creada correctamente.')
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
      setEditCorporationSuccess('Corporation actualizada correctamente.')
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
    'alias',
    'publicName',
    'codename',
    'heroTitle',
    'corporationId',
    'publicBio',
    'name',
  ])
  const filteredCorporations = filterReviewItems(
    reviewCorporations,
    reviewSearch,
    reviewStatusFilter,
    ['name', 'tagline', 'sector', 'country', 'description'],
  )
  const canUseLatestImage = Boolean(latestUploadedImageUrl)
  const newsActiveCount = countActiveItems(feedNews)
  const newsInactiveCount = countInactiveItems(feedNews)
  const heroesActiveCount = countActiveItems(heroes)
  const heroesInactiveCount = countInactiveItems(heroes)
  const corporationsActiveCount = countActiveItems(corporations)
  const corporationsInactiveCount = countInactiveItems(corporations)
  const handleManagerSectionJump = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const getHeroRelationLabel = (hero) => {
    const publicIdentity = hero.alias || hero.publicName || hero.codename || hero.name
    return hero.heroTitle ? `${publicIdentity} · ${hero.heroTitle}` : publicIdentity
  }
  const getCorporationRelationLabel = (corporation) =>
    corporation.sector ? `${corporation.name} · ${corporation.sector}` : corporation.name

  return (
    <section className="page-card gm-manager-page">
      <div className="gm-manager-hero">
        <div>
          <p className="page-card__kicker">ORÁCULO / Control de contenido</p>
          <h2>GM Manager</h2>
          <p>Interfaz ORÁCULO para gestión de contenido público HeroIndex.</p>
          <p className="gm-manager-hero__note">
            Administra noticias, héroes, corporaciones, vínculos, imágenes y estados de publicación.
          </p>
        </div>
        <div className="gm-manager-hero__actions" aria-label="Accesos rápidos de GM Manager">
          <button className="gm-manager-action" onClick={() => onNavigate?.('oraculo-hub')} type="button">
            Ir a ORÁCULO Hub
          </button>
          <button className="gm-manager-action" onClick={() => onNavigate?.('mission-calculator')} type="button">
            Mission Calculator
          </button>
          <button className="gm-manager-action" onClick={() => onNavigate?.('ranking')} type="button">
            Ranking público
          </button>
        </div>
</div>

      <section className="gm-manager-workspace gm-manager-workspace--overview" id="gm-manager-overview">
        <div className="gm-manager-workspace__top">
          <p className="page-card__kicker">Resumen</p>
          <h3>Vista general</h3>
          <p>Lectura rápida del volumen editorial y estado de publicación de las colecciones principales.</p>
        </div>
        <div className="gm-manager-grid">
          <GMManagerSummary
            activeCount={newsActiveCount}
            count={feedNews.length}
            error={newsError}
            inactiveCount={newsInactiveCount}
            label="Noticias"
            loading={newsLoading}
            updatedAt={getLatestUpdatedAt(feedNews)}
          />
          <GMManagerSummary
            activeCount={heroesActiveCount}
            count={heroes.length}
            error={heroesError}
            inactiveCount={heroesInactiveCount}
            label="Héroes"
            loading={heroesLoading}
            updatedAt={getLatestUpdatedAt(heroes)}
          />
          <GMManagerSummary
            activeCount={corporationsActiveCount}
            count={corporations.length}
            error={corporationsError}
            inactiveCount={corporationsInactiveCount}
            label="Corporaciones"
            loading={corporationsLoading}
            updatedAt={getLatestUpdatedAt(corporations)}
          />
        </div>
      </section>

      <nav className="gm-manager-section-nav" aria-label="Navegación interna de GM Manager">
        <button className="gm-manager-section-nav__item" onClick={() => handleManagerSectionJump('gm-manager-create')} type="button">
          Crear contenido
        </button>
        <button className="gm-manager-section-nav__item" onClick={() => handleManagerSectionJump('gm-manager-review')} type="button">
          Revisar contenido
        </button>
        <button className="gm-manager-section-nav__item" onClick={() => handleManagerSectionJump('gm-manager-upload')} type="button">
          Subir imágenes
        </button>
        <button className="gm-manager-section-nav__item" onClick={() => handleManagerSectionJump('gm-manager-detail')} type="button">
          Detalle / Edición
        </button>
      </nav>

      <section className="gm-manager-workspace" id="gm-manager-create">
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
          <p className="page-card__kicker">Crear</p>
          <h3>Crear News</h3>
        </div>
        <form className="gm-manager-form" onSubmit={handleCreateNews}>
          <label>
            <span>Título *</span>
            <input
              name="title"
              onChange={handleNewsFieldChange}
              type="text"
              value={newsForm.title}
            />
          </label>
          <label>
            <span>Resumen *</span>
            <textarea
              name="summary"
              onChange={handleNewsFieldChange}
              rows="3"
              value={newsForm.summary}
            />
          </label>
          <label>
            <span>Cuerpo</span>
            <textarea
              name="body"
              onChange={handleNewsFieldChange}
              rows="4"
              value={newsForm.body}
            />
          </label>
          <div className="gm-manager-form__grid">
            <label>
              <span>Categoría</span>
              <input
                name="category"
                onChange={handleNewsFieldChange}
                type="text"
                value={newsForm.category}
              />
            </label>
            <label>
              <span>Capa</span>
              <input
                name="layer"
                onChange={handleNewsFieldChange}
                type="text"
                value={newsForm.layer}
              />
            </label>
          </div>
          <label>
            <span>URL de imagen</span>
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
          <GMManagerMediaPreview label="Vista previa de News" url={newsForm.imageUrl} />
          <GMManagerRelationSelector
            getLabel={getHeroRelationLabel}
            items={reviewHeroes}
            onToggle={(id) => handleNewsRelationChange(setNewsForm, 'heroIds', id)}
            selectedIds={newsForm.heroIds}
            title="Heroes vinculados"
          />
          <GMManagerRelationSelector
            getLabel={getCorporationRelationLabel}
            items={reviewCorporations}
            onToggle={(id) =>
              handleNewsRelationChange(setNewsForm, 'corporationIds', id)
            }
            selectedIds={newsForm.corporationIds}
            title="Corporations vinculadas"
          />
          <label className="gm-manager-check">
            <input
              checked={newsForm.active}
              name="active"
              onChange={handleNewsFieldChange}
              type="checkbox"
            />
            <span>Activo</span>
          </label>
          {newsFormError ? <p className="gm-manager-message gm-manager-message--error">{newsFormError}</p> : null}
          {newsFormSuccess ? <p className="gm-manager-message gm-manager-message--success">{newsFormSuccess}</p> : null}
          <button className="gm-manager-action" disabled={isCreatingNews} type="submit">
            {isCreatingNews ? 'Creando…' : 'Crear News'}
          </button>
        </form>
      </section>
        ) : null}
        {activeCreatePanel === 'hero' ? (
      <section className="gm-manager-create">
        <div className="gm-manager-title">
          <p className="page-card__kicker">Crear</p>
          <h3>Crear Hero</h3>
        </div>
        <form className="gm-manager-form" onSubmit={handleCreateHero}>
          <div className="gm-manager-form__grid">
            <label>
              <span>Alias *</span>
              <input
                name="alias"
                onChange={handleHeroFieldChange}
                placeholder="Centinela Prime"
                type="text"
                value={heroForm.alias}
              />
            </label>
            <label>
              <span>Nombre público</span>
              <input
                name="publicName"
                onChange={handleHeroFieldChange}
                type="text"
                value={heroForm.publicName}
              />
            </label>
            <label>
              <span>Código / nombre clave</span>
              <input
                name="codename"
                onChange={handleHeroFieldChange}
                type="text"
                value={heroForm.codename}
              />
            </label>
          </div>
          <div className="gm-manager-form__grid">
            <label>
                   <span>Título heroico</span>
              <input
                name="heroTitle"
                onChange={handleHeroFieldChange}
                placeholder="Centinela Dorado"
                type="text"
                value={heroForm.heroTitle}
              />
            </label>
            <label>
              <span>Corporación</span>
              <input
                name="corporationId"
                onChange={handleHeroFieldChange}
                type="text"
                value={heroForm.corporationId}
              />
            </label>
            <label>
              <span>Nombre interno / legacy</span>
              <input
                name="name"
                onChange={handleHeroFieldChange}
                type="text"
                value={heroForm.name}
              />
            </label>
          </div>
          <div className="gm-manager-form__grid">
            <label>
              <span>Aprobación ciudadana</span>
              <input
                name="approval"
                onChange={handleHeroFieldChange}
                type="number"
                value={heroForm.approval}
              />
            </label>
            <label>
              <span>Índice de confianza interno</span>
              <input
                name="trustScore"
                onChange={handleHeroFieldChange}
                type="number"
                value={heroForm.trustScore}
              />
            </label>
             <label>
              <span>Puntos HeroIndex</span>
              <input
                name="rankingPoints"
                onChange={handleHeroFieldChange}
                type="number"
                value={heroForm.rankingPoints}
              />
            </label>
          </div>
          <label>
            <span>Biografía pública</span>
            <textarea
              name="publicBio"
              onChange={handleHeroFieldChange}
              rows="4"
              value={heroForm.publicBio}
            />
          </label>
          <label>
            <span>Poderes visibles</span>
            <input
              name="publicPowers"
              onChange={handleHeroFieldChange}
              placeholder="Vuelo, barrera de luz, rescate aéreo"
              type="text"
              value={heroForm.publicPowers}
            />
          </label>
          <details className="gm-manager-legacy-fields">
            <summary>Campos legacy internos</summary>
            <label>
              <span>Power Class</span>
              <input
                name="powerClass"
                onChange={handleHeroFieldChange}
                type="text"
                value={heroForm.powerClass}
              />
            </label>
          </details>
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
              <span>Portada URL</span>
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
            <GMManagerMediaPreview label="Vista previa de avatar" url={heroForm.avatarUrl} />
            <GMManagerMediaPreview label="Vista previa de portada" url={heroForm.bannerUrl} />
          </div>
          <label className="gm-manager-check">
            <input
              checked={heroForm.active}
              name="active"
              onChange={handleHeroFieldChange}
              type="checkbox"
            />
            <span>Activo</span>
          </label>
          {heroFormError ? <p className="gm-manager-message gm-manager-message--error">{heroFormError}</p> : null}
          {heroFormSuccess ? <p className="gm-manager-message gm-manager-message--success">{heroFormSuccess}</p> : null}
          <button className="gm-manager-action" disabled={isCreatingHero} type="submit">
             {isCreatingHero ? 'Creando…' : 'Crear Hero'}
          </button>
        </form>
      </section>
 ) : null}
        {activeCreatePanel === 'corporation' ? (
 <section className="gm-manager-create">
        <div className="gm-manager-title">
           <p className="page-card__kicker">Crear</p>
          <h3>Crear Corporation</h3>
        </div>
        <form className="gm-manager-form" onSubmit={handleCreateCorporation}>
          <div className="gm-manager-form__grid">
            <label>
               <span>Nombre *</span>
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
               <span>País</span>
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
              <span>Portada URL</span>
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
              <GMManagerMediaPreview label="Vista previa de logo" url={corporationForm.logoUrl} />
            <GMManagerMediaPreview label="Vista previa de portada" url={corporationForm.bannerUrl} />
          </div>
          <div className="gm-manager-form__grid">
            <label>
              <span>Aprobación</span>
              <input
                name="approval"
                onChange={handleCorporationFieldChange}
                type="number"
                value={corporationForm.approval}
              />
            </label>
            <label>
              <span>Índice de confianza</span>
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
            <span>Activo</span>
          </label>
          {corporationFormError ? <p className="gm-manager-message gm-manager-message--error">{corporationFormError}</p> : null}
          {corporationFormSuccess ? <p className="gm-manager-message gm-manager-message--success">{corporationFormSuccess}</p> : null}
          <button className="gm-manager-action" disabled={isCreatingCorporation} type="submit">
            {isCreatingCorporation ? 'Creando…' : 'Crear Corporation'}
          </button>
        </form>
      </section>
   ) : null}
      </section>

      <section className="gm-manager-workspace" id="gm-manager-review">
        <div className="gm-manager-workspace__top">
          <p className="page-card__kicker">Revisar contenido</p>
          <h3>Revisar contenido</h3>
          <p>Consulta registros, abre el detalle y activa o desactiva contenido.</p>
        </div>
 {toggleErrorMessage ? <p className="gm-manager-message gm-manager-message--error">{toggleErrorMessage}</p> : null}
      <div className="gm-manager-tools">
         {deleteErrorMessage ? <p className="gm-manager-message gm-manager-message--error">{deleteErrorMessage}</p> : null}
      {deleteStatusMessage ? <p className="gm-manager-message gm-manager-message--success">{deleteStatusMessage}</p> : null}
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
            Corporaciones
          </GMManagerTab>
        </div>
          {editNewsSuccess ? <p className="gm-manager-message gm-manager-message--success">{editNewsSuccess}</p> : null}
        {editingNewsId ? (
          <section className="gm-manager-create">
            <div className="gm-manager-title">
              <p className="page-card__kicker">Edición</p>
              <h3>Editar News</h3>
            </div>
            <form className="gm-manager-form" onSubmit={handleUpdateNews}>
              <label>
                <span>Título *</span>
                <input
                  name="title"
                  onChange={handleEditNewsFieldChange}
                  type="text"
                  value={editNewsForm.title}
                />
              </label>
              <label>
                <span>Resumen *</span>
                <textarea
                  name="summary"
                  onChange={handleEditNewsFieldChange}
                  rows="3"
                  value={editNewsForm.summary}
                />
              </label>
              <label>
                <span>Cuerpo</span>
                <textarea
                  name="body"
                  onChange={handleEditNewsFieldChange}
                  rows="4"
                  value={editNewsForm.body}
                />
              </label>
              <div className="gm-manager-form__grid">
                <label>
                  <span>Categoría</span>
                  <input
                    name="category"
                    onChange={handleEditNewsFieldChange}
                    type="text"
                    value={editNewsForm.category}
                  />
                </label>
                <label>
                  <span>Capa</span>
                  <input
                    name="layer"
                    onChange={handleEditNewsFieldChange}
                    type="text"
                    value={editNewsForm.layer}
                  />
                </label>
              </div>
              <label>
                <span>URL de imagen</span>
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
              <GMManagerMediaPreview label="Vista previa de News" url={editNewsForm.imageUrl} />
              <GMManagerRelationSelector
                getLabel={getHeroRelationLabel}
                items={reviewHeroes}
                onToggle={(id) => handleNewsRelationChange(setEditNewsForm, 'heroIds', id)}
                selectedIds={editNewsForm.heroIds}
                title="Heroes vinculados"
              />
              <GMManagerRelationSelector
                getLabel={getCorporationRelationLabel}
                items={reviewCorporations}
                onToggle={(id) =>
                  handleNewsRelationChange(setEditNewsForm, 'corporationIds', id)
                }
                selectedIds={editNewsForm.corporationIds}
                title="Corporations vinculadas"
              />
              <label className="gm-manager-check">
                <input
                  checked={editNewsForm.active}
                  name="active"
                  onChange={handleEditNewsFieldChange}
                  type="checkbox"
                />
                <span>Activo</span>
              </label>
              {editNewsError ? <p className="gm-manager-message gm-manager-message--error">{editNewsError}</p> : null}
              <div className="gm-manager-actions">
                <button className="gm-manager-action" disabled={isUpdatingNews} type="submit">
                  {isUpdatingNews ? 'Guardando…' : 'Guardar News'}
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
         <p className="gm-manager-count">Activos: {newsActiveCount} · Inactivos: {newsInactiveCount} · Total: {feedNews.length} · Mostrando {filteredNews.length}</p>
        <div className="gm-manager-bulk-actions">
          <button className="gm-manager-action" disabled={filteredNews.length === 0} onClick={() => selectVisibleItems('news', filteredNews)} type="button">Seleccionar visibles</button>
          <button className="gm-manager-action" disabled={(selectedReviewIds.news ?? []).length === 0} onClick={() => clearSelection('news')} type="button">Limpiar selección</button>
          <button className="gm-manager-action gm-manager-action--danger" disabled={(selectedReviewIds.news ?? []).length === 0 || deletingItemKey === 'news-bulk'} onClick={() => handleDeleteSelected('news')} type="button">Eliminar seleccionados ({(selectedReviewIds.news ?? []).length})</button>
        </div>
        {filteredNews.length > 0 ? (
        <table className="gm-manager-table">
          <thead>
            <tr>
              <th>Seleccionar</th>
             <th>Título</th>
              <th>Categoría / Tipo</th>
              <th>Héroes</th>
              <th>Corporaciones</th>
              <th>Activo</th>
              <th>Creado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredNews.map((newsItem) => (
              <tr key={newsItem.id}>
                <td><input checked={(selectedReviewIds.news ?? []).includes(newsItem.id)} onChange={() => toggleSelection('news', newsItem.id)} type="checkbox" /></td>
                <td>{getValue(newsItem.title)}</td>
                <td>{getValue(newsItem.category ?? newsItem.type)}</td>
                <td>{normalizeRelationIds(newsItem.heroIds).length}</td>
                <td>{normalizeRelationIds(newsItem.corporationIds).length}</td>
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
                  <button
                    className="gm-manager-action gm-manager-action--danger"
                    disabled={deletingItemKey === `news-${newsItem.id}`}
                    onClick={() => handleDeleteItem('news', newsItem)}
                    type="button"
                  >
                    {deletingItemKey === `news-${newsItem.id}` ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
         ) : (
                    <p className="gm-manager-empty">{getReviewEmptyMessage(reviewStatusFilter)}</p>
        )}
      </GMManagerSection>
      ) : null}
         {editHeroSuccess ? <p className="gm-manager-message gm-manager-message--success">{editHeroSuccess}</p> : null}
        {editingHeroId ? (
          <section className="gm-manager-create">
            <div className="gm-manager-title">
              <p className="page-card__kicker">Edición</p>
              <h3>Editar Hero</h3>
            </div>
            <form className="gm-manager-form" onSubmit={handleUpdateHero}>
              <div className="gm-manager-form__grid">
                <label>
                  <span>Alias *</span>
                  <input
                    name="alias"
                    onChange={handleEditHeroFieldChange}
                    type="text"
                    value={editHeroForm.alias}
                  />
                </label>
                <label>
                  <span>Nombre público</span>
                  <input
                    name="publicName"
                    onChange={handleEditHeroFieldChange}
                    type="text"
                     value={editHeroForm.publicName}
                  />
                </label>
                <label>
                  <span>Código / nombre clave</span>
                  <input
                    name="codename"
                    onChange={handleEditHeroFieldChange}
                    type="text"
                    value={editHeroForm.codename}
                  />
                </label>
              </div>
              <div className="gm-manager-form__grid">
                <label>
                  <span>Título heroico</span>
                  <input
                    name="heroTitle"
                    onChange={handleEditHeroFieldChange}
                    type="text"
                    value={editHeroForm.heroTitle}
                  />
                </label>
                <label>
                  <span>Corporación</span>
                  <input
                    name="corporationId"
                    onChange={handleEditHeroFieldChange}
                    type="text"
                    value={editHeroForm.corporationId}
                  />
                </label>
                <label>
                   <span>Nombre interno / legacy</span>
                  <input
                     name="name"
                    onChange={handleEditHeroFieldChange}
                    type="text"
                    value={editHeroForm.name}
                  />
                </label>
              </div>
              <div className="gm-manager-form__grid">
                <label>
                  <span>Aprobación ciudadana</span>
                  <input
                    name="approval"
                    onChange={handleEditHeroFieldChange}
                    type="number"
                    value={editHeroForm.approval}
                  />
                </label>
                <label>
                  <span>Índice de confianza interno</span>
                  <input
                    name="trustScore"
                    onChange={handleEditHeroFieldChange}
                    type="number"
                    value={editHeroForm.trustScore}
                  />
                </label>
                 <label>
                  <span>Puntos HeroIndex</span>
                  <input
                    name="rankingPoints"
                    onChange={handleEditHeroFieldChange}
                    type="number"
                    value={editHeroForm.rankingPoints}
                  />
                </label>
              </div>
              <label>
                <span>Biografía pública</span>
                <textarea
                  name="publicBio"
                  onChange={handleEditHeroFieldChange}
                  rows="4"
                  value={editHeroForm.publicBio}
                />
              </label>
              <label>
                <span>Poderes visibles</span>
                <input
                  name="publicPowers"
                  onChange={handleEditHeroFieldChange}
                  placeholder="Vuelo, barrera de luz, rescate aéreo"
                  type="text"
                  value={editHeroForm.publicPowers}
                />
              </label>
              <details className="gm-manager-legacy-fields">
                <summary>Campos legacy internos</summary>
                <label>
                  <span>Power Class</span>
                  <input
                    name="powerClass"
                    onChange={handleEditHeroFieldChange}
                    type="text"
                    value={editHeroForm.powerClass}
                  />
                </label>
              </details>
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
                  <span>Portada URL</span>
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
                <GMManagerMediaPreview label="Vista previa de avatar" url={editHeroForm.avatarUrl} />
                <GMManagerMediaPreview label="Vista previa de portada" url={editHeroForm.bannerUrl} />
              </div>
              <label className="gm-manager-check">
                <input
                  checked={editHeroForm.active}
                  name="active"
                  onChange={handleEditHeroFieldChange}
                  type="checkbox"
                />
                <span>Activo</span>
              </label>
              {editHeroError ? <p className="gm-manager-message gm-manager-message--error">{editHeroError}</p> : null}
              <div className="gm-manager-actions">
                <button className="gm-manager-action" disabled={isUpdatingHero} type="submit">
                  {isUpdatingHero ? 'Guardando…' : 'Guardar Hero'}
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
      <GMManagerSection title="Héroes">
            <p className="gm-manager-count">Activos: {heroesActiveCount} · Inactivos: {heroesInactiveCount} · Total: {reviewHeroes.length} · Mostrando {filteredHeroes.length}</p>
        <div className="gm-manager-bulk-actions">
          <button className="gm-manager-action" disabled={filteredHeroes.length === 0} onClick={() => selectVisibleItems('hero', filteredHeroes)} type="button">Seleccionar visibles</button>
          <button className="gm-manager-action" disabled={(selectedReviewIds.hero ?? []).length === 0} onClick={() => clearSelection('hero')} type="button">Limpiar selección</button>
          <button className="gm-manager-action gm-manager-action--danger" disabled={(selectedReviewIds.hero ?? []).length === 0 || deletingItemKey === 'hero-bulk'} onClick={() => handleDeleteSelected('hero')} type="button">Eliminar seleccionados ({(selectedReviewIds.hero ?? []).length})</button>
        </div>
        {filteredHeroes.length > 0 ? (
        <table className="gm-manager-table">
          <thead>
            <tr>
              <th>Seleccionar</th>
              <th>Alias</th>
              <th>Nombre público</th>
              <th>Título heroico</th>
              <th>Corporación</th>
              <th>Aprobación</th>
              <th>Puntos HeroIndex</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
             {filteredHeroes.map((hero) => (
              <tr key={hero.id}>
                <td><input checked={(selectedReviewIds.hero ?? []).includes(hero.id)} onChange={() => toggleSelection('hero', hero.id)} type="checkbox" /></td>
                <td>{getValue(hero.alias ?? hero.name)}</td>
                <td>{getValue(hero.publicName)}</td>
                <td>{getValue(hero.heroTitle ?? 'Figura HeroIndex')}</td>
                <td>{getValue(hero.corporationId)}</td>
                <td>{getValue(hero.approval)}</td>
                <td>{getValue(hero.rankingPoints)}</td>
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
                   <button
                    className="gm-manager-action gm-manager-action--danger"
                    disabled={deletingItemKey === `hero-${hero.id}`}
                    onClick={() => handleDeleteItem('hero', hero)}
                    type="button"
                  >
                    {deletingItemKey === `hero-${hero.id}` ? 'Eliminando...' : 'Eliminar'}
                  </button>
                   <button
                    className="gm-manager-action"
                    onClick={() => onNavigate?.('oraculo-hero-dossier', { heroId: hero.id })}
                    type="button"
                  >
                    Ver dossier ORÁCULO
                  </button>
                  <button
                    className="gm-manager-action"
                    onClick={() => onNavigate?.('hero-profile', { heroId: hero.id })}
                    type="button"
                  >
                    Ver perfil público
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
         ) : (
           <p className="gm-manager-empty">{getReviewEmptyMessage(reviewStatusFilter)}</p>
        )}
      </GMManagerSection>
 ) : null}
    {editCorporationSuccess ? <p className="gm-manager-message gm-manager-message--success">{editCorporationSuccess}</p> : null}
        {editingCorporationId ? (
          <section className="gm-manager-create">
            <div className="gm-manager-title">
              <p className="page-card__kicker">Edición</p>
              <h3>Editar Corporation</h3>
            </div>
            <form className="gm-manager-form" onSubmit={handleUpdateCorporation}>
              <div className="gm-manager-form__grid">
                <label>
                   <span>Nombre *</span>
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
                  <span>País</span>
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
                  <span>Portada URL</span>
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
                <GMManagerMediaPreview label="Vista previa de logo" url={editCorporationForm.logoUrl} />
                <GMManagerMediaPreview label="Vista previa de portada" url={editCorporationForm.bannerUrl} />
              </div>
              <div className="gm-manager-form__grid">
                <label>
                  <span>Aprobación</span>
                  <input
                    name="approval"
                    onChange={handleEditCorporationFieldChange}
                    type="number"
                    value={editCorporationForm.approval}
                  />
                </label>
                <label>
                  <span>Índice de confianza</span>
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
                <span>Activo</span>
              </label>
              {editCorporationError ? <p className="gm-manager-message gm-manager-message--error">{editCorporationError}</p> : null}
              <div className="gm-manager-actions">
                <button className="gm-manager-action" disabled={isUpdatingCorporation} type="submit">
                  {isUpdatingCorporation ? 'Guardando…' : 'Guardar Corporation'}
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
      <GMManagerSection title="Corporaciones">
           <p className="gm-manager-count">Activos: {corporationsActiveCount} · Inactivos: {corporationsInactiveCount} · Total: {reviewCorporations.length} · Mostrando {filteredCorporations.length}</p>
        <div className="gm-manager-bulk-actions">
          <button className="gm-manager-action" disabled={filteredCorporations.length === 0} onClick={() => selectVisibleItems('corporation', filteredCorporations)} type="button">Seleccionar visibles</button>
          <button className="gm-manager-action" disabled={(selectedReviewIds.corporation ?? []).length === 0} onClick={() => clearSelection('corporation')} type="button">Limpiar selección</button>
          <button className="gm-manager-action gm-manager-action--danger" disabled={(selectedReviewIds.corporation ?? []).length === 0 || deletingItemKey === 'corporation-bulk'} onClick={() => handleDeleteSelected('corporation')} type="button">Eliminar seleccionados ({(selectedReviewIds.corporation ?? []).length})</button>
        </div>
        {filteredCorporations.length > 0 ? (
        <table className="gm-manager-table">
          <thead>
            <tr>
              <th>Seleccionar</th>
              <th>Nombre</th>
              <th>Sector</th>
              <th>País</th>
              <th>Aprobación</th>
              <th>Confianza</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCorporations.map((corporation) => (
              <tr key={corporation.id}>
                <td><input checked={(selectedReviewIds.corporation ?? []).includes(corporation.id)} onChange={() => toggleSelection('corporation', corporation.id)} type="checkbox" /></td>
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
                    <button
                    className="gm-manager-action gm-manager-action--danger"
                    disabled={deletingItemKey === `corporation-${corporation.id}`}
                    onClick={() => handleDeleteItem('corporation', corporation)}
                    type="button"
                  >
                    {deletingItemKey === `corporation-${corporation.id}` ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        ) : (
          <p className="gm-manager-empty">{getReviewEmptyMessage(reviewStatusFilter)}</p>
        )}
      </GMManagerSection>
      ) : null}
      </section>

       <section className="gm-manager-workspace" id="gm-manager-upload">
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
              <span>URL descargable</span>
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
            <img
              alt="Vista previa de imagen subida"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.hidden = true
              }}
              src={latestUploadedImageUrl}
            />
          </div>
        ) : null}
      </section>

      <section className="gm-manager-workspace gm-manager-workspace--detail" id="gm-manager-detail">
        <div className="gm-manager-workspace__top">
          <p className="page-card__kicker">Detalle / Edición</p>
          <h3>Detalle / Edición</h3>
          <p>Abre un registro desde Revisar contenido para inspeccionar todos sus campos o continúa con el formulario de edición activo.</p>
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