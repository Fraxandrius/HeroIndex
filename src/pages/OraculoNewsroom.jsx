import { useEffect, useMemo, useState } from 'react'
import {
  DISPLAY_MODE_LABELS,
  STORY_MODE_LABELS,
  createNewsItem,
  hasEditorialText,
  normalizeDisplayMode,
  normalizeStoryMode,
  subscribeToNews,
  updateNewsItem,
  uploadNewsImage,
} from '../services/newsService.js'

const defaultFormState = {
  storyMode: 'standard',
  displayMode: 'editorial-card',
  kicker: 'Canal verificado',
  title: '',
  summary: '',
  body: '',
  editorialTone: 'verified',
  homePlacement: 'feed',
  priority: 0,
  sourceLabel: 'Mesa Editorial HeroIndex',
  imageUrl: '',
  imageFit: 'cover',
  imagePositionX: 50,
  imagePositionY: 50,
  imageScale: 1,
  imageOverlayStrength: 0.55,
  headlinePlacement: 'bottom-left',
  active: true,
}

const toneOptions = [
  { value: 'live', label: 'En vivo' },
  { value: 'priority', label: 'Prioridad' },
  { value: 'streak', label: 'Racha' },
  { value: 'trend', label: 'Tendencia' },
  { value: 'civic', label: 'Cívico' },
  { value: 'corporate', label: 'Corporativo' },
  { value: 'alert', label: 'Alerta' },
  { value: 'verified', label: 'Verificado' },
]

const placementOptions = [
  { value: 'hero', label: 'Portada principal' },
  { value: 'feed', label: 'Feed' },
  { value: 'hidden', label: 'Oculta / borrador' },
]

const storyModeOptions = [
  { value: 'standard', label: STORY_MODE_LABELS.standard },
  { value: 'visual', label: STORY_MODE_LABELS.visual },
  { value: 'signal', label: STORY_MODE_LABELS.signal },
]

const displayModeOptions = [
  { value: 'editorial-card', label: DISPLAY_MODE_LABELS['editorial-card'] },
  { value: 'image-first', label: DISPLAY_MODE_LABELS['image-first'] },
  { value: 'compact-feed', label: DISPLAY_MODE_LABELS['compact-feed'] },
  { value: 'signal-card', label: DISPLAY_MODE_LABELS['signal-card'] },
]

const titlePositionOptions = [
  { value: 'bottom-left', label: 'Abajo izquierda' },
  { value: 'top-left', label: 'Arriba izquierda' },
  { value: 'center-left', label: 'Centro izquierda' },
]

function getDateLabel(value) {
  if (!value) return 'Sin fecha'

  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function normalizePlacement(value) {
  if (value === 'hero' || value === 'feed' || value === 'hidden') return value

  return 'feed'
}

function normalizePriority(value) {
  const priority = Number(value ?? 0)

  return Number.isNaN(priority) ? 0 : priority
}

function getEditorialTitle(newsItem = {}) {
  if (newsItem.title) return newsItem.title
  if (newsItem.storyMode === 'visual') return 'Pieza visual HeroIndex'
  if (newsItem.storyMode === 'signal') return 'Señal editorial HeroIndex'

  return 'Noticia sin titular'
}

function getPlacementLabel(value) {
  if (value === 'hero') return 'Portada principal'
  if (value === 'hidden') return 'Oculta / borrador'

  return 'Feed público'
}

function getPublicationState(newsItem = {}) {
  if (newsItem.active === false || newsItem.homePlacement === 'hidden') return 'Borrador interno'

  return 'Activa'
}

function sortByEditorialPriority(firstItem, secondItem) {
  const priorityDifference = normalizePriority(secondItem.priority) - normalizePriority(firstItem.priority)
  if (priorityDifference !== 0) return priorityDifference

  return (secondItem.updatedAt ?? secondItem.createdAt ?? 0) - (firstItem.updatedAt ?? firstItem.createdAt ?? 0)
}

function getImagePreviewStyle(formState) {
  if (!formState.imageUrl) return undefined

  const imageScale = Number(formState.imageScale ?? 1)

  return {
    backgroundImage: `url(${formState.imageUrl})`,
    backgroundPosition: `${formState.imagePositionX}% ${formState.imagePositionY}%`,
    backgroundSize: `${Math.round((Number.isNaN(imageScale) ? 1 : imageScale) * 100)}%`,
  }
}

function getPreviewStyle(formState) {
  if (!formState.imageUrl) return undefined

  const imageScale = Number(formState.imageScale ?? 1)
  const overlayStrength = Number(formState.imageOverlayStrength ?? 0.55)

  return {
    backgroundImage: `linear-gradient(rgba(3, 7, 18, ${Number.isNaN(overlayStrength) ? 0.55 : overlayStrength}), rgba(3, 7, 18, ${Number.isNaN(overlayStrength) ? 0.55 : overlayStrength})), url(${formState.imageUrl})`,
    backgroundPosition: `${formState.imagePositionX}% ${formState.imagePositionY}%`,
    backgroundSize: `${Math.round((Number.isNaN(imageScale) ? 1 : imageScale) * 100)}%`
  }
}

function normalizeFormValue(newsItem) {
  const storyMode = normalizeStoryMode(newsItem.storyMode)

  return {
    ...defaultFormState,
    ...newsItem,
    storyMode,
    displayMode: normalizeDisplayMode({ ...newsItem, storyMode }),
    homePlacement: normalizePlacement(newsItem.homePlacement),
    priority: normalizePriority(newsItem.priority),
    imagePositionX: Number(newsItem.imagePositionX ?? 50),
    imagePositionY: Number(newsItem.imagePositionY ?? 50),
    imageScale: Number(newsItem.imageScale ?? 1),
    imageOverlayStrength: Number(newsItem.imageOverlayStrength ?? 0.55),
    active: newsItem.active !== false,
  }
}

function OraculoNewsroom() {
  const [formState, setFormState] = useState(defaultFormState)
  const [newsItems, setNewsItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isImageDropActive, setIsImageDropActive] = useState(false)

  useEffect(
    () => subscribeToNews({
      onData: setNewsItems,
      onError: () => setErrorMessage('No fue posible cargar la mesa editorial.'),
    }),
    [],
  )

  const selectedPreviewUrl = useMemo(() => {
    if (!selectedFile) return ''

    return URL.createObjectURL(selectedFile)
  }, [selectedFile])

  useEffect(
    () => () => {
      if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl)
    },
    [selectedPreviewUrl],
  )

  const sortedNewsItems = useMemo(
    () => [...newsItems].sort((firstItem, secondItem) => (secondItem.updatedAt ?? 0) - (firstItem.updatedAt ?? 0)),
    [newsItems],
  )

  const updateField = (field, value) => {
   setFormState((currentState) => {
      const nextState = {
        ...currentState,
        [field]: value,
      }

      if (field === 'storyMode') {
        const storyMode = normalizeStoryMode(value)

        return {
          ...nextState,
          storyMode,
          displayMode: normalizeDisplayMode({ storyMode }),
        }
      }

      return nextState
    })
  }

  const selectEditorialFile = (file) => {
    setErrorMessage('')
    if (!file) { setSelectedFile(null); return }
    if (!file.type?.startsWith('image/')) { setSelectedFile(null); setErrorMessage('El archivo debe ser una imagen válida.'); return }
    if (file.size > 5 * 1024 * 1024) { setSelectedFile(null); setErrorMessage('La imagen supera el tamaño permitido de 5 MB.'); return }
    setSelectedFile(file)
  }

  const resetVisual = () => {
    setFormState((currentState) => ({
      ...currentState,
      imageFit: 'cover',
      imagePositionX: 50,
      imagePositionY: 50,
      imageScale: 1,
      imageOverlayStrength: 0.55,
      headlinePlacement: 'bottom-left',
    }))
  }

  const centerVisual = () => {
    setFormState((currentState) => ({
      ...currentState,
      imagePositionX: 50,
      imagePositionY: 50,
    }))
  }

  const resetForm = () => {
    setEditingId(null)
    setSelectedFile(null)
    setStatusMessage('')
    setErrorMessage('')
    setFormState(defaultFormState)
  }

  const handleEdit = (newsItem) => {
    setEditingId(newsItem.id)
    setSelectedFile(null)
    setStatusMessage('Editando cobertura existente.')
    setErrorMessage('')
    setFormState(normalizeFormValue(newsItem))
  }

  const saveNews = async (overrides = {}) => {
    const nextImageUrl = selectedPreviewUrl || formState.imageUrl
    const storyMode = normalizeStoryMode(formState.storyMode)
    const hasText = hasEditorialText(formState)
    const hasSignalText = Boolean(formState.kicker.trim() || formState.title.trim() || formState.summary.trim() || formState.body.trim())

    if (storyMode === 'visual' && !nextImageUrl) {
      setErrorMessage('La pieza visual necesita una imagen.')
      return
    }

   if (storyMode === 'standard' && !hasText) {
      setErrorMessage('Las noticias tradicionales requieren texto editorial.')
      return
    }

    if (storyMode === 'signal' && !hasSignalText) {
      setErrorMessage('Las señales editoriales necesitan una actualización breve.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    setStatusMessage('Guardando cobertura editorial...')

    try {
      let nextSavedImageUrl = formState.imageUrl

      if (selectedFile) {
        setStatusMessage('Subiendo imagen editorial...')
        nextSavedImageUrl = await uploadNewsImage(selectedFile)
      }

      const payload = {
        ...formState,
        ...overrides,
        storyMode,
        displayMode: normalizeDisplayMode({ ...formState, ...overrides, storyMode }),
        imageUrl: nextSavedImageUrl,
        homePlacement: normalizePlacement(overrides.homePlacement ?? formState.homePlacement),
        priority: normalizePriority(overrides.priority ?? formState.priority),
        imagePositionX: Number(formState.imagePositionX ?? 50),
        imagePositionY: Number(formState.imagePositionY ?? 50),
        imageScale: Number(formState.imageScale ?? 1),
        imageOverlayStrength: Number(formState.imageOverlayStrength ?? 0.55),
        source: formState.sourceLabel || defaultFormState.sourceLabel,
        sourceLabel: formState.sourceLabel || defaultFormState.sourceLabel,
      }

      if (editingId) {
        await updateNewsItem(editingId, payload)
        setStatusMessage('Cobertura actualizada correctamente.')
      } else {
        const createdItem = await createNewsItem(payload)
        setEditingId(createdItem.id)
        setStatusMessage('Cobertura creada correctamente.')
      }

      setSelectedFile(null)
      setFormState((currentState) => ({ ...currentState, ...overrides, imageUrl: nextSavedImageUrl }))
    } catch {
      setErrorMessage('No fue posible guardar la cobertura.')
      setStatusMessage('')
    } finally {
      setIsSaving(false)
    }
  }

  const deactivateNews = async (newsItem) => {
    setIsSaving(true)
    setErrorMessage('')

    try {
      await updateNewsItem(newsItem.id, { active: false })
      setStatusMessage('Cobertura desactivada correctamente.')
      if (editingId === newsItem.id) resetForm()
    } catch {
      setErrorMessage('No fue posible desactivar la cobertura.')
    } finally {
      setIsSaving(false)
    }
  }

  const activeFrontpage = useMemo(
    () => [...newsItems]
      .filter((newsItem) => newsItem.active !== false && normalizePlacement(newsItem.homePlacement) === 'hero')
      .sort(sortByEditorialPriority)[0],
    [newsItems],
  )

  const newsroomStats = useMemo(() => {
    const activeItems = newsItems.filter((newsItem) => newsItem.active !== false && normalizePlacement(newsItem.homePlacement) !== 'hidden')

    return [
      {
        kicker: 'PORTADA ACTIVA',
        value: activeFrontpage ? 'Sincronizada' : 'En espera',
        detail: activeFrontpage ? getEditorialTitle(activeFrontpage) : 'La portada se define por destino principal y mayor prioridad.',
        hot: Boolean(activeFrontpage),
      },
      {
        kicker: 'COBERTURAS ACTIVAS',
        value: String(activeItems.length),
        detail: activeItems.length === 1 ? 'cobertura en ciclo público' : 'coberturas en ciclo público',
      },
      {
        kicker: 'PIEZAS VISUALES',
        value: String(newsItems.filter((newsItem) => normalizeStoryMode(newsItem.storyMode) === 'visual').length),
        detail: 'imagen protagonista con texto opcional',
      },
      {
        kicker: 'BORRADORES / OCULTAS',
        value: String(newsItems.filter((newsItem) => newsItem.active === false || normalizePlacement(newsItem.homePlacement) === 'hidden').length),
        detail: 'coberturas fuera del canal público',
      },
    ]
  }, [activeFrontpage, newsItems])

  const librarySections = useMemo(() => {
    const isDraft = (newsItem) => newsItem.active === false || normalizePlacement(newsItem.homePlacement) === 'hidden'

    return [
      {
        id: 'frontpage',
        kicker: 'PORTADA PRINCIPAL',
        title: 'Control de Home',
        description: 'Si existen varias, la de mayor prioridad queda como portada pública.',
        items: sortedNewsItems.filter((newsItem) => !isDraft(newsItem) && normalizePlacement(newsItem.homePlacement) === 'hero'),
      },
      {
        id: 'visuals',
        kicker: 'PIEZAS VISUALES',
        title: 'Imagen protagonista',
        description: 'Coberturas visuales activas con texto opcional.',
        items: sortedNewsItems.filter((newsItem) => !isDraft(newsItem) && normalizeStoryMode(newsItem.storyMode) === 'visual'),
      },
      {
        id: 'feed',
        kicker: 'FEED PÚBLICO',
        title: 'Coberturas del canal HeroIndex',
        description: 'Noticias y señales que alimentan la página pública.',
        items: sortedNewsItems.filter((newsItem) => !isDraft(newsItem) && normalizePlacement(newsItem.homePlacement) === 'feed' && normalizeStoryMode(newsItem.storyMode) !== 'visual'),
      },
      {
        id: 'drafts',
        kicker: 'BORRADORES / OCULTAS',
        title: 'Capa interna de preparación',
        description: 'Coberturas fuera del ciclo público.',
        items: sortedNewsItems.filter(isDraft),
      },
    ]
  }, [sortedNewsItems])

  const previewState = { ...formState, imageUrl: selectedPreviewUrl || formState.imageUrl }
  const previewStyle = getPreviewStyle(previewState)
  const visualPreviewStyle = getImagePreviewStyle(previewState)
  const hasPreviewImage = Boolean(previewState.imageUrl)
  const isHiddenDraft = formState.active === false || formState.homePlacement === 'hidden'
  const isVisualStory = normalizeStoryMode(formState.storyMode) === 'visual'
  const previewTitle = formState.title || (isVisualStory ? '' : 'Titular editorial pendiente')
  const previewSummary = formState.summary || (isVisualStory ? '' : 'La bajada editorial aparecerá aquí cuando se defina la cobertura.')
  const selectedToneLabel = toneOptions.find((option) => option.value === formState.editorialTone)?.label ?? 'Verificado'

  return (
    <section className="newsroom-page newsroom-studio">
      <header className="newsroom-studio__header hi-card hi-card-public">
        <div>
          <p className="page-card__kicker">ORÁCULO · ESTUDIO EDITORIAL</p>
          <h2>Mesa Editorial HeroIndex</h2>
          <p>Controla portada, coberturas, piezas visuales y señales públicas del ecosistema HeroIndex.</p>
        </div>
        <div className="newsroom-studio__chips" aria-label="Capas editoriales">
          <span>PORTADA</span>
          <span>FEED</span>
          <span>PIEZAS VISUALES</span>
          <span>BORRADORES</span>
        </div>
      </header>

      <section className="newsroom-status-grid" aria-label="Estado editorial">
        {newsroomStats.map((item) => (
          <article className={`newsroom-status-card ${item.hot ? 'newsroom-status-card--hot' : ''}`.trim()} key={item.kicker}>
            <p>{item.kicker}</p>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </article>
        ))}
      </section>

      <section className="newsroom-active-frontpage hi-card" aria-label="Portada activa">
        <div>
          <p className="page-card__kicker">PORTADA PÚBLICA</p>
          <h3>{activeFrontpage ? getEditorialTitle(activeFrontpage) : 'Portada en espera editorial'}</h3>
          <p>
            {activeFrontpage
              ? `Sincronizado con Home · prioridad ${normalizePriority(activeFrontpage.priority)} · ${getDateLabel(activeFrontpage.updatedAt ?? activeFrontpage.createdAt)}`
              : 'Selecciona destino Portada principal y publica la cobertura con mayor prioridad para controlar Home.'}
          </p>
        </div>
        {activeFrontpage ? (
          <button className="hi-button hi-button-secondary" onClick={() => handleEdit(activeFrontpage)} type="button">
            Editar portada
          </button>
        ) : null}
      </section>

      <div className="newsroom-editor-layout">
        <form className="newsroom-form newsroom-editor-panel hi-card" onSubmit={(event) => event.preventDefault()}>
          <section className="newsroom-form-block">
            <div className="newsroom-block-heading">
              <p className="page-card__kicker">TIPO Y DESTINO</p>
              <h3>Jerarquía editorial</h3>
              <span>Define dónde vive esta cobertura dentro del ciclo público.</span>
            </div>
            <div className="newsroom-form-grid">
              <label className="hi-field">
                <span className="hi-label">Tipo de cobertura</span>
                <select className="hi-select" onChange={(event) => updateField('storyMode', event.target.value)} value={formState.storyMode}>
                  {storyModeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <small>
                  {formState.storyMode === 'visual'
                    ? 'Las piezas visuales pueden publicarse solo con imagen.'
                    : formState.storyMode === 'signal'
                      ? 'Las señales editoriales funcionan como actualizaciones breves.'
                      : 'Las noticias tradicionales requieren texto editorial.'}
                </small>
              </label>
              <label className="hi-field">
                <span className="hi-label">Destino editorial</span>
                <select className="hi-select" onChange={(event) => updateField('homePlacement', event.target.value)} value={formState.homePlacement}>
                  {placementOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <small>La portada principal muestra la cobertura activa de mayor prioridad.</small>
              </label>
              <label className="hi-field">
                <span className="hi-label">Modo de presentación</span>
                <select className="hi-select" onChange={(event) => updateField('displayMode', event.target.value)} value={formState.displayMode}>
                  {displayModeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <small>Define si se verá como card, imagen protagonista, feed compacto o señal breve.</small>
              </label>
              <label className="hi-field">
                <span className="hi-label">Prioridad editorial</span>
                <input className="hi-input" min="0" onChange={(event) => updateField('priority', event.target.value)} type="number" value={formState.priority} />
                <small>Un número mayor domina dentro del mismo destino.</small>
              </label>
              <label className="hi-field">
                <span className="hi-label">Tipo editorial</span>
                <select className="hi-select" onChange={(event) => updateField('editorialTone', event.target.value)} value={formState.editorialTone}>
                  {toneOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="newsroom-check">
                <input checked={formState.active} onChange={(event) => updateField('active', event.target.checked)} type="checkbox" />
                <span>Activa públicamente</span>
              </label>
            </div>
          </section>

<section className="newsroom-form-block">
            <div className="newsroom-block-heading">
              <p className="page-card__kicker">CONTENIDO EDITORIAL</p>
              <h3>Texto de cobertura</h3>
              <span>{isVisualStory ? 'Opcional para piezas visuales.' : 'Requerido para noticias tradicionales.'}</span>
            </div>
            <label className="hi-field">
              <span className="hi-label">Kicker / etiqueta superior</span>
              <input className="hi-input" onChange={(event) => updateField('kicker', event.target.value)} value={formState.kicker} />
            </label>
            <label className="hi-field">
              <span className="hi-label">Titular</span>
              <input className="hi-input" onChange={(event) => updateField('title', event.target.value)} value={formState.title} />
            </label>
            <label className="hi-field">
              <span className="hi-label">Bajada</span>
              <textarea className="hi-textarea" onChange={(event) => updateField('summary', event.target.value)} rows="3" value={formState.summary} />
            </label>
            <label className="hi-field">
              <span className="hi-label">Cuerpo</span>
              <textarea className="hi-textarea" onChange={(event) => updateField('body', event.target.value)} rows="5" value={formState.body} />
            </label>
          </section>

          <section className="newsroom-form-block">
            <div className="newsroom-block-heading">
              <p className="page-card__kicker">IMAGEN / PIEZA VISUAL</p>
              <h3>Material visual</h3>
              <span>La imagen puede funcionar como cobertura completa en modo pieza visual.</span>
            </div>
            <label className={`newsroom-image-dropzone${isImageDropActive ? ' newsroom-image-dropzone--active' : ''}`} onDragEnter={(event) => { event.preventDefault(); setIsImageDropActive(true) }} onDragLeave={() => setIsImageDropActive(false)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setIsImageDropActive(false); selectEditorialFile(event.dataTransfer.files?.[0]) }}>
              <span>Arrastra una imagen o haz clic para subir</span>
              <small>JPG, PNG o WEBP. Las piezas visuales pueden publicarse sin titular.</small>
              <input accept="image/*" onChange={(event) => selectEditorialFile(event.target.files?.[0])} type="file" />
            </label>
            {selectedFile ? <button className="hi-button hi-button-secondary" onClick={() => setSelectedFile(null)} type="button">Quitar imagen seleccionada</button> : null}
            <label className="hi-field">
              <span className="hi-label">URL manual opcional</span>
              <input className="hi-input" onChange={(event) => updateField('imageUrl', event.target.value)} value={formState.imageUrl} />
            </label>
            {hasPreviewImage ? (
            <div className="newsroom-form-grid">
                <label className="hi-field">
                  <span className="hi-label">Posición X</span>
                  <input max="100" min="0" onChange={(event) => updateField('imagePositionX', event.target.value)} type="range" value={formState.imagePositionX} />
                </label>
                <label className="hi-field">
                  <span className="hi-label">Posición Y</span>
                  <input max="100" min="0" onChange={(event) => updateField('imagePositionY', event.target.value)} type="range" value={formState.imagePositionY} />
                </label>
                <label className="hi-field">
                  <span className="hi-label">Zoom</span>
                  <input max="1.8" min="1" onChange={(event) => updateField('imageScale', event.target.value)} step="0.05" type="range" value={formState.imageScale} />
                </label>
                <label className="hi-field">
                  <span className="hi-label">Overlay oscuro</span>
                  <input max="0.85" min="0.25" onChange={(event) => updateField('imageOverlayStrength', event.target.value)} step="0.05" type="range" value={formState.imageOverlayStrength} />
                </label>
                <label className="hi-field">
                  <span className="hi-label">Posición del titular</span>
                  <select className="hi-select" onChange={(event) => updateField('headlinePlacement', event.target.value)} value={formState.headlinePlacement}>
                    {titlePositionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </div>
            ) : <p>Agrega una imagen para activar los controles de encuadre.</p>}
            {hasPreviewImage ? (
              <div className="newsroom-actions">
                <button className="hi-button hi-button-secondary" onClick={centerVisual} type="button">Centrar</button>
                <button className="hi-button hi-button-secondary" onClick={resetVisual} type="button">Restablecer</button>
              </div>
            ) : null}
          </section>

          {statusMessage ? <p className="newsroom-status">{statusMessage}</p> : null}
          {errorMessage ? <p className="newsroom-error">{errorMessage}</p> : null}

          <footer className="newsroom-actions newsroom-actions--main">
             <button className="hi-button hi-button-primary" disabled={isSaving} onClick={() => saveNews()} type="button">{isHiddenDraft ? 'Guardar borrador' : 'Guardar cobertura'}</button>
            <button className="hi-button hi-button-primary" disabled={isSaving} onClick={() => saveNews({ active: true })} type="button">Publicar cobertura</button>
            <button className="hi-button hi-button-secondary" disabled={isSaving} onClick={() => saveNews({ active: false, homePlacement: 'hidden' })} type="button">Guardar borrador</button>
            <button className="hi-button hi-button-secondary" disabled={isSaving} onClick={resetForm} type="button">Limpiar formulario</button>
          </footer>
        </form>

        <aside className="newsroom-preview newsroom-preview-panel hi-card" aria-label="Vista previa editorial">
          <div className="newsroom-block-heading">
            <p className="page-card__kicker">PREVIEW EDITORIAL</p>
            <h3>{isVisualStory ? 'Vista pieza visual' : formState.homePlacement === 'hero' ? 'Vista portada principal' : formState.homePlacement === 'hidden' ? 'Vista borrador interno' : 'Vista feed público'}</h3>
            <span>{getPlacementLabel(formState.homePlacement)} · {selectedToneLabel}</span>
          </div>

          {isVisualStory ? (
            <div className={`newsroom-preview-card newsroom-visual-preview newsroom-tone-${formState.editorialTone}`} style={visualPreviewStyle}>
              {!hasPreviewImage ? <strong>Pieza visual sin imagen</strong> : null}
              {formState.title || formState.summary ? (
                <div className="newsroom-visual-preview__copy">
                  <span>{formState.homePlacement === 'hidden' ? 'Oculta / borrador' : 'Pieza visual'}</span>
                  {formState.title ? <h3>{formState.title}</h3> : null}
                  {formState.summary ? <p>{formState.summary}</p> : null}
                </div>
              ) : hasPreviewImage ? <span>Pieza visual HeroIndex</span> : null}
            </div>
           ) : (
            <div className={`newsroom-preview-card newsroom-standard-preview newsroom-preview-card--${formState.homePlacement === 'hero' ? 'hero' : 'feed'} newsroom-tone-${formState.editorialTone} newsroom-copy-${formState.headlinePlacement}`} style={formState.homePlacement === 'hidden' ? undefined : previewStyle}>
              <span>{formState.homePlacement === 'hero' ? 'Vista portada principal' : formState.homePlacement === 'hidden' ? 'Oculta / borrador' : 'Vista feed público'}</span>
              <h3>{formState.homePlacement === 'hidden' ? formState.title || 'Cobertura sin publicar' : previewTitle}</h3>
              {previewSummary ? <p>{previewSummary}</p> : null}
              <small>{formState.homePlacement === 'hidden' ? 'Esta cobertura no está publicada.' : `${formState.sourceLabel} · ${selectedToneLabel}`}</small>
            </div>
           )}

          <div className="newsroom-preview-meta">
            <span>Destino: {getPlacementLabel(formState.homePlacement)}</span>
            <span>Prioridad: {normalizePriority(formState.priority)}</span>
            <span>Estado: {isHiddenDraft ? 'Borrador interno' : 'Ciclo público'}</span>
          </div>
        </aside>
      </div>

        <section className="newsroom-library hi-card" aria-label="Biblioteca editorial">
        <div className="section-heading">
          <p className="page-card__kicker">BIBLIOTECA EDITORIAL</p>
          <h2>Coberturas en la mesa</h2>
          <p>Portada, feed, piezas visuales y borradores separados para control de jerarquía pública.</p>
        </div>

        <div className="newsroom-library__sections">
          {librarySections.map((section) => (
            <section className="newsroom-library__section" key={section.id}>
              <div className="newsroom-library__heading">
                <div>
                  <p>{section.kicker}</p>
                  <h3>{section.title}</h3>
                </div>
                <span>{section.description}</span>
              </div>
              <div className="newsroom-list-items">
                {section.items.map((newsItem) => (
                  <article className={`newsroom-library-item newsroom-library-item--${normalizePlacement(newsItem.homePlacement)}`} key={`${section.id}-${newsItem.id}`}>
                    <div>
                      <strong>{getEditorialTitle(newsItem)}</strong>
                      <small>
                        {STORY_MODE_LABELS[normalizeStoryMode(newsItem.storyMode)] ?? 'Noticia'} · {DISPLAY_MODE_LABELS[normalizeDisplayMode(newsItem)] ?? 'Card editorial'} · {getPlacementLabel(newsItem.homePlacement)} · {getPublicationState(newsItem)} · Prioridad {normalizePriority(newsItem.priority)} · {getDateLabel(newsItem.updatedAt ?? newsItem.createdAt)}
                      </small>
                    </div>
                    <div className="newsroom-actions">
                      <button className="hi-button hi-button-secondary" onClick={() => handleEdit(newsItem)} type="button">Editar</button>
                      <button className="hi-button hi-button-secondary" disabled={isSaving || newsItem.active === false} onClick={() => deactivateNews(newsItem)} type="button">Desactivar</button>
                    </div>
                  </article>
                ))}
                {section.items.length === 0 ? <p className="newsroom-empty-state">Sin coberturas en esta capa editorial.</p> : null}
              </div>
            </section>
          ))}
        </div>
      </section>
    </section>
  )
}

export default OraculoNewsroom