import { useState } from 'react'
import { useCorporations } from '../hooks/useCorporations.js'
import { createOrUpdateCharacterSheet } from '../services/characterSheetsService.js'
import { createHero } from '../services/heroesService.js'

const publicInitialState = {
  active: true,
  alias: '',
  approval: '0',
  avatarUrl: '',
  bannerUrl: '',
  codename: '',
  corporationId: '',
  heroTitle: '',
  publicBio: '',
  publicName: '',
  publicPowers: '',
  rankingPoints: '0',
}

const privateInitialState = {
  agility: '1',
  drawbacks: '',
  fighting: '1',
  flags: '',
  gear: '',
  gmNotes: '',
  health: '0',
  intuition: '1',
  karma: '0',
  personality: '',
  powers: '',
  presence: '1',
  reason: '1',
  realName: '',
  relationships: '',
  reputation: '',
  resolve: '0',
  resources: '',
  risk: '',
  role: '',
  strength: '1',
  talents: '',
}

const attributeFields = [
  ['fighting', 'Fighting'],
  ['agility', 'Agility'],
  ['strength', 'Strength'],
  ['reason', 'Reason'],
  ['intuition', 'Intuition'],
  ['presence', 'Presence'],
]

const privateTextAreas = [
  ['resources', 'Resources'],
  ['gear', 'Gear'],
  ['reputation', 'Reputation'],
  ['personality', 'Personality'],
  ['relationships', 'Relationships'],
  ['gmNotes', 'Notas GM'],
]

function parseCommaList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseNumber(value, fallback = 0) {
  const numberValue = Number(value)

  return Number.isNaN(numberValue) ? fallback : numberValue
}

function buildHeroPayload(form) {
  return {
    active: form.active,
    alias: form.alias.trim(),
    approval: parseNumber(form.approval, 0),
    avatarUrl: form.avatarUrl.trim(),
    bannerUrl: form.bannerUrl.trim(),
    codename: form.codename.trim(),
    corporationId: form.corporationId.trim(),
    heroTitle: form.heroTitle.trim(),
    publicBio: form.publicBio.trim(),
    publicName: form.publicName.trim(),
    publicPowers: parseCommaList(form.publicPowers),
    rankingPoints: parseNumber(form.rankingPoints, 0),
  }
}

function buildCharacterSheetPayload(heroId, form) {
  return {
    attributes: {
      agility: parseNumber(form.agility, 1),
      fighting: parseNumber(form.fighting, 1),
      intuition: parseNumber(form.intuition, 1),
      presence: parseNumber(form.presence, 1),
      reason: parseNumber(form.reason, 1),
      strength: parseNumber(form.strength, 1),
    },
    drawbacks: parseCommaList(form.drawbacks),
    flags: parseCommaList(form.flags),
    gear: form.gear.trim(),
    gmNotes: form.gmNotes.trim(),
    health: parseNumber(form.health, 0),
    heroId,
    isNpc: true,
    karma: parseNumber(form.karma, 0),
    personality: form.personality.trim(),
    powers: parseCommaList(form.powers),
    realName: form.realName.trim(),
    relationships: form.relationships.trim(),
    reputation: form.reputation.trim(),
    resolve: parseNumber(form.resolve, 0),
    resources: form.resources.trim(),
    risk: form.risk.trim(),
    role: form.role.trim(),
    talents: parseCommaList(form.talents),
  }
}

function OraculoNpcBuilder({ onNavigate }) {
  const { corporations } = useCorporations()
  const [publicForm, setPublicForm] = useState(publicInitialState)
  const [privateForm, setPrivateForm] = useState(privateInitialState)
  const [isCreating, setIsCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [createdHeroId, setCreatedHeroId] = useState('')
  const [partialHeroId, setPartialHeroId] = useState('')

  const handlePublicFieldChange = (event) => {
    const { checked, name, type, value } = event.target

    setPublicForm((currentForm) => ({
      ...currentForm,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setFormError('')
  }

  const handlePrivateFieldChange = (event) => {
    const { name, value } = event.target

    setPrivateForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
    setFormError('')
  }

  const resetBuilder = () => {
    setPublicForm(publicInitialState)
    setPrivateForm(privateInitialState)
    setCreatedHeroId('')
    setPartialHeroId('')
    setSuccessMessage('')
    setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!publicForm.alias.trim()) {
      setFormError('Alias es obligatorio para crear un NPC ORÁCULO.')
      setSuccessMessage('')
      return
    }

    setIsCreating(true)
    setFormError('')
    setSuccessMessage('')
    setCreatedHeroId('')
    setPartialHeroId('')

    let heroId = ''

    try {
      const hero = await createHero(buildHeroPayload(publicForm))
      heroId = hero.id
      setPartialHeroId(heroId)
      await createOrUpdateCharacterSheet(heroId, buildCharacterSheetPayload(heroId, privateForm))
      setCreatedHeroId(heroId)
      setPartialHeroId('')
      setSuccessMessage('NPC creado correctamente.')
    } catch (error) {
      const baseMessage = error.message ?? String(error)
      setFormError(
        heroId
          ? `Error al crear NPC: el héroe público fue creado (${heroId}), pero la hoja privada falló. ${baseMessage}`
          : `Error al crear NPC: ${baseMessage}`,
      )
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <section className="page-card oraculo-npc-builder-page">
      <header className="oraculo-npc-builder-hero">
        <p className="page-card__kicker">ORÁCULO / Generación de NPC</p>
        <h2>Creador de NPC ORÁCULO</h2>
        <p className="oraculo-npc-builder-hero__subtitle">
          Genera héroes NPC con perfil público HeroIndex y hoja privada RPG.
        </p>
        <p>Esta herramienta crea simultáneamente la identidad pública del héroe y su ficha interna ORÁCULO.</p>
      </header>

      {successMessage ? (
        <section className="oraculo-npc-builder-result" aria-live="polite">
          <div>
            <span>Operación completada</span>
            <h3>{successMessage}</h3>
            <p>El perfil público y la hoja privada RPG quedaron vinculados con el mismo ID.</p>
          </div>
          <div className="oraculo-npc-builder-result__actions">
            <button onClick={() => onNavigate?.('oraculo-hero-dossier', { heroId: createdHeroId })} type="button">
              Ver dossier ORÁCULO
            </button>
            <button onClick={() => onNavigate?.('hero-profile', { heroId: createdHeroId })} type="button">
              Ver perfil público
            </button>
            <button onClick={resetBuilder} type="button">
              Crear otro NPC
            </button>
          </div>
        </section>
      ) : null}

      {formError ? (
        <p className="oraculo-npc-builder-message oraculo-npc-builder-message--error">
          {formError}
          {partialHeroId ? ' Abre GM Manager o el Dossier ORÁCULO para completar la recuperación manual.' : ''}
        </p>
      ) : null}

      <form className="oraculo-npc-builder-form" onSubmit={handleSubmit}>
        <section className="oraculo-npc-builder-block">
          <div className="oraculo-npc-builder-block__header">
            <span>Bloque A</span>
            <div>
              <h3>Perfil público HeroIndex</h3>
              <p>Solo datos visibles para la capa pública: identidad heroica, afiliación y métricas públicas.</p>
            </div>
          </div>
          <div className="oraculo-npc-builder-grid">
            <label>
              <span>Alias *</span>
              <input name="alias" onChange={handlePublicFieldChange} value={publicForm.alias} />
            </label>
            <label>
              <span>Nombre público</span>
              <input name="publicName" onChange={handlePublicFieldChange} value={publicForm.publicName} />
            </label>
            <label>
              <span>Codename</span>
              <input name="codename" onChange={handlePublicFieldChange} value={publicForm.codename} />
            </label>
            <label>
              <span>Título heroico</span>
              <input name="heroTitle" onChange={handlePublicFieldChange} value={publicForm.heroTitle} />
            </label>
            <label>
              <span>Corporación</span>
              <select name="corporationId" onChange={handlePublicFieldChange} value={publicForm.corporationId}>
                <option value="">Independiente / sin afiliación</option>
                {corporations.map((corporation) => (
                  <option key={corporation.id} value={corporation.id}>
                    {corporation.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Puntos HeroIndex</span>
              <input name="rankingPoints" onChange={handlePublicFieldChange} type="number" value={publicForm.rankingPoints} />
            </label>
            <label>
              <span>Aprobación ciudadana</span>
              <input name="approval" onChange={handlePublicFieldChange} type="number" value={publicForm.approval} />
            </label>
            <label>
              <span>Poderes visibles</span>
              <input
                name="publicPowers"
                onChange={handlePublicFieldChange}
                placeholder="Separados por comas"
                value={publicForm.publicPowers}
              />
            </label>
            <label>
              <span>Avatar URL</span>
              <input name="avatarUrl" onChange={handlePublicFieldChange} type="url" value={publicForm.avatarUrl} />
            </label>
            <label>
              <span>Portada URL</span>
              <input name="bannerUrl" onChange={handlePublicFieldChange} type="url" value={publicForm.bannerUrl} />
            </label>
            <label className="oraculo-npc-builder-check">
              <input checked={publicForm.active} name="active" onChange={handlePublicFieldChange} type="checkbox" />
              <span>Activo</span>
            </label>
          </div>
          <label className="oraculo-npc-builder-wide-field">
            <span>Biografía pública</span>
            <textarea name="publicBio" onChange={handlePublicFieldChange} value={publicForm.publicBio} />
          </label>
        </section>

        <section className="oraculo-npc-builder-block oraculo-npc-builder-block--private">
          <div className="oraculo-npc-builder-block__header">
            <span>Bloque B</span>
            <div>
              <h3>Hoja privada RPG</h3>
              <p>Datos internos ORÁCULO. No se guardan en /heroes ni aparecen en perfiles públicos.</p>
            </div>
          </div>
          <div className="oraculo-npc-builder-grid">
            <label>
              <span>Nombre real</span>
              <input name="realName" onChange={handlePrivateFieldChange} value={privateForm.realName} />
            </label>
            <label>
              <span>Rol</span>
              <input name="role" onChange={handlePrivateFieldChange} value={privateForm.role} />
            </label>
            <label>
              <span>Health</span>
              <input name="health" onChange={handlePrivateFieldChange} type="number" value={privateForm.health} />
            </label>
            <label>
              <span>Resolve</span>
              <input name="resolve" onChange={handlePrivateFieldChange} type="number" value={privateForm.resolve} />
            </label>
            <label>
              <span>Karma</span>
              <input name="karma" onChange={handlePrivateFieldChange} type="number" value={privateForm.karma} />
            </label>
            <label>
              <span>Risk</span>
              <input name="risk" onChange={handlePrivateFieldChange} value={privateForm.risk} />
            </label>
          </div>

          <fieldset className="oraculo-npc-builder-fieldset">
            <legend>Atributos</legend>
            <div className="oraculo-npc-builder-grid oraculo-npc-builder-grid--attributes">
              {attributeFields.map(([field, label]) => (
                <label key={field}>
                  <span>{label}</span>
                  <input
                    max="10"
                    min="1"
                    name={field}
                    onChange={handlePrivateFieldChange}
                    type="number"
                    value={privateForm[field]}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <div className="oraculo-npc-builder-grid">
            {[
              ['powers', 'Powers'],
              ['talents', 'Talents'],
              ['drawbacks', 'Drawbacks'],
              ['flags', 'Flags'],
            ].map(([field, label]) => (
              <label key={field}>
                <span>{label}</span>
                <input
                  name={field}
                  onChange={handlePrivateFieldChange}
                  placeholder="Separado por comas"
                  value={privateForm[field]}
                />
              </label>
            ))}
          </div>

          <div className="oraculo-npc-builder-text-grid">
            {privateTextAreas.map(([field, label]) => (
              <label key={field}>
                <span>{label}</span>
                <textarea name={field} onChange={handlePrivateFieldChange} value={privateForm[field]} />
              </label>
            ))}
          </div>
          <p className="oraculo-npc-builder-note">
            Confirmación interna: isNpc se guarda siempre como true y los datos RPG permanecen en /characterSheets.
          </p>
        </section>

        <div className="oraculo-npc-builder-actions">
          <button disabled={isCreating} type="submit">
            {isCreating ? 'Creando NPC...' : 'Crear NPC'}
          </button>
          <button disabled={isCreating} onClick={resetBuilder} type="button">
            Reiniciar formulario
          </button>
        </div>
      </form>
    </section>
  )
}

export default OraculoNpcBuilder
