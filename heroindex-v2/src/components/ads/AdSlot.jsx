import { isGMMode } from '../../data/mockAds.js'
import { useAds } from '../../hooks/useAds.js'
import AdCard from './AdCard.jsx'

function AdSlot({ slotId }) {
  const { getAdResolutionForSlot } = useAds()
  const { ad: selectedAd, source: selectedSource } = getAdResolutionForSlot(slotId)

  if (selectedAd) {
    return (
      <section
        className={`broadcast-slot broadcast-slot--${slotId}`}
        data-broadcast-id={selectedAd.id ?? 'unknown'}
        data-broadcast-slot={slotId}
        data-broadcast-source={selectedSource}
      >
        <small className="broadcast-label">Broadcast · {slotId}</small>
        <AdCard ad={selectedAd} />
      </section>
    )
  }

  if (!isGMMode) {
    return null
  }

  return (
    <aside
      className="broadcast-slot broadcast-slot--placeholder"
      data-broadcast-id="none"
      data-broadcast-slot={slotId}
      data-broadcast-source="none"
    >
      <span>Mock broadcast slot</span>
      <strong>{slotId}</strong>
      <small>Visible in mock GM mode only</small>
    </aside>
  )
}

export default AdSlot