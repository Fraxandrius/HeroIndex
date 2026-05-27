// ── FIREBASE CONFIG ──────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCLsgLj5MY6H5BCO_OlMkB-fVPpSkccfsY",
  authDomain: "heroindex-da609.firebaseapp.com",
  databaseURL: "https://heroindex-da609-default-rtdb.firebaseio.com",
  projectId: "heroindex-da609",
  storageBucket: "heroindex-da609.firebasestorage.app",
  messagingSenderId: "409816657047",
  appId: "1:409816657047:web:350347b7cfdc8e3119cdd2"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

// ── HEROES ───────────────────────────────────────────────────
async function loadHeroes() {
  try {
    const snapshot = await get(ref(db, 'heroes'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Firebase stores arrays as objects with numeric keys — convert back
      return Array.isArray(data) ? data : Object.values(data);
    }
  } catch(e) { console.error('Firebase read error:', e); }
  // First run — seed with defaults
  const defaults = getDefaultHeroes();
  await saveHeroes(defaults);
  return defaults;
}

async function saveHeroes(heroes) {
  try {
    await set(ref(db, 'heroes'), heroes);
  } catch(e) { console.error('Firebase write error:', e); }
}

// Listen for real-time changes (other users saving)
function onHeroesChange(callback) {
  onValue(ref(db, 'heroes'), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      callback(Array.isArray(data) ? data : Object.values(data));
    }
  });
}

// ── NEWS ─────────────────────────────────────────────────────
async function loadNews() {
  try {
    const snapshot = await get(ref(db, 'news'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Array.isArray(data) ? data : Object.values(data);
    }
  } catch(e) { console.error('Firebase read error:', e); }
  const defaults = getDefaultNews();
  await saveNews(defaults);
  return defaults;
}

async function saveNews(news) {
  try {
    await set(ref(db, 'news'), news);
  } catch(e) { console.error('Firebase write error:', e); }
}

function onNewsChange(callback) {
  onValue(ref(db, 'news'), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      callback(Array.isArray(data) ? data : Object.values(data));
    }
  });
}

// ── DEFAULT DATA ─────────────────────────────────────────────
function getDefaultHeroes() {
  return [
    {
      id:1, alias:'Cóndor', realName:'Desconocido', corp:'Aurora Corporation', type:'NPC',
      role:'Defender', country:'Chile', score:9840, karma:0, risk:'low', occupation:'Héroe institucional',
      attrs:{fighting:11,agility:9,strength:10,reason:7,intuition:8,presence:10},
      powers:[
        {name:'Vuelo',level:'major',desc:'Velocidad supersónica, maniobrable en combate'},
        {name:'Superfuerza',level:'massive',desc:'Fuerza clase 80 toneladas'},
        {name:'Resistencia extrema',level:'major',desc:'Resistencia a daño balístico y explosivo'},
      ],
      talents:['Combate aéreo','Tácticas militares','Liderazgo','Intimidación'],
      drawbacks:['Lealtad institucional absoluta','Conocido públicamente'],
      relationships:[{name:'Aurora Corporation',type:'empleador'},{name:'HeroIndex',type:'aliado institucional'}],
      personality:'Personalidad: pragmático, frío bajo presión\nImpulso: estabilidad nacional\nFalla: incapaz de cuestionar el sistema que defiende',
      flags:['Conoce la existencia de ORÁCULO','Ha aprobado eliminaciones preventivas','Monitorea héroes de baja confianza'],
      karmaLog:[], scoreLog:[{delta:0,note:'Registro inicial',date:'01/01/2024'}]
    },
    {
      id:2, alias:'Viento Sur', realName:'', corp:'Aurora Corporation', type:'NPC',
      role:'Striker', country:'Chile', score:6200, karma:4, risk:'med', occupation:'Héroe de patrulla',
      attrs:{fighting:7,agility:10,strength:6,reason:6,intuition:8,presence:7},
      powers:[
        {name:'Manipulación de aire',level:'major',desc:'Control de vientos y corrientes'},
        {name:'Vuelo',level:'basic',desc:'Velocidad moderada'},
        {name:'Ráfaga de viento',level:'basic',desc:'Empuje y desorientación'},
      ],
      talents:['Acrobacia','Patrullaje urbano'],
      drawbacks:['Impulsivo','Sospechoso para la corporación'],
      relationships:[{name:'Cóndor',type:'superior'}],
      personality:'Personalidad: idealista, impulsivo\nImpulso: proteger a los más vulnerables\nFalla: actúa antes de pensar',
      flags:['Sospechoso de filtrar información','Vigilancia nivel 2 activa'],
      karmaLog:[{session:1,delta:4,pos:4,neg:0,note:'+4 / 0',date:'01/01/2024'}],
      scoreLog:[{delta:0,note:'Registro inicial',date:'01/01/2024'}]
    },
  ];
}

function getDefaultNews() {
  return [
    {id:1,source:'heroindex',category:'comunicado',headline:'HeroIndex reporta 99.7% de cobertura heroica en Santiago',body:'El último informe trimestral confirma que la capital chilena mantiene el índice más alto de respuesta heroica certificada del continente.',corp:'',date:'15/05/2024'},
    {id:2,source:'corp',category:'operacion',headline:'Aurora Corporation despliega Equipo Alfa en zona norte',body:'Nuestros héroes completaron con éxito la Operación Amanecer. Aurora Corporation agradece la confianza ciudadana.',corp:'Aurora Corporation',date:'12/05/2024'},
    {id:3,source:'oracle',category:'clasificado',headline:'[CLASIFICADO] Tres eliminaciones preventivas — Sector Norte',body:'ORÁCULO registra resolución de tres individuos con Risk Index crítico. Participación de héroes Aurora confirmada. Borrado mediático aplicado.',corp:'',date:'10/05/2024'},
  ];
}

// ── EXPORT/IMPORT JSON ───────────────────────────────────────
function exportData(heroes) {
  const b = new Blob([JSON.stringify(heroes, null, 2)], { type: 'application/json' });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u;
  a.download = `heroindex-${new Date().toLocaleDateString('es-CL').replace(/\//g,'-')}.json`;
  a.click();
  URL.revokeObjectURL(u);
}

function importData(file, cb) {
  const r = new FileReader();
  r.onload = e => {
    try {
      const d = JSON.parse(e.target.result);
      if (Array.isArray(d)) cb(d);
      else alert('Archivo inválido.');
    } catch { alert('Error al leer el archivo.'); }
  };
  r.readAsText(file);
}
