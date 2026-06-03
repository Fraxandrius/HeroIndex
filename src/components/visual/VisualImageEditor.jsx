import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { normalizeVisualData } from '../../utils/visualModel.js'
import { getVisualSlotDefinition } from '../../utils/visualSlotsRegistry.js'

const ASPECT_RATIO_WARNING_THRESHOLD = 0.14

function getDefinitionRatio(slotDefinition) {
  const width = Number(slotDefinition.recommendedWidth ?? 0)
  const height = Number(slotDefinition.recommendedHeight ?? 0)

  return width > 0 && height > 0 ? width / height : 2
}

function VisualImageEditor({
  onClose,
  onSave,
  showOverlayControl = true,
  slotDefinition: providedSlotDefinition,
  slotId,
  title = 'Editar visual',
  visual,
}) {
  const slotDefinition = useMemo(
    () => providedSlotDefinition ?? getVisualSlotDefinition(slotId),
    [providedSlotDefinition, slotId],
  )
  const allowOverlayText = slotDefinition.allowOverlayText === true
  const initialVisual = useMemo(() => normalizeVisualData(visual), [visual])
  const [draftVisual, setDraftVisual] = useState(initialVisual)
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedImageSize, setSelectedImageSize] = useState(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    document.body.classList.add('visual-editor-open')

    return () => {
      document.body.classList.remove('visual-editor-open')
    }
  }, [])

  const closeEditor = useCallback(() => {
    if (!isSaving) onClose?.()
  }, [isSaving, onClose])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeEditor()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeEditor])

  const previewUrl = useMemo(() => {
    if (!selectedFile) return ''

    return URL.createObjectURL(selectedFile)
  }, [selectedFile])

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    },
    [previewUrl],
  )

  useEffect(() => {
    if (!previewUrl) return undefined

    const previewImage = new Image()
    previewImage.onload = () => {
      setSelectedImageSize({
        height: previewImage.naturalHeight,
        width: previewImage.naturalWidth,
      })
    }
    previewImage.src = previewUrl

    return () => {
      previewImage.onload = null
    }
  }, [previewUrl])

  const handleFileChange = (event) => {
    setSelectedImageSize(null)
    setSelectedFile(event.target.files?.[0] ?? null)
  }

  const updateDraft = (field, value) => {
    setDraftVisual((currentVisual) => ({
      ...currentVisual,
      [field]: value,
    }))
  }

  const centerVisual = () => {
    setDraftVisual((currentVisual) => ({
      ...currentVisual,
      imagePositionX: 50,
      imagePositionY: 50,
    }))
  }

  const resetVisual = () => {
    setDraftVisual(normalizeVisualData({ imageUrl: draftVisual.imageUrl }))
    setSelectedFile(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setErrorMessage('')
    setStatusMessage(selectedFile ? 'Subiendo imagen...' : 'Guardando visual...')

    try {
      await onSave?.({
        file: selectedFile,
        visual: normalizeVisualData(draftVisual),
      })
      setStatusMessage('Visual guardado correctamente.')
      setSelectedFile(null)
      setTimeout(closeEditor, 550)
    } catch {
      setErrorMessage('No fue posible guardar el visual.')
      setStatusMessage('')
    } finally {
      setIsSaving(false)
    }
  }

  const visiblePreviewUrl = previewUrl || draftVisual.imageUrl
  const slotRatio = getDefinitionRatio(slotDefinition)
  const selectedRatio = selectedImageSize ? selectedImageSize.width / selectedImageSize.height : null
  const hasRatioWarning = selectedRatio
    ? Math.abs(selectedRatio - slotRatio) / slotRatio > ASPECT_RATIO_WARNING_THRESHOLD
    : false
  const portalTarget = typeof document === 'undefined' ? null : document.body
  const editorMarkup = (
    <div className="visual-editor-root visual-image-editor" role="dialog" aria-modal="true" aria-labelledby="visual-image-editor-title">
      <button
        aria-label="Cerrar editor visual"
        className="visual-editor-backdrop visual-image-editor__scrim"
        disabled={isSaving}
        onClick={closeEditor}
        type="button"
      />
      <section className="visual-editor-panel visual-image-editor__panel">
        <header className="visual-image-editor__header">
          <p className="page-card__kicker">ORÁCULO visual</p>
          <h2 id="visual-image-editor-title">{title}</h2>
          <p>Sube una imagen, ajusta su encuadre y guarda este espacio visual independiente.</p>
        </header>

        <section className="visual-editor__meta visual-image-editor__meta" aria-label="Guía del slot visual">
          <div>
            <span>Slot</span>
            <strong>{slotDefinition.label}</strong>
          </div>
          <div>
            <span>Ubicación</span>
            <strong>{slotDefinition.placementLabel}</strong>
          </div>
          <div>
            <span>Resolución recomendada</span>
            <strong>{slotDefinition.recommendedWidth} × {slotDefinition.recommendedHeight} px</strong>
          </div>
          <div>
            <span>Proporción</span>
            <strong>{slotDefinition.aspectRatioLabel}</strong>
          </div>
          <p>{slotDefinition.helperText}</p>
          <p>Las imágenes usan encuadre de cobertura para llenar el espacio. Si se recortan, usa posición y zoom para ajustar el encuadre.</p>
          {selectedImageSize ? (
            <p>Imagen seleccionada: {selectedImageSize.width} × {selectedImageSize.height} px.</p>
          ) : null}
          {hasRatioWarning ? (
            <p className="visual-editor__warning visual-image-editor__warning">Esta imagen puede recortarse en este espacio.</p>
          ) : null}
        </section>

        <div className="visual-image-editor__layout">
          <div className="visual-image-editor__preview" aria-label="Vista previa del visual" style={{ aspectRatio: slotDefinition.aspectRatio }}>
            {visiblePreviewUrl ? (
              <>
                <img
                  alt={draftVisual.altText || 'Vista previa visual'}
                  src={visiblePreviewUrl}
                  style={{
                    objectPosition: `${draftVisual.imagePositionX}% ${draftVisual.imagePositionY}%`,
                    transform: `scale(${draftVisual.imageScale})`,
                  }}
                />
                {showOverlayControl ? (
                  <span
                    aria-hidden="true"
                    className="visual-image-editor__overlay"
                    style={{ opacity: draftVisual.imageOverlayStrength }}
                  />
                ) : null}
              </>
            ) : (
              <div className="visual-image-editor__empty">
                <strong>Agregar visual</strong>
                <span>Sube una imagen para este espacio.</span>
              </div>
            )}
          </div>

          <div className="visual-image-editor__fields">
            <label className="hi-field">
              <span className="hi-label">Imagen</span>
              <input
                accept="image/*"
                className="hi-input"
                disabled={isSaving}
                onChange={handleFileChange}
                type="file"
              />
            </label>

            <label className="hi-field">
              <span className="hi-label">Posición X</span>
              <input
                disabled={isSaving}
                max="100"
                min="0"
                onChange={(event) => updateDraft('imagePositionX', Number(event.target.value))}
                type="range"
                value={draftVisual.imagePositionX}
              />
            </label>

            <label className="hi-field">
              <span className="hi-label">Posición Y</span>
              <input
                disabled={isSaving}
                max="100"
                min="0"
                onChange={(event) => updateDraft('imagePositionY', Number(event.target.value))}
                type="range"
                value={draftVisual.imagePositionY}
              />
            </label>

            <label className="hi-field">
              <span className="hi-label">Zoom</span>
              <input
                disabled={isSaving}
                max="1.8"
                min="1"
                onChange={(event) => updateDraft('imageScale', Number(event.target.value))}
                step="0.05"
                type="range"
                value={draftVisual.imageScale}
              />
            </label>

{showOverlayControl ? (
              <label className="hi-field">
                <span className="hi-label">Overlay oscuro</span>
                <input
                  disabled={isSaving}
                  max="0.85"
                  min="0"
                  onChange={(event) => updateDraft('imageOverlayStrength', Number(event.target.value))}
                  step="0.05"
                  type="range"
                  value={draftVisual.imageOverlayStrength}
                />
              </label>
            ) : null}

{allowOverlayText ? (
              <>
                <label className="hi-field">
                  <span className="hi-label">Etiqueta superior</span>
                  <input className="hi-input" disabled={isSaving} onChange={(event) => updateDraft('eyebrow', event.target.value)} type="text" value={draftVisual.eyebrow} />
                </label>
                <label className="hi-field">
                  <span className="hi-label">Título visible</span>
                  <input className="hi-input" disabled={isSaving} onChange={(event) => updateDraft('title', event.target.value)} type="text" value={draftVisual.title} />
                </label>
                <label className="hi-field visual-image-editor__wide-field">
                  <span className="hi-label">Subtítulo visible</span>
                  <input className="hi-input" disabled={isSaving} onChange={(event) => updateDraft('subtitle', event.target.value)} type="text" value={draftVisual.subtitle} />
                </label>
                <label className="hi-field visual-image-editor__wide-field">
                  <span className="hi-label">Cuerpo visible</span>
                  <textarea className="hi-textarea" disabled={isSaving} onChange={(event) => updateDraft('body', event.target.value)} rows="3" value={draftVisual.body} />
                </label>
                <label className="hi-field">
                  <span className="hi-label">Texto del botón</span>
                  <input className="hi-input" disabled={isSaving} onChange={(event) => updateDraft('ctaLabel', event.target.value)} type="text" value={draftVisual.ctaLabel} />
                </label>
                <label className="hi-field">
                  <span className="hi-label">Ruta del botón</span>
                  <input className="hi-input" disabled={isSaving} onChange={(event) => updateDraft('ctaRoute', event.target.value)} placeholder="/registro" type="text" value={draftVisual.ctaRoute} />
                </label>
              </>
            ) : null}

            <label className="hi-field visual-image-editor__wide-field">
              <span className="hi-label">Texto alternativo interno</span>
              <input
                className="hi-input"
                disabled={isSaving}
                onChange={(event) => updateDraft('altText', event.target.value)}
                placeholder="Visual institucional HeroIndex"
                type="text"
                value={draftVisual.altText}
              />
            </label>

            <label className="visual-image-editor__toggle">
              <input
                checked={draftVisual.active !== false}
                disabled={isSaving}
                onChange={(event) => updateDraft('active', event.target.checked)}
                type="checkbox"
              />
              <span>Visual activo</span>
            </label>
          </div>
        </div>

         <p className="visual-image-editor__note">v1 usa sliders; arrastre, rueda y modo de imagen completa pueden agregarse después sin cambiar el modelo.</p>
        {statusMessage ? <p className="visual-image-editor__status">{statusMessage}</p> : null}
        {errorMessage ? <p className="visual-image-editor__error">{errorMessage}</p> : null}

        <footer className="visual-editor-footer visual-image-editor__actions">
          <button className="hi-button hi-button-secondary" disabled={isSaving} onClick={centerVisual} type="button">
            Centrar
          </button>
          <button className="hi-button hi-button-secondary" disabled={isSaving} onClick={resetVisual} type="button">
            Restablecer
          </button>
          <button className="hi-button hi-button-secondary" disabled={isSaving} onClick={closeEditor} type="button">
            Cerrar
          </button>
          <button className="hi-button hi-button-primary" disabled={isSaving} onClick={handleSave} type="button">
            Guardar visual
          </button>
        </footer>
      </section>
    </div>
  )

  return portalTarget ? createPortal(editorMarkup, portalTarget) : editorMarkup
}

export default VisualImageEditor