import { useEffect, useState } from 'react'
import VisualImageEditor from './VisualImageEditor.jsx'
import {
  subscribeToVisualSlot,
  updateVisualSlot,
  uploadVisualSlotImage,
} from '../../services/visualSlotsService.js'
import { getVisualImageStyle, getVisualOverlayStyle, normalizeVisualData } from '../../utils/visualModel.js'
import { getVisualSlotDefinition } from '../../utils/visualSlotsRegistry.js'

export const SIDEBAR_ACCOUNT_VISUAL_SLOT = 'sidebarAccountVisual'

function SidebarVisualSlot({ canSeeOraculoTools = false, slotId = SIDEBAR_ACCOUNT_VISUAL_SLOT }) {
  const [visualSlot, setVisualSlot] = useState(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const slotDefinition = getVisualSlotDefinition(slotId)

  useEffect(() => subscribeToVisualSlot(slotId, setVisualSlot), [slotId])

  const visual = normalizeVisualData(visualSlot)
  const hasActiveImage = visual.active !== false && Boolean(visual.imageUrl)

  if (!hasActiveImage && canSeeOraculoTools !== true) {
    return null
  }

  const saveVisual = async ({ file, visual: draftVisual }) => {
    let nextVisual = normalizeVisualData({ ...visualSlot, ...draftVisual })

    if (file) {
      const uploadedImage = await uploadVisualSlotImage(slotId, file)
      nextVisual = {
        ...nextVisual,
        imageUrl: uploadedImage.imageUrl,
        storagePath: uploadedImage.storagePath,
      }
    }

    const savedSlot = await updateVisualSlot(slotId, nextVisual)
    setVisualSlot(savedSlot)
  }

  return (
    <section className={`sidebar-visual-slot ${hasActiveImage ? 'sidebar-visual-slot--ready' : 'sidebar-visual-slot--empty'}`} aria-label={visual.altText}>
      <div className="sidebar-visual-slot__frame" style={{ aspectRatio: slotDefinition.aspectRatio }}>
        {hasActiveImage ? (
          <>
            <img alt={visual.altText} src={visual.imageUrl} style={getVisualImageStyle(visual)} />
            <span aria-hidden="true" className="sidebar-visual-slot__overlay" style={getVisualOverlayStyle(visual)} />
          </>
        ) : (
          <div className="sidebar-visual-slot__placeholder">
            <strong>Agregar visual</strong>
            <span>Sube una imagen para este espacio.</span>
          </div>
        )}
      </div>

      {canSeeOraculoTools === true ? (
        <button className="sidebar-visual-slot__control" onClick={() => setIsEditorOpen(true)} type="button">
          Cambiar visual
        </button>
      ) : null}

      {isEditorOpen ? (
        <VisualImageEditor
          onClose={() => setIsEditorOpen(false)}
          onSave={saveVisual}
          slotDefinition={slotDefinition}
          slotId={slotId}
          title="Editar visual lateral de acceso"
          visual={visual}
        />
      ) : null}
    </section>
  )
}

export default SidebarVisualSlot