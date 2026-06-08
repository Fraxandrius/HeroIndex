import { useMemo, useState } from 'react'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { updateCorporationMetricsBulk } from '../services/corporationsService.js'
import { updateHeroMetricsBulk } from '../services/heroesService.js'

const targetOptions = [
  { value: 'active-heroes', label: 'Todos los héroes activos' },
  { value: 'corporate-heroes', label: 'Todos los héroes corporativos' },
  { value: 'corporation-heroes', label: 'Héroes de una corporación específica' },
  { value: 'independent-heroes', label: 'Todos los héroes independientes' },
  { value: 'top-heroes', label: 'Top N héroes del ranking' },
  { value: 'all-corporations', label: 'Todas las corporaciones' },
  { value: 'corporation', label: 'Una corporación específica' },
  { value: 'heroes-and-corporations', label: 'Héroes + corporaciones' },
]

const operationOptions = [
  { value: 'add', label: 'Sumar / restar número fijo' },
  { value: 'percent', label: 'Multiplicar por porcentaje' },
  { value: 'set', label: 'Setear valor exacto' },
  { value: 'zero', label: 'Setear a 0' },
  { value: 'random', label: 'Aleatorio dentro de rango' },
]

const metricDefinitions = {
  heroes: [
    { key: 'rankingPoints', label: 'Puntos de ranking', min: 0 },
    { key: 'approval', label: 'Aprobación', max: 100, min: 0 },
    { key: 'trustScore', label: 'Confianza pública', max: 100, min: 0 },
  ],
  corporations: [
    { key: 'approval', label: 'Aprobación', max: 100, min: 0 },
    { key: 'trustScore', label: 'Confianza pública', max: 100, min: 0 },
  ],
}

const defaultMetricControls = {
  corporationApproval: { enabled: false, key: 'approval', operation: 'add', rangeMax: 0, rangeMin: -10, targetType: 'corporations', value: -10 },
  corporationTrustScore: { enabled: false, key: 'trustScore', operation: 'add', rangeMax: 0, rangeMin: -15, targetType: 'corporations', value: -15 },
  heroApproval: { enabled: true, key: 'approval', operation: 'add', rangeMax: -10, rangeMin: -35, targetType: 'heroes', value: -10 },
  heroRankingPoints: { enabled: true, key: 'rankingPoints', operation: 'percent', rangeMax: -10, rangeMin: -35, targetType: 'heroes', value: -15 },
  heroTrustScore: { enabled: true, key: 'trustScore', operation: 'add', rangeMax: -10, rangeMin: -35, targetType: 'heroes', value: -15 },
}

const presets = [
  {
    id: 'light-corporate-crisis',
    title: 'Crisis corporativa leve',
    description: 'Impacto moderado sobre héroes corporativos.',
    form: { targetMode: 'corporate-heroes' },
    metrics: {
      heroApproval: { enabled: true, operation: 'add', value: -10 },
      heroRankingPoints: { enabled: true, operation: 'percent', value: -15 },
      heroTrustScore: { enabled: true, operation: 'add', value: -15 },
    },
  },
  {
    id: 'severe-corporate-crisis',
    title: 'Crisis corporativa severa',
    description: 'Castigo fuerte a reputación y ranking corporativo.',
    form: { targetMode: 'corporate-heroes' },
    metrics: {
      heroApproval: { enabled: true, operation: 'add', value: -25 },
      heroRankingPoints: { enabled: true, operation: 'percent', value: -35 },
      heroTrustScore: { enabled: true, operation: 'add', value: -35 },
    },
  },
  {
    id: 'trust-collapse',
    title: 'Colapso de confianza',
    description: 'Crisis masiva sobre todos los héroes seleccionados.',
    form: { targetMode: 'active-heroes' },
    metrics: {
      heroApproval: { enabled: true, operation: 'add', value: -40 },
      heroRankingPoints: { enabled: true, operation: 'percent', value: -60 },
      heroTrustScore: { enabled: true, operation: 'add', value: -50 },
    },
  },
  {
    id: 'zero-reputation',
    title: 'Reputación a cero',
    description: 'Lleva aprobación y confianza a cero; ranking queda opcional.',
    form: { targetMode: 'heroes-and-corporations' },
    metrics: {
      corporationApproval: { enabled: true, operation: 'zero' },
      corporationTrustScore: { enabled: true, operation: 'zero' },
      heroApproval: { enabled: true, operation: 'zero' },
      heroRankingPoints: { enabled: false, operation: 'zero' },
      heroTrustScore: { enabled: true, operation: 'zero' },
    },
  },
  {
    id: 'independent-rebound',
    title: 'Rebote independiente',
    description: 'Mejora moderada para héroes sin operador corporativo.',
    form: { targetMode: 'independent-heroes' },
    metrics: {
      heroApproval: { enabled: true, operation: 'add', value: 15 },
      heroRankingPoints: { enabled: false, operation: 'percent', value: 0 },
      heroTrustScore: { enabled: true, operation: 'add', value: 10 },
    },
  },
]

function getNumberValue(value) {
  const numberValue = Number(value ?? 0)

  return Number.isNaN(numberValue) ? 0 : numberValue
}

function clampValue(value, metric) {
  const minValue = metric.min ?? Number.NEGATIVE_INFINITY
  const maxValue = metric.max ?? Number.POSITIVE_INFINITY

  return Math.min(Math.max(value, minValue), maxValue)
}

function getDisplayName(item = {}, type) {
  if (type === 'hero') return item.alias || item.publicName || item.codename || item.name || 'Identidad HeroIndex'

  return item.name || item.publicName || 'Operador corporativo'
}

function isIndependentHero(hero = {}) {
  const corporationId = hero.corporationId || hero.corporation || hero.affiliationId

  return !corporationId || corporationId === 'independent' || corporationId === 'none'
}

function getHeroCorporationId(hero = {}) {
  return hero.corporationId || hero.corporation || hero.affiliationId || ''
}

function isPlayerLinkedHero(hero = {}) {
  return Boolean(hero.isPlayerHero || hero.ownerUid || hero.playerUid || hero.createdByUid)
}

function getMetricDefinition(targetType, metricKey) {
  return metricDefinitions[targetType].find((metric) => metric.key === metricKey)
}

function applyOperation(currentValue, control, metric) {
  if (control.operation === 'zero') return clampValue(0, metric)

  if (control.operation === 'set') {
    return clampValue(getNumberValue(control.value), metric)
  }

  if (control.operation === 'percent') {
    return clampValue(Math.round(currentValue * (1 + getNumberValue(control.value) / 100)), metric)
  }

  if (control.operation === 'random') {
    const minValue = getNumberValue(control.rangeMin)
    const maxValue = getNumberValue(control.rangeMax)
    const lowerValue = Math.min(minValue, maxValue)
    const upperValue = Math.max(minValue, maxValue)
    const delta = lowerValue + Math.random() * (upperValue - lowerValue)

    return clampValue(Math.round(currentValue + delta), metric)
  }

  return clampValue(Math.round(currentValue + getNumberValue(control.value)), metric)
}

function getTargetEntities({ corporations, formState, heroes }) {
  const includeInactive = formState.includeInactive
  const activeHeroes = heroes.filter((hero) => includeInactive || hero.active !== false)
  const activeCorporations = corporations.filter((corporation) => includeInactive || corporation.active !== false)
  const selectedCorporationId = formState.corporationId

  if (formState.targetMode === 'corporate-heroes') {
    return { corporations: [], heroes: activeHeroes.filter((hero) => !isIndependentHero(hero)) }
  }

  if (formState.targetMode === 'corporation-heroes') {
    return { corporations: [], heroes: activeHeroes.filter((hero) => getHeroCorporationId(hero) === selectedCorporationId) }
  }

  if (formState.targetMode === 'independent-heroes') {
    return { corporations: [], heroes: activeHeroes.filter(isIndependentHero) }
  }

  if (formState.targetMode === 'top-heroes') {
    return {
      corporations: [],
      heroes: [...activeHeroes]
        .sort((firstHero, secondHero) => getNumberValue(secondHero.rankingPoints) - getNumberValue(firstHero.rankingPoints))
        .slice(0, Math.max(1, getNumberValue(formState.topN))),
    }
  }

  if (formState.targetMode === 'all-corporations') {
    return { corporations: activeCorporations, heroes: [] }
  }

  if (formState.targetMode === 'corporation') {
    return { corporations: activeCorporations.filter((corporation) => corporation.id === selectedCorporationId), heroes: [] }
  }

  if (formState.targetMode === 'heroes-and-corporations') {
    return { corporations: activeCorporations, heroes: activeHeroes }
  }

  return { corporations: [], heroes: activeHeroes }
}

function getEnabledControls(metricControls, targetType) {
  return Object.values(metricControls).filter((control) => control.enabled && control.targetType === targetType)
}

function buildPreviewRows({ corporations, formState, heroes, metricControls }) {
  const targets = getTargetEntities({ corporations, formState, heroes })
  const heroControls = getEnabledControls(metricControls, 'heroes')
  const corporationControls = getEnabledControls(metricControls, 'corporations')
  const rows = []

  targets.heroes.forEach((hero) => {
    const changes = heroControls.map((control) => {
      const metric = getMetricDefinition('heroes', control.key)
      const currentValue = getNumberValue(hero[control.key])
      const nextValue = applyOperation(currentValue, control, metric)

      return {
        currentValue,
        key: control.key,
        label: metric.label,
        nextValue,
        difference: nextValue - currentValue,
      }
    })

    if (changes.length > 0) {
      rows.push({ changes, entity: hero, id: hero.id, name: getDisplayName(hero, 'hero'), type: 'hero' })
    }
  })

  targets.corporations.forEach((corporation) => {
    const changes = corporationControls.map((control) => {
      const metric = getMetricDefinition('corporations', control.key)
      const currentValue = getNumberValue(corporation[control.key])
      const nextValue = applyOperation(currentValue, control, metric)

      return {
        currentValue,
        key: control.key,
        label: metric.label,
        nextValue,
        difference: nextValue - currentValue,
      }
    })

    if (changes.length > 0) {
      rows.push({ changes, entity: corporation, id: corporation.id, name: getDisplayName(corporation, 'corporation'), type: 'corporation' })
    }
  })

  return rows
}

function buildBulkUpdates(previewRows, type) {
  return previewRows
    .filter((row) => row.type === type)
    .map((row) => ({
      id: row.id,
      metrics: Object.fromEntries(row.changes.map((change) => [change.key, change.nextValue])),
    }))
}

function OraculoReputationCrisis() {
  const { firebaseHeroes, heroes, loading: heroesLoading } = useHeroes()
  const { corporations, firebaseCorporations, loading: corporationsLoading } = useCorporations()
  const [formState, setFormState] = useState({ corporationId: '', includeInactive: false, targetMode: 'active-heroes', topN: 10 })
  const [metricControls, setMetricControls] = useState(defaultMetricControls)
  const [previewRows, setPreviewRows] = useState([])
  const [confirmationChecked, setConfirmationChecked] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  const availableHeroes = useMemo(
    () => (firebaseHeroes.length > 0 ? firebaseHeroes : heroes),
    [firebaseHeroes, heroes],
  )
  const availableCorporations = useMemo(
    () => (firebaseCorporations.length > 0 ? firebaseCorporations : corporations),
    [corporations, firebaseCorporations],
  )
  const selectedTargets = useMemo(
    () => getTargetEntities({ corporations: availableCorporations, formState, heroes: availableHeroes }),
    [availableCorporations, availableHeroes, formState],
  )
  const includesPlayerHeroes = selectedTargets.heroes.some(isPlayerLinkedHero)
  const isSyncing = heroesLoading || corporationsLoading
  const targetCount = selectedTargets.heroes.length + selectedTargets.corporations.length

  const updateFormField = (field, value) => {
    setFormState((currentState) => ({ ...currentState, [field]: value }))
    setPreviewRows([])
    setConfirmationChecked(false)
  }

  const updateMetricControl = (controlId, field, value) => {
    setMetricControls((currentControls) => ({
      ...currentControls,
      [controlId]: {
        ...currentControls[controlId],
        [field]: value,
      },
    }))
    setPreviewRows([])
    setConfirmationChecked(false)
  }

  const applyPreset = (preset) => {
    setFormState((currentState) => ({ ...currentState, ...preset.form }))
    setMetricControls((currentControls) => {
      const nextControls = { ...currentControls }

      Object.entries(preset.metrics).forEach(([controlId, controlPatch]) => {
        nextControls[controlId] = { ...nextControls[controlId], ...controlPatch }
      })

      return nextControls
    })
    setStatusMessage(`Preset preparado: ${preset.title}. Genera preview antes de aplicar.`)
    setErrorMessage('')
    setPreviewRows([])
    setConfirmationChecked(false)
  }

  const generatePreview = () => {
    const rows = buildPreviewRows({
      corporations: availableCorporations,
      formState,
      heroes: availableHeroes,
      metricControls,
    })

    if (rows.length === 0) {
      setErrorMessage('No hay objetivos o métricas seleccionadas para generar preview.')
      setStatusMessage('')
      setPreviewRows([])
      return
    }

    setPreviewRows(rows)
    setConfirmationChecked(false)
    setErrorMessage('')
    setStatusMessage(`Preview generado para ${rows.length} registros reputacionales.`)
  }

  const applyReputationCrisis = async () => {
    if (!previewRows.length) {
      setErrorMessage('Genera un preview antes de aplicar cambios.')
      return
    }

    if (!confirmationChecked) {
      setErrorMessage('Confirma la aplicación de cambios reputacionales antes de continuar.')
      return
    }

    setIsApplying(true)
    setErrorMessage('')
    setStatusMessage('Aplicando crisis reputacional...')

    try {
      const heroUpdates = buildBulkUpdates(previewRows, 'hero')
      const corporationUpdates = buildBulkUpdates(previewRows, 'corporation')
      const [updatedHeroes, updatedCorporations] = await Promise.all([
        updateHeroMetricsBulk(heroUpdates),
        updateCorporationMetricsBulk(corporationUpdates),
      ])

      setStatusMessage(`Crisis aplicada: ${updatedHeroes} héroes y ${updatedCorporations} corporaciones actualizadas.`)
      setPreviewRows([])
      setConfirmationChecked(false)
    } catch {
      setErrorMessage('No fue posible aplicar la crisis reputacional.')
      setStatusMessage('')
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <section className="oraculo-crisis page-card hi-card hi-card-oraculo">
      <header className="oraculo-crisis__header">
        <div>
          <p className="page-card__kicker">ACCESO ORÁCULO</p>
          <h2>Crisis Reputacional</h2>
          <p>Ajusta en masa la confianza pública, aprobación y ranking del ecosistema HeroIndex.</p>
        </div>
        <strong>Revisa el preview antes de aplicar cambios.</strong>
      </header>

      <section className="oraculo-crisis__warning" aria-label="Advertencia ORÁCULO">
        <strong>Esta herramienta modifica métricas públicas.</strong>
        <p>No aplica cambios automáticamente. Genera un preview, revisa cada variación y confirma antes de ejecutar la operación.</p>
      </section>

      <section className="oraculo-crisis__presets" aria-label="Presets narrativos">
        <div className="oraculo-crisis__section-heading">
          <p className="page-card__kicker">PRESETS NARRATIVOS</p>
          <h3>Consecuencias rápidas</h3>
          <span>Los presets solo llenan el formulario.</span>
        </div>
        <div className="oraculo-crisis__preset-grid">
          {presets.map((preset) => (
            <button className="oraculo-crisis__preset-card" key={preset.id} onClick={() => applyPreset(preset)} type="button">
              <strong>{preset.title}</strong>
              <small>{preset.description}</small>
            </button>
          ))}
        </div>
      </section>

      <div className="oraculo-crisis__layout">
        <section className="oraculo-crisis__panel" aria-label="Selección de objetivo">
          <div className="oraculo-crisis__section-heading">
            <p className="page-card__kicker">OBJETIVO</p>
            <h3>Alcance de crisis</h3>
            <span>{isSyncing ? 'Sincronizando capa ORÁCULO...' : `${targetCount} registros seleccionados`}</span>
          </div>

          <label className="hi-field">
            <span className="hi-label">Objetivo</span>
            <select className="hi-select" onChange={(event) => updateFormField('targetMode', event.target.value)} value={formState.targetMode}>
              {targetOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          {formState.targetMode === 'corporation' || formState.targetMode === 'corporation-heroes' ? (
            <label className="hi-field">
              <span className="hi-label">Corporación específica</span>
              <select className="hi-select" onChange={(event) => updateFormField('corporationId', event.target.value)} value={formState.corporationId}>
                <option value="">Selecciona operador</option>
                {availableCorporations.map((corporation) => (
                  <option key={corporation.id} value={corporation.id}>{getDisplayName(corporation, 'corporation')}</option>
                ))}
              </select>
            </label>
          ) : null}

          {formState.targetMode === 'top-heroes' ? (
            <label className="hi-field">
              <span className="hi-label">Top N héroes</span>
              <input className="hi-input" min="1" onChange={(event) => updateFormField('topN', event.target.value)} type="number" value={formState.topN} />
            </label>
          ) : null}

          <label className="oraculo-crisis__check">
            <input checked={formState.includeInactive} onChange={(event) => updateFormField('includeInactive', event.target.checked)} type="checkbox" />
            <span>Incluir registros inactivos</span>
          </label>

          {includesPlayerHeroes ? (
            <p className="oraculo-crisis__notice">Advertencia: el objetivo incluye héroes vinculados a jugadores.</p>
          ) : null}
        </section>

        <section className="oraculo-crisis__panel" aria-label="Métricas ajustables">
          <div className="oraculo-crisis__section-heading">
            <p className="page-card__kicker">MÉTRICAS</p>
            <h3>Operaciones reputacionales</h3>
            <span>Valores clampeados para evitar métricas inválidas.</span>
          </div>

          {Object.entries(metricControls).map(([controlId, control]) => {
            const metric = getMetricDefinition(control.targetType, control.key)

            return (
              <article className="oraculo-crisis__metric" key={controlId}>
                <label className="oraculo-crisis__check">
                  <input checked={control.enabled} onChange={(event) => updateMetricControl(controlId, 'enabled', event.target.checked)} type="checkbox" />
                  <span>{control.targetType === 'heroes' ? 'Héroes' : 'Corporaciones'} · {metric.label}</span>
                </label>
                <div className="oraculo-crisis__metric-grid">
                  <label className="hi-field">
                    <span className="hi-label">Operación</span>
                    <select className="hi-select" onChange={(event) => updateMetricControl(controlId, 'operation', event.target.value)} value={control.operation}>
                      {operationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  {control.operation !== 'zero' && control.operation !== 'random' ? (
                    <label className="hi-field">
                      <span className="hi-label">Valor</span>
                      <input className="hi-input" onChange={(event) => updateMetricControl(controlId, 'value', event.target.value)} type="number" value={control.value} />
                    </label>
                  ) : null}
                  {control.operation === 'random' ? (
                    <>
                      <label className="hi-field">
                        <span className="hi-label">Rango mínimo</span>
                        <input className="hi-input" onChange={(event) => updateMetricControl(controlId, 'rangeMin', event.target.value)} type="number" value={control.rangeMin} />
                      </label>
                      <label className="hi-field">
                        <span className="hi-label">Rango máximo</span>
                        <input className="hi-input" onChange={(event) => updateMetricControl(controlId, 'rangeMax', event.target.value)} type="number" value={control.rangeMax} />
                      </label>
                    </>
                  ) : null}
                </div>
              </article>
            )
          })}
        </section>
      </div>

      <section className="oraculo-crisis__preview" aria-label="Preview de crisis reputacional">
        <div className="oraculo-crisis__section-heading">
          <p className="page-card__kicker">PREVIEW OBLIGATORIO</p>
          <h3>Valores actuales y nuevos</h3>
          <span>{previewRows.length > 0 ? `${previewRows.length} registros listos` : 'Sin preview generado'}</span>
        </div>

        <div className="oraculo-crisis__actions">
          <button className="hi-button hi-button-primary" disabled={isApplying} onClick={generatePreview} type="button">Generar preview</button>
        </div>

        {previewRows.length > 0 ? (
          <div className="oraculo-crisis__preview-list">
            {previewRows.map((row) => (
              <article className="oraculo-crisis__preview-row" key={`${row.type}-${row.id}`}>
                <div>
                  <strong>{row.name}</strong>
                  <small>{row.type === 'hero' ? 'Héroe' : 'Corporación'}</small>
                </div>
                <div className="oraculo-crisis__changes">
                  {row.changes.map((change) => (
                    <span key={`${row.id}-${change.key}`}>
                      {change.label}: {change.currentValue} → {change.nextValue} ({change.difference >= 0 ? '+' : ''}{change.difference})
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : <p className="oraculo-crisis__empty">Genera un preview para revisar el impacto antes de confirmar.</p>}
      </section>

      <section className="oraculo-crisis__confirm" aria-label="Confirmación de crisis reputacional">
        <label className="oraculo-crisis__check">
          <input checked={confirmationChecked} disabled={!previewRows.length || isApplying} onChange={(event) => setConfirmationChecked(event.target.checked)} type="checkbox" />
          <span>Confirmo aplicar estos cambios reputacionales.</span>
        </label>
        <button className="hi-button hi-button-primary" disabled={!previewRows.length || !confirmationChecked || isApplying} onClick={applyReputationCrisis} type="button">
          Aplicar crisis reputacional
        </button>
      </section>

      {statusMessage ? <p className="oraculo-crisis__status">{statusMessage}</p> : null}
      {errorMessage ? <p className="oraculo-crisis__error">{errorMessage}</p> : null}
    </section>
  )
}

export default OraculoReputationCrisis
