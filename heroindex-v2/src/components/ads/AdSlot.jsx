import { isGMMode } from '../../data/mockAds.js'
import { useAds } from '../../hooks/useAds.js'
import AdCard from './AdCard.jsx'

function AdSlot({ slotId }) {
  const { getAdResolutionForSlot } = useAds()
  const { ad: selectedAd, source: selectedSource } = getAdResolutionForSlot(slotId)

  if (selectedAd) {
    return (
      <section
        className={`ad-slot ad-slot--${slotId}`}
        data-ad-id={selectedAd.id ?? 'unknown'}
        data-ad-slot={slotId}
        data-ad-source={selectedSource}
      >
        <small className="ad-slot__label">Sponsored · {slotId}</small>
        <AdCard ad={selectedAd} />
      </section>
    )
  }

  if (!isGMMode) {
    return null
  }

  return (
    <aside
      className="ad-slot ad-slot--placeholder"
      data-ad-id="none"
      data-ad-slot={slotId}
      data-ad-source="none"
    >
      <span>Mock ad slot</span>
      <strong>{slotId}</strong>
      <small>Visible in mock GM mode only</small>
    </aside>
  )
}

export default AdSlot