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

function AdsDebugPanelContent() {
  const { debug } = useAds()

  const rows = [
    ['Firebase configured', formatBoolean(debug.firebaseConfigured)],
    ['Has VITE_FIREBASE_DATABASE_URL', formatBoolean(debug.hasDatabaseUrl)],
    ['Has VITE_FIREBASE_PROJECT_ID', formatBoolean(debug.hasProjectId)],
    ['Ads source', debug.source],
    ['Firebase ads count', debug.firebaseAdsCount],
    ['mockAds count', debug.mockAdsCount],
    ['Error message', debug.errorMessage ?? 'none'],
    ['import.meta.env.MODE', debug.mode ?? 'unknown'],
    ['import.meta.env.PROD', String(debug.prod)],
    ['import.meta.env.DEV', String(debug.dev)],
  ]

  return (
    <aside className="ads-debug-panel" aria-label="Ads debug panel">
      <h2>Ads debug</h2>
      <dl>
        {rows.map(([label, value]) => (
          <div className="ads-debug-panel__row" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <h3>Canonical slots</h3>
      <div className="ads-debug-panel__slots">
        {debug.slots.map((slot) => (
          <section className="ads-debug-panel__slot" key={slot.slotId}>
            <h4>{slot.slotId}</h4>
            <dl>
              <div className="ads-debug-panel__row">
                <dt>firebase candidates count</dt>
                <dd>{slot.firebaseCandidatesCount}</dd>
              </div>
              <div className="ads-debug-panel__row">
                <dt>active firebase candidates count</dt>
                <dd>{slot.activeFirebaseCandidatesCount}</dd>
              </div>
              <div className="ads-debug-panel__row">
                <dt>mock fallback exists</dt>
                <dd>{formatBoolean(slot.mockFallbackExists)}</dd>
              </div>
              <div className="ads-debug-panel__row">
                <dt>selected source</dt>
                <dd>{slot.selectedSource}</dd>
              </div>
              <div className="ads-debug-panel__row">
                <dt>selected ad id</dt>
                <dd>{slot.selectedAdId}</dd>
              </div>
              <div className="ads-debug-panel__row">
                <dt>selected ad brand</dt>
                <dd>{slot.selectedAdBrand}</dd>
              </div>
              <div className="ads-debug-panel__row">
                <dt>selected ad headline</dt>
                <dd>{slot.selectedAdHeadline}</dd>
              </div>
              <div className="ads-debug-panel__row">
                <dt>selected imageUrl</dt>
                <dd>{formatBoolean(slot.selectedImageUrl)}</dd>
              </div>
            </dl>
          </section>
        ))}
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