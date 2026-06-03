import { useState } from 'react'

const sizeClassByValue = {
  sm: 'brand-logo--sm',
  md: 'brand-logo--md',
  lg: 'brand-logo--lg',
  sidebar: 'brand-logo--sidebar',
  sidebarSymbol: 'brand-logo--sidebar-symbol',
}

function BrandLogo({ className = '', size = 'md', variant = 'symbol' }) {
  const [hasImageError, setHasImageError] = useState(false)
  const sizeClass = sizeClassByValue[size] ?? sizeClassByValue.md
  const label = variant === 'full' ? 'HEROÍNDEX' : 'HI'
const src = variant === 'symbol' ? '/brand/HeroIndex-symbol.png' : '/brand/HeroIndex.png'

  return (
    <span className={`brand-logo brand-logo--${variant} ${sizeClass} ${className}`.trim()}>
      {!hasImageError ? (
        <img
          alt="HeroIndex"
          onError={() => setHasImageError(true)}
          src={src}
        />
      ) : (
        <span className="brand-logo__fallback">{label}</span>
      )}
    </span>
  )
}

export default BrandLogo