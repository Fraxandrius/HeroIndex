import { useEffect, useState } from 'react'
import VisualImageEditor from './VisualImageEditor.jsx'
import {
  subscribeToVisualSlot,
  updateVisualSlot,
  uploadVisualSlotImage,
} from '../../services/visualSlotsService.js'
import { getVisualImageStyle, getVisualOverlayStyle, normalizeVisualData } from '../../utils/visualModel.js'
import { getPublicContentDefinition } from '../../utils/publicContentRegistry.js'

export const SIDEBAR_ACCESS_VISUAL_SLOT = 'sidebarAccessVisual'
export const SIDEBAR_ACCOUNT_VISUAL_SLOT = SIDEBAR_ACCESS_VISUAL_SLOT
const LEGACY_SIDEBAR_VISUAL_SLOT = 'sidebarAccountVisual'

function SidebarVisualSlot({ canSeeOraculoTools = false, slotId = SIDEBAR_ACCESS_VISUAL_SLOT }) {
  const [visualSlot, setVisualSlot] = useState(null)
  const [legacyVisualSlot, setLegacyVisualSlot] = useState(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const slotDefinition = getPublicContentDefinition(slotId)

  useEffect(() => {
    const unsubscribePrimary = subscribeToVisualSlot(slotId, setVisualSlot)
    const unsubscribeLegacy = slotId === SIDEBAR_ACCESS_VISUAL_SLOT
      ? subscribeToVisualSlot(LEGACY_SIDEBAR_VISUAL_SLOT, setLegacyVisualSlot)
      : () => {}

    return () => {
      unsubscribePrimary()
      unsubscribeLegacy()
    }
  }, [slotId])

  const effectiveVisualSlot = visualSlot ?? legacyVisualSlot
  const visual = normalizeVisualData(effectiveVisualSlot)
  const hasActiveImage = visual.active !== false && Boolean(visual.imageUrl)

  if (!hasActiveImage && canSeeOraculoTools !== true && !isEditorOpen) {
    return null
  }

  const saveVisual = async ({ file, visual: draftVisual }) => {
    let nextVisual = normalizeVisualData({ ...effectiveVisualSlot, ...draftVisual })

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
    <section className={`sidebar-visual-slot ${hasActiveImage ? 'sidebar-visual-slot--ready' : 'sidebar-visual-slot--empty'}`} aria-label={visual.altText || slotDefinition.label}>
      <div className="sidebar-visual-slot__frame" style={{ aspectRatio: slotDefinition.aspectRatio }}>
        {hasActiveImage ? (
          <>
            <img alt={visual.altText} src={visual.imageUrl} style={getVisualImageStyle(visual)} />
            <span aria-hidden="true" className="sidebar-visual-slot__overlay" style={getVisualOverlayStyle(visual)} />
          </>
        ) : (
          <div className="sidebar-visual-slot__placeholder">
            <strong>Agregar visual publicitario</strong>
            <span>Piezas gráficas del ecosistema HeroIndex: afiches, visuales corporativos y llamados visuales.</span>
          </div>
        )}
      </div>

      {canSeeOraculoTools === true ? (
        <button className="sidebar-visual-slot__control" onClick={() => setIsEditorOpen(true)} type="button">
          Gestionar visual publicitario
        </button>
      ) : null}

      {isEditorOpen ? (
        <VisualImageEditor
          onClose={() => setIsEditorOpen(false)}
          onSave={saveVisual}
          slotDefinition={slotDefinition}
          slotId={slotId}
          title="Gestionar visual publicitario"
          visual={visual}
        />
      ) : null}
    </section>
  )
}

export default SidebarVisualSlot