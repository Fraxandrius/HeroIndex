import { useEffect, useState } from 'react'
import { useHeroes } from '../hooks/useHeroes.js'
import {
  applyMissionCalculationToHero,
  createMissionCalculation,
  subscribeToMissionCalculations,
  updateMissionCalculationStatus,
} from '../services/missionCalculationsService.js'

const initialFormState = {
  missionName: '',
  selectedHeroId: 'manual',
  heroName: '',
  missionOutcome: 'primeTimeSuccess',
  threatVisibility: '3',
  publicVisibility: '3',
  spectacleIndex: '3',
  collateralOptics: '0',
  corporateAlignment: '3',
  narrativeControl: '3',
  mediaNarrative: 'controlled',
}

const missionOutcomeOptions = [
  { value: 'primeTimeSuccess', label: 'Éxito televisivo', modifier: 25 },
  { value: 'cleanSuccess', label: 'Éxito limpio', modifier: 15 },
  { value: 'complicatedSuccess', label: 'Éxito complicado', modifier: 8 },
  { value: 'quietSuccess', label: 'Éxito silencioso', modifier: 3 },
  { value: 'failure', label: 'Fracaso', modifier: -10 },
  { value: 'publicDisaster', label: 'Desastre público', modifier: -30 },
]

const mediaNarrativeOptions = [
  { value: 'heroic', label: 'Heroica', modifier: 10 },
  { value: 'viral', label: 'Viral', modifier: 15 },
  { value: 'controlled', label: 'Controlada', modifier: 6 },
  { value: 'ambiguous', label: 'Ambigua', modifier: 0 },
  { value: 'controversial', label: 'Controversial', modifier: -8 },
  { value: 'hostile', label: 'Hostil', modifier: -18 },
]

const threatVisibilityOptions = [
  { value: 1, label: 'Menor', modifier: 5 },
  { value: 2, label: 'Local', modifier: 10 },
  { value: 3, label: 'Nivel ciudad', modifier: 15 },
  { value: 4, label: 'Nacional', modifier: 20 },
  { value: 5, label: 'Global', modifier: 25 },
]

const rangeOneToFive = [1, 2, 3, 4, 5]
const rangeZeroToFive = [0, 1, 2, 3, 4, 5]

const classificationTranslations = {
  'Major ranking event': 'Evento mayor de ranking',
  'Positive ranking movement': 'Movimiento público positivo',
  'Minor ranking adjustment': 'Ganancia menor de visibilidad',
  'No significant movement': 'Sin movimiento de mercado significativo',
  'Reputation loss event': 'Pérdida de valor público',
}

const statusLabels = {
  draft: 'Borrador',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}

const breakdownLabels = {
  base: 'Base',
  outcomeModifier: 'Modificador por resultado',
  threatVisibilityBonus: 'Bonificación por visibilidad de amenaza',
  publicVisibilityBonus: 'Bonificación por visibilidad pública',
  spectacleBonus: 'Bonificación por espectáculo',
  collateralOpticsPenalty: 'Penalización por óptica de daño colateral',
  corporateBonus: 'Bonificación corporativa',
  narrativeControlBonus: 'Bonificación por control narrativo',
  mediaModifier: 'Modificador mediático',
  total: 'Total',
}

function formatModifier(value) {
  return value > 0 ? `+${value}` : String(value)
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function formatDate(value) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function classifyRankingImpact(total) {
  if (total >= 120) {
    return 'Auge global de mercado'
  }

  if (total >= 80) {
    return 'Evento mayor de ranking'
  }

  if (total >= 40) {
    return 'Movimiento público positivo'
  }

  if (total >= 10) {
    return 'Ganancia menor de visibilidad'
  }

  if (total >= -9) {
    return 'Sin movimiento de mercado significativo'
  }

  if (total >= -40) {
    return 'Pérdida de valor público'
  }

  return 'Daño severo de marca'
}

function translateClassification(classification) {
  return classificationTranslations[classification] ?? classification ?? '—'
}

function getHeroDisplayName(hero) {
  if (!hero) {
    return ''
  }

  return hero.alias || hero.name || ''
}

function getOptionModifier(options, value) {
  return options.find((option) => option.value === value)?.modifier ?? 0
}

function getCalculationInputs(formState) {
  return {
    missionOutcome: formState.missionOutcome,
    threatVisibility: Number(formState.threatVisibility),
    publicVisibility: Number(formState.publicVisibility),
    spectacleIndex: Number(formState.spectacleIndex),
    collateralOptics: Number(formState.collateralOptics),
    corporateAlignment: Number(formState.corporateAlignment),
    narrativeControl: Number(formState.narrativeControl),
    mediaNarrative: formState.mediaNarrative,
  }
}

function calculateImpact(formState, selectedHero) {
  const inputs = getCalculationInputs(formState)
  const base = 10
  const outcomeModifier = getOptionModifier(missionOutcomeOptions, inputs.missionOutcome)
  const mediaModifier = getOptionModifier(mediaNarrativeOptions, inputs.mediaNarrative)
  const threatVisibilityBonus = inputs.threatVisibility * 5
  const publicVisibilityBonus = inputs.publicVisibility * 4
  const spectacleBonus = inputs.spectacleIndex * 6
  const collateralOpticsPenalty = inputs.collateralOptics * -5
  const corporateBonus = inputs.corporateAlignment * 4
  const narrativeControlBonus = inputs.narrativeControl * 4
  const rawTotal =
    base +
    outcomeModifier +
    threatVisibilityBonus +
    publicVisibilityBonus +
    spectacleBonus +
    collateralOpticsPenalty +
    corporateBonus +
    narrativeControlBonus +
    mediaModifier
  const total = clamp(rawTotal, -75, 150)

  return {
    missionName: formState.missionName.trim() || 'Misión sin registrar',
    heroName: selectedHero
      ? getHeroDisplayName(selectedHero) || 'Héroe sin asignar'
      : formState.heroName.trim() || 'Héroe sin asignar',
    heroAlias: selectedHero?.alias ?? '',
    heroId: selectedHero?.id ?? null,
    inputs,
    suggestedRankingPoints: total,
    classification: classifyRankingImpact(total),
    breakdown: {
      base,
      outcomeModifier,
      threatVisibilityBonus,
      publicVisibilityBonus,
      spectacleBonus,
      collateralOpticsPenalty,
      corporateBonus,
      narrativeControlBonus,
      mediaModifier,
      total,
    },
  }
}

function FactorSelect({ description, label, name, onChange, options, value }) {
  return (
    <label className="mission-calculator-factor">
      <span>{label}</span>
      <small>{description}</small>
      <select name={name} onChange={onChange} value={value}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} ({formatModifier(option.modifier)})
          </option>
        ))}
      </select>
    </label>
  )
}

function MissionCalculator() {
  const { error: heroesError, heroes, loading: heroesLoading } = useHeroes()
  const [formState, setFormState] = useState(initialFormState)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [historyError, setHistoryError] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [saveError, setSaveError] = useState(null)
  const [saveMessage, setSaveMessage] = useState(null)
  const [savingAssessment, setSavingAssessment] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)
  const [statusError, setStatusError] = useState(null)
  const [updatingStatusId, setUpdatingStatusId] = useState(null)
  const [applyingAssessmentId, setApplyingAssessmentId] = useState(null)
  const activeHeroes = heroes.filter((hero) => hero.active !== false)
  const selectedHero =
    formState.selectedHeroId === 'manual'
      ? null
      : activeHeroes.find((hero) => hero.id === formState.selectedHeroId) ?? null

  useEffect(() => {
    return subscribeToMissionCalculations(
      (items) => {
        setHistory(items)
        setHistoryLoading(false)
      },
      (error) => {
        setHistoryError(error)
        setHistoryLoading(false)
      },
    )
  }, [])

  const handleFieldChange = (event) => {
    const { name, value } = event.target

    setFormState((currentFormState) => ({
      ...currentFormState,
      [name]: value,
    }))
    setSaveError(null)
    setSaveMessage(null)
  }

  const handleHeroSelectionChange = (event) => {
    const selectedHeroId = event.target.value
    const nextHero = activeHeroes.find((hero) => hero.id === selectedHeroId)

    setFormState((currentFormState) => ({
      ...currentFormState,
      selectedHeroId,
      heroName: nextHero ? getHeroDisplayName(nextHero) : '',
    }))
    setSaveError(null)
    setSaveMessage(null)
  }

  const handleCalculate = (event) => {
    event.preventDefault()
    setResult(calculateImpact(formState, selectedHero))
    setSaveError(null)
    setSaveMessage(null)
  }

  const handleSaveAssessment = async () => {
    if (!result) {
      return
    }

    setSavingAssessment(true)
    setSaveError(null)
    setSaveMessage(null)

    try {
      await createMissionCalculation({
        missionName: result.missionName,
        heroId: result.heroId,
        heroName: result.heroName,
        heroAlias: result.heroAlias,
        suggestedRankingPoints: result.suggestedRankingPoints,
        classification: result.classification,
        inputs: result.inputs,
        breakdown: result.breakdown,
         applied: false,
        appliedAt: null,
        status: 'draft',
      })
      setSaveMessage('Evaluación ORÁCULO guardada como borrador.')
    } catch (error) {
      setSaveError(error)
    } finally {
      setSavingAssessment(false)
    }
  }

  const handleStatusUpdate = async (calculationId, status) => {
    setUpdatingStatusId(calculationId)
    setStatusError(null)
    setStatusMessage(null)

    try {
      await updateMissionCalculationStatus(calculationId, status)
      setStatusMessage(`Evaluación marcada como ${statusLabels[status] ?? status}. Ranking y Karma no cambian.`)
    } catch (error) {
      setStatusError(error)
    } finally {
      setUpdatingStatusId(null)
    }
  }

   const handleApplyAssessment = async (item) => {
    setApplyingAssessmentId(item.id)
    setStatusError(null)
    setStatusMessage(null)

    try {
      const nextRankingPoints = await applyMissionCalculationToHero(item)
      setStatusMessage(
        `Evaluación aplicada al ranking. Nuevo valor HeroIndex: ${nextRankingPoints}. Karma no cambia.`,
      )
    } catch (error) {
      setStatusError(error)
    } finally {
      setApplyingAssessmentId(null)
    }
  }

  const renderStatusActions = (item) => {
    const status = item.status || 'draft'
    const isUpdating = updatingStatusId === item.id

    if (status === 'draft') {
      return (
        <>
          <button
            className="gm-manager-action"
            disabled={isUpdating}
            onClick={() => handleStatusUpdate(item.id, 'approved')}
            type="button"
          >
             Aprobar
          </button>
          <button
            className="gm-manager-action"
            disabled={isUpdating}
            onClick={() => handleStatusUpdate(item.id, 'rejected')}
            type="button"
          >
            Rechazar
          </button>
        </>
      )
    }

    if (status === 'approved') {
      return (
        <>
          <button
            className="gm-manager-action"
            disabled={isUpdating}
            onClick={() => handleStatusUpdate(item.id, 'draft')}
            type="button"
          >
            Volver a borrador
          </button>
          <button
            className="gm-manager-action"
            disabled={isUpdating}
            onClick={() => handleStatusUpdate(item.id, 'rejected')}
            type="button"
          >
            Rechazar
          </button>
        </>
      )
    }

    return (
      <>
        <button
          className="gm-manager-action"
          disabled={isUpdating}
          onClick={() => handleStatusUpdate(item.id, 'draft')}
          type="button"
        >
          Volver a borrador
        </button>
        <button
          className="gm-manager-action"
          disabled={isUpdating}
          onClick={() => handleStatusUpdate(item.id, 'approved')}
          type="button"
        >
          Aprobar
        </button>
      </>
    )
  }

  const renderApplyAction = (item) => {
    const status = item.status || 'draft'
    const isApplying = applyingAssessmentId === item.id

    if (item.applied === true) {
      return <span className="mission-calculator-message">Aplicado al ranking</span>
    }

    if (status === 'approved' && item.heroId) {
      return (
        <button
          className="gm-manager-action"
          disabled={isApplying}
          onClick={() => handleApplyAssessment(item)}
          type="button"
        >
          {isApplying ? 'Aplicando...' : 'Aplicar al ranking'}
        </button>
      )
    }

    return <span className="mission-calculator-history__hint">Requiere aprobación y héroe vinculado.</span>
  }

  const handleReset = () => {
    setFormState(initialFormState)
    setResult(null)
    setSaveError(null)
    setSaveMessage(null)
  }
 const renderBreakdown = (breakdown) =>
    Object.entries(breakdown).map(([key, value]) => (
      <div key={key}>
        <dt>{breakdownLabels[key] ?? key}</dt>
        <dd>{value}</dd>
      </div>
    ))

  return (
    <section className="page-card page-card--oracle mission-calculator-page">
      <div className="mission-calculator-hero">
        <p className="page-card__kicker">ORÁCULO / mercado heroico</p>
        <h2>Calculadora de Misión ORÁCULO</h2>
        <p className="mission-calculator-hero__subtitle">
          Estimador interno de impacto de mercado para asignación de ranking HeroIndex.
        </p>
        <p>
          ORÁCULO evalúa espectáculo, visibilidad, control narrativo y alineación corporativa
          para sugerir puntos de ranking HeroIndex. Estos puntos no son Karma y no miden
          mérito moral.
        </p>
      </div>

      <div className="mission-calculator-layout">
        <form className="mission-calculator-form" onSubmit={handleCalculate}>
          <label>
            <span>Nombre de la misión</span>
            <input
              name="missionName"
              onChange={handleFieldChange}
              placeholder="Operación Cielo de Vidrio"
              type="text"
              value={formState.missionName}
            />
          </label>

          <label>
            <span>Héroe evaluado</span>
            <select
              name="selectedHeroId"
              onChange={handleHeroSelectionChange}
              value={formState.selectedHeroId}
            >
              <option value="manual">Héroe no registrado / ingreso manual</option>
              {activeHeroes.map((hero) => (
                <option key={hero.id} value={hero.id}>
                  {[hero.name, hero.alias, hero.corporationId].filter(Boolean).join(' · ')}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Nombre del héroe manual</span>
            <input
              disabled={formState.selectedHeroId !== 'manual'}
              name="heroName"
              onChange={handleFieldChange}
              placeholder="Centinela Prime"
              type="text"
              value={formState.heroName}
            />
          </label>

          <div className="mission-calculator-hero-status">
            {heroesLoading ? <span>Cargando héroes...</span> : null}
            {heroesError ? <span>No se pudo cargar el feed de héroes. El modo manual sigue disponible.</span> : null}
            {!heroesLoading && activeHeroes.length === 0 ? (
              <span>No hay héroes activos disponibles. Usa el modo manual.</span>
            ) : null}
          </div>

          {selectedHero ? (
            <aside className="mission-calculator-context">
              {selectedHero.avatarUrl ? (
                <img alt={`Avatar de ${selectedHero.name}`} src={selectedHero.avatarUrl} />
              ) : (
                <span aria-hidden="true">{(selectedHero.alias || selectedHero.name || 'HI').slice(0, 2)}</span>
              )}
              <div>
                <p className="page-card__kicker">Héroe seleccionado</p>
                <strong>{selectedHero.name}</strong>
                <small>{selectedHero.alias || 'Sin alias registrado'}</small>
              </div>
              <dl>
                <div>
                  <dt>Clase de poder</dt>
                  <dd>{selectedHero.powerClass || '—'}</dd>
                </div>
                <div>
                  <dt>Aprobación</dt>
                  <dd>{selectedHero.approval ?? '—'}</dd>
                </div>
                <div>
                  <dt>Confianza</dt>
                  <dd>{selectedHero.trustScore ?? '—'}</dd>
                </div>
                <div>
                  <dt>Corporación</dt>
                  <dd>{selectedHero.corporationId || '—'}</dd>
                </div>
              </dl>
            </aside>
          ) : null}

          <FactorSelect
            description="Cómo vendió HeroIndex el cierre de la misión."
            label="Resultado de la misión"
            name="missionOutcome"
            onChange={handleFieldChange}
            options={missionOutcomeOptions}
            value={formState.missionOutcome}
          />

          <FactorSelect
            description="¿Qué tan visible y vendible fue la amenaza?"
            label="Visibilidad de la amenaza"
            name="threatVisibility"
            onChange={handleFieldChange}
            options={threatVisibilityOptions}
            value={formState.threatVisibility}
          />

          <FactorSelect
            description="¿Cuántos civiles, cámaras o transmisiones presenciaron el evento?"
            label="Visibilidad pública"
            name="publicVisibility"
            onChange={handleFieldChange}
            options={rangeOneToFive.map((value) => ({
              value,
              label: `${value}`,
              modifier: value * 4,
            }))}
            value={formState.publicVisibility}
          />

          <FactorSelect
            description="¿Qué tan visualmente impresionante fue la intervención del héroe?"
            label="Índice de espectáculo"
            name="spectacleIndex"
            onChange={handleFieldChange}
            options={rangeOneToFive.map((value) => ({
              value,
              label: `${value}`,
              modifier: value * 6,
            }))}
            value={formState.spectacleIndex}
          />

          <FactorSelect
            description="¿Qué tan dañino se vio el daño colateral para la narrativa pública?"
            label="Óptica del daño colateral"
            name="collateralOptics"
            onChange={handleFieldChange}
            options={rangeZeroToFive.map((value) => ({
              value,
              label: `${value}`,
              modifier: value * -5,
            }))}
            value={formState.collateralOptics}
          />

          <FactorSelect
            description="¿Qué tan bien sirvió el evento a intereses corporativos o institucionales?"
            label="Alineación corporativa"
            name="corporateAlignment"
            onChange={handleFieldChange}
            options={rangeZeroToFive.map((value) => ({
              value,
              label: `${value}`,
              modifier: value * 4,
            }))}
            value={formState.corporateAlignment}
          />

          <FactorSelect
            description="¿Qué tan fácil es para HeroIndex controlar y encuadrar la historia?"
            label="Control narrativo"
            name="narrativeControl"
            onChange={handleFieldChange}
            options={rangeZeroToFive.map((value) => ({
              value,
              label: `${value}`,
              modifier: value * 4,
            }))}
            value={formState.narrativeControl}
          />

          <FactorSelect
            description="Lectura pública dominante después de la misión."
            label="Narrativa mediática"
            name="mediaNarrative"
            onChange={handleFieldChange}
            options={mediaNarrativeOptions}
            value={formState.mediaNarrative}
          />

          <div className="mission-calculator-actions">
            <button className="gm-manager-action" type="submit">
              Calcular impacto de ranking
            </button>
            <button className="gm-manager-action" onClick={handleReset} type="button">
              Reiniciar cálculo
            </button>
          </div>
        </form>

        <aside className="mission-calculator-side-panel">
          {result ? (
            <section className="mission-calculator-result" aria-live="polite">
              <div>
                <p className="page-card__kicker">Evaluación ORÁCULO generada</p>
                <h3>{translateClassification(result.classification)}</h3>
                <p>Proyección de valor de mercado pendiente de confirmación del GM.</p>
              </div>

              <div className="mission-calculator-result__score">
                <span>{result.suggestedRankingPoints}</span>
                <small>puntos de ranking sugeridos</small>
              </div>

              <dl className="mission-calculator-summary">
                <div>
                  <dt>Misión</dt>
                  <dd>{result.missionName}</dd>
                </div>
                <div>
                  <dt>Héroe</dt>
                  <dd>{result.heroName}</dd>
                </div>
                <div>
                  <dt>Alias</dt>
                  <dd>{result.heroAlias || '—'}</dd>
                </div>
              </dl>

              <div className="mission-calculator-breakdown">
                <h4>Desglose de mercado</h4>
                <dl>{renderBreakdown(result.breakdown)}</dl>
              </div>

              <div className="mission-calculator-actions mission-calculator-actions--save">
                <button
                  className="gm-manager-action"
                  disabled={savingAssessment}
                  onClick={handleSaveAssessment}
                  type="button"
                >
                  {savingAssessment ? 'Guardando evaluación...' : 'Guardar evaluación ORÁCULO'}
                </button>
                {saveMessage ? <span className="mission-calculator-message">{saveMessage}</span> : null}
                {saveError ? (
                  <span className="mission-calculator-message mission-calculator-message--error">
                    {saveError.message ?? 'No se pudo guardar la evaluación ORÁCULO.'}
                  </span>
                ) : null}
              </div>
            </section>
          ) : (
            <section className="mission-calculator-result mission-calculator-result--empty">
              <p className="page-card__kicker">Resultado ORÁCULO</p>
              <h3>Sin cálculo activo</h3>
              <p>
                Completa los factores de mercado para estimar valor público, potencial comercial y
                puntos de ranking sugeridos. No se modificará Ranking ni Karma.
              </p>
            </section>
          )}
        </aside>
      </div>

      <section className="mission-calculator-history">
        <div>
          <p className="page-card__kicker">Archivo ORÁCULO</p>
          <h3>Historial de evaluaciones ORÁCULO</h3>
        </div>

        <p className="mission-calculator-history__note">
          La revisión de estado es interna: aprobar o rechazar evaluaciones no cambia Ranking ni Karma todavía.
        </p>
        {statusMessage ? <p className="mission-calculator-message">{statusMessage}</p> : null}
        {statusError ? (
          <p className="mission-calculator-message mission-calculator-message--error">
            {statusError.message ?? 'No se pudo actualizar el estado de la evaluación.'}
          </p>
        ) : null}

        {historyLoading ? <p>Cargando historial ORÁCULO...</p> : null}
        {historyError ? (
          <p className="mission-calculator-message mission-calculator-message--error">
            {historyError.message ?? 'No se pudo cargar el historial ORÁCULO.'}
          </p>
        ) : null}
        {!historyLoading && !historyError && history.length === 0 ? (
          <p>Sin evaluaciones ORÁCULO registradas.</p>
        ) : null}

        {history.length > 0 ? (
          <div className="mission-calculator-history__list">
            {history.slice(0, 8).map((item) => (
              <article className="mission-calculator-history__item" key={item.id}>
                <div>
                  <strong>{item.missionName || 'Misión sin registrar'}</strong>
                  <small>
                    {[item.heroName, item.heroAlias].filter(Boolean).join(' · ') || 'Héroe sin asignar'}
                  </small>
                </div>
                <span>{item.suggestedRankingPoints ?? '—'} pts</span>
                <span>{translateClassification(item.classification)}</span>
                <span className={`mission-calculator-status mission-calculator-status--${item.status || 'draft'}`}>
                  {statusLabels[item.status || 'draft'] ?? item.status ?? 'Borrador'}
                </span>
                <time dateTime={item.createdAt ? new Date(item.createdAt).toISOString() : undefined}>
                  {formatDate(item.createdAt)}
                </time>
                    <div className="mission-calculator-history__applied">
                  {item.applied ? (
                    <>
                      <span>Aplicado al ranking</span>
                      <small>{item.appliedAt ? formatDate(item.appliedAt) : '—'}</small>
                    </>
                  ) : (
                    <span>Pendiente de aplicación</span>
                  )}
                </div>
                <div className="mission-calculator-history__actions">
                  {renderStatusActions(item)}
                  {renderApplyAction(item)}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  )
}

export default MissionCalculator
