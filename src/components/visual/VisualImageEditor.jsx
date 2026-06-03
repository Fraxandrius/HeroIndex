import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { normalizeVisualData } from '../../utils/visualModel.js'

function VisualImageEditor({ onClose, onSave, showOverlayControl = true, title = 'Editar visual', visual }) {
  const initialVisual = useMemo(() => normalizeVisualData(visual), [visual])
  const [draftVisual, setDraftVisual] = useState(initialVisual)
  const [selectedFile, setSelectedFile] = useState(null)
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

        <div className="visual-image-editor__layout">
          <div className="visual-image-editor__preview" aria-label="Vista previa del visual">
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
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
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

        <p className="visual-image-editor__note">v1 usa sliders; arrastre y rueda pueden agregarse después sin cambiar el modelo.</p>
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