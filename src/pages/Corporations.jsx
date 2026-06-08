import { useState } from 'react'
import BroadcastSlot from '../components/broadcast/BroadcastSlot.jsx'
import InlineVisualSlot from '../components/visual/InlineVisualSlot.jsx'
import { useCorporations } from '../hooks/useCorporations.js'
import { useNews } from '../hooks/useNews.js'
import { deleteCorporation } from '../services/corporationsService.js'

const isOraculoMode = import.meta.env.VITE_ORACULO_MODE === 'true'

function getInitials(name = '') {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0])
    .join('')

  return initials || 'HI'
}

function toTimestamp(value) {
  if (!value) return 0
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value

  const parsed = Date.parse(value)

  return Number.isNaN(parsed) ? 0 : parsed
}

function getRelatedNews(corporationId, newsItems) {
  return newsItems
    .filter(
      (newsItem) =>
        newsItem.active !== false &&
        Array.isArray(newsItem.corporationIds) &&
        newsItem.corporationIds.map(String).includes(String(corporationId)),
    )
    .sort(
      (firstItem, secondItem) =>
        toTimestamp(secondItem.createdAt) - toTimestamp(firstItem.createdAt),
    )
    .slice(0, 2)
}

function getCorporationMedia(corporation) {
  return corporation.bannerUrl || corporation.coverUrl || corporation.imageUrl || ''
}

function getCorporationType(corporation) {
  return corporation.sector || corporation.category || corporation.type || 'Operador verificado'
}

function getCorporationCountry(corporation) {
  return corporation.country || corporation.originCountry || corporation.region || 'Cobertura global'
}

function getCorporationApproval(corporation) {
  const approval = corporation.approval ?? corporation.approvalScore

  if (approval === undefined || approval === null || approval === '') return 'En consolidación'

  return String(approval)
}

function Corporations() {
  const { corporations, loading } = useCorporations()
  const [deletingCorporationId, setDeletingCorporationId] = useState(null)
  const [deleteMessage, setDeleteMessage] = useState('')
  const { feedNews, loading: newsLoading } = useNews()
  const visibleCorporations = corporations.filter((corporation) => corporation.active !== false)

  const handleDeleteCorporation = async (corporation) => {
    if (!window.confirm('Eliminar corporación. Esta acción no se puede deshacer.')) return

    setDeletingCorporationId(corporation.id)
    setDeleteMessage('Eliminando registro corporativo...')

    try {
      await deleteCorporation(corporation.id)
      setDeleteMessage('Registro corporativo eliminado correctamente.')
    } catch {
      setDeleteMessage('No fue posible eliminar el registro corporativo.')
    } finally {
      setDeletingCorporationId(null)
    }
  }

  return (
    <section className="page-card corporations-page corporations-page--premium">
      <InlineVisualSlot className="corporations-hero hi-card hi-card-public" page="corporations" section="Cabecera de corporaciones" slotId="corporations-feature-visual">
        <p className="page-card__kicker">OPERADORES VERIFICADOS</p>
        <h2>Corporaciones HeroIndex</h2>
        <p>Agencias, consorcios y operadores estratégicos vinculados al ecosistema heroico.</p>
        <div className="corporations-hero__chips" aria-label="Áreas corporativas verificadas">
          <span>Agencias heroicas</span>
          <span>Tecnología</span>
          <span>Infraestructura</span>
          <span>Red activa</span>
        </div>
      </InlineVisualSlot>

      <section className="corporations-signal-block" aria-label="Canal público corporativo">
        <div className="corporations-section-heading">
          <div>
            <p className="page-card__kicker">CANAL CORPORATIVO</p>
            <h3>Señales públicas verificadas</h3>
          </div>
          <span>Transmisión institucional</span>
        </div>
        <BroadcastSlot className="corporations-broadcast-channel" placement="corporations-feature" variant="feature" />
      </section>

      {deleteMessage && isOraculoMode ? <p className="corporations-oraculo-message">{deleteMessage}</p> : null}

      <section className="corporations-directory" aria-label="Directorio corporativo HeroIndex">
        <div className="corporations-section-heading">
          <div>
            <p className="page-card__kicker">DIRECTORIO OFICIAL</p>
            <h3>Entidades vinculadas</h3>
          </div>
          <span>{visibleCorporations.length} operadores activos</span>
        </div>

        <div className="corporations-grid corporations-list">
          {loading || newsLoading ? <p className="corporations-state">Verificando operadores vinculados a Red HeroIndex…</p> : null}
          {!loading && !newsLoading && visibleCorporations.length === 0 ? (
            <p className="corporations-state">No hay operadores vinculados a Red HeroIndex durante este ciclo.</p>
          ) : null}
          {!loading && !newsLoading
            ? visibleCorporations.map((corporation) => {
                const relatedNews = getRelatedNews(corporation.id, feedNews)
                const mediaUrl = getCorporationMedia(corporation)
                const corporationType = getCorporationType(corporation)

                return (
                  <article className="corporation-card corporation-card--premium" key={corporation.id}>
                    <div className="corporation-card__media">
                      {mediaUrl ? (
                        <img
                          alt={`Canal corporativo de ${corporation.name}`}
                          className="corporation-card__cover"
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.hidden = true
                            event.currentTarget.nextElementSibling?.removeAttribute('hidden')
                          }}
                          src={mediaUrl}
                        />
                      ) : null}
                      <div className="corporation-card__media-placeholder" hidden={Boolean(mediaUrl)}>
                        <span>RED HEROINDEX</span>
                        <strong>CANAL CORPORATIVO</strong>
                      </div>
                      <span className="corporation-card__verified">Operador verificado</span>
                    </div>

                    <div className="corporation-card__body">
                      <div className="corporation-card__identity">
                        <div className="corporation-card__avatar corporation-card__logo">
                          <span>{getInitials(corporation.name)}</span>
                          {corporation.logoUrl ? (
                            <img
                              alt={`Identidad visual de ${corporation.name}`}
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.hidden = true
                              }}
                              src={corporation.logoUrl}
                            />
                          ) : null}
                        </div>
                        <div>
                          <p className="corporation-card__kicker">{corporationType}</p>
                          <h3>{corporation.name}</h3>
                        </div>
                      </div>

                      {corporation.tagline ? <strong className="corporation-card__tagline">{corporation.tagline}</strong> : null}
                      <p className="corporation-card__description">
                        {corporation.description || 'Perfil corporativo en proceso de consolidación pública.'}
                      </p>

                      <dl className="corporation-card__metrics corporation-card__stats">
                        <div className="corporation-card__metric">
                          <dt>País</dt>
                          <dd>{getCorporationCountry(corporation)}</dd>
                        </div>
                        <div className="corporation-card__metric">
                          <dt>Aprobación</dt>
                          <dd>{getCorporationApproval(corporation)}</dd>
                        </div>
                      </dl>

                      <section className="corporation-card__related" aria-label={`Señales relacionadas de ${corporation.name}`}>
                        <div className="corporation-card__related-heading">
                          <span>SEÑALES RELACIONADAS</span>
                          {relatedNews.length > 0 ? <small>{relatedNews.length} activas</small> : null}
                        </div>
                        {relatedNews.length > 0 ? (
                          <ul>
                            {relatedNews.map((newsItem) => (
                              <li key={newsItem.id}>
                                <span>{newsItem.category ?? newsItem.layer ?? newsItem.tag ?? 'Señal verificada'}</span>
                                <strong>{newsItem.title}</strong>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No hay señales públicas asociadas durante el ciclo actual.</p>
                        )}
                      </section>

                      {isOraculoMode ? (
                        <div className="corporation-card__oraculo-actions">
                          <span>Control ORÁCULO</span>
                          <button
                            disabled={deletingCorporationId === corporation.id}
                            onClick={() => handleDeleteCorporation(corporation)}
                            type="button"
                          >
                            {deletingCorporationId === corporation.id ? 'Eliminando...' : 'Eliminar corporación'}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </article>
                )
              })
            : null}
        </div>
      </section>

      <section className="corporations-signal-block corporations-signal-block--compact" aria-label="Señal pública del directorio">
        <BroadcastSlot className="corporations-grid-signal" placement="corporations-grid" variant="inline" />
      </section>
    </section>
  )
}

export default Corporations