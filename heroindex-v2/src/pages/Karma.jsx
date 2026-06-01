import { useEffect, useMemo, useState } from 'react'
import { subscribeToCampaignLogs } from '../services/campaignLogsService.js'
import { subscribeToCharacterSheet } from '../services/characterSheetsService.js'
import {
  createKarmaTransaction,
  getKarmaGainOptions,
  getKarmaPenaltyOptions,
  subscribeToKarmaTransactions,
} from '../services/karmaService.js'

const playerHeroId = import.meta.env.VITE_PLAYER_HERO_ID ?? ''

const typeLabels = {
  adjustment: 'Ajuste',
  gain: 'Ganancia',
  penalty: 'Penalización',
  spend: 'Gasto',
}

const sourceLabels = {
  oraculo: 'ORÁCULO',
  player: 'Jugador',
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

function getManualAmount(value) {
  const amount = Number(value || 0)

  return Number.isNaN(amount) ? 0 : amount
}

function Karma() {
  const [characterSheet, setCharacterSheet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [campaignLogs, setCampaignLogs] = useState([])
  const [selectedCriteria, setSelectedCriteria] = useState([])
  const [manualAmount, setManualAmount] = useState('0')
  const [manualReason, setManualReason] = useState('')
  const [sessionLogId, setSessionLogId] = useState('')
  const [loading, setLoading] = useState(Boolean(playerHeroId))
  const [transactionsLoading, setTransactionsLoading] = useState(Boolean(playerHeroId))
  const [campaignLogsLoading, setCampaignLogsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const gainOptions = useMemo(() => getKarmaGainOptions(), [])
  const penaltyOptions = useMemo(() => getKarmaPenaltyOptions(), [])
  const allCriteria = useMemo(() => [...gainOptions, ...penaltyOptions], [gainOptions, penaltyOptions])
  const selectedOptions = useMemo(
    () => allCriteria.filter((option) => selectedCriteria.includes(option.category)),
    [allCriteria, selectedCriteria],
  )
  const criteriaTotal = selectedOptions.reduce((total, option) => total + Number(option.amount ?? 0), 0)
  const manualValue = getManualAmount(manualAmount)
  const totalAmount = criteriaTotal + manualValue
  const currentKarma = Number(characterSheet?.karma ?? 0)
  const estimatedKarma = currentKarma + totalAmount

  useEffect(() => {
    if (!playerHeroId) return undefined

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
    if (!playerHeroId) return undefined

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

  useEffect(() => {
    return subscribeToCampaignLogs(
      (items) => {
        setCampaignLogs(items)
        setCampaignLogsLoading(false)
      },
      () => {
        setCampaignLogs([])
        setCampaignLogsLoading(false)
      },
    )
  }, [])

  const handleToggleCriteria = (category) => {
    setSelectedCriteria((currentCriteria) =>
      currentCriteria.includes(category)
        ? currentCriteria.filter((item) => item !== category)
        : [...currentCriteria, category],
    )
    setMessage('')
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    if (totalAmount === 0) {
      setError('Selecciona al menos un criterio o registra un ajuste manual distinto de 0.')
      setSaving(false)
      return
    }

    if (manualValue !== 0 && !manualReason.trim()) {
      setError('El ajuste manual requiere un motivo.')
      setSaving(false)
      return
    }

    if (estimatedKarma < 0) {
      setError('Este movimiento dejaría tu Karma bajo 0.')
      setSaving(false)
      return
    }

    const criteriaLabels = selectedOptions.map((option) => option.label)
    const reason = manualReason.trim() || 'Registro de Karma de sesión'
    const notes = [
      criteriaLabels.length > 0 ? `Criterios: ${criteriaLabels.join(', ')}` : '',
      manualValue !== 0 ? `Ajuste manual: ${formatAmount(manualValue)}` : '',
    ].filter(Boolean).join('\n')

    try {
      await createKarmaTransaction({
        heroId: playerHeroId,
        type: totalAmount >= 0 ? 'gain' : 'penalty',
        amount: totalAmount,
        category: 'session_self_report',
        reason,
        notes,
        criteria: selectedOptions,
        source: 'player',
        status: 'accepted',
        sessionLogId,
        createdBy: 'Jugador',
      })
      setMessage('Karma registrado correctamente.')
      setSelectedCriteria([])
      setManualAmount('0')
      setManualReason('')
      setSessionLogId('')
    } catch (saveError) {
      setError(saveError.message ?? 'No fue posible registrar el Karma.')
    } finally {
      setSaving(false)
    }
  }

  if (!playerHeroId) {
    return (
      <section className="page-card page-card--player karma-page hi-page hi-page-wide hi-state-card">
        <p>No hay héroe de jugador configurado.</p>
      </section>
    )
  }

  if (loading || transactionsLoading || campaignLogsLoading) {
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
        <strong>{currentKarma.toLocaleString('es')}</strong>
        <p>
          Karma es tu recurso de progresión. Se gana al final de sesiones y se usa para mejorar
          atributos, poderes, talentos, drawbacks o la base.
        </p>
      </header>

      {message ? <p className="hi-state-card hi-state-card--success">{message}</p> : null}
      {error ? <p className="hi-state-card hi-state-card--error">{error}</p> : null}

      <section className="page-card hi-card hi-card-player karma-self-assignment">
        <div className="karma-history__header">
          <div>
            <span className="section-kicker">Cierre de sesión</span>
            <h3>Registrar Karma de sesión</h3>
          </div>
          <p>Marca los criterios que aplicaron durante la sesión. ORÁCULO podrá revisar todos los movimientos registrados.</p>
        </div>

        <form className="hi-form karma-self-form" onSubmit={handleSubmit}>
          <fieldset className="karma-criteria-group">
            <legend>Criterios de ganancia</legend>
            {gainOptions.map((option) => (
              <label className="hi-checkbox karma-criteria" key={option.category}>
                <input
                  checked={selectedCriteria.includes(option.category)}
                  onChange={() => handleToggleCriteria(option.category)}
                  type="checkbox"
                />
                <span>{option.label} ({formatAmount(option.amount)})</span>
              </label>
            ))}
          </fieldset>
          <fieldset className="karma-criteria-group">
            <legend>Criterios de pérdida</legend>
            {penaltyOptions.map((option) => (
              <label className="hi-checkbox karma-criteria" key={option.category}>
                <input
                  checked={selectedCriteria.includes(option.category)}
                  onChange={() => handleToggleCriteria(option.category)}
                  type="checkbox"
                />
                <span>{option.label} ({formatAmount(option.amount)})</span>
              </label>
            ))}
          </fieldset>
          <label className="hi-field">
            <span className="hi-label">Registro de campaña opcional</span>
            <select className="hi-select" onChange={(event) => setSessionLogId(event.target.value)} value={sessionLogId}>
              <option value="">Sin registro vinculado</option>
              {campaignLogs.map((log) => (
                <option key={log.id} value={log.id}>{log.title || 'Registro sin título'}</option>
              ))}
            </select>
          </label>
          <label className="hi-field">
            <span className="hi-label">Ajuste manual opcional</span>
            <input className="hi-input" onChange={(event) => setManualAmount(event.target.value)} type="number" value={manualAmount} />
          </label>
          <label className="hi-field karma-self-form__wide">
            <span className="hi-label">Motivo del ajuste manual</span>
            <input className="hi-input" onChange={(event) => setManualReason(event.target.value)} value={manualReason} />
          </label>
          <div className="karma-summary-card karma-self-form__wide">
            <span>Total calculado: <strong>{formatAmount(totalAmount)}</strong></span>
            <span>Karma actual: <strong>{currentKarma}</strong></span>
            <span className={estimatedKarma < 0 ? 'is-danger' : ''}>Karma final estimado: <strong>{estimatedKarma}</strong></span>
          </div>
          <button className="hi-button hi-button-primary karma-self-form__wide" disabled={saving || estimatedKarma < 0} type="submit">
            {saving ? 'Registrando...' : 'Registrar mi Karma'}
          </button>
        </form>
      </section>

      <section className="page-card hi-card hi-card-player karma-history">
        <div className="karma-history__header">
          <div>
            <span className="section-kicker">Historial</span>
            <h3>Movimientos de Karma</h3>
          </div>
          <p>Transparencia completa para tu héroe configurado.</p>
        </div>

        {transactions.length > 0 ? (
          <div className="karma-transaction-list">
            {transactions.map((transaction) => (
              <article className={`karma-transaction karma-transaction--${transaction.type}`} key={transaction.id}>
                <div>
                  <span>{typeLabels[transaction.type] ?? transaction.type} · {sourceLabels[transaction.source] ?? transaction.source}</span>
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
                    <dt>Criterios</dt>
                    <dd>{transaction.criteria?.length ? transaction.criteria.length : '—'}</dd>
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
