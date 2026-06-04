import { useMemo, useState } from 'react'
import BroadcastSlot from '../components/broadcast/BroadcastSlot.jsx'
import InlineVisualSlot from '../components/visual/InlineVisualSlot.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { useNews } from '../hooks/useNews.js'
import { useProfileGallery } from '../hooks/useProfileGallery.js'
import { useProfilePosts } from '../hooks/useProfilePosts.js'
import { deleteHero } from '../services/heroesService.js'
import { canSeeOraculoTools } from '../utils/roles.js'

const isOraculoMode = import.meta.env.VITE_ORACULO_MODE === 'true'

function getNumericValue(value) {
  const numberValue = Number(value ?? 0)

  return Number.isNaN(numberValue) ? 0 : numberValue
}

function toTimestamp(value) {
  if (!value) return 0
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value

  const parsed = Date.parse(value)

  return Number.isNaN(parsed) ? 0 : parsed
}

function getInitials(name = '') {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')

  return initials || 'HI'
}

function getHeroDisplayName(hero = {}) {
  return hero.alias || hero.publicName || hero.codename || hero.name || 'Identidad HeroIndex'
}

function getHeroTitle(hero = {}) {
  return hero.heroTitle || 'Figura HeroIndex'
}

function getHeroTier(rankingPoints) {
  const points = getNumericValue(rankingPoints)

  if (points >= 20000) return 'Símbolo global'
  if (points >= 10000) return 'Figura internacional'
  if (points >= 6000) return 'Ícono nacional'
  if (points >= 3000) return 'Héroe destacado'
  if (points >= 1500) return 'Héroe reconocido'
  if (points >= 750) return 'Protector urbano'
  if (points >= 250) return 'Héroe emergente'

  return 'Registro inicial'
}

function getCorporationName(hero, getCorporationById) {
  if (hero.independent === true || !hero.corporationId || hero.corporationId === 'independent') {
    return 'Independiente'
  }

  return getCorporationById(hero.corporationId)?.name || hero.corporationId
}

function getPublicPowers(hero = {}) {
  const powers = hero.publicPowers ?? hero.visiblePowers

  if (Array.isArray(powers)) {
    return powers.filter(Boolean)
  }

  if (typeof powers === 'string' && powers.trim()) {
    return powers
      .split(',')
      .map((power) => power.trim())
      .filter(Boolean)
  }

  return []
}

function normalizePublicCollection(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function getPublicPosts(hero = {}) {
  return normalizePublicCollection(hero.publicPosts ?? hero.publications ?? hero.posts ?? hero.activity ?? hero.publicUpdates ?? hero.updates)
    .filter((post) => post?.visibility !== 'private' && post?.public !== false)
    .sort((firstPost, secondPost) => toTimestamp(secondPost.createdAt ?? secondPost.date) - toTimestamp(firstPost.createdAt ?? firstPost.date))
}

function getPublicGallery(hero = {}) {
  const gallery = normalizePublicCollection(hero.publicGallery ?? hero.gallery ?? hero.publicImages ?? hero.images)
  const imageUrls = gallery.map((item) => (typeof item === 'string' ? item : item?.imageUrl ?? item?.url)).filter(Boolean)

  return [...new Set([hero.featuredImageUrl, ...imageUrls].filter(Boolean))]
}

function getPublicTrust(hero = {}) {
  const value = hero.publicTrust ?? hero.trust ?? hero.trustScore

  return value === undefined || value === null || value === '' ? 'Datos en consolidación' : String(value)
}

function getPublicMetric(value, fallback = 'Sin medición') {
  return value === undefined || value === null || value === '' ? fallback : String(value)
}

function getNewsSummary(newsItem) {
  const summary = newsItem.summary ?? newsItem.body ?? ''

  return summary.length > 150 ? `${summary.slice(0, 147)}...` : summary
}

function formatDate(value) {
  const timestamp = toTimestamp(value)

  if (!timestamp) return 'Fecha pendiente'

  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp))
}

function sortHeroesByPublicPosition(firstHero, secondHero) {
  const rankingDifference = getNumericValue(secondHero.rankingPoints) - getNumericValue(firstHero.rankingPoints)

  if (rankingDifference !== 0) return rankingDifference

  const approvalDifference = getNumericValue(secondHero.approval) - getNumericValue(firstHero.approval)

  if (approvalDifference !== 0) return approvalDifference

  return getHeroDisplayName(firstHero).localeCompare(getHeroDisplayName(secondHero), 'es')
}

function HeroProfile({ onNavigate, routeParams = {} }) {
  const heroId = routeParams.heroId
  const [deleteMessage, setDeleteMessage] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [isDeletingHero, setIsDeletingHero] = useState(false)
  const { userProfile } = useAuth()
  const { error: heroesError, heroes, loading: heroesLoading } = useHeroes()
  const {
    getCorporationById,
    loading: corporationsLoading,
    error: corporationsError,
  } = useCorporations()
  const { feedNews, loading: newsLoading, error: newsError } = useNews()
  const { error: postsError, loading: postsLoading, posts: profilePosts } = useProfilePosts(heroId, { publicOnly: true })
  const { error: galleryError, loading: galleryLoading, images: profileGallery } = useProfileGallery(heroId, { publicOnly: true })
  const canViewOraculoTools = isOraculoMode && canSeeOraculoTools(userProfile)

  const hero = heroes.find((heroItem) => String(heroItem.id) === String(heroId))
  const activeHeroes = useMemo(
    () => [...heroes].filter((heroItem) => heroItem.active !== false).sort(sortHeroesByPublicPosition),
    [heroes],
  )
  const publicPosition = hero
    ? activeHeroes.findIndex((heroItem) => String(heroItem.id) === String(hero.id)) + 1
    : 0
  const displayName = hero ? getHeroDisplayName(hero) : ''
  const relatedNews = hero
    ? feedNews
        .filter(
          (newsItem) =>
            newsItem.active !== false &&
            Array.isArray(newsItem.heroIds) &&
            newsItem.heroIds.map(String).includes(String(hero.id)),
        )
        .sort((firstItem, secondItem) => toTimestamp(secondItem.createdAt) - toTimestamp(firstItem.createdAt))
        .slice(0, 5)
    : []

   const loading = heroesLoading || corporationsLoading || newsLoading || postsLoading || galleryLoading
  const error = heroesError || corporationsError || newsError || postsError || galleryError

  if (loading) {
    return (
      <section className="page-card hero-profile-page">
        <p className="hero-profile-state">Cargando perfil HeroIndex...</p>
      </section>
    )
  }

  if (error && !hero) {
    return (
      <section className="page-card hero-profile-page">
        <p className="hero-profile-state hero-profile-state--error">No fue posible cargar el perfil.</p>
      </section>
    )
  }

  if (!hero) {
    return (
      <section className="page-card hero-profile-page">
        <p className="hero-profile-state">No se encontró el perfil solicitado.</p>
      </section>
    )
  }

  const corporationName = getCorporationName(hero, getCorporationById)
  const publicPowers = getPublicPowers(hero)
  const publicBio = hero.publicBio || 'Biografía pública pendiente de actualización.'
  const heroTier = getHeroTier(hero.rankingPoints)
  const legacyPublicPosts = getPublicPosts(hero)
  const publicPosts = profilePosts.length > 0 ? profilePosts : legacyPublicPosts
  const legacyPublicGallery = getPublicGallery(hero)
  const publicGallery = profileGallery.length > 0 ? profileGallery : legacyPublicGallery.map((imageUrl) => ({ id: imageUrl, imageUrl, caption: '' }))
  const coverUrl = hero.coverUrl || hero.bannerUrl || hero.imageUrl || ''
  const publicQuote = hero.profileStatus || hero.publicQuote || hero.tagline || 'Presencia pública activa dentro de la red HeroIndex.'

   const handleDeleteHero = async () => {
    if (!window.confirm('Eliminar héroe público. Noticias y evaluaciones asociadas no se eliminarán automáticamente. Esta acción no se puede deshacer.')) return

    setIsDeletingHero(true)
    setDeleteMessage('Eliminando...')
    setDeleteError('')

    try {
      await deleteHero(hero.id)
     setDeleteMessage('Registro eliminado correctamente.')
      onNavigate?.('oraculo-hub')
    } catch {
      setDeleteError('No fue posible eliminar el registro.')
      setDeleteMessage('')
    } finally {
      setIsDeletingHero(false)
    }
  }

  return (
    <section className="page-card hero-profile-page public-hero-profile">
      <nav className="hero-profile-actions public-hero-profile__actions" aria-label="Navegación de perfil">
        <button onClick={() => onNavigate?.('profiles')} type="button">Volver a perfiles</button>
        <button onClick={() => onNavigate?.('ranking')} type="button">Volver al ranking</button>
      </nav>

      <header className="hero-profile-cover public-hero-profile__cover">
        {coverUrl ? <img alt={`Portada pública de ${displayName}`} loading="lazy" onError={(event) => { event.currentTarget.hidden = true }} src={coverUrl} /> : null}
        <div className="public-hero-profile__cover-placeholder" hidden={Boolean(coverUrl)}><span>RED HEROINDEX</span><strong>IDENTIDAD HEROICA REGISTRADA</strong></div>
        <div className="hero-profile-cover__overlay public-hero-profile__identity">
          <span className="hero-profile-avatar">
            <span>{getInitials(displayName)}</span>
            {hero.avatarUrl ? <img alt={`Avatar público de ${displayName}`} loading="lazy" onError={(event) => { event.currentTarget.hidden = true }} src={hero.avatarUrl} /> : null}
          </span>
          <div className="hero-profile-heading">
            <p className="page-card__kicker">PERFIL PÚBLICO HEROINDEX</p>
            <h2>{displayName}</h2>
            <p>{getHeroTitle(hero)}</p>
            <div className="hero-profile-tags">
              <span>Canal verificado</span><span>{corporationName}</span><span>{publicPosition > 0 ? `Ranking #${publicPosition}` : heroTier}</span><span>Aprobación {getPublicMetric(hero.approval)}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="public-hero-profile__layout">
        <main className="public-hero-profile__main">
          <section className="public-hero-profile__section public-hero-profile__presentation">
            <div className="public-hero-profile__section-heading"><div><p className="page-card__kicker">PRESENTACIÓN</p><h3>Presencia pública</h3></div><span>Identidad heroica registrada</span></div>
            <blockquote>{publicQuote}</blockquote>
            <p>{publicBio}</p>
          </section>

          <section className="public-hero-profile__section">
            <div className="public-hero-profile__section-heading"><div><p className="page-card__kicker">ACTIVIDAD</p><h3>Canal público del héroe</h3></div><span>{publicPosts.length} actualizaciones</span></div>
            <div className="public-hero-feed">
              {publicPosts.length > 0 ? publicPosts.map((post, index) => (
                <article className="public-hero-post" key={post.id || `${hero.id}-post-${index}`}>
                  <header><span className="public-hero-post__avatar">{hero.avatarUrl ? <img alt="" src={hero.avatarUrl} /> : getInitials(displayName)}</span><div><strong>{displayName}</strong><small>{formatDate(post.createdAt ?? post.date)}</small></div><em>Señal del héroe</em></header>
                  <p>{post.content ?? post.text ?? post.body}</p>
                  {post.imageUrl ? <img alt={`Actualización pública de ${displayName}`} loading="lazy" src={post.imageUrl} /> : null}
                </article>
              )) : <div className="public-hero-profile__empty"><strong>Este perfil aún no registra actualizaciones públicas.</strong><span>La actividad visible aparecerá aquí cuando el héroe emita una señal pública.</span></div>}
            </div>
          </section>

          <InlineVisualSlot className="public-hero-profile__section hero-profile-visual-signal" page="hero-profile" section="Canal verificado de perfil" slotId="hero-profile-feature-visual">
            <p className="page-card__kicker">CANAL VERIFICADO</p><h3>Presencia heroica activa</h3><p>Actividad destacada y cobertura pública asociada dentro del ecosistema HeroIndex.</p>
          </InlineVisualSlot>

          <section className="public-hero-profile__section">
            <div className="public-hero-profile__section-heading"><div><p className="page-card__kicker">GALERÍA</p><h3>Galería pública</h3></div><span>Presencia visual</span></div>
          {publicGallery.length > 0 ? <div className="public-hero-gallery">{publicGallery.map((image) => <figure key={image.id || image.imageUrl}><img alt={image.caption || `Galería pública de ${displayName}`} loading="lazy" src={image.imageUrl} />{image.caption ? <figcaption>{image.caption}</figcaption> : null}</figure>)}</div> : <div className="public-hero-profile__empty"><strong>Galería pública en consolidación.</strong><span>Las futuras imágenes verificadas aparecerán en este espacio.</span></div>}
          </section>

          <section className="public-hero-profile__section">
            <div className="public-hero-profile__section-heading"><div><p className="page-card__kicker">CAPACIDADES DECLARADAS</p><h3>Poderes visibles</h3></div><span>Información pública declarada o verificada por HeroIndex</span></div>
            {publicPowers.length > 0 ? <div className="public-hero-powers">{publicPowers.map((power) => <span key={power}>{power}</span>)}</div> : <div className="public-hero-profile__empty"><strong>Sin poderes públicos declarados.</strong></div>}
          </section>

          <section className="public-hero-profile__section">
            <div className="public-hero-profile__section-heading"><div><p className="page-card__kicker">SEÑALES RELACIONADAS</p><h3>Cobertura vinculada</h3></div><span>{relatedNews.length} señales</span></div>
            {relatedNews.length > 0 ? <div className="public-hero-signals">{relatedNews.map((newsItem) => <article key={newsItem.id}><span>{newsItem.category || newsItem.layer || 'Canal HeroIndex'}</span><h4>{newsItem.title}</h4><p>{getNewsSummary(newsItem)}</p><small>{formatDate(newsItem.createdAt)} · Leer cobertura</small></article>)}</div> : <div className="public-hero-profile__empty"><strong>Sin señales asociadas.</strong></div>}
          </section>
        </main>

        <aside className="public-hero-profile__sidebar" aria-label="Resumen público del héroe">
          <section className="public-hero-profile__panel"><p className="page-card__kicker">REPUTACIÓN PÚBLICA</p><dl className="public-hero-profile__metrics"><div><dt>Puntos HeroIndex</dt><dd>{getPublicMetric(hero.rankingPoints)}</dd></div><div><dt>Aprobación ciudadana</dt><dd>{getPublicMetric(hero.approval)}</dd></div><div><dt>Confianza pública</dt><dd>{getPublicTrust(hero)}</dd></div><div><dt>Posición ranking</dt><dd>{publicPosition > 0 ? `#${publicPosition}` : 'Sin medición'}</dd></div><div><dt>Afiliación</dt><dd>{corporationName}</dd></div></dl></section>
          <section className="public-hero-profile__panel public-hero-profile__panel--status"><p className="page-card__kicker">PRESENCIA PÚBLICA ACTIVA</p><h3>{heroTier}</h3><p>Perfil público con identidad, actividad y reconocimiento consolidados por Red HeroIndex.</p></section>
          <BroadcastSlot className="hero-profile-rail-signal" heroId={hero.id} placement="hero-profile-rail" variant="rail" />
        </aside>
      </div>

      {canViewOraculoTools ? <section className="public-hero-oraculo-tools"><div><p className="page-card__kicker">HERRAMIENTAS ORÁCULO</p><h3>Controles internos separados de la vista pública</h3></div><div className="public-hero-oraculo-tools__actions"><button onClick={() => onNavigate?.('oraculo-hero-dossier', { heroId: hero.id })} type="button">Abrir dossier</button><button onClick={() => onNavigate?.('gm-manager')} type="button">Volver a GM Manager</button><button disabled={isDeletingHero} onClick={handleDeleteHero} type="button">{isDeletingHero ? 'Eliminando...' : 'Eliminar héroe'}</button></div>{deleteError ? <p className="hero-profile-state hero-profile-state--error">{deleteError}</p> : null}{deleteMessage ? <p className="hero-profile-state">{deleteMessage}</p> : null}</section> : null}
    </section>
  )}

export default HeroProfile