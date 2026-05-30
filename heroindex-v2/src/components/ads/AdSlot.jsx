import { useEffect } from 'react'
import { isGMMode } from '../../data/mockAds.js'
import { registerAdSlot, useAds } from '../../hooks/useAds.js'
import AdCard from './AdCard.jsx'

function AdSlot({ slotId }) {
  const { getActiveAdForSlot } = useAds()

  useEffect(() => registerAdSlot(slotId), [slotId])
  const ad = getActiveAdForSlot(slotId)

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