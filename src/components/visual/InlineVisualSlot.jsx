import { useEffect, useMemo, useState } from 'react'
import VisualImageEditor from './VisualImageEditor.jsx'
import {
  subscribeToVisualSlot,
  updateVisualSlot,
  uploadVisualSlotImage,
} from '../../services/visualSlotsService.js'
import { getVisualImageStyle, getVisualOverlayStyle, normalizeVisualData } from '../../utils/visualModel.js'
import { getVisualSlotDefinition, hasVisualSlotDefinition } from '../../utils/visualSlotsRegistry.js'

const isOraculoMode = import.meta.env.VITE_ORACULO_MODE === 'true'

function VisualOverlayCopy({ visual }) {
  const hasCopy = Boolean(visual.eyebrow || visual.title || visual.subtitle || visual.body || visual.ctaLabel)

  if (!hasCopy) return null

  return (
    <div className="visual-slot__copy">
      {visual.eyebrow ? <p className="page-card__kicker">{visual.eyebrow}</p> : null}
      {visual.title ? <h3>{visual.title}</h3> : null}
      {visual.subtitle ? <strong>{visual.subtitle}</strong> : null}
      {visual.body ? <p>{visual.body}</p> : null}
      {visual.ctaLabel ? (
        <a className="visual-slot__link" href={visual.ctaRoute || '#'}>
          {visual.ctaLabel}
        </a>
      ) : null}
    </div>
  )
}

function InlineVisualSlot({
  activeVisualSlotId = null,
  children,
  className = '',
  isVisualEditorOpen = false,
  onVisualEditorClose,
  onVisualEditorOpen,
  section,
  slotDefinition: providedSlotDefinition,
  slotId,
}) {
  const [slotConfig, setSlotConfig] = useState(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const slotDefinition = useMemo(
    () => providedSlotDefinition ?? getVisualSlotDefinition(slotId),
    [providedSlotDefinition, slotId],
  )

  useEffect(() => subscribeToVisualSlot(slotId, setSlotConfig), [slotId])

  const openEditor = () => {
    setIsEditorOpen(true)
    onVisualEditorOpen?.(slotId)
  }

  const closeEditor = () => {
    setIsEditorOpen(false)
    onVisualEditorClose?.(slotId)
  }

  const saveVisual = async ({ file, visual }) => {
    let nextVisual = normalizeVisualData({ ...slotConfig, ...visual })

    if (file) {
      const uploadedImage = await uploadVisualSlotImage(slotId, file)
      nextVisual = {
        ...nextVisual,
        imageUrl: uploadedImage.imageUrl,
        storagePath: uploadedImage.storagePath,
      }
    }

    const savedSlot = await updateVisualSlot(slotId, nextVisual)
    setSlotConfig(savedSlot)
  }

  const visual = normalizeVisualData(slotConfig)
  const imageUrl = visual.active !== false ? visual.imageUrl : ''
  const shouldShowControl = isOraculoMode && !isEditorOpen && !isVisualEditorOpen
  const hasEditableOverlay = slotDefinition.allowOverlayText === true
  const shouldUseRegisteredAspectRatio = hasVisualSlotDefinition(slotId) || !children
  const hasChildren = Boolean(children)
  const shouldRender = Boolean(imageUrl || hasChildren || shouldShowControl)

  if (!shouldRender) return null

  return (
    <section
      aria-label={visual.altText || section || slotDefinition.label}
      className={`visual-slot inline-visual-slot ${imageUrl ? 'inline-visual-slot--with-image' : ''} ${className}`.trim()}
      style={shouldUseRegisteredAspectRatio ? { aspectRatio: slotDefinition.aspectRatio } : undefined}
    >
      {imageUrl ? <img alt={visual.altText} className="visual-slot__image" src={imageUrl} style={getVisualImageStyle(visual)} /> : null}
      <span aria-hidden="true" className="visual-slot__overlay inline-visual-slot__veil" style={getVisualOverlayStyle(visual)} />
      <div className="inline-visual-slot__content">
        {hasEditableOverlay ? <VisualOverlayCopy visual={visual} /> : null}
        {!imageUrl ? children : null}
        {!imageUrl && shouldShowControl && !hasChildren ? (
          <div className="visual-slot__placeholder">
            <strong>Agregar señal</strong>
            <span>Sube una imagen y texto para este espacio.</span>
          </div>
        ) : null}
      </div>
      {shouldShowControl ? (
        <button className="visual-slot__controls inline-visual-slot__control" disabled={isVisualEditorOpen && activeVisualSlotId !== slotId} onClick={openEditor} type="button">
          {hasEditableOverlay ? 'Gestionar señal' : imageUrl ? 'Cambiar visual' : 'Editar visual'}
        </button>
      ) : null}
      {isEditorOpen ? (
        <VisualImageEditor
          onClose={closeEditor}
          onSave={saveVisual}
          slotDefinition={slotDefinition}
          slotId={slotId}
          title={`Editar ${section ?? slotDefinition.label}`}
          visual={visual}
        />
      ) : null}
    </section>
  )
}

export default InlineVisualSlot