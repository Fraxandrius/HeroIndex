import { isGMMode } from '../../data/mockAds.js'
import { useAds } from '../../hooks/useAds.js'
import AdCard from './AdCard.jsx'

function AdSlot({ slotId }) {
  const { getAdResolutionForSlot } = useAds()
  const { ad: selectedAd, source: selectedSource } = getAdResolutionForSlot(slotId)

  if (selectedAd) {
    return (
      <section
        className={`sponsor-slot sponsor-slot--${slotId}`}
        data-content-id={selectedAd.id ?? 'unknown'}
        data-placement-slot={slotId}
        data-content-source={selectedSource}
      >
        <small className="sponsor-slot__label">Sponsored · {slotId}</small>
        <AdCard ad={selectedAd} />
      </section>
    )
  }

  if (!isGMMode) {
    return null
  }

  return (
    <aside
      className="sponsor-slot sponsor-slot--placeholder"
      data-content-id="none"
      data-placement-slot={slotId}
      data-content-source="none"
    >
      <span>Mock sponsor placement</span>
      <strong>{slotId}</strong>
      <small>Visible in mock GM mode only</small>
    </aside>
  )
}

export default AdSlot