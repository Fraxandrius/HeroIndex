import { useEffect, useMemo, useState } from 'react'
import {
  subscribeToPublicSignal,
  updatePublicSignal,
  uploadPublicSignalImage,
} from '../../services/publicSignalsService.js'
import { getVisualImageStyle, getVisualOverlayStyle, normalizeVisualData } from '../../utils/visualModel.js'
import { getPublicContentDefinition } from '../../utils/publicContentRegistry.js'
import VisualImageEditor from './VisualImageEditor.jsx'

const isOraculoMode = import.meta.env.VITE_ORACULO_MODE === 'true'

function hasSignalContent(signal) {
  return Boolean(signal.imageUrl || signal.eyebrow || signal.title || signal.subtitle || signal.body || signal.ctaLabel)
}

function PublicSignalContent({ signal }) {
  return (
    <div className="public-signal__copy">
      {signal.eyebrow ? <p className="page-card__kicker">{signal.eyebrow}</p> : null}
      {signal.title ? <h3>{signal.title}</h3> : null}
      {signal.subtitle ? <strong>{signal.subtitle}</strong> : null}
      {signal.body ? <p>{signal.body}</p> : null}
      {signal.ctaLabel ? (
        <a className="public-signal__link" href={signal.ctaRoute || '#'}>
          {signal.ctaLabel}
        </a>
      ) : null}
    </div>
  )
}

function PublicSignalSlot({
  activeVisualSlotId = null,
  className = '',
  isVisualEditorOpen = false,
  onVisualEditorClose,
  onVisualEditorOpen,
  signalId,
}) {
  const [signalConfig, setSignalConfig] = useState(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const signalDefinition = useMemo(() => getPublicContentDefinition(signalId), [signalId])

  useEffect(() => subscribeToPublicSignal(signalId, setSignalConfig), [signalId])

  const openEditor = () => {
    setIsEditorOpen(true)
    onVisualEditorOpen?.(signalId)
  }

  const closeEditor = () => {
    setIsEditorOpen(false)
    onVisualEditorClose?.(signalId)
  }

  const saveSignal = async ({ file, visual }) => {
    let nextSignal = normalizeVisualData({ ...signalConfig, ...visual })

    if (file) {
      const uploadedImage = await uploadPublicSignalImage(signalId, file)
      nextSignal = {
        ...nextSignal,
        imageUrl: uploadedImage.imageUrl,
        storagePath: uploadedImage.storagePath,
      }
    }

    const savedSignal = await updatePublicSignal(signalId, nextSignal)
    setSignalConfig(savedSignal)
  }

  const signal = normalizeVisualData(signalConfig)
  const hasContent = signal.active !== false && hasSignalContent(signal)
  const shouldShowControl = isOraculoMode && !isEditorOpen && !isVisualEditorOpen
  const shouldRender = Boolean(hasContent || shouldShowControl || isEditorOpen)

  if (!shouldRender) return null

  return (
    <section
      aria-label={signal.altText || signalDefinition.label}
      className={`public-signal ${signal.imageUrl ? 'public-signal--with-image' : 'public-signal--text-only'} ${className}`.trim()}
      style={{ aspectRatio: signalDefinition.aspectRatio }}
    >
      {signal.imageUrl && signal.active !== false ? (
        <>
          <img alt={signal.altText} className="public-signal__image" src={signal.imageUrl} style={getVisualImageStyle(signal)} />
          <span aria-hidden="true" className="public-signal__overlay" style={getVisualOverlayStyle(signal)} />
        </>
      ) : null}

      {hasContent ? <PublicSignalContent signal={signal} /> : null}
      {!hasContent && shouldShowControl ? (
        <div className="public-signal__placeholder">
          <strong>Agregar señal pública</strong>
          <span>Mensajes públicos del ecosistema HeroIndex: avisos, comunicados y llamados corporativos.</span>
        </div>
      ) : null}

      {shouldShowControl ? (
        <button className="public-signal__control" disabled={isVisualEditorOpen && activeVisualSlotId !== signalId} onClick={openEditor} type="button">
          Gestionar señal pública
        </button>
      ) : null}

      {isEditorOpen ? (
        <VisualImageEditor
          onClose={closeEditor}
          onSave={saveSignal}
          slotDefinition={signalDefinition}
          slotId={signalId}
          title="Gestionar señal pública"
          visual={signal}
        />
      ) : null}
    </section>
  )
}

export default PublicSignalSlot