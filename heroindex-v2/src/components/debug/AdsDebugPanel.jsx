import { useEffect, useState } from 'react'
import { useAds } from '../../hooks/useAds.js'

function formatBoolean(value) {
  return value ? 'yes' : 'no'
}

function shouldShowAdsDebugPanel() {
  if (import.meta.env.DEV === true) {
    return true
  }

  if (typeof window === 'undefined') {
    return false
  }

  return new URLSearchParams(window.location.search).get('debugAds') === '1'
}

function getSlotDomState(slotId) {
  if (typeof document === 'undefined') {
    return {
      mountedInDom: false,
      selectedAdPassedToAdCard: false,
    }
  }

  const slotElement = document.querySelector(`.sponsor-slot[data-placement-slot="${slotId}"]`)

  return {
    mountedInDom: Boolean(slotElement),
    selectedAdPassedToAdCard: Boolean(
      slotElement?.querySelector(`.sponsor-card[data-placement-slot="${slotId}"]`),
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
    <aside className="diagnostics-panel" aria-label="Sponsor diagnostics panel">
      <h2>Sponsor diagnostics</h2>
      <dl>
        {rows.map(([label, value]) => (
          <div className="diagnostics-panel__row" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <h3>Canonical slots</h3>
      <div className="diagnostics-panel__slots">
        {debug.slots.map((slot) => {
          const domState = slotDomState[slot.slotId] ?? {
            mountedInDom: false,
            selectedAdPassedToAdCard: false,
          }

          return (
            <section className="diagnostics-panel__slot" key={slot.slotId}>
              <h4>{slot.slotId}</h4>
              <dl>
                <div className="diagnostics-panel__row">
                  <dt>firebase candidates count</dt>
                  <dd>{slot.firebaseCandidatesCount}</dd>
                </div>
                <div className="diagnostics-panel__row">
                  <dt>active firebase candidates count</dt>
                  <dd>{slot.activeFirebaseCandidatesCount}</dd>
                </div>
                <div className="diagnostics-panel__row">
                  <dt>mock fallback exists</dt>
                  <dd>{formatBoolean(slot.mockFallbackExists)}</dd>
                </div>
                <div className="diagnostics-panel__row">
                  <dt>selected source</dt>
                  <dd>{slot.selectedSource}</dd>
                </div>
                <div className="diagnostics-panel__row">
                  <dt>selected content id</dt>
                  <dd>{slot.selectedAdId}</dd>
                </div>
                <div className="diagnostics-panel__row">
                  <dt>selected content brand</dt>
                  <dd>{slot.selectedAdBrand}</dd>
                </div>
                <div className="diagnostics-panel__row">
                  <dt>selected content headline</dt>
                  <dd>{slot.selectedAdHeadline}</dd>
                </div>
                <div className="diagnostics-panel__row">
                  <dt>selected imageUrl</dt>
                  <dd>{formatBoolean(slot.selectedImageUrl)}</dd>
                </div>
                <div className="diagnostics-panel__row">
                  <dt>mounted in DOM</dt>
                  <dd>{formatBoolean(domState.mountedInDom)}</dd>
                </div>
                <div className="diagnostics-panel__row">
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