import { useEffect, useMemo, useState } from 'react'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { useNews } from '../hooks/useNews.js'
import {
  createCampaignLog,
  deleteCampaignLog,
  subscribeToCampaignLogs,
  updateCampaignLog,
} from '../services/campaignLogsService.js'
import { subscribeToMissionCalculations } from '../services/missionCalculationsService.js'

const initialFormState = {
  title: '',
  sessionDate: '',
  location: '',
  outcome: '',
  status: 'draft',
  summaryPublic: '',
  summaryPrivate: '',
  publicConsequences: '',
  privateConsequences: '',
  heroIds: [],
  corporationIds: [],
  newsIds: [],
  missionCalculationIds: [],
  tags: '',
}

const statusOptions = [
  { id: 'draft', label: 'Borrador' },
  { id: 'active', label: 'En desarrollo' },
  { id: 'closed', label: 'Cerrado' },
]

const statusLabels = Object.fromEntries(statusOptions.map((status) => [status.id, status.label]))

function getTimestamp(value) {
  if (!value) return 0
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value

  const parsed = Date.parse(value)

  return Number.isNaN(parsed) ? 0 : parsed
}

function formatDate(value) {
  const timestamp = getTimestamp(value)

  if (!timestamp) return '—'

  return new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(new Date(timestamp))
}

function formatDateTime(value) {
  const timestamp = getTimestamp(value)

  if (!timestamp) return '—'

  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}

function parseCommaList(value = '') {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getHeroName(hero = {}) {
  return hero.alias || hero.publicName || hero.codename || hero.name || 'Identidad HeroIndex'
}

function getNewsTitle(newsItem = {}) {
  return newsItem.title || newsItem.headline || 'Noticia HeroIndex'
}

function getMissionTitle(assessment = {}) {
  return assessment.missionName || assessment.title || assessment.name || `Evaluación ${assessment.id}`
}

function mapById(items = []) {
  return new Map(items.map((item) => [String(item.id), item]))
}

function buildFormState(log) {
  return {
    title: log.title ?? '',
    sessionDate: log.sessionDate ?? '',
    location: log.location ?? '',
    outcome: log.outcome ?? '',
    status: log.status ?? 'draft',
    summaryPublic: log.summaryPublic ?? '',
    summaryPrivate: log.summaryPrivate ?? '',
    publicConsequences: log.publicConsequences ?? '',
    privateConsequences: log.privateConsequences ?? '',
    heroIds: log.heroIds ?? [],
    corporationIds: log.corporationIds ?? [],
    newsIds: log.newsIds ?? [],
    missionCalculationIds: log.missionCalculationIds ?? [],
    tags: Array.isArray(log.tags) ? log.tags.join(', ') : '',
  }
}

function RelationCheckboxGroup({ items, label, name, selectedIds, getLabel, onToggle }) {
  return (
    <fieldset className="campaign-log-relation-group">
      <legend>{label}</legend>
      {items.length > 0 ? (
        <div className="campaign-log-checkbox-grid">
          {items.map((item) => (
            <label className="hi-checkbox campaign-log-checkbox" key={item.id}>
              <input
                checked={selectedIds.includes(item.id)}
                onChange={() => onToggle(name, item.id)}
                type="checkbox"
              />
              <span>{getLabel(item)}</span>
            </label>
          ))}
        </div>
      ) : (
        <p className="campaign-log-empty-inline">No hay registros disponibles.</p>
      )}
    </fieldset>
  )
}

function ReferenceList({ emptyText, items, renderItem }) {
  if (!items.length) return <p className="campaign-log-empty-inline">{emptyText}</p>

  return <div className="campaign-log-reference-list">{items.map(renderItem)}</div>
}

function OraculoCampaignLog({ onNavigate }) {
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [logsError, setLogsError] = useState(null)
  const [missionCalculations, setMissionCalculations] = useState([])
  const [missionCalculationsLoading, setMissionCalculationsLoading] = useState(true)
  const [selectedLogId, setSelectedLogId] = useState(null)
  const [editingLogId, setEditingLogId] = useState(null)
  const [formState, setFormState] = useState(initialFormState)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')
  const { error: heroesError, firebaseHeroes, heroes, loading: heroesLoading } = useHeroes()
  const {
    corporations,
    error: corporationsError,
    firebaseCorporations,
    loading: corporationsLoading,
  } = useCorporations()
  const { error: newsError, feedNews, firebaseNews, loading: newsLoading } = useNews()

  useEffect(() => {
    return subscribeToCampaignLogs(
      (items) => {
        setLogs(items)
        setLogsLoading(false)
      },
      (error) => {
        setLogsError(error)
        setLogsLoading(false)
      },
    )
  }, [])

  useEffect(() => {
    return subscribeToMissionCalculations(
      (items) => {
        setMissionCalculations(items)
        setMissionCalculationsLoading(false)
      },
      () => {
        setMissionCalculations([])
        setMissionCalculationsLoading(false)
      },
    )
  }, [])

  const allHeroes = firebaseHeroes.length > 0 ? firebaseHeroes : heroes
  const allCorporations = firebaseCorporations.length > 0 ? firebaseCorporations : corporations
  const allNews = firebaseNews.length > 0 ? firebaseNews : feedNews
  const heroesById = useMemo(() => mapById(allHeroes), [allHeroes])
  const corporationsById = useMemo(() => mapById(allCorporations), [allCorporations])
  const newsById = useMemo(() => mapById(allNews), [allNews])
  const missionCalculationsById = useMemo(() => mapById(missionCalculations), [missionCalculations])
  const selectedLog = logs.find((log) => log.id === selectedLogId) ?? logs[0] ?? null
  const loading = logsLoading || heroesLoading || corporationsLoading || newsLoading || missionCalculationsLoading
  const error = logsError || heroesError || corporationsError || newsError
  const draftCount = logs.filter((log) => (log.status ?? 'draft') === 'draft').length
  const activeCount = logs.filter((log) => log.status === 'active').length
  const closedCount = logs.filter((log) => log.status === 'closed').length
  const lastSession = logs[0]

  const handleFieldChange = (event) => {
    const { name, value } = event.target

    setFormState((currentForm) => ({ ...currentForm, [name]: value }))
    setMessage('')
    setFormError('')
  }

  const handleToggleRelation = (fieldName, itemId) => {
    setFormState((currentForm) => {
      const currentIds = currentForm[fieldName] ?? []
      const nextIds = currentIds.includes(itemId)
        ? currentIds.filter((id) => id !== itemId)
        : [...currentIds, itemId]

      return { ...currentForm, [fieldName]: nextIds }
    })
    setMessage('')
    setFormError('')
  }

  const resetForm = () => {
    setEditingLogId(null)
    setFormState(initialFormState)
    setMessage('')
    setFormError('')
  }

  const handleEditLog = (log) => {
    setEditingLogId(log.id)
    setSelectedLogId(log.id)
    setFormState(buildFormState(log))
    setMessage('')
    setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setMessage('')
    setFormError('')

    const payload = {
      ...formState,
      title: formState.title.trim(),
      location: formState.location.trim(),
      outcome: formState.outcome.trim(),
      summaryPublic: formState.summaryPublic.trim(),
      summaryPrivate: formState.summaryPrivate.trim(),
      publicConsequences: formState.publicConsequences.trim(),
      privateConsequences: formState.privateConsequences.trim(),
      tags: parseCommaList(formState.tags),
    }

    if (!payload.title) {
      setFormError('El título de sesión o misión es obligatorio.')
      setIsSaving(false)
      return
    }

    try {
      const savedLog = editingLogId
        ? await updateCampaignLog(editingLogId, payload)
        : await createCampaignLog(payload)

      setSelectedLogId(savedLog.id)
      setMessage('Registro guardado correctamente.')
      setEditingLogId(null)
      setFormState(initialFormState)
    } catch (saveError) {
      setFormError(saveError.message ?? 'No fue posible guardar el registro.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteLog = async (log) => {
    const confirmed = window.confirm(
      'Esta acción eliminará permanentemente este registro de campaña. No se puede deshacer.',
    )

    if (!confirmed) return

    try {
      await deleteCampaignLog(log.id)
      if (selectedLogId === log.id) setSelectedLogId(null)
      if (editingLogId === log.id) resetForm()
      setMessage('Registro eliminado correctamente.')
    } catch (deleteError) {
      setFormError(deleteError.message ?? 'No fue posible eliminar el registro.')
    }
  }

  if (loading) {
    return (
      <section className="page-card oraculo-campaign-log-page hi-page hi-page-wide hi-state-card">
        <p>Cargando Registro de Campaña...</p>
      </section>
    )
  }

  if (error && logs.length === 0) {
    return (
      <section className="page-card oraculo-campaign-log-page hi-page hi-page-wide hi-state-card hi-state-card--error">
        <p>No fue posible cargar el Registro de Campaña.</p>
      </section>
    )
  }

  return (
    <section className="oraculo-campaign-log-page hi-page hi-page-wide">
      <header className="oraculo-campaign-log-hero hi-page-header hi-card hi-card-oraculo">
        <p className="page-card__kicker">Acceso ORÁCULO</p>
        <h2>Registro de Campaña</h2>
        <p className="oraculo-campaign-log-hero__subtitle">
          Archivo interno de sesiones, misiones y consecuencias narrativas.
        </p>
        <p>
          Registra eventos de campaña y vincúlalos con héroes, corporaciones, noticias y evaluaciones ORÁCULO.
        </p>
        <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('oraculo-hub')} type="button">
          Volver a ORÁCULO Hub
        </button>
      </header>

      <section className="campaign-log-overview" aria-label="Resumen del Registro de Campaña">
        <article className="hi-metric-card">
          <span>Total de registros</span>
          <strong>{logs.length}</strong>
        </article>
        <article className="hi-metric-card">
          <span>Borradores</span>
          <strong>{draftCount}</strong>
        </article>
        <article className="hi-metric-card">
          <span>En desarrollo</span>
          <strong>{activeCount}</strong>
        </article>
        <article className="hi-metric-card">
          <span>Cerrados</span>
          <strong>{closedCount}</strong>
        </article>
        <article className="hi-metric-card">
          <span>Última sesión registrada</span>
          <strong>{lastSession ? formatDate(lastSession.sessionDate || lastSession.createdAt) : '—'}</strong>
        </article>
      </section>

      {message ? <p className="hi-state-card hi-state-card--success">{message}</p> : null}
      {formError ? <p className="hi-state-card hi-state-card--error">{formError}</p> : null}

      <div className="campaign-log-layout">
        <div className="campaign-log-main-column">
          <section className="hi-card hi-card-oraculo campaign-log-form-card">
            <div className="campaign-log-section-header">
              <div>
                <span className="section-kicker">Archivo interno</span>
                <h3>{editingLogId ? 'Editar registro' : 'Nuevo registro'}</h3>
              </div>
              {editingLogId ? (
                <button className="hi-button hi-button-subtle" onClick={resetForm} type="button">
                  Cancelar edición
                </button>
              ) : null}
            </div>

            <form className="hi-form campaign-log-form" onSubmit={handleSubmit}>
              <label className="hi-field campaign-log-form__wide">
                <span className="hi-label">Título de sesión / misión</span>
                <input className="hi-input" name="title" onChange={handleFieldChange} value={formState.title} />
              </label>
              <label className="hi-field">
                <span className="hi-label">Fecha de sesión</span>
                <input
                  className="hi-input"
                  name="sessionDate"
                  onChange={handleFieldChange}
                  type="date"
                  value={formState.sessionDate}
                />
              </label>
              <label className="hi-field">
                <span className="hi-label">Lugar / zona</span>
                <input className="hi-input" name="location" onChange={handleFieldChange} value={formState.location} />
              </label>
              <label className="hi-field">
                <span className="hi-label">Resultado</span>
                <input className="hi-input" name="outcome" onChange={handleFieldChange} value={formState.outcome} />
              </label>
              <label className="hi-field">
                <span className="hi-label">Estado</span>
                <select className="hi-select" name="status" onChange={handleFieldChange} value={formState.status}>
                  {statusOptions.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="hi-field campaign-log-form__wide">
                <span className="hi-label">Resumen público potencial</span>
                <textarea
                  className="hi-textarea"
                  name="summaryPublic"
                  onChange={handleFieldChange}
                  value={formState.summaryPublic}
                />
              </label>
              <label className="hi-field campaign-log-form__wide">
                <span className="hi-label">Resumen privado ORÁCULO</span>
                <textarea
                  className="hi-textarea"
                  name="summaryPrivate"
                  onChange={handleFieldChange}
                  value={formState.summaryPrivate}
                />
              </label>
              <label className="hi-field campaign-log-form__wide">
                <span className="hi-label">Consecuencias públicas</span>
                <textarea
                  className="hi-textarea"
                  name="publicConsequences"
                  onChange={handleFieldChange}
                  value={formState.publicConsequences}
                />
              </label>
              <label className="hi-field campaign-log-form__wide">
                <span className="hi-label">Consecuencias privadas</span>
                <textarea
                  className="hi-textarea"
                  name="privateConsequences"
                  onChange={handleFieldChange}
                  value={formState.privateConsequences}
                />
              </label>
              <label className="hi-field campaign-log-form__wide">
                <span className="hi-label">Tags</span>
                <input
                  className="hi-input"
                  name="tags"
                  onChange={handleFieldChange}
                  placeholder="separados por comas"
                  value={formState.tags}
                />
              </label>

              <RelationCheckboxGroup
                getLabel={getHeroName}
                items={allHeroes}
                label="Héroes participantes"
                name="heroIds"
                onToggle={handleToggleRelation}
                selectedIds={formState.heroIds}
              />
              <RelationCheckboxGroup
                getLabel={(corporation) => corporation.name || corporation.id}
                items={allCorporations}
                label="Corporaciones involucradas"
                name="corporationIds"
                onToggle={handleToggleRelation}
                selectedIds={formState.corporationIds}
              />
              <RelationCheckboxGroup
                getLabel={getNewsTitle}
                items={allNews}
                label="Noticias relacionadas"
                name="newsIds"
                onToggle={handleToggleRelation}
                selectedIds={formState.newsIds}
              />
              <RelationCheckboxGroup
                getLabel={getMissionTitle}
                items={missionCalculations}
                label="Evaluaciones ORÁCULO relacionadas"
                name="missionCalculationIds"
                onToggle={handleToggleRelation}
                selectedIds={formState.missionCalculationIds}
              />

              <div className="campaign-log-form-actions">
                <button className="hi-button hi-button-primary" disabled={isSaving} type="submit">
                  {isSaving ? 'Guardando...' : editingLogId ? 'Guardar cambios' : 'Crear registro'}
                </button>
                <button className="hi-button hi-button-secondary" onClick={resetForm} type="button">
                  Cancelar edición
                </button>
              </div>
            </form>
          </section>

          <section className="hi-card hi-card-oraculo campaign-log-list-card">
            <div className="campaign-log-section-header">
              <div>
                <span className="section-kicker">Registros</span>
                <h3>Sesiones y misiones</h3>
              </div>
            </div>

            {logs.length > 0 ? (
              <div className="campaign-log-list">
                {logs.map((log) => (
                  <article className="campaign-log-item" key={log.id}>
                    <div>
                      <span className={`campaign-log-status campaign-log-status--${log.status ?? 'draft'}`}>
                        {statusLabels[log.status ?? 'draft'] ?? log.status}
                      </span>
                      <h4>{log.title || 'Registro sin título'}</h4>
                      <p>{formatDate(log.sessionDate || log.createdAt)} · {log.location || 'Zona no registrada'}</p>
                    </div>
                    <dl>
                      <div>
                        <dt>Héroes</dt>
                        <dd>{log.heroIds?.length ?? 0}</dd>
                      </div>
                      <div>
                        <dt>Evaluaciones</dt>
                        <dd>{log.missionCalculationIds?.length ?? 0}</dd>
                      </div>
                      <div>
                        <dt>Noticias</dt>
                        <dd>{log.newsIds?.length ?? 0}</dd>
                      </div>
                    </dl>
                    {log.tags?.length ? (
                      <div className="campaign-log-tags">
                        {log.tags.map((tag) => <span className="hi-chip" key={tag}>{tag}</span>)}
                      </div>
                    ) : null}
                    <div className="campaign-log-item-actions">
                      <button className="hi-button hi-button-secondary" onClick={() => setSelectedLogId(log.id)} type="button">
                        Ver detalle
                      </button>
                      <button className="hi-button hi-button-subtle" onClick={() => handleEditLog(log)} type="button">
                        Editar
                      </button>
                      <button className="hi-button hi-button-danger" onClick={() => handleDeleteLog(log)} type="button">
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="hi-state-card">No hay registros de campaña.</p>
            )}
          </section>
        </div>

        <aside className="campaign-log-detail-column">
          <section className="hi-card hi-card-oraculo campaign-log-detail-card">
            {selectedLog ? (
              <>
                <div className="campaign-log-section-header">
                  <div>
                    <span className={`campaign-log-status campaign-log-status--${selectedLog.status ?? 'draft'}`}>
                      {statusLabels[selectedLog.status ?? 'draft'] ?? selectedLog.status}
                    </span>
                    <h3>{selectedLog.title || 'Registro sin título'}</h3>
                    <p>{formatDate(selectedLog.sessionDate || selectedLog.createdAt)} · {selectedLog.location || 'Zona no registrada'}</p>
                  </div>
                </div>

                <dl className="campaign-log-detail-list">
                  <div>
                    <dt>Resultado</dt>
                    <dd>{selectedLog.outcome || '—'}</dd>
                  </div>
                  <div>
                    <dt>Resumen público potencial</dt>
                    <dd>{selectedLog.summaryPublic || '—'}</dd>
                  </div>
                  <div>
                    <dt>Resumen privado ORÁCULO</dt>
                    <dd>{selectedLog.summaryPrivate || '—'}</dd>
                  </div>
                  <div>
                    <dt>Consecuencias públicas</dt>
                    <dd>{selectedLog.publicConsequences || '—'}</dd>
                  </div>
                  <div>
                    <dt>Consecuencias privadas</dt>
                    <dd>{selectedLog.privateConsequences || '—'}</dd>
                  </div>
                </dl>

                <div className="campaign-log-detail-section">
                  <h4>Héroes participantes</h4>
                  <ReferenceList
                    emptyText="Sin héroes vinculados."
                    items={selectedLog.heroIds ?? []}
                    renderItem={(heroId) => {
                      const hero = heroesById.get(String(heroId))

                      return (
                        <article className="campaign-log-reference" key={heroId}>
                          <strong>{hero ? getHeroName(hero) : 'Referencia no encontrada'}</strong>
                          <div>
                            <button
                              className="hi-button hi-button-subtle"
                              disabled={!hero}
                              onClick={() => onNavigate?.('hero-profile', { heroId })}
                              type="button"
                            >
                              Ver perfil público
                            </button>
                            <button
                              className="hi-button hi-button-subtle"
                              disabled={!hero}
                              onClick={() => onNavigate?.('oraculo-hero-dossier', { heroId })}
                              type="button"
                            >
                              Ver dossier ORÁCULO
                            </button>
                          </div>
                        </article>
                      )
                    }}
                  />
                </div>

                <div className="campaign-log-detail-section">
                  <h4>Corporaciones involucradas</h4>
                  <ReferenceList
                    emptyText="Sin corporaciones vinculadas."
                    items={selectedLog.corporationIds ?? []}
                    renderItem={(corporationId) => {
                      const corporation = corporationsById.get(String(corporationId))

                      return (
                        <article className="campaign-log-reference" key={corporationId}>
                          <strong>{corporation?.name || 'Referencia no encontrada'}</strong>
                        </article>
                      )
                    }}
                  />
                </div>

                <div className="campaign-log-detail-section">
                  <h4>Noticias relacionadas</h4>
                  <ReferenceList
                    emptyText="Sin noticias vinculadas."
                    items={selectedLog.newsIds ?? []}
                    renderItem={(newsId) => {
                      const newsItem = newsById.get(String(newsId))

                      return (
                        <article className="campaign-log-reference" key={newsId}>
                          <strong>{newsItem ? getNewsTitle(newsItem) : 'Referencia no encontrada'}</strong>
                        </article>
                      )
                    }}
                  />
                </div>

                <div className="campaign-log-detail-section">
                  <h4>Evaluaciones ORÁCULO relacionadas</h4>
                  <ReferenceList
                    emptyText="Sin evaluaciones vinculadas."
                    items={selectedLog.missionCalculationIds ?? []}
                    renderItem={(assessmentId) => {
                      const assessment = missionCalculationsById.get(String(assessmentId))

                      return (
                        <article className="campaign-log-reference" key={assessmentId}>
                          <strong>{assessment ? getMissionTitle(assessment) : 'Referencia no encontrada'}</strong>
                          {assessment?.status ? <span>{assessment.status}</span> : null}
                        </article>
                      )
                    }}
                  />
                </div>

                <div className="campaign-log-tags campaign-log-detail-tags">
                  {(selectedLog.tags ?? []).map((tag) => <span className="hi-chip" key={tag}>{tag}</span>)}
                </div>

                <dl className="campaign-log-detail-list campaign-log-detail-list--meta">
                  <div>
                    <dt>Creado</dt>
                    <dd>{formatDateTime(selectedLog.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Actualizado</dt>
                    <dd>{formatDateTime(selectedLog.updatedAt)}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="hi-state-card">Selecciona un registro para ver el detalle.</p>
            )}
          </section>
        </aside>
      </div>
    </section>
  )
}

export default OraculoCampaignLog
