import { useEffect, useState } from 'react'
import { useAds } from '../../hooks/useAds.js'

function formatBoolean(value) {
  return value ? 'yes' : 'no'
}

function shouldShowAdsDebugPanel() {
    return (
    import.meta.env.VITE_DEBUG_BROADCAST === 'true' ||
    import.meta.env.VITE_DEBUG_ADS === 'true'
  )
}

function getSlotDomState(slotId) {
  if (typeof document === 'undefined') {
    return {
      mountedInDom: false,
      selectedAdPassedToAdCard: false,
    }
  }

    const slotElement = document.querySelector(`.broadcast-slot[data-broadcast-slot="${slotId}"]`)

  return {
    mountedInDom: Boolean(slotElement),
    selectedAdPassedToAdCard: Boolean(
      slotElement?.querySelector(`.broadcast-card[data-broadcast-slot="${slotId}"]`),
        ),
  }
}

function AdsDebugPanelContent() {
  const { debug } = useAds()
  const [slotDomState, setSlotDomState] = useState({})

  useEffect(() => {
    const updateSlotDomState = () => {
      setSlotDomState(
        Object.fromEntries(
          debug.slots.map((slot) => [slot.slotId, getSlotDomState(slot.slotId)]),
        ),
      )
    }

    const animationFrameId = window.requestAnimationFrame(updateSlotDomState)

    return () => window.cancelAnimationFrame(animationFrameId)
  }, [debug.slots])

  const rows = [
    ['Firebase configured', formatBoolean(debug.firebaseConfigured)],
    ['Has VITE_FIREBASE_DATABASE_URL', formatBoolean(debug.hasDatabaseUrl)],
    ['Has VITE_FIREBASE_PROJECT_ID', formatBoolean(debug.hasProjectId)],
    ['Content source', debug.source],
    ['Firebase content count', debug.firebaseAdsCount],
    ['mock content count', debug.mockAdsCount],
    ['Error message', debug.errorMessage ?? 'none'],
    ['import.meta.env.MODE', debug.mode ?? 'unknown'],
    ['import.meta.env.PROD', String(debug.prod)],
    ['import.meta.env.DEV', String(debug.dev)],
  ]

  return (
    <aside className="broadcast-panel" aria-label="Broadcast debug panel">
      <h2>Broadcast debug</h2>
      <dl>
        {rows.map(([label, value]) => (
          <div className="broadcast-panel__row" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <h3>Canonical slots</h3>
      <div className="broadcast-panel__slots">
        {debug.slots.map((slot) => {
          const domState = slotDomState[slot.slotId] ?? {
            mountedInDom: false,
            selectedAdPassedToAdCard: false,
          }

          return (
            <section className="broadcast-panel__slot" key={slot.slotId}>
              <h4>{slot.slotId}</h4>
              <dl>
                <div className="broadcast-panel__row">
                  <dt>firebase candidates count</dt>
                  <dd>{slot.firebaseCandidatesCount}</dd>
                </div>
                <div className="broadcast-panel__row">
                  <dt>active firebase candidates count</dt>
                  <dd>{slot.activeFirebaseCandidatesCount}</dd>
                </div>
                <div className="broadcast-panel__row">
                  <dt>mock fallback exists</dt>
                  <dd>{formatBoolean(slot.mockFallbackExists)}</dd>
                </div>
                <div className="broadcast-panel__row">
                  <dt>selected source</dt>
                  <dd>{slot.selectedSource}</dd>
                </div>
                <div className="broadcast-panel__row">
                  <dt>selected content id</dt>
                  <dd>{slot.selectedAdId}</dd>
                </div>
                <div className="broadcast-panel__row">
                  <dt>selected content brand</dt>
                  <dd>{slot.selectedAdBrand}</dd>
                </div>
                <div className="broadcast-panel__row">
                  <dt>selected content headline</dt>
                  <dd>{slot.selectedAdHeadline}</dd>
                </div>
                <div className="broadcast-panel__row">
                  <dt>selected imageUrl</dt>
                  <dd>{formatBoolean(slot.selectedImageUrl)}</dd>
                </div>
                <div className="broadcast-panel__row">
                  <dt>mounted in DOM</dt>
                  <dd>{formatBoolean(domState.mountedInDom)}</dd>
                </div>
                <div className="broadcast-panel__row">
                  <dt>selected content passed to AdCard</dt>
                  <dd>{formatBoolean(domState.selectedAdPassedToAdCard)}</dd>
                </div>
              </dl>
            </section>
          )
        })}
      </div>
    </aside>
  )
}

function AdsDebugPanel() {
  if (!shouldShowAdsDebugPanel()) {
    return null
  }

  return <AdsDebugPanelContent />
}

export default AdsDebugPanel