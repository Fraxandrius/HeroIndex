import { useEffect, useMemo, useState } from 'react'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import {
  createBroadcast,
  deleteBroadcast,
  subscribeToBroadcasts,
  updateBroadcast,
} from '../services/broadcastsService.js'

const placementOptions = [
  { value: 'home-feature', label: 'Home · Señal destacada' },
  { value: 'home-rail', label: 'Home · Columna lateral' },
  { value: 'home-feed', label: 'Home · Feed' },
  { value: 'ranking-feature', label: 'Ranking · Señal destacada' },
  { value: 'ranking-rail', label: 'Ranking · Lateral' },
  { value: 'profiles-feature', label: 'Perfiles · Señal destacada' },
  { value: 'profiles-grid', label: 'Perfiles · Grid' },
  { value: 'hero-profile-rail', label: 'Perfil público · Lateral' },
  { value: 'news-feature', label: 'Noticias · Señal destacada' },
  { value: 'news-feed', label: 'Noticias · Feed' },
  { value: 'corporations-feature', label: 'Corporaciones · Señal destacada' },
  { value: 'corporations-grid', label: 'Corporaciones · Grid' },
]

const toneOptions = [
  { value: 'institutional', label: 'Institucional' },
  { value: 'civic', label: 'Cívico' },
  { value: 'corporate', label: 'Corporativo' },
  { value: 'recruitment', label: 'Comunidad' },
  { value: 'safety', label: 'Seguridad' },
  { value: 'heroic', label: 'Heroico' },
  { value: 'alert', label: 'Alerta' },
]

const emptyForm = {
  active: true,
  body: '',
  category: '',
  corporationId: '',
  ctaLabel: '',
  ctaUrl: '',
  heroId: '',
  imageUrl: '',
  placement: 'home-feature',
  priority: 50,
  subtitle: '',
  title: '',
  tone: 'institutional',
}

function getDisplayName(hero = {}) {
  return hero.alias || hero.publicName || hero.codename || hero.name || 'Identidad HeroIndex'
}

function formatDate(value) {
  if (!value) return 'Fecha pendiente'

  return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function OraculoBroadcasts() {
  const [broadcasts, setBroadcasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [editingId, setEditingId] = useState('')
  const [formData, setFormData] = useState(emptyForm)
  const { corporations } = useCorporations()
  const { heroes } = useHeroes()

  useEffect(
    () => subscribeToBroadcasts(
      (items) => {
        setBroadcasts(items)
        setLoading(false)
      },
      () => {
        setErrorMessage('No fue posible cargar las señales públicas.')
        setLoading(false)
      },
    ),
    [],
  )

  const activeCount = broadcasts.filter((broadcast) => broadcast.active !== false).length
  const inactiveCount = broadcasts.length - activeCount
  const placementLabelById = useMemo(
    () => new Map(placementOptions.map((option) => [option.value, option.label])),
    [],
  )

  const handleFieldChange = (field, value) => {
    setFormData((currentData) => ({ ...currentData, [field]: value }))
  }

  const resetForm = () => {
    setEditingId('')
    setFormData(emptyForm)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setStatusMessage('Guardando señal pública...')

    const payload = {
      ...formData,
      priority: Number(formData.priority ?? 0),
    }

    try {
      if (editingId) {
        await updateBroadcast(editingId, payload)
      } else {
        await createBroadcast(payload)
      }

      setStatusMessage('Señal pública guardada correctamente.')
      resetForm()
    } catch {
      setStatusMessage('')
      setErrorMessage('No fue posible guardar la señal pública.')
    }
  }

  const handleEdit = (broadcast) => {
    setEditingId(broadcast.id)
    setFormData({ ...emptyForm, ...broadcast, priority: Number(broadcast.priority ?? 0) })
    setStatusMessage('Editando señal pública seleccionada.')
    setErrorMessage('')
  }

  const handleDelete = async (broadcast) => {
    if (!window.confirm('Esta acción eliminará permanentemente esta señal pública. No se puede deshacer.')) return

    setErrorMessage('')
    setStatusMessage('Eliminando señal pública...')

    try {
      await deleteBroadcast(broadcast.id)
      setStatusMessage('Señal pública eliminada correctamente.')
      if (editingId === broadcast.id) resetForm()
    } catch {
      setStatusMessage('')
      setErrorMessage('No fue posible eliminar la señal pública.')
    }
  }

  const handleToggleActive = async (broadcast) => {
    setErrorMessage('')

    try {
      await updateBroadcast(broadcast.id, { active: !(broadcast.active !== false) })
      setStatusMessage('Estado de señal actualizado correctamente.')
    } catch {
      setErrorMessage('No fue posible guardar la señal pública.')
    }
  }

  return (
    <section className="page-card oraculo-broadcasts-page hi-page-wide">
      <header className="oraculo-broadcasts-hero hi-card hi-card-oraculo">
        <p className="page-card__kicker">ORÁCULO · Canales públicos</p>
        <h2>Señales públicas</h2>
        <p>Gestiona mensajes visuales institucionales para poblar HeroIndex con cobertura, confianza y presencia heroica certificada.</p>
      </header>

      <section className="oraculo-broadcasts-summary" aria-label="Resumen de señales públicas">
        <article>
          <span>Total</span>
          <strong>{broadcasts.length}</strong>
        </article>
        <article>
          <span>Activas</span>
          <strong>{activeCount}</strong>
        </article>
        <article>
          <span>Inactivas</span>
          <strong>{inactiveCount}</strong>
        </article>
      </section>

      <div className="oraculo-broadcasts-layout">
        <form className="oraculo-broadcasts-form hi-card hi-card-oraculo hi-form" onSubmit={handleSubmit}>
          <div className="oraculo-broadcasts-form__heading">
            <p className="page-card__kicker">Editor de señal</p>
            <h3>{editingId ? 'Editar señal pública' : 'Crear señal pública'}</h3>
          </div>

          <label className="hi-field">
            <span className="hi-label">Título</span>
            <input className="hi-input" onChange={(event) => handleFieldChange('title', event.target.value)} required type="text" value={formData.title} />
          </label>
          <label className="hi-field">
            <span className="hi-label">Subtítulo</span>
            <input className="hi-input" onChange={(event) => handleFieldChange('subtitle', event.target.value)} type="text" value={formData.subtitle} />
          </label>
          <label className="hi-field oraculo-broadcasts-form__wide">
            <span className="hi-label">Texto breve</span>
            <textarea className="hi-textarea" onChange={(event) => handleFieldChange('body', event.target.value)} required value={formData.body} />
          </label>
          <label className="hi-field">
            <span className="hi-label">Imagen URL</span>
            <input className="hi-input" onChange={(event) => handleFieldChange('imageUrl', event.target.value)} type="url" value={formData.imageUrl} />
          </label>
          <label className="hi-field">
            <span className="hi-label">Ubicación</span>
            <select className="hi-select" onChange={(event) => handleFieldChange('placement', event.target.value)} value={formData.placement}>
              {placementOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="hi-field">
            <span className="hi-label">Tono</span>
            <select className="hi-select" onChange={(event) => handleFieldChange('tone', event.target.value)} value={formData.tone}>
              {toneOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="hi-field">
            <span className="hi-label">Categoría visible</span>
            <input className="hi-input" onChange={(event) => handleFieldChange('category', event.target.value)} type="text" value={formData.category} />
          </label>
          <label className="hi-field">
            <span className="hi-label">Héroe relacionado</span>
            <select className="hi-select" onChange={(event) => handleFieldChange('heroId', event.target.value)} value={formData.heroId}>
              <option value="">Sin héroe específico</option>
              {heroes.map((hero) => (
                <option key={hero.id} value={hero.id}>{getDisplayName(hero)}</option>
              ))}
            </select>
          </label>
          <label className="hi-field">
            <span className="hi-label">Corporación relacionada</span>
            <select className="hi-select" onChange={(event) => handleFieldChange('corporationId', event.target.value)} value={formData.corporationId}>
              <option value="">Sin corporación específica</option>
              {corporations.map((corporation) => (
                <option key={corporation.id} value={corporation.id}>{corporation.name}</option>
              ))}
            </select>
          </label>
          <label className="hi-field">
            <span className="hi-label">Texto de acción</span>
            <input className="hi-input" onChange={(event) => handleFieldChange('ctaLabel', event.target.value)} type="text" value={formData.ctaLabel} />
          </label>
          <label className="hi-field">
            <span className="hi-label">URL de acción</span>
            <input className="hi-input" onChange={(event) => handleFieldChange('ctaUrl', event.target.value)} type="text" value={formData.ctaUrl} />
          </label>
          <label className="hi-field">
            <span className="hi-label">Prioridad</span>
            <input className="hi-input" min="0" onChange={(event) => handleFieldChange('priority', event.target.value)} type="number" value={formData.priority} />
          </label>
          <label className="oraculo-broadcasts-active-control">
            <input checked={formData.active} onChange={(event) => handleFieldChange('active', event.target.checked)} type="checkbox" />
            <span>Visible públicamente</span>
          </label>

          <div className="oraculo-broadcasts-actions">
            <button className="hi-button hi-button-primary" type="submit">
              {editingId ? 'Guardar cambios' : 'Crear señal'}
            </button>
            <button className="hi-button hi-button-secondary" onClick={resetForm} type="button">
              Cancelar edición
            </button>
          </div>
          {statusMessage ? <p className="oraculo-broadcasts-status">{statusMessage}</p> : null}
          {errorMessage ? <p className="oraculo-broadcasts-error">{errorMessage}</p> : null}
        </form>

        <section className="oraculo-broadcasts-list hi-card hi-card-oraculo" aria-label="Listado de señales públicas">
          <div className="oraculo-broadcasts-form__heading">
            <p className="page-card__kicker">Canales activos</p>
            <h3>Historial de señales</h3>
          </div>
          {loading ? <p>Cargando señales públicas...</p> : null}
          {!loading && broadcasts.length === 0 ? <p>No hay señales públicas registradas.</p> : null}
          {!loading ? broadcasts.map((broadcast) => (
            <article className="oraculo-broadcasts-row" key={broadcast.id}>
              <div>
                <span className="hi-chip">{broadcast.active === false ? 'Inactiva' : 'Activa'}</span>
                <h4>{broadcast.title || 'Señal sin título'}</h4>
                <p>{broadcast.subtitle || broadcast.body}</p>
                <small>{placementLabelById.get(broadcast.placement) || broadcast.placement} · Prioridad {broadcast.priority ?? 0} · {formatDate(broadcast.updatedAt || broadcast.createdAt)}</small>
              </div>
              <div className="oraculo-broadcasts-row__actions">
                <button className="hi-button hi-button-secondary" onClick={() => handleEdit(broadcast)} type="button">Editar</button>
                <button className="hi-button hi-button-subtle" onClick={() => handleToggleActive(broadcast)} type="button">
                  {broadcast.active === false ? 'Activar' : 'Desactivar'}
                </button>
                <button className="hi-button hi-button-danger" onClick={() => handleDelete(broadcast)} type="button">Eliminar</button>
              </div>
            </article>
          )) : null}
        </section>
      </div>
    </section>
  )
}

export default OraculoBroadcasts
