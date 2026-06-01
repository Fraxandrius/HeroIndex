import { useEffect, useState } from 'react'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { useNews } from '../hooks/useNews.js'
import {
  createOrUpdateCharacterSheet,
  subscribeToCharacterSheet,
  updateCharacterSheet,
} from '../services/characterSheetsService.js'
import { deleteHero } from '../services/heroesService.js'
import {
  createKarmaTransaction,
  getKarmaCostOptions,
  getKarmaGainOptions,
  getKarmaPenaltyOptions,
  subscribeToKarmaTransactions,
} from '../services/karmaService.js'
import { subscribeToMissionCalculations } from '../services/missionCalculationsService.js'

const statusLabels = {
  approved: 'Aprobado',
  draft: 'Borrador',
  rejected: 'Rechazado',
}

const attributeLabels = {
  agility: 'Agility',
  fighting: 'Fighting',
  intuition: 'Intuition',
  presence: 'Presence',
  reason: 'Reason',
  strength: 'Strength',
}

const attributeKeys = ['fighting', 'agility', 'strength', 'reason', 'intuition', 'presence']
const listFields = ['powers', 'talents', 'drawbacks', 'flags']

const karmaTypeLabels = {
  adjustment: 'Ajuste',
  gain: 'Ganancia',
  penalty: 'Penalización',
  spend: 'Gasto',
}

const karmaTypeOptions = [
  { id: 'gain', label: 'Ganancia' },
  { id: 'spend', label: 'Gasto' },
  { id: 'penalty', label: 'Penalización' },
  { id: 'adjustment', label: 'Ajuste' },
]

function getKarmaOptionsByType(type) {
  if (type === 'spend') return getKarmaCostOptions()
  if (type === 'penalty') return getKarmaPenaltyOptions()
  if (type === 'gain') return getKarmaGainOptions()

  return [{ category: 'manual_adjustment', label: 'Ajuste manual', amount: 1, manual: true }]
}

function formatKarmaAmount(amount) {
  const value = Number(amount ?? 0)

  return value > 0 ? `+${value}` : String(value)
}

const baseCharacterSheet = {
  attributes: {
    agility: 1,
    fighting: 1,
    intuition: 1,
    presence: 1,
    reason: 1,
    strength: 1,
  },
  drawbacks: [],
  flags: [],
  gear: '',
  gmNotes: '',
  health: 0,
  isNpc: true,
  karma: 0,
  ownerId: '',
  personality: '',
  powers: [],
  realName: '',
  relationships: '',
  reputation: '',
  resources: '',
  resolve: 0,
  role: '',
  talents: [],
}

function getNumericValue(value) {
  const numberValue = Number(value ?? 0)

  return Number.isNaN(numberValue) ? 0 : numberValue
}

function toTimestamp(value) {
  if (!value) return 0
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value

  const parsed = Date.parse(value)

  return Number.isNaN(parsed) ? 0 : parsed
}

function formatDate(value) {
  const timestamp = toTimestamp(value)

  if (!timestamp) return 'Fecha pendiente'

  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}

function getInitials(name = '') {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')

  return initials || 'HI'
}

function getHeroDisplayName(hero = {}) {
  return hero.alias || hero.publicName || hero.codename || hero.name || 'Identidad HeroIndex'
}

function getHeroTitle(hero = {}) {
  return hero.heroTitle || 'Figura HeroIndex'
}

function getHeroTier(rankingPoints) {
  const points = getNumericValue(rankingPoints)

  if (points >= 20000) return 'Símbolo global'
  if (points >= 10000) return 'Figura internacional'
  if (points >= 6000) return 'Ícono nacional'
  if (points >= 3000) return 'Héroe destacado'
  if (points >= 1500) return 'Héroe reconocido'
  if (points >= 750) return 'Protector urbano'
  if (points >= 250) return 'Héroe emergente'

  return 'Registro inicial'
}

function getCorporationName(hero, getCorporationById) {
  if (hero.independent === true || !hero.corporationId || hero.corporationId === 'independent') {
    return 'Independiente'
  }

  return getCorporationById(hero.corporationId)?.name || hero.corporationId
}

function getPublicPowers(hero = {}) {
  const powers = hero.publicPowers ?? hero.visiblePowers

  if (Array.isArray(powers)) return powers.filter(Boolean)

  if (typeof powers === 'string' && powers.trim()) {
    return powers
      .split(',')
      .map((power) => power.trim())
      .filter(Boolean)
  }

  return []
}

function getSummary(value = '') {
  return value.length > 160 ? `${value.slice(0, 157)}...` : value
}

function formatInternalValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ')
  if (value && typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (value === 0) return '0'

  return value ? String(value) : ''
}

function getInternalFields(hero = {}) {
  return [
    ['Nombre real', hero.realName],
    ['Índice de confianza interno', hero.trustScore],
    ['Índice de riesgo', hero.risk],
    ['Flags ORÁCULO', hero.flags],
    ['Notas GM', hero.gmNotes],
    ['Clasificación legacy', hero.powerClass],
    ['Independiente', hero.independent],
    ['Alcance de ranking', hero.rankingScope],
    ['País', hero.country],
    ['Cobertura', hero.coverageCountry],
  ]
    .map(([label, value]) => [label, formatInternalValue(value)])
    .filter(([, value]) => value)
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function arrayToText(value) {
  return normalizeArray(value).join(', ')
}

function createBaseCharacterSheet(heroId) {
  return {
    ...baseCharacterSheet,
    heroId,
  }
}

function getSheetFormValues(sheet = {}) {
  const mergedSheet = {
    ...baseCharacterSheet,
    ...sheet,
    attributes: {
      ...baseCharacterSheet.attributes,
      ...(sheet.attributes ?? {}),
    },
  }

  return {
    ...mergedSheet,
    drawbacks: arrayToText(mergedSheet.drawbacks),
    flags: arrayToText(mergedSheet.flags),
    powers: arrayToText(mergedSheet.powers),
    talents: arrayToText(mergedSheet.talents),
  }
}

function getSheetPayload(formState = {}) {
  return {
    realName: formState.realName ?? '',
    role: formState.role ?? '',
    ownerId: formState.ownerId ?? '',
    isNpc: Boolean(formState.isNpc),
    attributes: Object.fromEntries(
      attributeKeys.map((key) => [key, getNumericValue(formState.attributes?.[key] ?? 1)]),
    ),
    health: getNumericValue(formState.health),
    resolve: getNumericValue(formState.resolve),
    karma: getNumericValue(formState.karma),
    powers: normalizeArray(formState.powers),
    talents: normalizeArray(formState.talents),
    drawbacks: normalizeArray(formState.drawbacks),
    flags: normalizeArray(formState.flags),
    resources: formState.resources ?? '',
    gear: formState.gear ?? '',
    reputation: formState.reputation ?? '',
    personality: formState.personality ?? '',
    relationships: formState.relationships ?? '',
    gmNotes: formState.gmNotes ?? '',
  }
}

function renderListValue(value) {
  const items = normalizeArray(value)

  if (items.length === 0) return <span>—</span>

  return (
    <div className="oraculo-character-sheet__chips">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  )
}

function getSheetOwnershipStatus(sheet = {}) {
  if (!sheet.ownerId) return 'Sin propietario'

  return sheet.isNpc ? 'NPC' : 'Jugador'
}

function getAttributeScale(value) {
  const normalizedValue = Math.min(10, Math.max(0, getNumericValue(value)))

  return `${normalizedValue * 10}%`
}

function renderTextValue(value) {
  return value ? String(value) : '—'
}

function OraculoHeroDossier({ onNavigate, routeParams = {} }) {
  const heroId = routeParams.heroId
  const { error: heroesError, heroes, loading: heroesLoading } = useHeroes()
  const { feedNews, loading: newsLoading, error: newsError } = useNews()
  const {
    error: corporationsError,
    getCorporationById,
    loading: corporationsLoading,
  } = useCorporations()
  const [missionCalculations, setMissionCalculations] = useState([])
  const [calculationsError, setCalculationsError] = useState(null)
  const [calculationsLoading, setCalculationsLoading] = useState(true)
const [characterSheet, setCharacterSheet] = useState(null)
  const [characterSheetError, setCharacterSheetError] = useState(null)
  const [characterSheetLoading, setCharacterSheetLoading] = useState(true)
  const [characterSheetForm, setCharacterSheetForm] = useState(getSheetFormValues())
  const [isEditingCharacterSheet, setIsEditingCharacterSheet] = useState(false)
  const [isCreatingCharacterSheet, setIsCreatingCharacterSheet] = useState(false)
  const [isSavingCharacterSheet, setIsSavingCharacterSheet] = useState(false)
  const [characterSheetMessage, setCharacterSheetMessage] = useState('')
  const [characterSheetSaveError, setCharacterSheetSaveError] = useState('')
 const [deleteMessage, setDeleteMessage] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [isDeletingHero, setIsDeletingHero] = useState(false)
const [karmaTransactions, setKarmaTransactions] = useState([])
  const [karmaTransactionsLoading, setKarmaTransactionsLoading] = useState(true)
  const [karmaTransactionsError, setKarmaTransactionsError] = useState(null)
  const [karmaForm, setKarmaForm] = useState({
    amount: '1',
    category: 'action_scene',
    notes: '',
    reason: 'Participó en escena de acción',
    type: 'gain',
  })
  const [karmaMessage, setKarmaMessage] = useState('')
  const [karmaError, setKarmaError] = useState('')
  const [isSavingKarma, setIsSavingKarma] = useState(false)
  
  useEffect(() => {
    return subscribeToMissionCalculations(
      (items) => {
        setMissionCalculations(items)
        setCalculationsLoading(false)
      },
      (error) => {
        setCalculationsError(error)
        setCalculationsLoading(false)
      },
    )
  }, [])

  useEffect(() => {
    return subscribeToCharacterSheet(
      heroId,
      (sheet) => {
        setCharacterSheet(sheet)
        setCharacterSheetLoading(false)
        if (sheet && !isEditingCharacterSheet) {
          setCharacterSheetForm(getSheetFormValues(sheet))
        }
      },
      (error) => {
        setCharacterSheetError(error)
        setCharacterSheetLoading(false)
      },
    )
  }, [heroId, isEditingCharacterSheet])

  useEffect(() => {
    return subscribeToKarmaTransactions(
      heroId,
      (items) => {
        setKarmaTransactions(items)
        setKarmaTransactionsLoading(false)
      },
      (error) => {
        setKarmaTransactionsError(error)
        setKarmaTransactionsLoading(false)
      },
    )
  }, [heroId])

  const hero = heroes.find((heroItem) => String(heroItem.id) === String(heroId))
  const displayName = hero ? getHeroDisplayName(hero) : ''
  const relatedCalculations = hero
    ? missionCalculations
        .filter((calculation) => String(calculation.heroId) === String(hero.id))
        .sort((first, second) => toTimestamp(second.createdAt) - toTimestamp(first.createdAt))
    : []
  const relatedNews = hero
    ? feedNews
        .filter(
          (newsItem) =>
            Array.isArray(newsItem.heroIds) && newsItem.heroIds.map(String).includes(String(hero.id)),
        )
        .sort((first, second) => toTimestamp(second.createdAt) - toTimestamp(first.createdAt))
    : []

  const loading = heroesLoading || corporationsLoading || newsLoading || calculationsLoading || characterSheetLoading || karmaTransactionsLoading
  const error = heroesError || corporationsError || newsError || calculationsError

  const handleCreateCharacterSheet = async () => {
    setIsCreatingCharacterSheet(true)
    setCharacterSheetMessage('')
    setCharacterSheetSaveError('')

    try {
      await createOrUpdateCharacterSheet(hero.id, createBaseCharacterSheet(hero.id))
      setCharacterSheetMessage('Hoja privada creada correctamente.')
     } catch {
      setCharacterSheetSaveError(error.message ?? String(error))
    } finally {
      setIsCreatingCharacterSheet(false)
    }
  }

  const handleStartCharacterSheetEdit = () => {
    setCharacterSheetForm(getSheetFormValues(characterSheet))
    setIsEditingCharacterSheet(true)
    setCharacterSheetMessage('')
    setCharacterSheetSaveError('')
  }

  const handleCancelCharacterSheetEdit = () => {
    setCharacterSheetForm(getSheetFormValues(characterSheet))
    setIsEditingCharacterSheet(false)
    setCharacterSheetSaveError('')
  }

  const handleCharacterSheetFieldChange = (event) => {
    const { checked, name, type, value } = event.target

    setCharacterSheetForm((currentForm) => ({
      ...currentForm,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setCharacterSheetSaveError('')
    setCharacterSheetMessage('')
  }

  const handleCharacterSheetAttributeChange = (event) => {
    const { name, value } = event.target

    setCharacterSheetForm((currentForm) => ({
      ...currentForm,
      attributes: {
        ...currentForm.attributes,
        [name]: value,
      },
    }))
    setCharacterSheetSaveError('')
    setCharacterSheetMessage('')
  }

  const handleDeleteHero = async (deleteCharacterSheet = false) => {
    const confirmationMessage = deleteCharacterSheet
      ? 'Eliminar héroe y hoja privada RPG. Esta acción no se puede deshacer.'
      : 'Eliminar héroe público. Las noticias y evaluaciones asociadas no se eliminarán automáticamente. Esta acción no se puede deshacer.'

    if (!window.confirm(confirmationMessage)) return

    setIsDeletingHero(true)
    setDeleteMessage('Eliminando...')
    setDeleteError('')

    try {
      await deleteHero(hero.id, { deleteCharacterSheet })
      setDeleteMessage('Registro eliminado correctamente.')
      onNavigate?.('oraculo-hub')
    } catch {
      setDeleteError('No fue posible eliminar el registro.')
      setDeleteMessage('')
    } finally {
      setIsDeletingHero(false)
    }
  }

  const handleSaveCharacterSheet = async (event) => {
    event.preventDefault()
    setIsSavingCharacterSheet(true)
    setCharacterSheetMessage('')
    setCharacterSheetSaveError('')

    try {
      await updateCharacterSheet(hero.id, getSheetPayload(characterSheetForm))
      setCharacterSheetMessage('Hoja privada guardada correctamente.')
      setIsEditingCharacterSheet(false)
     } catch {
      setCharacterSheetSaveError(error.message ?? String(error))
    } finally {
      setIsSavingCharacterSheet(false)
    }
  }

  const handleKarmaTypeChange = (event) => {
    const nextType = event.target.value
    const [firstOption] = getKarmaOptionsByType(nextType)

    setKarmaForm({
      amount: String(firstOption?.amount ?? 1),
      category: firstOption?.category ?? '',
      notes: '',
      reason: firstOption?.label ?? '',
      type: nextType,
    })
    setKarmaMessage('')
    setKarmaError('')
  }

  const handleKarmaCategoryChange = (event) => {
    const option = getKarmaOptionsByType(karmaForm.type).find((item) => item.category === event.target.value)

    setKarmaForm((currentForm) => ({
      ...currentForm,
      amount: String(option?.amount ?? currentForm.amount),
      category: event.target.value,
      reason: option?.label ?? currentForm.reason,
    }))
    setKarmaMessage('')
    setKarmaError('')
  }

  const handleKarmaFieldChange = (event) => {
    const { name, value } = event.target

    setKarmaForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
    setKarmaMessage('')
    setKarmaError('')
  }

  const handleCreateKarmaTransaction = async (event) => {
    event.preventDefault()
    setIsSavingKarma(true)
    setKarmaMessage('')
    setKarmaError('')

    try {
      const rawAmount = getNumericValue(karmaForm.amount)
      const signedAmount =
        karmaForm.type === 'spend' || karmaForm.type === 'penalty'
          ? -Math.abs(rawAmount)
          : karmaForm.type === 'gain'
            ? Math.abs(rawAmount)
            : rawAmount

      await createKarmaTransaction({
        heroId: hero.id,
        type: karmaForm.type,
        amount: signedAmount,
        category: karmaForm.category,
        reason: karmaForm.reason,
        notes: karmaForm.notes,
        source: 'oraculo',
        status: 'accepted',
        createdBy: 'ORÁCULO/GM',
      })
      setKarmaMessage('Movimiento de Karma registrado correctamente.')
      setKarmaForm((currentForm) => ({
        ...currentForm,
        notes: '',
      }))
    } catch (transactionError) {
      setKarmaError(transactionError.message ?? 'No fue posible registrar el movimiento de Karma.')
    } finally {
      setIsSavingKarma(false)
    }
  }

  if (loading) {
    return (
      <section className="page-card oraculo-dossier-page">
        <p className="oraculo-dossier-state">Cargando dossier ORÁCULO...</p>
      </section>
    )
  }

  if (error && !hero) {
    return (
      <section className="page-card oraculo-dossier-page">
        <p className="oraculo-dossier-state oraculo-dossier-state--error">No fue posible cargar el dossier.</p>
      </section>
    )
  }

  if (!hero) {
    return (
      <section className="page-card oraculo-dossier-page">
        <p className="oraculo-dossier-state">No se encontró el héroe solicitado.</p>
      </section>
    )
  }

  const corporationName = getCorporationName(hero, getCorporationById)
  const publicPowers = getPublicPowers(hero)
  const publicBio = hero.publicBio || 'Biografía pública pendiente de actualización.'
  const internalFields = getInternalFields(hero)
    const displaySheet = characterSheet
    ? {
        ...baseCharacterSheet,
        ...characterSheet,
        attributes: {
          ...baseCharacterSheet.attributes,
          ...(characterSheet.attributes ?? {}),
        },
      }
    : null

  return (
    <section className="page-card oraculo-dossier-page">
      <nav className="oraculo-dossier-actions" aria-label="Navegación del dossier">
        <button onClick={() => onNavigate?.('hero-profile', { heroId: hero.id })} type="button">
          Ver perfil público
        </button>
        <button onClick={() => onNavigate?.('gm-manager')} type="button">
          Volver a GM Manager
        </button>
        <button onClick={() => onNavigate?.('ranking')} type="button">
          Volver al Ranking
        </button>
        <button onClick={() => onNavigate?.('mission-calculator')} type="button">
          Volver a Mission Calculator
        </button>
         <button disabled={isDeletingHero} onClick={() => handleDeleteHero(false)} type="button">
          {isDeletingHero ? 'Eliminando...' : 'Eliminar héroe'}
        </button>
        <button disabled={isDeletingHero} onClick={() => handleDeleteHero(true)} type="button">
          Eliminar héroe y hoja privada RPG
        </button>
      </nav>

 {deleteError ? <p className="oraculo-dossier-state oraculo-dossier-state--error">{deleteError}</p> : null}
      {deleteMessage ? <p className="oraculo-dossier-state">{deleteMessage}</p> : null}
      <header className="oraculo-dossier-cover">
        {hero.bannerUrl ? (
          <img
            alt={`Portada interna de ${displayName}`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.hidden = true
            }}
            src={hero.bannerUrl}
          />
        ) : null}
        <div className="oraculo-dossier-cover__content">
          <span className="oraculo-dossier-avatar">
            <span>{getInitials(displayName)}</span>
            {hero.avatarUrl ? (
              <img
                alt={`Avatar interno de ${displayName}`}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.hidden = true
                }}
                src={hero.avatarUrl}
              />
            ) : null}
          </span>
          <div>
            <span className="oraculo-dossier-access">Acceso ORÁCULO</span>
            <p className="page-card__kicker">Dossier ORÁCULO</p>
            <h2>{displayName}</h2>
            <p className="oraculo-dossier-subtitle">
              Registro interno de evaluación, exposición pública y control operativo.
            </p>
            <div className="oraculo-dossier-tags">
              <span>{getHeroTitle(hero)}</span>
              <span>{corporationName}</span>
              <span>{hero.active === false ? 'Inactivo' : 'Activo'}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="oraculo-dossier-grid">
        <main className="oraculo-dossier-main">
          <section className="oraculo-dossier-panel">
            <h3>Resumen público observado</h3>
            <div className="oraculo-dossier-summary-grid">
              <div>
                <span>Puntos HeroIndex</span>
                <strong>{getNumericValue(hero.rankingPoints)}</strong>
              </div>
              <div>
                <span>Aprobación ciudadana</span>
                <strong>{getNumericValue(hero.approval)}</strong>
              </div>
              <div>
                <span>Tier público</span>
                <strong>{getHeroTier(hero.rankingPoints)}</strong>
              </div>
              <div>
                <span>Afiliación</span>
                <strong>{corporationName}</strong>
              </div>
            </div>
            <dl className="oraculo-dossier-public-list">
              <div>
                <dt>Título heroico</dt>
                <dd>{getHeroTitle(hero)}</dd>
              </div>
              <div>
                <dt>Poderes visibles</dt>
                <dd>{publicPowers.length > 0 ? publicPowers.join(', ') : 'Sin poderes públicos registrados.'}</dd>
              </div>
              <div>
                <dt>Biografía pública</dt>
                <dd>{publicBio}</dd>
              </div>
            </dl>
          </section>

<section className="oraculo-dossier-panel oraculo-character-sheet">
            <div className="oraculo-dossier-panel__header">
              <div>
                <h3>Hoja privada RPG</h3>
                <p>Esta hoja pertenece a la capa ORÁCULO. No aparece en perfiles públicos ni en el ranking.</p>
              </div>
              {characterSheet && !isEditingCharacterSheet ? (
                <button className="oraculo-character-sheet__action" onClick={handleStartCharacterSheetEdit} type="button">
                  Editar hoja privada
                </button>
              ) : null}
            </div>
            {characterSheetError ? (
              <p className="oraculo-dossier-state oraculo-dossier-state--error">
                No fue posible cargar la hoja privada RPG.
              </p>
            ) : null}
            {characterSheetMessage ? (
              <p className="oraculo-dossier-state oraculo-dossier-state--success">{characterSheetMessage}</p>
            ) : null}
            {characterSheetSaveError ? (
              <p className="oraculo-dossier-state oraculo-dossier-state--error">{characterSheetSaveError}</p>
            ) : null}

            {!characterSheet ? (
                       <div className="oraculo-character-sheet__empty oraculo-character-sheet__empty--classified">
                <div>
                  <span className="oraculo-character-sheet__stamp">Ficha clasificada no registrada</span>
                  <h4>No existe hoja privada RPG para este héroe.</h4>
                  <p>ORÁCULO puede generar una hoja base para iniciar seguimiento RPG privado.</p>
                </div>
                <button
                  className="oraculo-character-sheet__action"
                  disabled={isCreatingCharacterSheet}
                  onClick={handleCreateCharacterSheet}
                  type="button"
                >
                  {isCreatingCharacterSheet ? 'Creando hoja…' : 'Crear hoja privada'}
                </button>
              </div>
            ) : null}

            {displaySheet && !isEditingCharacterSheet ? (
              <div className="oraculo-character-sheet__summary">
                <div className="oraculo-character-sheet__timestamps">
                  <span>Creada: {displaySheet.createdAt ? formatDate(displaySheet.createdAt) : 'Fecha pendiente'}</span>
                  <span>Última actualización: {displaySheet.updatedAt ? formatDate(displaySheet.updatedAt) : 'Fecha pendiente'}</span>
                </div>

                <section className="oraculo-character-sheet__block">
                  <div className="oraculo-character-sheet__block-title">
                    <span>01</span>
                    <h4>Identidad privada</h4>
                  </div>
                  <dl className="oraculo-character-sheet__identity">
                    <div>
                      <dt>Nombre real</dt>
                      <dd>{displaySheet.realName || '—'}</dd>
                    </div>
                    <div>
                      <dt>Rol</dt>
                      <dd>{displaySheet.role || '—'}</dd>
                    </div>
                    <div>
                      <dt>Tipo</dt>
                      <dd>{displaySheet.isNpc ? 'NPC' : 'Jugador'}</dd>
                    </div>
                    <div>
                      <dt>Owner ID</dt>
                      <dd>{displaySheet.ownerId || '—'}</dd>
                    </div>
                    <div>
                      <dt>Estado de hoja</dt>
                      <dd>{getSheetOwnershipStatus(displaySheet)}</dd>
                    </div>
                  </dl>
                </section>

                <section className="oraculo-character-sheet__block">
                  <div className="oraculo-character-sheet__block-title">
                    <span>02</span>
                    <h4>Atributos</h4>
                  </div>
                <div className="oraculo-character-sheet__attributes">
                    {attributeKeys.map((attribute) => (
                      <div key={attribute} className="oraculo-character-sheet__attribute-card">
                        <span>{attributeLabels[attribute]}</span>
                        <strong>{getNumericValue(displaySheet.attributes?.[attribute])}</strong>
                        <div className="oraculo-character-sheet__attribute-scale" aria-hidden="true">
                          <i style={{ '--attribute-level': getAttributeScale(displaySheet.attributes?.[attribute]) }} />
                        </div>
                        <small>Escala 1–10</small>
                      </div>
                    ))}
                  </div>
                  </section>

                <section className="oraculo-character-sheet__block">
                  <div className="oraculo-character-sheet__block-title">
                    <span>03</span>
                    <h4>Recursos de juego</h4>
                  </div>
                  <p className="oraculo-character-sheet__privacy-note">Karma es progresión RPG. No modifica el Ranking HeroIndex.</p>
                  <dl className="oraculo-character-sheet__identity">
                    <div>
                      <dt>Health</dt>
                      <dd>{getNumericValue(displaySheet.health)}</dd>
                    </div>
                    <div>
                      <dt>Resolve</dt>
                      <dd>{getNumericValue(displaySheet.resolve)}</dd>
                    </div>
                    <div>
                      <dt>Karma</dt>
                      <dd>{getNumericValue(displaySheet.karma)}</dd>
                    </div>
                  </dl>
                </section>

                <section className="oraculo-character-sheet__block">
                  <div className="oraculo-character-sheet__block-title">
                    <span>04</span>
                    <h4>Poderes y rasgos</h4>
                  </div>
                  <dl className="oraculo-character-sheet__details">
                    <div>
                      <dt>Powers</dt>
                      <dd>{renderListValue(displaySheet.powers)}</dd>
                    </div>
                    <div>
                      <dt>Talents</dt>
                      <dd>{renderListValue(displaySheet.talents)}</dd>
                    </div>
                    <div>
                      <dt>Drawbacks</dt>
                      <dd>{renderListValue(displaySheet.drawbacks)}</dd>
                    </div>
                    <div>
                      <dt>Flags</dt>
                      <dd>{renderListValue(displaySheet.flags)}</dd>
                    </div>
                  </dl>
                </section>

                <section className="oraculo-character-sheet__block">
                  <div className="oraculo-character-sheet__block-title">
                    <span>05</span>
                    <h4>Perfil narrativo</h4>
                  </div>
                  <dl className="oraculo-character-sheet__details">
                    <div>
                      <dt>Resources</dt>
                      <dd>{renderTextValue(displaySheet.resources)}</dd>
                    </div>
                    <div>
                      <dt>Gear</dt>
                      <dd>{renderTextValue(displaySheet.gear)}</dd>
                    </div>
                    <div>
                      <dt>Reputation</dt>
                      <dd>{renderTextValue(displaySheet.reputation)}</dd>
                    </div>
                    <div>
                      <dt>Personality</dt>
                      <dd>{renderTextValue(displaySheet.personality)}</dd>
                    </div>
                    <div>
                      <dt>Relationships</dt>
                      <dd>{renderTextValue(displaySheet.relationships)}</dd>
                    </div>
                  </dl>
                </section>

                <section className="oraculo-character-sheet__block oraculo-character-sheet__block--notes">
                  <div className="oraculo-character-sheet__block-title">
                    <span>06</span>
                    <h4>Notas ORÁCULO</h4>
                  </div>
                <p className="oraculo-character-sheet__privacy-note">Notas internas del GM/ORÁCULO. No aparecen en perfiles públicos.</p>
                  <p className="oraculo-character-sheet__notes">{renderTextValue(displaySheet.gmNotes)}</p>
                </section>
              </div>
            ) : null}

            {isEditingCharacterSheet ? (
              <form className="oraculo-character-sheet__form" onSubmit={handleSaveCharacterSheet}>
                <section className="oraculo-character-sheet__block">
                  <div className="oraculo-character-sheet__block-title">
                    <span>01</span>
                    <h4>Identidad privada</h4>
                  </div>
                  <div className="oraculo-character-sheet__form-grid">
                    <label>
                      <span>Nombre real</span>
                      <input name="realName" onChange={handleCharacterSheetFieldChange} value={characterSheetForm.realName} />
                    </label>
                    <label>
                      <span>Rol</span>
                      <input name="role" onChange={handleCharacterSheetFieldChange} value={characterSheetForm.role} />
                    </label>
                    <label>
                      <span>Owner ID</span>
                      <input name="ownerId" onChange={handleCharacterSheetFieldChange} value={characterSheetForm.ownerId} />
                    </label>
                    <label className="oraculo-character-sheet__checkbox">
                      <input
                        checked={characterSheetForm.isNpc}
                        name="isNpc"
                        onChange={handleCharacterSheetFieldChange}
                        type="checkbox"
                      />
                      <span>Es NPC</span>
                    </label>
                  </div>
                </section>

                <section className="oraculo-character-sheet__block">
                  <div className="oraculo-character-sheet__block-title">
                    <span>02</span>
                    <h4>Atributos</h4>
                  </div>
                  <div className="oraculo-character-sheet__attributes-edit">
                    {attributeKeys.map((attribute) => (
                      <label key={attribute}>
                        <span>{attributeLabels[attribute]}</span>
                        <input
                          max="10"
                          min="1"
                          name={attribute}
                          onChange={handleCharacterSheetAttributeChange}
                          type="number"
                          value={characterSheetForm.attributes?.[attribute] ?? 1}
                        />
                      </label>
                    ))}
                  </div>
                </section>

                <section className="oraculo-character-sheet__block">
                  <div className="oraculo-character-sheet__block-title">
                    <span>03</span>
                    <h4>Recursos de juego</h4>
                  </div>
                  <p className="oraculo-character-sheet__privacy-note">Karma es progresión RPG. No modifica el Ranking HeroIndex.</p>
                  <div className="oraculo-character-sheet__form-grid">
                    <label>
                      <span>Health</span>
                      <input name="health" onChange={handleCharacterSheetFieldChange} type="number" value={characterSheetForm.health} />
                    </label>
                     <label>
                      <span>Resolve</span>
                      <input name="resolve" onChange={handleCharacterSheetFieldChange} type="number" value={characterSheetForm.resolve} />
                    </label>
 <label>
                      <span>Karma</span>
                      <input name="karma" onChange={handleCharacterSheetFieldChange} type="number" value={characterSheetForm.karma} />
                    </label>
                  </div>
                </section>

                <section className="oraculo-character-sheet__block">
                  <div className="oraculo-character-sheet__block-title">
                    <span>04</span>
                    <h4>Poderes y rasgos</h4>
                  </div>
                  <div className="oraculo-character-sheet__form-grid">
                    {listFields.map((field) => (
                      <label key={field}>
                        <span>{field === 'powers' ? 'Powers' : field === 'talents' ? 'Talents' : field === 'drawbacks' ? 'Drawbacks' : 'Flags'}</span>
                        <input
                          name={field}
                          onChange={handleCharacterSheetFieldChange}
                          placeholder="Separado por comas"
                          value={characterSheetForm[field]}
                        />
                      </label>
                    ))}
                  </div>
                </section>

                <section className="oraculo-character-sheet__block">
                  <div className="oraculo-character-sheet__block-title">
                    <span>05</span>
                    <h4>Perfil narrativo</h4>
                  </div>
                  <div className="oraculo-character-sheet__text-grid">
                    {[
                      ['resources', 'Resources'],
                      ['gear', 'Gear'],
                      ['reputation', 'Reputation'],
                      ['personality', 'Personality'],
                      ['relationships', 'Relationships'],
                    ].map(([field, label]) => (
                      <label key={field}>
                        <span>{label}</span>
                        <textarea name={field} onChange={handleCharacterSheetFieldChange} value={characterSheetForm[field]} />
                      </label>
                    ))}
                  </div>
                </section>

                <section className="oraculo-character-sheet__block oraculo-character-sheet__block--notes">
                  <div className="oraculo-character-sheet__block-title">
                    <span>06</span>
                    <h4>Notas ORÁCULO</h4>
                  </div>
                  <p className="oraculo-character-sheet__privacy-note">Notas internas del GM/ORÁCULO. No aparecen en perfiles públicos.</p>
                  <label>
                    <span>Notas GM</span>
                    <textarea name="gmNotes" onChange={handleCharacterSheetFieldChange} value={characterSheetForm.gmNotes} />
                  </label>
                </section>

                <div className="oraculo-character-sheet__form-actions">
                  <button className="oraculo-character-sheet__action" disabled={isSavingCharacterSheet} type="submit">
                    {isSavingCharacterSheet ? 'Guardando…' : 'Guardar hoja'}
                  </button>
                  <button
                    className="oraculo-character-sheet__action oraculo-character-sheet__action--secondary"
                    disabled={isSavingCharacterSheet}
                    onClick={handleCancelCharacterSheetEdit}
                    type="button"
                  >
                    Cancelar edición
                  </button>
                </div>
              </form>
            ) : null}
            
          </section>

<section className="oraculo-dossier-panel oraculo-karma-management">
            <div className="oraculo-dossier-panel__header">
              <div>
                <h3>Karma</h3>
                <p>Karma es progresión RPG. No modifica Ranking HeroIndex ni aprobación ciudadana.</p>
                  <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('oraculo-karma-manager')} type="button">
                  Abrir Gestor de Karma
                </button>
              </div>
              <strong className="oraculo-karma-management__value">
                {getNumericValue(characterSheet?.karma)} Karma
              </strong>
            </div>

            {karmaTransactionsError ? (
              <p className="oraculo-dossier-state oraculo-dossier-state--error">
                No fue posible cargar el historial de Karma.
              </p>
            ) : null}
            {karmaMessage ? <p className="oraculo-dossier-state oraculo-dossier-state--success">{karmaMessage}</p> : null}
            {karmaError ? <p className="oraculo-dossier-state oraculo-dossier-state--error">{karmaError}</p> : null}

            <form className="oraculo-karma-form hi-form" onSubmit={handleCreateKarmaTransaction}>
              <label className="hi-field">
                <span className="hi-label">Tipo</span>
                <select className="hi-select" name="type" onChange={handleKarmaTypeChange} value={karmaForm.type}>
                  {karmaTypeOptions.map((typeOption) => (
                    <option key={typeOption.id} value={typeOption.id}>
                      {typeOption.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="hi-field">
                <span className="hi-label">Categoría</span>
                <select className="hi-select" name="category" onChange={handleKarmaCategoryChange} value={karmaForm.category}>
                  {getKarmaOptionsByType(karmaForm.type).map((option) => (
                    <option key={option.category} value={option.category}>
                      {option.label} ({formatKarmaAmount(option.amount)})
                    </option>
                  ))}
                </select>
              </label>
              <label className="hi-field">
                <span className="hi-label">Cantidad</span>
                <input className="hi-input" name="amount" onChange={handleKarmaFieldChange} type="number" value={karmaForm.amount} />
              </label>
              <label className="hi-field">
                <span className="hi-label">Motivo</span>
                <input className="hi-input" name="reason" onChange={handleKarmaFieldChange} value={karmaForm.reason} />
              </label>
              <label className="hi-field oraculo-karma-form__wide">
                <span className="hi-label">Notas ORÁCULO</span>
                <textarea className="hi-textarea" name="notes" onChange={handleKarmaFieldChange} value={karmaForm.notes} />
              </label>
              <div className="oraculo-karma-form__wide">
                <button className="hi-button hi-button-primary" disabled={isSavingKarma} type="submit">
                  {isSavingKarma ? 'Registrando…' : 'Registrar movimiento'}
                </button>
              </div>
            </form>

            <div className="oraculo-karma-history">
              <h4>Historial reciente</h4>
              {karmaTransactions.length > 0 ? (
                karmaTransactions.slice(0, 6).map((transaction) => (
                  <article className={`karma-transaction karma-transaction--${transaction.type}`} key={transaction.id}>
                    <div>
                      <span>{karmaTypeLabels[transaction.type] ?? transaction.type}</span>
                      <strong>{formatKarmaAmount(transaction.amount)}</strong>
                    </div>
                    <p>{transaction.reason || 'Movimiento sin motivo'}</p>
                    <small>{formatDate(transaction.createdAt)} · {transaction.source === 'player' ? 'Jugador' : 'ORÁCULO'} · {transaction.notes || 'Sin notas'}</small>
                  </article>
                ))
              ) : (
                <p>Sin movimientos de Karma registrados.</p>
              )}
            </div>
          </section>

          <section className="oraculo-dossier-panel">
            <h3>Evaluaciones ORÁCULO</h3>
            {relatedCalculations.length > 0 ? (
              <div className="oraculo-dossier-assessments">
                {relatedCalculations.map((calculation) => (
                  <article key={calculation.id}>
                    <div>
                      <span>{statusLabels[calculation.status] ?? calculation.status ?? 'Borrador'}</span>
                      <h4>{calculation.missionName || 'Misión sin nombre'}</h4>
                      <p>{calculation.classification || 'Clasificación pendiente'}</p>
                    </div>
                    <dl>
                      <div>
                        <dt>Puntos sugeridos</dt>
                        <dd>{getNumericValue(calculation.suggestedRankingPoints)}</dd>
                      </div>
                      <div>
                        <dt>Aplicación</dt>
                        <dd>{calculation.applied ? 'Aplicada al ranking' : 'Pendiente de aplicación'}</dd>
                      </div>
                      <div>
                        <dt>Creada</dt>
                        <dd>{formatDate(calculation.createdAt)}</dd>
                      </div>
                      {calculation.appliedAt ? (
                        <div>
                          <dt>Aplicada</dt>
                          <dd>{formatDate(calculation.appliedAt)}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <p>Sin evaluaciones ORÁCULO registradas para este héroe.</p>
            )}
          </section>

          <section className="oraculo-dossier-panel">
            <h3>Noticias relacionadas</h3>
            {relatedNews.length > 0 ? (
              <div className="oraculo-dossier-news">
                {relatedNews.map((newsItem) => (
                  <article
                    className={newsItem.active === false ? 'is-inactive' : ''}
                    key={newsItem.id}
                  >
                    <span>{newsItem.active === false ? 'Inactiva' : 'Activa'}</span>
                    <small>{newsItem.category || newsItem.layer || 'HeroIndex News'} · {formatDate(newsItem.createdAt)}</small>
                    <h4>{newsItem.title}</h4>
                    {newsItem.summary ? <p>{getSummary(newsItem.summary)}</p> : null}
                  </article>
                ))}
              </div>
            ) : (
              <p>Sin noticias relacionadas.</p>
            )}
          </section>
        </main>

        <aside className="oraculo-dossier-side">
          <section className="oraculo-dossier-panel oraculo-dossier-panel--internal">
            <h3>Datos internos ORÁCULO</h3>
            {internalFields.length > 0 ? (
              <dl>
                {internalFields.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p>Sin datos internos registrados.</p>
            )}
          </section>

          <section className="oraculo-dossier-panel oraculo-dossier-panel--notice">
            <h3>Separación de capas</h3>
            <p>
              El perfil público solo muestra identidad heroica, biografía, poderes visibles y métricas
              públicas. Este dossier ORÁCULO puede contener datos internos no visibles para civiles ni
              jugadores.
            </p>
          </section>
        </aside>
      </div>
    </section>
  )
}

export default OraculoHeroDossier
