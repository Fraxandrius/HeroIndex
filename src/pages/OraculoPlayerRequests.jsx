import { useEffect, useMemo, useState } from 'react'
import { useHeroes } from '../hooks/useHeroes.js'
import { createOrUpdateUserProfile } from '../services/authService.js'
import {
  subscribeToPlayerHeroRequests,
  updatePlayerHeroRequest,
} from '../services/playerHeroRequestsService.js'

const statusLabels = {
  approved: 'Aprobada',
  pending: 'Pendiente',
  rejected: 'Rechazada',
  resolved: 'Resuelta',
}

function formatDate(value) {
  if (!value) return 'Fecha pendiente'

  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getHeroDisplayName(hero = {}) {
  return hero.alias || hero.publicName || hero.codename || hero.name || 'Identidad HeroIndex'
}

function getHeroTitle(hero = {}) {
  return hero.heroTitle || 'Figura HeroIndex'
}

function OraculoPlayerRequests({ onNavigate }) {
  const { heroes, loading: heroesLoading } = useHeroes()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selectedHeroes, setSelectedHeroes] = useState({})
  const [savingId, setSavingId] = useState('')

  useEffect(
    () => subscribeToPlayerHeroRequests(
      (items) => {
        setRequests(items)
        setLoading(false)
      },
      () => {
        setError('No fue posible cargar las solicitudes de jugadores.')
        setLoading(false)
      },
    ),
    [],
  )

  const activeHeroes = useMemo(
    () => heroes.filter((hero) => hero.active !== false),
    [heroes],
  )
  const pendingCount = requests.filter((request) => request.status === 'pending').length
  const resolvedCount = requests.filter((request) => request.status === 'resolved').length

  const handleStatusUpdate = async (requestId, status) => {
    setSavingId(requestId)
    setError('')
    setMessage('Actualizando solicitud...')

    try {
      await updatePlayerHeroRequest(requestId, { status })
      setMessage(status === 'rejected' ? 'Solicitud marcada como rechazada.' : 'Solicitud marcada como resuelta.')
    } catch {
      setMessage('')
      setError('No fue posible actualizar la solicitud.')
    } finally {
      setSavingId('')
    }
  }

  const handleLinkHero = async (request) => {
    const nextHeroId = selectedHeroes[request.id]

    if (!request.uid || !nextHeroId) {
      setError('Selecciona un héroe antes de vincular la solicitud.')
      setMessage('')
      return
    }

    setSavingId(request.id)
    setError('')
    setMessage('Vinculando héroe a la cuenta del jugador...')

    try {
      await createOrUpdateUserProfile(request.uid, { heroId: nextHeroId })
      await updatePlayerHeroRequest(request.id, { heroId: nextHeroId, status: 'resolved' })
      setMessage('Héroe vinculado y solicitud resuelta correctamente.')
    } catch {
      setMessage('')
      setError('No fue posible vincular el héroe solicitado.')
    } finally {
      setSavingId('')
    }
  }

  if (loading) {
    return (
      <section className="oraculo-player-requests hi-page hi-page-wide hi-state-card">
        <p>Cargando solicitudes de jugadores...</p>
      </section>
    )
  }

  return (
    <section className="oraculo-player-requests hi-page hi-page-wide">
      <header className="hi-page-header hi-card hi-card-oraculo oraculo-player-requests__hero">
        <div>
          <p className="page-card__kicker">ORÁCULO · Vinculación de jugadores</p>
          <h2>Solicitudes de jugadores</h2>
          <p>Revisa solicitudes de vinculación heroica y conecta cuentas de jugador con héroes existentes.</p>
        </div>
        <div className="oraculo-player-requests__metrics">
          <span className="hi-chip">{requests.length} solicitudes</span>
          <span className="hi-chip">{pendingCount} pendientes</span>
          <span className="hi-chip">{resolvedCount} resueltas</span>
        </div>
      </header>

      {message ? <p className="hi-state-card hi-state-card--success">{message}</p> : null}
      {error ? <p className="hi-state-card hi-state-card--error">{error}</p> : null}

      <div className="oraculo-player-requests__list">
        {requests.length === 0 ? (
          <article className="hi-card hi-card-oraculo oraculo-player-request-card">
            <p>No hay solicitudes de jugadores.</p>
          </article>
        ) : null}

        {requests.map((request) => (
          <article className="hi-card hi-card-oraculo oraculo-player-request-card" key={request.id}>
            <div className="oraculo-player-request-card__content">
              <div>
                <span className="hi-chip">{statusLabels[request.status] || request.status}</span>
                <h3>{request.requestedHeroName || 'Héroe no especificado'}</h3>
                <p>{request.notes || 'Sin notas adicionales.'}</p>
              </div>
              <dl className="oraculo-player-request-card__meta">
                <div>
                  <dt>Usuario</dt>
                  <dd>{request.username || 'Usuario no registrado'}</dd>
                </div>
                <div>
                  <dt>Nombre visible</dt>
                  <dd>{request.displayName || 'Sin nombre visible'}</dd>
                </div>
                <div>
                  <dt>Creada</dt>
                  <dd>{formatDate(request.createdAt)}</dd>
                </div>
              </dl>
            </div>

            <div className="oraculo-player-request-card__actions">
              <label className="hi-field">
                <span className="hi-label">Vincular héroe existente</span>
                <select
                  className="hi-select"
                  disabled={heroesLoading || savingId === request.id}
                  onChange={(event) => setSelectedHeroes((current) => ({ ...current, [request.id]: event.target.value }))}
                  value={selectedHeroes[request.id] ?? request.heroId ?? ''}
                >
                  <option value="">Seleccionar héroe</option>
                  {activeHeroes.map((hero) => (
                    <option key={hero.id} value={hero.id}>
                      {getHeroDisplayName(hero)} · {getHeroTitle(hero)}
                    </option>
                  ))}
                </select>
              </label>

              <button className="hi-button hi-button-primary" disabled={savingId === request.id} onClick={() => handleLinkHero(request)} type="button">
                Vincular héroe
              </button>
              <button className="hi-button hi-button-secondary" disabled={savingId === request.id} onClick={() => handleStatusUpdate(request.id, 'resolved')} type="button">
                Marcar resuelta
              </button>
              <button className="hi-button hi-button-danger" disabled={savingId === request.id} onClick={() => handleStatusUpdate(request.id, 'rejected')} type="button">
                Marcar rechazada
              </button>
            </div>
          </article>
        ))}
      </div>

      <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('oraculo-hub')} type="button">
        Volver a ORÁCULO Hub
      </button>
    </section>
  )
}

export default OraculoPlayerRequests