import { useEffect, useMemo, useState } from 'react'
import { useHeroes } from '../hooks/useHeroes.js'
import { subscribeToCampaignLogs } from '../services/campaignLogsService.js'
import { subscribeToCharacterSheets } from '../services/characterSheetsService.js'
import {
  createKarmaBatchTransactions,
  getKarmaGainOptions,
  getKarmaPenaltyOptions,
  getKarmaSpendOptions,
  subscribeToAllKarmaTransactions,
} from '../services/karmaService.js'

const sourceLabels = { oraculo: 'ORÁCULO', player: 'Jugador' }
const typeLabels = { adjustment: 'Ajuste', gain: 'Ganancia', penalty: 'Penalización', spend: 'Gasto' }

function getHeroName(hero = {}) {
  return hero.alias || hero.publicName || hero.codename || hero.name || 'Identidad HeroIndex'
}

function formatAmount(amount) {
  const value = Number(amount ?? 0)
  return value > 0 ? `+${value}` : String(value)
}

function formatDate(value) {
  if (!value) return 'Fecha pendiente'
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function getManualAmount(value) {
  const amount = Number(value || 0)
  return Number.isNaN(amount) ? 0 : amount
}

function OraculoKarmaManager({ onNavigate }) {
  const [characterSheets, setCharacterSheets] = useState([])
  const [sheetsLoading, setSheetsLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [transactionsLoading, setTransactionsLoading] = useState(true)
  const [campaignLogs, setCampaignLogs] = useState([])
  const [campaignLogsLoading, setCampaignLogsLoading] = useState(true)
  const [selectedHeroIds, setSelectedHeroIds] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCriteria, setSelectedCriteria] = useState([])
  const [manualAmount, setManualAmount] = useState('0')
  const [manualReason, setManualReason] = useState('')
  const [sessionLogId, setSessionLogId] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { error: heroesError, firebaseHeroes, heroes, loading: heroesLoading } = useHeroes()

  const gainOptions = useMemo(() => getKarmaGainOptions(), [])
  const penaltyOptions = useMemo(() => getKarmaPenaltyOptions(), [])
  const spendOptions = useMemo(() => getKarmaSpendOptions(), [])
  const allCriteria = useMemo(() => [...gainOptions, ...penaltyOptions, ...spendOptions], [gainOptions, penaltyOptions, spendOptions])
  const selectedOptions = useMemo(
    () => allCriteria.filter((option) => selectedCriteria.includes(option.category)),
    [allCriteria, selectedCriteria],
  )
  const criteriaTotal = selectedOptions.reduce((total, option) => total + Number(option.amount ?? 0), 0)
  const manualValue = getManualAmount(manualAmount)
  const totalAmount = criteriaTotal + manualValue
  const allHeroes = firebaseHeroes.length > 0 ? firebaseHeroes : heroes
  const sheetsByHeroId = useMemo(
    () => new Map(characterSheets.map((sheet) => [String(sheet.heroId ?? sheet.id), sheet])),
    [characterSheets],
  )
  const heroesById = useMemo(() => new Map(allHeroes.map((hero) => [String(hero.id), hero])), [allHeroes])
  const search = searchQuery.trim().toLowerCase()
  const visibleHeroes = allHeroes.filter((hero) => {
    if (!search) return true
    return [getHeroName(hero), hero.heroTitle, hero.publicName, hero.codename]
      .some((value) => value?.toString().toLowerCase().includes(search))
  })
  const selectedSummaries = selectedHeroIds.map((heroId) => {
    const sheet = sheetsByHeroId.get(String(heroId))
    const currentKarma = Number(sheet?.karma ?? 0)
    return { heroId, hero: heroesById.get(String(heroId)), sheet, currentKarma, nextKarma: currentKarma + totalAmount }
  })
  const hasNegativeResult = selectedSummaries.some((summary) => summary.sheet && summary.nextKarma < 0)

  useEffect(() => {
    return subscribeToCharacterSheets(
      (items) => { setCharacterSheets(items); setSheetsLoading(false) },
      () => { setError('No fue posible cargar hojas RPG.'); setSheetsLoading(false) },
    )
  }, [])

  useEffect(() => {
    return subscribeToAllKarmaTransactions(
      (items) => { setTransactions(items); setTransactionsLoading(false) },
      () => { setError('No fue posible cargar movimientos de Karma.'); setTransactionsLoading(false) },
    )
  }, [])

  useEffect(() => {
    return subscribeToCampaignLogs(
      (items) => { setCampaignLogs(items); setCampaignLogsLoading(false) },
      () => { setCampaignLogs([]); setCampaignLogsLoading(false) },
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

  const handleToggleHero = (heroId) => {
    setSelectedHeroIds((currentIds) =>
      currentIds.includes(heroId) ? currentIds.filter((id) => id !== heroId) : [...currentIds, heroId],
    )
  }

  const handleSelectVisible = () => {
    setSelectedHeroIds([...new Set([...selectedHeroIds, ...visibleHeroes.map((hero) => hero.id)])])
    setMessage('Héroes visibles seleccionados.')
  }

  const handleClearSelection = () => {
    setSelectedHeroIds([])
    setMessage('Selección limpiada.')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    if (selectedHeroIds.length === 0) {
      setError('Selecciona al menos un héroe.')
      setSaving(false)
      return
    }

    if (totalAmount === 0) {
      setError('Selecciona criterios o registra un ajuste manual distinto de 0.')
      setSaving(false)
      return
    }

    if (manualValue !== 0 && !manualReason.trim()) {
      setError('El ajuste manual requiere un motivo.')
      setSaving(false)
      return
    }

    if (hasNegativeResult) {
      setError('Uno o más héroes quedarían con Karma negativo.')
      setSaving(false)
      return
    }

    const criteriaLabels = selectedOptions.map((option) => option.label)
    const reason = manualReason.trim() || 'Asignación ORÁCULO de Karma'
    const notes = [
      criteriaLabels.length > 0 ? `Criterios: ${criteriaLabels.join(', ')}` : '',
      manualValue !== 0 ? `Ajuste manual: ${formatAmount(manualValue)}` : '',
    ].filter(Boolean).join('\n')

    try {
      const result = await createKarmaBatchTransactions(selectedHeroIds, {
        type: totalAmount >= 0 ? 'gain' : totalAmount <= -10 ? 'spend' : 'penalty',
        amount: totalAmount,
        category: 'oraculo_batch',
        reason,
        notes,
        criteria: selectedOptions,
        source: 'oraculo',
        status: 'accepted',
        sessionLogId,
        createdBy: 'ORÁCULO/GM',
      })
      setMessage(`Karma registrado para ${result.createdTransactions.length} héroe(s). ${result.skippedHeroIds.length ? `${result.skippedHeroIds.length} sin hoja RPG omitido(s).` : ''}`)
      setSelectedCriteria([])
      setManualAmount('0')
      setManualReason('')
      setSessionLogId('')
    } catch (saveError) {
      setError(saveError.message ?? 'No fue posible registrar Karma.')
    } finally {
      setSaving(false)
    }
  }

  if (heroesLoading || sheetsLoading || transactionsLoading || campaignLogsLoading) {
    return <section className="hi-page hi-page-wide hi-state-card"><p>Cargando ORÁCULO...</p></section>
  }

  return (
    <section className="oraculo-karma-manager hi-page hi-page-wide">
      <header className="hi-page-header hi-card hi-card-oraculo oraculo-karma-manager__hero">
        <p className="page-card__kicker">Acceso ORÁCULO</p>
        <h2>Gestor de Karma</h2>
        <p>Asignación y revisión de progresión RPG.</p>
        <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('oraculo-hub')} type="button">Volver a ORÁCULO Hub</button>
      </header>

      {heroesError ? <p className="hi-state-card hi-state-card--error">No fue posible cargar héroes.</p> : null}
      {message ? <p className="hi-state-card hi-state-card--success">{message}</p> : null}
      {error ? <p className="hi-state-card hi-state-card--error">{error}</p> : null}

      <form className="oraculo-karma-manager__layout" onSubmit={handleSubmit}>
        <section className="hi-card hi-card-oraculo oraculo-karma-manager__heroes">
          <div className="karma-history__header">
            <div><span className="section-kicker">Selección</span><h3>Héroes</h3></div>
            <p>{selectedHeroIds.length} seleccionado(s)</p>
          </div>
          <input className="hi-input" onChange={(event) => setSearchQuery(event.target.value)} placeholder="Buscar héroe..." type="search" value={searchQuery} />
          <div className="oraculo-karma-manager__actions">
            <button className="hi-button hi-button-secondary" onClick={handleSelectVisible} type="button">Seleccionar visibles</button>
            <button className="hi-button hi-button-subtle" onClick={handleClearSelection} type="button">Limpiar selección</button>
          </div>
          <div className="oraculo-karma-hero-list">
            {visibleHeroes.map((hero) => {
              const sheet = sheetsByHeroId.get(String(hero.id))
              return (
                <label className="oraculo-karma-hero-row" key={hero.id}>
                  <input checked={selectedHeroIds.includes(hero.id)} onChange={() => handleToggleHero(hero.id)} type="checkbox" />
                  <span><strong>{getHeroName(hero)}</strong><small>{sheet ? `${Number(sheet.karma ?? 0)} Karma` : 'Sin hoja RPG'}</small></span>
                </label>
              )
            })}
          </div>
        </section>

        <section className="hi-card hi-card-oraculo oraculo-karma-manager__criteria">
          <span className="section-kicker">Criterios</span>
          <h3>Movimiento</h3>
          {[['Ganancias', gainOptions], ['Pérdidas', penaltyOptions], ['Gastos', spendOptions]].map(([title, options]) => (
            <fieldset className="karma-criteria-group" key={title}>
              <legend>{title}</legend>
              {options.map((option) => (
                <label className="hi-checkbox karma-criteria" key={option.category}>
                  <input checked={selectedCriteria.includes(option.category)} onChange={() => handleToggleCriteria(option.category)} type="checkbox" />
                  <span>{option.label} ({formatAmount(option.amount)})</span>
                </label>
              ))}
            </fieldset>
          ))}
          <label className="hi-field">
            <span className="hi-label">Registro de campaña opcional</span>
            <select className="hi-select" onChange={(event) => setSessionLogId(event.target.value)} value={sessionLogId}>
              <option value="">Sin registro vinculado</option>
              {campaignLogs.map((log) => <option key={log.id} value={log.id}>{log.title || 'Registro sin título'}</option>)}
            </select>
          </label>
          <label className="hi-field">
            <span className="hi-label">Ajuste manual</span>
            <input className="hi-input" onChange={(event) => setManualAmount(event.target.value)} type="number" value={manualAmount} />
          </label>
          <label className="hi-field">
            <span className="hi-label">Motivo</span>
            <input className="hi-input" onChange={(event) => setManualReason(event.target.value)} value={manualReason} />
          </label>
          <div className="karma-summary-card">
            <span>Total: <strong>{formatAmount(totalAmount)}</strong></span>
            <span>Héroes con hoja RPG: <strong>{selectedSummaries.filter((summary) => summary.sheet).length}</strong></span>
          </div>
          <button className="hi-button hi-button-primary" disabled={saving || hasNegativeResult} type="submit">{saving ? 'Registrando...' : 'Registrar Karma'}</button>
        </section>

        <aside className="hi-card hi-card-oraculo oraculo-karma-manager__summary">
          <span className="section-kicker">Resumen</span>
          <h3>Impacto estimado</h3>
          {selectedSummaries.length > 0 ? selectedSummaries.map((summary) => (
            <article className="karma-summary-row" key={summary.heroId}>
              <strong>{summary.hero ? getHeroName(summary.hero) : summary.heroId}</strong>
              {summary.sheet ? <span className={summary.nextKarma < 0 ? 'is-danger' : ''}>{summary.currentKarma} → {summary.nextKarma}</span> : <span className="is-danger">Sin hoja RPG</span>}
            </article>
          )) : <p className="hi-state-card">No hay héroes seleccionados.</p>}
        </aside>
      </form>

      <section className="hi-card hi-card-oraculo karma-history">
        <div className="karma-history__header">
          <div><span className="section-kicker">Auditoría</span><h3>Historial reciente</h3></div>
          <p>ORÁCULO ve movimientos de jugadores y operadores.</p>
        </div>
        <div className="karma-transaction-list">
          {transactions.slice(0, 12).map((transaction) => {
            const hero = heroesById.get(String(transaction.heroId))
            return (
              <article className={`karma-transaction karma-transaction--${transaction.type}`} key={transaction.id}>
                <div>
                  <span>{sourceLabels[transaction.source] ?? transaction.source} · {typeLabels[transaction.type] ?? transaction.type}</span>
                  <h4>{hero ? getHeroName(hero) : 'Referencia no encontrada'}</h4>
                  <p>{transaction.reason || 'Movimiento sin motivo'}</p>
                </div>
                <dl><div><dt>Cantidad</dt><dd>{formatAmount(transaction.amount)}</dd></div><div><dt>Fecha</dt><dd>{formatDate(transaction.createdAt)}</dd></div></dl>
              </article>
            )
          })}
        </div>
      </section>
    </section>
  )
}

export default OraculoKarmaManager
