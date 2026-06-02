import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  saveVisualSlot,
  subscribeToVisualSlot,
  uploadVisualSlotImage,
} from '../../services/visualSlotsService.js'

const isOraculoMode = import.meta.env.VITE_ORACULO_MODE === 'true'

const fitOptions = [
  { value: 'cover', label: 'Cubrir' },
  { value: 'contain', label: 'Contener' },
]

const positionOptions = [
  { value: 'center', label: 'Centro', cssValue: 'center center' },
  { value: 'top', label: 'Arriba', cssValue: 'center top' },
  { value: 'bottom', label: 'Abajo', cssValue: 'center bottom' },
  { value: 'left', label: 'Izquierda', cssValue: 'left center' },
  { value: 'right', label: 'Derecha', cssValue: 'right center' },
]

function getPositionCss(position) {
  return positionOptions.find((option) => option.value === position)?.cssValue ?? 'center center'
}

function InlineVisualSlot({
  activeVisualSlotId = null,
  children,
  className = '',
  isVisualEditorOpen = false,
  onVisualEditorClose,
  onVisualEditorOpen,
  page,
  section,
  slotId,
}) {
  const [slotConfig, setSlotConfig] = useState(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fitMode, setFitMode] = useState('cover')
  const [position, setPosition] = useState('center')
  const [altText, setAltText] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => subscribeToVisualSlot(slotId, setSlotConfig), [slotId])

  const closeEditor = useCallback(() => {
    setIsEditorOpen(false)
    onVisualEditorClose?.(slotId)
  }, [onVisualEditorClose, slotId])

  useEffect(() => {
    if (!isEditorOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
         closeEditor()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeEditor, isEditorOpen])

   useEffect(() => {
    if (!isEditorOpen) return undefined

    document.body.classList.add('visual-editor-open')

    return () => {
      document.body.classList.remove('visual-editor-open')
    }
  }, [isEditorOpen])

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

  const openEditor = () => {
    setFitMode(slotConfig?.fitMode ?? 'cover')
    setPosition(slotConfig?.position ?? 'center')
    setAltText(slotConfig?.altText ?? '')
    setSelectedFile(null)
    setStatusMessage('')
    setErrorMessage('')
    setIsEditorOpen(true)
    onVisualEditorOpen?.(slotId)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setErrorMessage('')

    try {
      let nextImageUrl = slotConfig?.imageUrl ?? ''
      let nextStoragePath = slotConfig?.storagePath ?? ''

      if (selectedFile) {
        setStatusMessage('Subiendo imagen...')
        const uploadedImage = await uploadVisualSlotImage(slotId, selectedFile)
        nextImageUrl = uploadedImage.imageUrl
        nextStoragePath = uploadedImage.storagePath
      }

      setStatusMessage('Guardando configuración...')
      const savedSlot = await saveVisualSlot(slotId, {
        page,
        section,
        imageUrl: nextImageUrl,
        storagePath: nextStoragePath,
        fitMode,
        position,
        altText,
      })

      setSlotConfig(savedSlot)
      setStatusMessage('Imagen actualizada correctamente.')
      setSelectedFile(null)
      setTimeout(closeEditor, 650)
    } catch {
      setErrorMessage('No fue posible actualizar la imagen.')
      setStatusMessage('')
    } finally {
      setIsSaving(false)
    }
  }

  const imageUrl = slotConfig?.imageUrl
  const resolvedFitMode = slotConfig?.fitMode ?? 'cover'
  const resolvedPosition = slotConfig?.position ?? 'center'
  const slotStyle = imageUrl
    ? {
        backgroundImage: `url(${imageUrl})`,
        backgroundPosition: getPositionCss(resolvedPosition),
        backgroundRepeat: 'no-repeat',
        backgroundSize: resolvedFitMode,
      }
    : undefined

  const modalPreviewUrl = previewUrl || slotConfig?.imageUrl || ''
  const shouldShowControl = isOraculoMode && !isEditorOpen && !isVisualEditorOpen
  const editorPortalTarget = typeof document === 'undefined' ? null : document.body
  const editorMarkup = isEditorOpen ? (
    <div className="visual-editor-root visual-slot-modal" role="dialog" aria-modal="true" aria-labelledby={`visual-slot-title-${slotId}`}>
      <button
        aria-label="Cerrar editor visual"
        className="visual-editor-backdrop visual-slot-modal__scrim"
        onClick={closeEditor}
        type="button"
      />
      <div className="visual-editor-panel visual-slot-modal__panel">
        <header>
          <p className="page-card__kicker">ORÁCULO visual</p>
          <h2 id={`visual-slot-title-${slotId}`}>Editar imagen</h2>
          <p>Actualiza el espacio visual sin salir de la página pública.</p>
        </header>

        <div className="visual-slot-modal__preview">
          {modalPreviewUrl ? (
            <img alt={altText || section || 'Vista previa visual'} src={modalPreviewUrl} />
          ) : (
            <span>Vista previa pendiente</span>
          )}
        </div>

        <div className="visual-slot-modal__form">
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
            <span className="hi-label">Modo de imagen</span>
            <select className="hi-select" disabled={isSaving} onChange={(event) => setFitMode(event.target.value)} value={fitMode}>
              {fitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="hi-field">
            <span className="hi-label">Posición</span>
            <select className="hi-select" disabled={isSaving} onChange={(event) => setPosition(event.target.value)} value={position}>
              {positionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="hi-field">
            <span className="hi-label">Texto alternativo / etiqueta interna</span>
            <input
              className="hi-input"
              disabled={isSaving}
              onChange={(event) => setAltText(event.target.value)}
              placeholder="Describe el visual para ORÁCULO"
              type="text"
              value={altText}
            />
          </label>
        </div>

        {statusMessage ? <p className="visual-slot-modal__status">{statusMessage}</p> : null}
        {errorMessage ? <p className="visual-slot-modal__error">{errorMessage}</p> : null}

        <footer className="visual-editor-footer visual-slot-modal__actions">
          <button className="hi-button hi-button-secondary" disabled={isSaving} onClick={closeEditor} type="button">
            Cerrar
          </button>
          <button className="hi-button hi-button-primary" disabled={isSaving} onClick={handleSave} type="button">
            Guardar visual
          </button>
        </footer>
      </div>
    </div>
  ) : null

  return (
    <section
      aria-label={slotConfig?.altText || section}
      className={`inline-visual-slot ${imageUrl ? 'inline-visual-slot--with-image' : ''} ${className}`.trim()}
      style={slotStyle}
    >
      <div className="inline-visual-slot__veil" aria-hidden="true" />
      <div className="inline-visual-slot__content">{children}</div>
       {shouldShowControl ? (
        <button className="inline-visual-slot__control" disabled={isVisualEditorOpen && activeVisualSlotId !== slotId} onClick={openEditor} type="button">
          {imageUrl ? 'Cambiar visual' : 'Editar imagen'}
        </button>
      ) : null}
      {editorPortalTarget && editorMarkup ? createPortal(editorMarkup, editorPortalTarget) : null}
    </section>
  )
}

export default InlineVisualSlot