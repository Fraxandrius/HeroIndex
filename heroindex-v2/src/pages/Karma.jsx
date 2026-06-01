import { useEffect, useState } from 'react'
import { subscribeToCharacterSheet } from '../services/characterSheetsService.js'
import { subscribeToKarmaTransactions } from '../services/karmaService.js'

const playerHeroId = import.meta.env.VITE_PLAYER_HERO_ID ?? ''

const typeLabels = {
  adjustment: 'Ajuste',
  gain: 'Ganancia',
  penalty: 'Penalización',
  spend: 'Gasto',
}

function formatDate(value) {
  if (!value) return 'Fecha pendiente'

  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatAmount(amount) {
  const value = Number(amount ?? 0)

  return value > 0 ? `+${value}` : String(value)
}

function Karma() {
  const [characterSheet, setCharacterSheet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(Boolean(playerHeroId))
  const [transactionsLoading, setTransactionsLoading] = useState(Boolean(playerHeroId))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!playerHeroId) {
      return undefined
    }

    return subscribeToCharacterSheet(
      playerHeroId,
      (sheet) => {
        setCharacterSheet(sheet)
        setLoading(false)
      },
      () => {
        setError('No fue posible cargar la hoja de personaje.')
        setLoading(false)
      },
    )
  }, [])

  useEffect(() => {
    if (!playerHeroId) {
      return undefined
    }

    return subscribeToKarmaTransactions(
      playerHeroId,
      (items) => {
        setTransactions(items)
        setTransactionsLoading(false)
      },
      () => {
        setError('No fue posible cargar el historial de Karma.')
        setTransactionsLoading(false)
      },
    )
  }, [])

  if (!playerHeroId) {
    return (
      <section className="page-card page-card--player karma-page hi-page hi-page-wide hi-state-card">
        <p>No hay héroe de jugador configurado.</p>
      </section>
    )
  }

  if (loading || transactionsLoading) {
    return (
      <section className="page-card page-card--player karma-page hi-page hi-page-wide hi-state-card">
        <p>Cargando datos...</p>
      </section>
    )
  }

  return (
    <section className="karma-page hi-page hi-page-wide">
      <header className="page-card page-card--player hi-page-header hi-card hi-card-player karma-hero">
        <p className="page-card__kicker">Progresión del jugador</p>
        <h2>Karma</h2>
        <strong>{Number(characterSheet?.karma ?? 0).toLocaleString('es')}</strong>
        <p>
          Karma es tu recurso de progresión. Se gana al final de sesiones y se usa para mejorar
          atributos, poderes, talentos, drawbacks o la base.
        </p>
      </header>

      {error ? <p className="hi-state-card hi-state-card--error">{error}</p> : null}

      <section className="page-card hi-card hi-card-player karma-history">
        <div className="karma-history__header">
          <div>
            <span className="section-kicker">Historial</span>
            <h3>Movimientos de Karma</h3>
          </div>
          <p>Solo lectura para jugadores.</p>
        </div>

        {transactions.length > 0 ? (
          <div className="karma-transaction-list">
            {transactions.map((transaction) => (
              <article className={`karma-transaction karma-transaction--${transaction.type}`} key={transaction.id}>
                <div>
                  <span>{typeLabels[transaction.type] ?? transaction.type}</span>
                  <h4>{transaction.reason || 'Movimiento sin motivo'}</h4>
                  <p>{transaction.notes || 'Sin notas.'}</p>
                </div>
                <dl>
                  <div>
                    <dt>Cantidad</dt>
                    <dd>{formatAmount(transaction.amount)}</dd>
                  </div>
                  <div>
                    <dt>Fecha</dt>
                    <dd>{formatDate(transaction.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Categoría</dt>
                    <dd>{transaction.category || '—'}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p className="hi-state-card">No hay registros disponibles.</p>
        )}
      </section>
    </section>
  )
}

export default Karma