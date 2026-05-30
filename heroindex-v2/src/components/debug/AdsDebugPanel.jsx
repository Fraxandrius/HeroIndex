import { useAds, useRegisteredAdSlotIds } from '../../hooks/useAds.js'

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
  const slotIds = useRegisteredAdSlotIds()

  const rows = [
    ['Firebase configured', formatBoolean(debug.firebaseConfigured)],
    ['Has VITE_FIREBASE_DATABASE_URL', formatBoolean(debug.hasDatabaseUrl)],
    ['Has VITE_FIREBASE_PROJECT_ID', formatBoolean(debug.hasProjectId)],
    ['Ads source', debug.source],
    ['Firebase ads count', debug.firebaseAdsCount],
    ['mockAds count', debug.mockAdsCount],
    ['Current slotIds encontrados', slotIds.length > 0 ? slotIds.join(', ') : 'none'],
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