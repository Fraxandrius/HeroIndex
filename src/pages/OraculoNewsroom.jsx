import { useEffect, useMemo, useState } from 'react'
import {
  createNewsItem,
  subscribeToNews,
  updateNewsItem,
  uploadNewsImage,
} from '../services/newsService.js'

const defaultFormState = {
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
  return {
    ...defaultFormState,
    ...newsItem,
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
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }))
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
    if (!formState.title.trim() || !formState.summary.trim()) {
      setErrorMessage('Titular y bajada son obligatorios.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    setStatusMessage('Guardando cobertura editorial...')

    try {
      let nextImageUrl = formState.imageUrl

      if (selectedFile) {
        setStatusMessage('Subiendo imagen editorial...')
        nextImageUrl = await uploadNewsImage(selectedFile)
      }

      const payload = {
        ...formState,
        ...overrides,
        imageUrl: nextImageUrl,
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
        setStatusMessage('Noticia actualizada correctamente.')
      } else {
        const createdItem = await createNewsItem(payload)
        setEditingId(createdItem.id)
        setStatusMessage('Noticia creada correctamente.')
      }

      setSelectedFile(null)
      setFormState((currentState) => ({ ...currentState, ...overrides, imageUrl: nextImageUrl }))
    } catch {
      setErrorMessage('No fue posible guardar la noticia.')
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
      setStatusMessage('Noticia desactivada correctamente.')
      if (editingId === newsItem.id) resetForm()
    } catch {
      setErrorMessage('No fue posible desactivar la noticia.')
    } finally {
      setIsSaving(false)
    }
  }

  const previewState = { ...formState, imageUrl: selectedPreviewUrl || formState.imageUrl }
  const previewStyle = getPreviewStyle(previewState)
  const hasPreviewImage = Boolean(previewState.imageUrl)
  const isHiddenDraft = formState.active === false || formState.homePlacement === 'hidden'

  return (
    <section className="newsroom-page">
      <header className="newsroom-hero hi-card hi-card-public">
        <p className="page-card__kicker">ORÁCULO · Mesa Editorial</p>
        <h2>Mesa Editorial HeroIndex</h2>
        <p>Construye titulares, ajusta imágenes y publica cobertura directamente en HeroIndex.</p>
      </header>

      <div className="newsroom-layout">
        <form className="newsroom-form hi-card" onSubmit={(event) => event.preventDefault()}>
          <section className="newsroom-form-block">
            <p className="page-card__kicker">Identidad editorial</p>
            <p>El titular vende el momento. La bajada convierte el espectáculo en confianza pública.</p>
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

          <section className="newsroom-form-block newsroom-form-grid">
            <label className="hi-field">
              <span className="hi-label">Tipo editorial</span>
              <select className="hi-select" onChange={(event) => updateField('editorialTone', event.target.value)} value={formState.editorialTone}>
                {toneOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="hi-field">
              <span className="hi-label">Destino editorial</span>
              <select className="hi-select" onChange={(event) => updateField('homePlacement', event.target.value)} value={formState.homePlacement}>
                {placementOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <small>Define dónde aparecerá esta noticia. La portada principal muestra solo una noticia activa: la de mayor prioridad.</small>
            </label>
            <label className="hi-field">
              <span className="hi-label">Prioridad editorial</span>
              <input className="hi-input" min="0" onChange={(event) => updateField('priority', event.target.value)} type="number" value={formState.priority} />
            <small>La prioridad ordena noticias dentro del mismo destino. Un número mayor aparece antes.</small>
            </label>
            <label className="newsroom-check">
              <input checked={formState.active} onChange={(event) => updateField('active', event.target.checked)} type="checkbox" />
              <span>Activa públicamente</span>
            </label>
          </section>

          <section className="newsroom-form-block">
            <p className="page-card__kicker">Imagen</p>
            <label className="hi-field">
              <span className="hi-label">Subir imagen</span>
              <input accept="image/*" className="hi-input" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} type="file" />
            </label>
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
            <button className="hi-button hi-button-primary" disabled={isSaving} onClick={() => saveNews()} type="button">{isHiddenDraft ? 'Guardar borrador' : 'Guardar noticia'}</button>
            <button className="hi-button hi-button-primary" disabled={isSaving} onClick={() => saveNews({ active: true })} type="button">Publicar noticia</button>
            <button className="hi-button hi-button-secondary" disabled={isSaving} onClick={() => saveNews({ active: false })} type="button">Guardar borrador</button>
            <button className="hi-button hi-button-secondary" disabled={isSaving} onClick={resetForm} type="button">Limpiar formulario</button>
          </footer>
        </form>

        <aside className="newsroom-preview" aria-label="Vista previa editorial">
        {formState.homePlacement === 'hero' ? (
            <div className={`newsroom-preview-card newsroom-preview-card--hero newsroom-tone-${formState.editorialTone} newsroom-copy-${formState.headlinePlacement}`} style={previewStyle}>
              <span>Vista portada principal</span>
              <h3>{formState.title || 'Titular HeroIndex listo para publicar'}</h3>
              <p>{formState.summary || 'La bajada aparecerá aquí para revisar contraste, ritmo y lectura editorial.'}</p>
              <small>{formState.sourceLabel}</small>
            </div>
          ) : null}
          {formState.homePlacement === 'feed' ? (
            <div className={`newsroom-preview-card newsroom-preview-card--feed newsroom-tone-${formState.editorialTone}`} style={previewStyle}>
              <span>Vista feed</span>
              <h3>{formState.title || 'Vista Feed'}</h3>
              <p>{formState.summary || 'Resumen compacto para cobertura reciente.'}</p>
              <small>{formState.sourceLabel} · {toneOptions.find((option) => option.value === formState.editorialTone)?.label}</small>
            </div>
          ) : null}
          {formState.homePlacement === 'hidden' ? (
            <div className="newsroom-preview-card newsroom-preview-card--feed newsroom-tone-verified">
              <span>Oculta / borrador</span>
              <h3>{formState.title || 'Noticia sin publicar'}</h3>
              <p>No aparecerá públicamente mientras esté oculta.</p>
            </div>
          ) : null}
          <p className="newsroom-preview-note">Los espacios visuales laterales se gestionan fuera de Mesa Editorial.</p>
        </aside>
      </div>

      <section className="newsroom-list hi-card">
        <div className="section-heading">
          <p className="page-card__kicker">Cobertura existente</p>
          <h2>Noticias en la mesa</h2>
        </div>
        <div className="newsroom-list-items">
          {sortedNewsItems.map((newsItem) => (
            <article className="newsroom-list-item" key={newsItem.id}>
              <div>
                <strong>{newsItem.title ?? 'Noticia sin titular'}</strong>
                <small>{newsItem.homePlacement ?? 'feed'} · {newsItem.editorialTone ?? 'verified'} · {newsItem.active === false ? 'Borrador' : 'Activa'} · {getDateLabel(newsItem.updatedAt ?? newsItem.createdAt)}</small>
              </div>
              <div className="newsroom-actions">
                <button className="hi-button hi-button-secondary" onClick={() => handleEdit(newsItem)} type="button">Editar</button>
                <button className="hi-button hi-button-secondary" disabled={isSaving || newsItem.active === false} onClick={() => deactivateNews(newsItem)} type="button">Desactivar</button>
              </div>
            </article>
          ))}
          {sortedNewsItems.length === 0 ? <p>No hay noticias editoriales cargadas todavía.</p> : null}
        </div>
      </section>
    </section>
  )
}

export default OraculoNewsroom
