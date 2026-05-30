import { getActiveMockAdBySlotId, isGMMode } from '../../data/mockAds.js'
import AdCard from './AdCard.jsx'

function AdSlot({ slotId }) {
  const ad = getActiveMockAdBySlotId(slotId)

  if (ad) {
    return <AdCard ad={ad} />
  }

  if (!isGMMode) {
    return null
  }

  return (
    <aside className="ad-slot ad-slot--placeholder" data-ad-slot={slotId}>
      <span>Mock ad slot</span>
      <strong>{slotId}</strong>
      <small>Visible in mock GM mode only</small>
    </aside>
  )
}

export default AdSlot