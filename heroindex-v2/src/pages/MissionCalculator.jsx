import { useState } from 'react'

const initialFormState = {
  missionName: '',
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

function calculateImpact(formState) {
  const base = 10
  const threatLevel = Number(formState.threatLevel)
  const publicVisibility = Number(formState.publicVisibility)
  const civilianRisk = Number(formState.civilianRisk)
  const collateralDamage = Number(formState.collateralDamage)
  const corporateAlignment = Number(formState.corporateAlignment)
  const outcomeModifier = outcomeModifiers[formState.missionOutcome] ?? 0
  const mediaModifier = mediaModifiers[formState.mediaNarrative] ?? 0
  const threatBonus = threatLevel * 5
  const visibilityBonus = publicVisibility * 3
  const civilianRiskBonus = civilianRisk * 2
  const collateralPenalty = collateralDamage * -5
  const corporateBonus = corporateAlignment * 2
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
    heroName: formState.heroName.trim() || 'Unassigned hero',
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
  const [formState, setFormState] = useState(initialFormState)
  const [result, setResult] = useState(null)

  const handleFieldChange = (event) => {
    const { name, value } = event.target

    setFormState((currentFormState) => ({
      ...currentFormState,
      [name]: value,
    }))
  }

  const handleCalculate = (event) => {
    event.preventDefault()
    setResult(calculateImpact(formState))
  }

  const handleReset = () => {
    setFormState(initialFormState)
    setResult(null)
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
          <span>Hero name</span>
          <input
            name="heroName"
            onChange={handleFieldChange}
            placeholder="Aegis Prime"
            type="text"
            value={formState.heroName}
          />
        </label>

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
        </section>
      ) : null}
    </section>
  )
}

export default MissionCalculator
