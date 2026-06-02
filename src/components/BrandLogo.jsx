import { useState } from 'react'

const sizeClassByValue = {
  sm: 'brand-logo--sm',
  md: 'brand-logo--md',
  lg: 'brand-logo--lg',
  sidebar: 'brand-logo--sidebar',
}

function BrandLogo({ className = '', size = 'md', variant = 'symbol' }) {
  const [hasImageError, setHasImageError] = useState(false)
  const sizeClass = sizeClassByValue[size] ?? sizeClassByValue.md
  const label = variant === 'full' ? 'HEROÍNDEX' : 'HI'

  return (
    <span className={`brand-logo brand-logo--${variant} ${sizeClass} ${className}`.trim()}>
      {!hasImageError ? (
        <img
          alt="HeroIndex"
          onError={() => setHasImageError(true)}
          src="/brand/HeroIndex.png"
        />
      ) : (
        <span className="brand-logo__fallback">{label}</span>
      )}
    </span>
  )
}

export default BrandLogo