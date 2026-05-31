import { useEffect, useState } from 'react'
import { useHeroes } from '../hooks/useHeroes.js'
import {
  createMissionCalculation,
  subscribeToMissionCalculations,
} from '../services/missionCalculationsService.js'

const initialFormState = {
  missionName: '',
  selectedHeroId: 'manual',
  heroName: '',
  missionOutcome: 'Complete success',
  threatLevel: '3',
  publicVisibility: '3',
  civilianRisk: '3',
  collateralDamage: '0',
  corporateAlignment: '3',
  mediaNarrative: 'Controlled',
}

const outcomeModifiers = {
  'Complete success': 20,
  'Partial success': 10,
  'Complicated success': 5,
  Failure: -10,
  'Public disaster': -25,
}

const mediaModifiers = {
  Heroic: 10,
  Controlled: 5,
  Ambiguous: 0,
  Controversial: -8,
  Hostile: -15,
}

const rangeOneToFive = [1, 2, 3, 4, 5]
const rangeZeroToFive = [0, 1, 2, 3, 4, 5]

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function formatDate(value) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function classifyRankingImpact(total) {
  if (total >= 75) {
    return 'Major ranking event'
  }

  if (total >= 40) {
    return 'Positive ranking movement'
  }

  if (total >= 10) {
    return 'Minor ranking adjustment'
  }

  if (total >= -9) {
    return 'No significant movement'
  }

  return 'Reputation loss event'
}

function getHeroDisplayName(hero) {
  if (!hero) {
    return ''
  }

  return hero.alias || hero.name || ''
}

function getCalculationInputs(formState) {
  return {
    missionOutcome: formState.missionOutcome,
    threatLevel: Number(formState.threatLevel),
    publicVisibility: Number(formState.publicVisibility),
    civilianRisk: Number(formState.civilianRisk),
    collateralDamage: Number(formState.collateralDamage),
    corporateAlignment: Number(formState.corporateAlignment),
    mediaNarrative: formState.mediaNarrative,
  }
}

function calculateImpact(formState, selectedHero) {
  const inputs = getCalculationInputs(formState)
  const base = 10
  const outcomeModifier = outcomeModifiers[inputs.missionOutcome] ?? 0
  const mediaModifier = mediaModifiers[inputs.mediaNarrative] ?? 0
  const threatBonus = inputs.threatLevel * 5
  const visibilityBonus = inputs.publicVisibility * 3
  const civilianRiskBonus = inputs.civilianRisk * 2
  const collateralPenalty = inputs.collateralDamage * -5
  const corporateBonus = inputs.corporateAlignment * 2
  const rawTotal =
    base +
    outcomeModifier +
    threatBonus +
    visibilityBonus +
    civilianRiskBonus +
    collateralPenalty +
    corporateBonus +
    mediaModifier
  const total = clamp(rawTotal, -50, 100)

  return {
    missionName: formState.missionName.trim() || 'Unregistered mission',
    heroName: selectedHero
      ? getHeroDisplayName(selectedHero) || 'Unassigned hero'
      : formState.heroName.trim() || 'Unassigned hero',
    heroAlias: selectedHero?.alias ?? '',
    heroId: selectedHero?.id ?? null,
    inputs,
    suggestedRankingPoints: total,
    classification: classifyRankingImpact(total),
    breakdown: {
      base,
      outcomeModifier,
      threatBonus,
      visibilityBonus,
      civilianRiskBonus,
      collateralPenalty,
      corporateBonus,
      mediaModifier,
      total,
    },
  }
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
        status: 'draft',
      })
      setSaveMessage('ORÁCULO assessment saved as draft.')
    } catch (error) {
      setSaveError(error)
    } finally {
      setSavingAssessment(false)
    }
  }

  const handleReset = () => {
    setFormState(initialFormState)
    setResult(null)
    setSaveError(null)
    setSaveMessage(null)
  }

  return (
    <section className="page-card page-card--oracle mission-calculator-page">
      <div className="mission-calculator-hero">
        <p className="page-card__kicker">ORÁCULO / GM Tools</p>
        <h2>ORÁCULO Mission Calculator</h2>
        <p className="mission-calculator-hero__subtitle">
          Internal mission impact estimator for HeroIndex ranking allocation.
        </p>
        <p>
          This tool suggests ranking points based on mission visibility, risk,
          collateral impact and public narrative value.
        </p>
      </div>

      <form className="mission-calculator-form" onSubmit={handleCalculate}>
        <label>
          <span>Mission name</span>
          <input
            name="missionName"
            onChange={handleFieldChange}
            placeholder="Operation Skybreak"
            type="text"
            value={formState.missionName}
          />
        </label>

        <label>
          <span>Select Hero</span>
          <select
            name="selectedHeroId"
            onChange={handleHeroSelectionChange}
            value={formState.selectedHeroId}
          >
            <option value="manual">Manual / unregistered hero</option>
            {activeHeroes.map((hero) => (
              <option key={hero.id} value={hero.id}>
                {[hero.name, hero.alias, hero.corporationId].filter(Boolean).join(' · ')}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Hero name</span>
          <input
            disabled={formState.selectedHeroId !== 'manual'}
            name="heroName"
            onChange={handleFieldChange}
            placeholder="Aegis Prime"
            type="text"
            value={formState.heroName}
          />
        </label>

        <div className="mission-calculator-hero-status">
          {heroesLoading ? <span>Loading heroes...</span> : null}
          {heroesError ? <span>Hero feed unavailable. Manual mode remains available.</span> : null}
          {!heroesLoading && activeHeroes.length === 0 ? (
            <span>No active heroes available. Use manual mode.</span>
          ) : null}
        </div>

        {selectedHero ? (
          <aside className="mission-calculator-context">
            {selectedHero.avatarUrl ? (
              <img alt={`${selectedHero.name} avatar`} src={selectedHero.avatarUrl} />
            ) : (
              <span aria-hidden="true">{(selectedHero.alias || selectedHero.name || 'HI').slice(0, 2)}</span>
            )}
            <div>
              <p className="page-card__kicker">Selected Hero</p>
              <strong>{selectedHero.name}</strong>
              <small>{selectedHero.alias || 'No alias registered'}</small>
            </div>
            <dl>
              <div>
                <dt>Power class</dt>
                <dd>{selectedHero.powerClass || '—'}</dd>
              </div>
              <div>
                <dt>Approval</dt>
                <dd>{selectedHero.approval ?? '—'}</dd>
              </div>
              <div>
                <dt>Trust score</dt>
                <dd>{selectedHero.trustScore ?? '—'}</dd>
              </div>
              <div>
                <dt>Corporation</dt>
                <dd>{selectedHero.corporationId || '—'}</dd>
              </div>
            </dl>
          </aside>
        ) : null}

        <label>
          <span>Mission outcome</span>
          <select
            name="missionOutcome"
            onChange={handleFieldChange}
            value={formState.missionOutcome}
          >
            {Object.keys(outcomeModifiers).map((outcome) => (
              <option key={outcome} value={outcome}>
                {outcome}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Threat level</span>
          <select name="threatLevel" onChange={handleFieldChange} value={formState.threatLevel}>
            {rangeOneToFive.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Public visibility</span>
          <select
            name="publicVisibility"
            onChange={handleFieldChange}
            value={formState.publicVisibility}
          >
            {rangeOneToFive.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Civilian risk</span>
          <select name="civilianRisk" onChange={handleFieldChange} value={formState.civilianRisk}>
            {rangeOneToFive.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Collateral damage</span>
          <select
            name="collateralDamage"
            onChange={handleFieldChange}
            value={formState.collateralDamage}
          >
            {rangeZeroToFive.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Corporate alignment</span>
          <select
            name="corporateAlignment"
            onChange={handleFieldChange}
            value={formState.corporateAlignment}
          >
            {rangeZeroToFive.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Media narrative</span>
          <select
            name="mediaNarrative"
            onChange={handleFieldChange}
            value={formState.mediaNarrative}
          >
            {Object.keys(mediaModifiers).map((narrative) => (
              <option key={narrative} value={narrative}>
                {narrative}
              </option>
            ))}
          </select>
        </label>

        <div className="mission-calculator-actions">
          <button className="gm-manager-action" type="submit">
            Calculate ranking impact
          </button>
          <button className="gm-manager-action" onClick={handleReset} type="button">
            Reset calculation
          </button>
        </div>
      </form>

      {result ? (
        <section className="mission-calculator-result" aria-live="polite">
          <div>
            <p className="page-card__kicker">ORÁCULO assessment generated</p>
            <h3>{result.classification}</h3>
            <p>Awaiting GM confirmation.</p>
          </div>

          <div className="mission-calculator-result__score">
            <span>{result.suggestedRankingPoints}</span>
            <small>suggested ranking points</small>
          </div>

          <dl className="mission-calculator-summary">
            <div>
              <dt>Mission</dt>
              <dd>{result.missionName}</dd>
            </div>
            <div>
              <dt>Hero</dt>
              <dd>{result.heroName}</dd>
            </div>
             <div>
              <dt>Hero alias</dt>
              <dd>{result.heroAlias || '—'}</dd>
            </div>
          </dl>

          <div className="mission-calculator-breakdown">
            <h4>Impact breakdown</h4>
            <dl>
              {Object.entries(result.breakdown).map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          
          <div className="mission-calculator-actions mission-calculator-actions--save">
            <button
              className="gm-manager-action"
              disabled={savingAssessment}
              onClick={handleSaveAssessment}
              type="button"
            >
              {savingAssessment ? 'Saving assessment...' : 'Save ORÁCULO assessment'}
            </button>
            {saveMessage ? <span className="mission-calculator-message">{saveMessage}</span> : null}
            {saveError ? (
              <span className="mission-calculator-message mission-calculator-message--error">
                {saveError.message ?? 'Unable to save ORÁCULO assessment.'}
              </span>
            ) : null}
          </div>
        </section>
      ) : null}
      
      <section className="mission-calculator-history">
        <div>
          <p className="page-card__kicker">ORÁCULO archive</p>
          <h3>ORÁCULO Assessment History</h3>
        </div>

        {historyLoading ? <p>Loading ORÁCULO history...</p> : null}
        {historyError ? (
          <p className="mission-calculator-message mission-calculator-message--error">
            {historyError.message ?? 'Unable to load ORÁCULO history.'}
          </p>
        ) : null}
        {!historyLoading && !historyError && history.length === 0 ? (
          <p>No ORÁCULO assessments recorded yet.</p>
        ) : null}

        {history.length > 0 ? (
          <div className="mission-calculator-history__list">
            {history.slice(0, 8).map((item) => (
              <article className="mission-calculator-history__item" key={item.id}>
                <div>
                  <strong>{item.missionName || 'Unregistered mission'}</strong>
                  <small>
                    {[item.heroName, item.heroAlias].filter(Boolean).join(' · ') || 'Unassigned hero'}
                  </small>
                </div>
                <span>{item.suggestedRankingPoints ?? '—'} pts</span>
                <span>{item.classification || '—'}</span>
                <span>{item.status || 'draft'}</span>
                <time dateTime={item.createdAt ? new Date(item.createdAt).toISOString() : undefined}>
                  {formatDate(item.createdAt)}
                </time>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  )
}

export default MissionCalculator
