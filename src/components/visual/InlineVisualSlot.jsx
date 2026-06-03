import { useEffect, useState } from 'react'
import VisualImageEditor from './VisualImageEditor.jsx'
import {
  subscribeToVisualSlot,
  updateVisualSlot,
  uploadVisualSlotImage,
} from '../../services/visualSlotsService.js'
import { getVisualBackgroundStyle, normalizeVisualData } from '../../utils/visualModel.js'

const isOraculoMode = import.meta.env.VITE_ORACULO_MODE === 'true'

function InlineVisualSlot({
  activeVisualSlotId = null,
  children,
  className = '',
  isVisualEditorOpen = false,
  onVisualEditorClose,
  onVisualEditorOpen,
  section,
  slotId,
}) {
  const [slotConfig, setSlotConfig] = useState(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

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
  const imageUrl = visual.imageUrl
  const slotStyle = getVisualBackgroundStyle(visual)
  const shouldShowControl = isOraculoMode && !isEditorOpen && !isVisualEditorOpen

  return (
    <section
      aria-label={visual.altText || section}
      className={`inline-visual-slot ${imageUrl ? 'inline-visual-slot--with-image' : ''} ${className}`.trim()}
      style={slotStyle}
    >
      <div className="inline-visual-slot__veil" aria-hidden="true" style={{ opacity: visual.imageOverlayStrength }} />
      <div className="inline-visual-slot__content">{children}</div>
      {shouldShowControl ? (
        <button className="inline-visual-slot__control" disabled={isVisualEditorOpen && activeVisualSlotId !== slotId} onClick={openEditor} type="button">
          {imageUrl ? 'Cambiar visual' : 'Editar visual'}
        </button>
      ) : null}
      {isEditorOpen ? (
        <VisualImageEditor
          onClose={closeEditor}
          onSave={saveVisual}
          title={`Editar ${section ?? 'visual'}`}
          visual={visual}
        />
      ) : null}
    </section>
  )
}

export default InlineVisualSlot