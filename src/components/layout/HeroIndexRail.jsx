import SidebarVisualSlot from '../visual/SidebarVisualSlot.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { canSeeOraculoTools } from '../../utils/roles.js'

const isOraculoMode = import.meta.env.VITE_ORACULO_MODE === 'true'

const railSignals = [
  {
    kicker: 'SEÑAL PÚBLICA',
    title: 'Red HeroIndex operativa',
    body: 'Ranking, perfiles y señales verificadas disponibles para consulta ciudadana.',
  },
  {
    kicker: 'ACTIVIDAD DESTACADA',
    title: 'Presencia heroica en aumento',
    body: 'Actualizaciones de reputación y confianza pública en ciclo activo.',
    hot: true,
  },
  {
    kicker: 'CANAL VERIFICADO',
    title: 'Ecosistema bajo monitoreo',
    body: 'HeroIndex consolida datos públicos de actividad, respuesta y reconocimiento.',
  },
]

function HeroIndexRail() {
  const { userProfile } = useAuth()
  const canViewOracle = isOraculoMode && canSeeOraculoTools(userProfile)

  return (
    <aside className="heroindex-rail" aria-label="Canal lateral HeroIndex">
      <div className="heroindex-rail__heading">
        <span>CANAL HEROINDEX</span>
        <small>Transmisión continua</small>
      </div>

      <SidebarVisualSlot canSeeOraculoTools={canViewOracle} />

      <div className="heroindex-rail__signals">
        {railSignals.map((signal) => (
          <section className={`heroindex-rail__card ${signal.hot ? 'heroindex-rail__card--hot' : ''}`.trim()} key={signal.kicker}>
            <p className="heroindex-rail__kicker">{signal.kicker}</p>
            <h2>{signal.title}</h2>
            <p>{signal.body}</p>
          </section>
        ))}
      </div>
    </aside>
  )
}

export default HeroIndexRail