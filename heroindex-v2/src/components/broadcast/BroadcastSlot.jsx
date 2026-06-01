import { useEffect, useMemo, useState } from 'react'
import { subscribeToBroadcastsByPlacement } from '../../services/broadcastsService.js'
import BroadcastCard from './BroadcastCard.jsx'

const isOraculoMode = import.meta.env.VITE_ORACULO_MODE === 'true'

function prioritizeContext(items, heroId, corporationId) {
  if (!heroId && !corporationId) return items

  return [...items].sort((firstItem, secondItem) => {
    const firstScore = (heroId && String(firstItem.heroId) === String(heroId) ? 2 : 0) +
      (corporationId && String(firstItem.corporationId) === String(corporationId) ? 1 : 0)
    const secondScore = (heroId && String(secondItem.heroId) === String(heroId) ? 2 : 0) +
      (corporationId && String(secondItem.corporationId) === String(corporationId) ? 1 : 0)

    return secondScore - firstScore
  })
}

function BroadcastSlot({ className = '', corporationId, heroId, limit = 1, placement, variant = 'inline' }) {
  const [broadcasts, setBroadcasts] = useState([])

  useEffect(
    () => subscribeToBroadcastsByPlacement(placement, setBroadcasts, () => setBroadcasts([])),
    [placement],
  )

  const visibleBroadcasts = useMemo(
    () => prioritizeContext(broadcasts, heroId, corporationId).slice(0, limit),
    [broadcasts, corporationId, heroId, limit],
  )

  const items = visibleBroadcasts.length > 0
    ? visibleBroadcasts
    : [
        {
          id: `${placement}-placeholder`,
          title: 'Señal HeroIndex pendiente',
          subtitle: 'Canal verificado en preparación.',
          body: 'HeroIndex prepara nuevas señales institucionales para una ciudadanía más segura.',
          placement,
          tone: 'institutional',
          category: 'Canal verificado',
        },
      ]

  return (
    <section className={`broadcast-slot broadcast-slot--${variant} ${className}`.trim()} aria-label="Señal pública HeroIndex">
      {isOraculoMode ? (
        <a className="broadcast-slot__manage" href="/oraculo/broadcasts">
          Gestionar señales
        </a>
      ) : null}
      <div className="broadcast-slot__items">
        {items.map((broadcast) => (
          <BroadcastCard broadcast={broadcast} key={broadcast.id} variant={variant} />
        ))}
      </div>
    </section>
  )
}

export default BroadcastSlot
