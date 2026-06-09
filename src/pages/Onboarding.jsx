import { useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useCorporations } from '../hooks/useCorporations.js'
import { useHeroes } from '../hooks/useHeroes.js'
import { updateUserProfile } from '../services/authService.js'
import { createHero } from '../services/heroesService.js'

const defaultRegistration = {
  affiliationLabel: 'Independiente verificado',
  affiliationMode: 'independent',
  alias: '',
  avatarUrl: '',
  coverUrl: '',
  heroTitle: '',
  initialStatus: '',
  publicBio: '',
  publicLimitations: '',
  publicPowers: '',
  publicQuote: '',
  publicSpecialty: '',
  visibility: 'public',
}

function normalizeList(value = '') {
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getInitials(value = '') {
  return (
    value
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('') || 'HI'
  )
}


const registrationSteps = [
  { id: 'identity', code: 'HI-RG-01', label: 'Identidad', title: 'Identidad heroica' },
  { id: 'presence', code: 'HI-RG-02', label: 'Presencia', title: 'Presencia pública' },
  { id: 'affiliation', code: 'HI-RG-03', label: 'Afiliación', title: 'Afiliación' },
  { id: 'media', code: 'HI-RG-04', label: 'Imagen', title: 'Imagen pública' },
  { id: 'powers', code: 'HI-RG-05', label: 'Poderes', title: 'Poderes visibles' },
  { id: 'social', code: 'HI-RG-06', label: 'Social', title: 'Perfil social' },
  { id: 'internal', code: 'HI-RG-07', label: 'Validación', title: 'Validación interna' },
  { id: 'issuance', code: 'HI-RG-08', label: 'Emisión', title: 'Emisión de identidad' },
]

function Onboarding({ onNavigate }) {
  const { currentUser, isLoggedIn, loading: authLoading, logout, userProfile } = useAuth()
  const { heroes, loading: heroesLoading } = useHeroes()
  const { corporations, loading: corporationsLoading } = useCorporations()
  const [draft, setDraft] = useState(() => ({
    ...defaultRegistration,
    alias: userProfile?.heroName ?? userProfile?.displayName ?? '',
    avatarUrl: userProfile?.avatarUrl ?? '',
  }))
  const [saving, setSaving] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const accountHeroId = userProfile?.heroId ?? ''
  const currentUserUid = currentUser?.uid ?? ''
  const linkedHero = useMemo(
    () => heroes.find((hero) => String(hero.id) === String(accountHeroId)) ?? null,
    [accountHeroId, heroes],
  )
  const ownedHeroWithoutLink = useMemo(
    () => heroes.find((hero) => hero.ownerUid === currentUserUid || hero.createdByUid === currentUserUid) ?? null,
    [currentUserUid, heroes],
  )
  const hasHeroProfile = Boolean(accountHeroId || linkedHero)
  const selectedCorporation = draft.affiliationMode === 'corporation'
    ? corporations.find((corporation) => String(corporation.id) === String(draft.corporationId))
    : null
  const previewAlias = draft.alias.trim() || userProfile?.heroName || userProfile?.displayName || 'Identidad HeroIndex'
  const previewTitle = draft.heroTitle.trim() || 'Identidad en verificación'
  const previewAffiliation = draft.affiliationMode === 'corporation'
    ? selectedCorporation?.name || draft.affiliationLabel || 'Corporación pendiente'
    : draft.affiliationLabel || 'Independiente verificado'
  const previewPowers = normalizeList(draft.publicPowers)
  const completionItems = [
    { complete: Boolean(draft.alias.trim()), label: 'Alias heroico' },
    { complete: Boolean(draft.publicBio.trim()), label: 'Presencia pública' },
    { complete: Boolean(draft.avatarUrl.trim() || draft.coverUrl.trim()), label: 'Imagen' },
    { complete: previewPowers.length > 0, label: 'Poderes visibles' },
    { complete: Boolean(previewAffiliation), label: 'Afiliación' },
    { complete: Boolean(draft.visibility), label: 'Confirmación' },
  ]
  const completedItems = completionItems.filter((item) => item.complete).length
  const validationState = !draft.alias.trim()
    ? 'Registro incompleto'
    : completedItems >= 4
      ? 'Perfil público activable'
      : 'Identidad mínima lista'
  const completionPercentage = Math.round((completedItems / completionItems.length) * 100)
  const isSyncing = authLoading || heroesLoading || corporationsLoading
const activeStep = registrationSteps[currentStep]
  const isFinalStep = currentStep === registrationSteps.length - 1

  const handlePreviousStep = () => {
    setError('')
    setCurrentStep((step) => Math.max(0, step - 1))
  }

  const handleSelectStep = (stepIndex) => {
    if (stepIndex > 0 && !draft.alias.trim()) {
      setError('Alias requerido para emitir identidad pública.')
      return
    }

    setError('')
    setCurrentStep(stepIndex)
  }

  const handleNextStep = () => {
    if (currentStep === 0 && !draft.alias.trim()) {
      setError('Alias requerido para emitir identidad pública.')
      return
    }

    setError('')
    setCurrentStep((step) => Math.min(registrationSteps.length - 1, step + 1))
  }

  const updateDraft = (field, value) => {
    setDraft((currentDraft) => ({ ...currentDraft, [field]: value }))
  }

  const handleLogout = async () => {
    setSaving(true)
    setError('')
    setMessage('Cerrando sesión...')

    try {
      await logout()
      setMessage('')
      onNavigate?.('login')
    } catch {
      setMessage('')
      setError('No fue posible cerrar sesión.')
    } finally {
      setSaving(false)
    }
  }

  const handleLinkOwnedHero = async () => {
    if (!currentUser?.uid || !ownedHeroWithoutLink?.id) return

    setSaving(true)
    setError('')
    setMessage('Sincronizando identidad heroica existente…')

    try {
      await updateUserProfile(currentUser.uid, {
        avatarUrl: ownedHeroWithoutLink.avatarUrl || userProfile?.avatarUrl || '',
        displayName: userProfile?.displayName || ownedHeroWithoutLink.alias || 'Identidad HeroIndex',
        heroId: ownedHeroWithoutLink.id,
        heroName: ownedHeroWithoutLink.alias || userProfile?.heroName || 'Identidad HeroIndex',
      })
      setMessage('Identidad heroica existente vinculada a tu cuenta.')
    } catch {
      setMessage('')
      setError('No fue posible vincular la identidad existente.')
    } finally {
      setSaving(false)
    }
  }

  const buildHeroPayload = () => {
    const alias = draft.alias.trim()
    const corporationId = draft.affiliationMode === 'corporation' ? draft.corporationId || '' : ''
    const corporationName = draft.affiliationMode === 'corporation' ? selectedCorporation?.name ?? '' : ''

    return {
      active: true,
      affiliationLabel: draft.affiliationMode === 'corporation'
        ? draft.affiliationLabel.trim() || corporationName || 'Afiliación corporativa en verificación'
        : draft.affiliationLabel.trim() || 'Independiente verificado',
      alias,
      approval: 0,
      avatarPositionX: 50,
      avatarPositionY: 50,
      avatarScale: 1,
      avatarUrl: draft.avatarUrl.trim(),
      corporationId,
      corporationName,
      coverOverlayStrength: 0.35,
      coverPositionX: 50,
      coverPositionY: 50,
      coverScale: 1,
      coverUrl: draft.coverUrl.trim(),
      createdByUid: currentUserUid,
      heroTitle: draft.heroTitle.trim() || 'Identidad en verificación',
      isPlayerHero: true,
      ownerUid: currentUserUid,
      publicAbilities: draft.initialStatus.trim(),
      publicBio: draft.publicBio.trim(),
      publicLimitations: draft.publicLimitations.trim(),
      publicPowers: normalizeList(draft.publicPowers),
      publicQuote: draft.publicQuote.trim(),
      publicSpecialty: draft.publicSpecialty.trim(),
      rankingPoints: 0,
      rankChange: 0,
      trustScore: 0,
      visibility: draft.visibility || 'public',
    }
  }

  const handleCreateHero = async (event) => {
    event.preventDefault()

    if (!currentUser?.uid) {
      setError('Inicia sesión para activar tu registro heroico.')
      return
    }

    if (hasHeroProfile) {
      setError('Tu cuenta ya tiene un perfil heroico vinculado. Continúa desde Mi Perfil.')
      return
    }

    const payload = buildHeroPayload()

    if (!payload.alias) {
      setError('El alias heroico es obligatorio para activar tu registro.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('Emitiendo identidad pública HeroIndex…')

    try {
      const createdHero = await createHero(payload)

      await updateUserProfile(currentUser.uid, {
        avatarUrl: payload.avatarUrl || userProfile?.avatarUrl || '',
        displayName: userProfile?.displayName || payload.alias,
        heroId: createdHero.id,
        heroName: payload.alias,
      })

      setMessage('Registro heroico emitido. Tu perfil público ya puede completarse desde Mi Perfil.')
      onNavigate?.('my-profile')
    } catch {
      setMessage('')
      setError('No fue posible emitir tu identidad pública. Intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <section className="onboarding-page hi-page hi-page-wide hi-state-card">
        <p>Verificando identidad HeroIndex...</p>
      </section>
    )
  }

  if (!isLoggedIn) {
    return (
      <section className="onboarding-page hi-page hi-page-wide hi-state-card onboarding-empty-state">
        <span className="section-kicker">Registro Oficial HeroIndex</span>
        <h2>Inicia sesión para continuar</h2>
        <p>Necesitas una cuenta HeroIndex para activar una identidad heroica certificada.</p>
        <div className="onboarding-actions">
          <button className="hi-button hi-button-primary" onClick={() => onNavigate?.('login')} type="button">Iniciar sesión</button>
          <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('register')} type="button">Crear cuenta</button>
       </div>
      </section>
    )
  }

  if (hasHeroProfile) {
    return (
      <section className="onboarding-page hi-page hi-page-wide">
        <header className="onboarding-hero onboarding-hero--institutional hi-card hi-card-player">
          <div>
            <span className="section-kicker">Registro Oficial HeroIndex</span>
            <h2>Identidad heroica activa</h2>
            <p className="onboarding-hero__lead">Tu perfil ya está vinculado al sistema público HeroIndex.</p>
            <p>Continúa la edición social, visual y pública desde Mi Perfil. No se generará una identidad duplicada.</p>
          </div>
          <div className="onboarding-header-actions">
            <button className="hi-button hi-button-primary" onClick={() => onNavigate?.('my-profile')} type="button">Ir a Mi Perfil</button>
            <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('account')} type="button">Mi Cuenta</button>
          </div>
        </header>
      </section>
    )
  }

  return (
    <section className="onboarding-page onboarding-page--registry onboarding-page--dossier hi-page hi-page-wide">
      <header className="onboarding-dossier-header hi-card hi-card-player">
        <div className="onboarding-dossier-header__identity">
          <span className="section-kicker">Registro Oficial HeroIndex</span>
          <h2>Expediente de Identidad Heroica</h2>
          <p className="onboarding-hero__lead">Sistema de verificación pública, trazabilidad y emisión de perfiles heroicos.</p>
          <p className="onboarding-institutional-warning">Los datos públicos serán visibles en HeroIndex. La validación interna queda reservada para ORÁCULO.</p>
        </div>
        <dl className="onboarding-dossier-meta" aria-label="Metadatos del expediente">
          <div><dt>Código</dt><dd>HI-RG</dd></div>
          <div><dt>Estado</dt><dd>{isFinalStep ? 'Listo para emisión' : 'En emisión'}</dd></div>
          <div><dt>Fase activa</dt><dd>{activeStep.code}</dd></div>
          <div><dt>Validación interna</dt><dd>ORÁCULO pendiente</dd></div>
        </dl>
        <div className="onboarding-header-actions onboarding-dossier-actions">
          <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('my-profile')} type="button">Mi Perfil</button>
          <button className="hi-button hi-button-subtle" disabled={saving} onClick={handleLogout} type="button">Cerrar sesión</button>
        </div>
      </header>

      <nav className="onboarding-stepper" aria-label="Fases del Registro Oficial HeroIndex">
        {registrationSteps.map((step, index) => (
          <button
            className={[
              'onboarding-stepper__item',
              index === currentStep ? 'is-active' : '',
              index < currentStep ? 'is-complete' : '',
            ].filter(Boolean).join(' ')}
            key={step.id}
            onClick={() => handleSelectStep(index)}
            type="button"
          >
            <span>{step.code}</span>
            <strong>{step.label}</strong>
          </button>
        ))}
      </nav>

      {isSyncing ? <p className="hi-state-card">Sincronizando registro institucional…</p> : null}
      {message ? <p className="hi-state-card hi-state-card--success">{message}</p> : null}
      {error ? <p className="hi-state-card hi-state-card--error">{error}</p> : null}

      {ownedHeroWithoutLink ? (
        <aside className="onboarding-existing-link hi-card hi-card-player">
          <div>
            <span className="section-kicker">Identidad detectada</span>
            <h3>{ownedHeroWithoutLink.alias || 'Héroe registrado'}</h3>
            <p>Existe un perfil heroico asociado a tu cuenta. Puedes vincularlo sin crear un duplicado.</p>
          </div>
          <button className="hi-button hi-button-primary" disabled={saving} onClick={handleLinkOwnedHero} type="button">
            Vincular identidad existente
          </button>
        </aside>
      ) : null}

      <div className="onboarding-registry-layout onboarding-dossier-layout">
        <form className="onboarding-registry-form onboarding-dossier-form hi-card hi-card-player" onSubmit={handleCreateHero}>
          <div className="onboarding-step-frame" key={activeStep.id}>
            <div className="onboarding-step-frame__header">
              <span>{activeStep.code}</span>
              <h3>{activeStep.title}</h3>
              <p>{isFinalStep ? 'Revisa el resumen antes de activar la identidad pública.' : 'Completa esta fase del expediente y avanza a la siguiente verificación.'}</p>
            </div>

            {currentStep === 0 ? (
              <section className="onboarding-registry-section onboarding-dossier-section">
                <div className="onboarding-registry-section__heading onboarding-dossier-section__heading">
                  <span>HI-RG-01</span>
                  <h3>Identidad heroica</h3>
                  <p>Datos mínimos para emitir tu presencia pública verificada.</p>
                  <div className="onboarding-section-meta"><strong>Visibilidad: pública</strong><strong>Estado: requerido</strong></div>
                </div>
                <label className="hi-field onboarding-dossier-field">
                  <span className="hi-label">HI-RG-01A // Alias heroico · Visible en HeroIndex <strong className="onboarding-required-chip">Obligatorio</strong></span>
                  <input className="hi-input" maxLength={80} onChange={(event) => updateDraft('alias', event.target.value)} placeholder="Ej: Cóndor Austral" value={draft.alias} />
                  <small>Alias requerido para emitir identidad pública.</small>
                </label>
                <label className="hi-field onboarding-dossier-field">
                  <span className="hi-label">HI-RG-01B // Título heroico · Visible en HeroIndex</span>
                  <input className="hi-input" maxLength={120} onChange={(event) => updateDraft('heroTitle', event.target.value)} placeholder="Ej: Defensor metropolitano" value={draft.heroTitle} />
                  <small>Si queda vacío, HeroIndex usará una designación institucional.</small>
                </label>
                <label className="hi-field onboarding-dossier-field">
                  <span className="hi-label">HI-RG-01C // Frase pública</span>
                  <input className="hi-input" maxLength={180} onChange={(event) => updateDraft('publicQuote', event.target.value)} placeholder="Declaración breve para ciudadanía" value={draft.publicQuote} />
                </label>
              </section>
            ) : null}

            {currentStep === 1 ? (
              <section className="onboarding-registry-section onboarding-dossier-section">
                <div className="onboarding-registry-section__heading onboarding-dossier-section__heading">
                  <span>HI-RG-02</span>
                  <h3>Presencia pública</h3>
                  <p>Información legible para ciudadanía, ranking y perfiles públicos.</p>
                  <div className="onboarding-section-meta"><strong>Visibilidad: pública</strong><strong>Estado: complementario</strong></div>
                </div>
                <label className="hi-field onboarding-dossier-field onboarding-dossier-field--wide">
                  <span className="hi-label">HI-RG-02A // Biografía pública</span>
                  <textarea className="hi-input" maxLength={520} onChange={(event) => updateDraft('publicBio', event.target.value)} placeholder="Origen público, rol en la ciudad y límites de exposición." rows="4" value={draft.publicBio} />
                  <small>Visible en perfil público y lectura ciudadana.</small>
                </label>
                <label className="hi-field onboarding-dossier-field">
                  <span className="hi-label">HI-RG-02B // Visibilidad pública</span>
                  <select className="hi-input" onChange={(event) => updateDraft('visibility', event.target.value)} value={draft.visibility}>
                    <option value="public">Perfil público activo</option>
                    <option value="limited">Perfil público limitado</option>
                  </select>
                </label>
              </section>
            ) : null}

            {currentStep === 2 ? (
              <section className="onboarding-registry-section onboarding-dossier-section">
                <div className="onboarding-registry-section__heading onboarding-dossier-section__heading">
                  <span>HI-RG-03</span>
                  <h3>Afiliación</h3>
                  <p>Declara si operas de forma independiente o bajo una estructura reconocida.</p>
                  <div className="onboarding-section-meta"><strong>Visibilidad: pública</strong><strong>Estado: complementario</strong></div>
                </div>
                <label className="hi-field onboarding-dossier-field">
                  <span className="hi-label">HI-RG-03A // Tipo de afiliación</span>
                  <select className="hi-input" onChange={(event) => updateDraft('affiliationMode', event.target.value)} value={draft.affiliationMode}>
                    <option value="independent">Independiente</option>
                    <option value="corporation">Corporación registrada</option>
                  </select>
                </label>
                {draft.affiliationMode === 'corporation' ? (
                  <label className="hi-field onboarding-dossier-field">
                    <span className="hi-label">HI-RG-03B // Corporación</span>
                    <select className="hi-input" onChange={(event) => updateDraft('corporationId', event.target.value)} value={draft.corporationId ?? ''}>
                      <option value="">Selecciona una corporación</option>
                      {corporations.map((corporation) => (
                        <option key={corporation.id} value={corporation.id}>{corporation.name}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label className="hi-field onboarding-dossier-field">
                  <span className="hi-label">HI-RG-03C // Etiqueta de afiliación</span>
                  <input className="hi-input" maxLength={120} onChange={(event) => updateDraft('affiliationLabel', event.target.value)} placeholder="Independiente verificado" value={draft.affiliationLabel} />
                </label>
              </section>
            ) : null}

            {currentStep === 3 ? (
              <section className="onboarding-registry-section onboarding-dossier-section onboarding-dossier-section--media">
                <div className="onboarding-registry-section__heading onboarding-dossier-section__heading">
                  <span>HI-RG-04</span>
                  <h3>Imagen pública</h3>
                  <p>Soportes visuales iniciales para credencial y portada pública.</p>
                  <div className="onboarding-section-meta"><strong>Visibilidad: pública</strong><strong>Estado: opcional</strong></div>
                </div>
                <label className="hi-field onboarding-dossier-field onboarding-upload-field">
                  <span className="hi-label">HI-RG-04A // Avatar público</span>
                  <span className="onboarding-upload-zone"><strong>Añadir avatar público</strong><em>Enlace de imagen como alternativa segura</em></span>
                  <input className="hi-input" onChange={(event) => updateDraft('avatarUrl', event.target.value)} placeholder="Pegar enlace de avatar" value={draft.avatarUrl} />
                </label>
                <label className="hi-field onboarding-dossier-field onboarding-upload-field">
                  <span className="hi-label">HI-RG-04B // Portada pública</span>
                  <span className="onboarding-upload-zone"><strong>Añadir portada pública</strong><em>Enlace de portada como alternativa segura</em></span>
                  <input className="hi-input" onChange={(event) => updateDraft('coverUrl', event.target.value)} placeholder="Pegar enlace de portada" value={draft.coverUrl} />
                </label>
              </section>
            ) : null}

            {currentStep === 4 ? (
              <section className="onboarding-registry-section onboarding-dossier-section">
                <div className="onboarding-registry-section__heading onboarding-dossier-section__heading">
                  <span>HI-RG-05</span>
                  <h3>Poderes visibles</h3>
                  <p>Capacidades públicas sin revelar hoja privada ni datos internos de campaña.</p>
                  <div className="onboarding-section-meta"><strong>Visibilidad: pública</strong><strong>Estado: complementario</strong></div>
                </div>
                <label className="hi-field onboarding-dossier-field onboarding-dossier-field--wide">
                  <span className="hi-label">HI-RG-05A // Poderes visibles</span>
                  <input className="hi-input" maxLength={220} onChange={(event) => updateDraft('publicPowers', event.target.value)} placeholder="Vuelo táctico, fuerza aumentada" value={draft.publicPowers} />
                </label>
                <label className="hi-field onboarding-dossier-field">
                  <span className="hi-label">HI-RG-05B // Especialidad pública</span>
                  <input className="hi-input" maxLength={140} onChange={(event) => updateDraft('publicSpecialty', event.target.value)} placeholder="Rescate urbano" value={draft.publicSpecialty} />
                </label>
                <label className="hi-field onboarding-dossier-field onboarding-dossier-field--wide">
                  <span className="hi-label">HI-RG-05C // Limitaciones públicas opcionales</span>
                  <textarea className="hi-input" maxLength={260} onChange={(event) => updateDraft('publicLimitations', event.target.value)} placeholder="Riesgos conocidos o límites declarables." rows="3" value={draft.publicLimitations} />
                </label>
              </section>
            ) : null}

            {currentStep === 5 ? (
              <section className="onboarding-registry-section onboarding-dossier-section">
                <div className="onboarding-registry-section__heading onboarding-dossier-section__heading">
                  <span>HI-RG-06</span>
                  <h3>Perfil social</h3>
                  <p>Estado inicial para conectar el expediente con tu perfil público.</p>
                  <div className="onboarding-section-meta"><strong>Visibilidad: pública</strong><strong>Estado: opcional</strong></div>
                </div>
                <label className="hi-field onboarding-dossier-field onboarding-dossier-field--wide">
                  <span className="hi-label">HI-RG-06A // Estado público inicial</span>
                  <textarea className="hi-input" maxLength={260} onChange={(event) => updateDraft('initialStatus', event.target.value)} placeholder="Mensaje breve de activación o disponibilidad." rows="3" value={draft.initialStatus} />
                  <small>Se conserva como descripción pública inicial, no como dato privado.</small>
                </label>
              </section>
            ) : null}

            {currentStep === 6 ? (
              <section className="onboarding-registry-section onboarding-dossier-section onboarding-registry-section--internal">
                <div className="onboarding-registry-section__heading onboarding-dossier-section__heading">
                  <span>HI-RG-07</span>
                  <h3>Validación interna</h3>
                  <p>Validación ORÁCULO pendiente. Esta emisión solo activa la identidad pública.</p>
                  <div className="onboarding-section-meta"><strong>Visibilidad: ORÁCULO</strong><strong>Estado: pendiente</strong></div>
                </div>
                <p className="onboarding-internal-note">La hoja privada de campaña permanece separada del perfil público y no se incrusta en la identidad visible.</p>
                <p className="onboarding-step-note">Puedes completar esta sección más tarde desde Mi Perfil. La validación interna queda pendiente para ORÁCULO.</p>
              </section>
            ) : null}

            {isFinalStep ? (
              <section className="onboarding-registry-section onboarding-dossier-section onboarding-issuance-summary">
                <div className="onboarding-registry-section__heading onboarding-dossier-section__heading">
                  <span>HI-RG-08</span>
                  <h3>Emisión de identidad</h3>
                  <p>Al emitir tu identidad, se activará tu perfil público dentro de la Red HeroIndex.</p>
                  <div className="onboarding-section-meta"><strong>Visibilidad: pública</strong><strong>Estado: confirmación</strong></div>
                </div>
                <dl>
                  <div><dt>Alias</dt><dd>{previewAlias}</dd></div>
                  <div><dt>Título</dt><dd>{previewTitle}</dd></div>
                  <div><dt>Afiliación</dt><dd>{previewAffiliation}</dd></div>
                  <div><dt>Visibilidad</dt><dd>{draft.visibility === 'public' ? 'Perfil público activo' : 'Perfil público limitado'}</dd></div>
                  <div><dt>Poderes visibles</dt><dd>{previewPowers.length ? previewPowers.join(', ') : 'Poderes visibles pendientes'}</dd></div>
                  <div><dt>Imagen</dt><dd>{draft.avatarUrl || draft.coverUrl ? 'Soporte visual declarado' : 'Imagen pendiente'}</dd></div>
                  <div><dt>Validación interna</dt><dd>ORÁCULO pendiente</dd></div>
                </dl>
              </section>
            ) : null}
          </div>

          <div className="onboarding-registry-actions onboarding-dossier-submit onboarding-step-actions">
            <p>{isFinalStep ? 'La emisión activa tu perfil público dentro de HeroIndex.' : 'Puedes completar esta sección más tarde desde Mi Perfil.'}</p>
            <button className="hi-button hi-button-subtle" disabled={currentStep === 0 || saving} onClick={handlePreviousStep} type="button">Anterior</button>
            {!isFinalStep ? (
              <button className="hi-button hi-button-primary" disabled={saving || isSyncing} onClick={handleNextStep} type="button">Siguiente</button>
            ) : (
              <button className="hi-button hi-button-primary" disabled={saving || isSyncing} type="submit">
                {saving ? 'Emitiendo identidad…' : 'Emitir identidad pública'}
              </button>
            )}
            <button className="hi-button hi-button-secondary" onClick={() => onNavigate?.('my-profile')} type="button">Guardar y continuar en Mi Perfil</button>
          </div>
        </form>

        <aside className="onboarding-registry-preview onboarding-certificate hi-card hi-card-player" aria-label="Certificado HeroIndex preliminar">
          <div className="onboarding-preview-heading onboarding-certificate__heading">
            <span className="section-kicker">Certificado HeroIndex</span>
            <h3>Identidad pública preliminar</h3>
            <p>Expediente HI-RG-2026/TEMP · Fase: {activeStep.code} · Estado: {validationState}</p>
            <strong>{isFinalStep ? 'Listo para emisión' : 'En verificación'}</strong>
          </div>
          <div className="onboarding-validation-panel onboarding-certificate__validation">
            <div>
              <span>Estado de emisión</span>
              <strong>{validationState}</strong>
            </div>
            <div className="onboarding-progress-bar" aria-label={`Progreso del registro: ${completionPercentage}%`}>
              <span style={{ width: `${completionPercentage}%` }} />
            </div>
            <ul>
              {completionItems.map((item) => (
                <li className={item.complete ? 'is-complete' : ''} key={item.label}>
                  <span>{item.complete ? '✓' : '•'}</span>
                  <strong>{item.label}</strong>
                  <em>{item.complete ? 'Completo' : item.label === 'Imagen' || item.label === 'Poderes visibles' ? 'Opcional' : 'Pendiente'}</em>
                </li>
              ))}
            </ul>
          </div>
          <div className="onboarding-preview-cover onboarding-certificate__cover">
            {draft.coverUrl.trim() ? <img alt="Portada preliminar" src={draft.coverUrl.trim()} /> : <span>PORTADA HEROINDEX</span>}
          </div>
          <div className="onboarding-preview-body onboarding-certificate__body">
            <div className="onboarding-preview-avatar onboarding-certificate__avatar">
              {draft.avatarUrl.trim() ? <img alt={`Avatar preliminar de ${previewAlias}`} src={draft.avatarUrl.trim()} /> : <span>{getInitials(previewAlias)}</span>}
            </div>
            <p className="onboarding-preview-status">{draft.visibility === 'public' ? 'Perfil público activo' : 'Perfil público limitado'}</p>
            <h3>{previewAlias}</h3>
            <p className="onboarding-preview-title">{previewTitle}</p>
            <p className="onboarding-preview-affiliation">{previewAffiliation}</p>
            <p className="onboarding-preview-bio">{draft.publicBio.trim() || 'Biografía pública pendiente.'}</p>
            <div className="onboarding-preview-powers">
              {(previewPowers.length ? previewPowers : ['Poderes visibles pendientes de declaración']).slice(0, 4).map((power) => (
                <span key={power}>{power}</span>
              ))}
            </div>
            <div className="onboarding-preview-ledger">
              <span>Datos visibles para ciudadanía</span>
              <strong>Validación interna pendiente</strong>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default Onboarding
