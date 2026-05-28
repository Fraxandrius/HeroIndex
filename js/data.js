// ── FIREBASE — cargado via CDN compat (no ES modules) ────────
// Firebase se carga antes desde index.html via CDN

const firebaseConfig = {
  apiKey: "AIzaSyCLsgLj5MY6H5BCO_OlMkB-fVPpSkccfsY",
  authDomain: "heroindex-da609.firebaseapp.com",
  databaseURL: "https://heroindex-da609-default-rtdb.firebaseio.com",
  projectId: "heroindex-da609",
  storageBucket: "heroindex-da609.firebasestorage.app",
  messagingSenderId: "409816657047",
  appId: "1:409816657047:web:350347b7cfdc8e3119cdd2"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ── GM ACCESS ────────────────────────────────────────────────
function loadGMPasswordHash() {
  return db.ref('config/gmPasswordHash').once('value')
    .then(snapshot => snapshot.exists() ? String(snapshot.val() || '') : '')
    .catch(e => {
      console.error('Firebase GM hash read error:', e);
      return '';
    });
}

// ── HEROES ───────────────────────────────────────────────────
function loadHeroes() {
  return db.ref('heroes').once('value').then(snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Array.isArray(data) ? data : Object.values(data);
    }
    const defaults = getDefaultHeroes();
    return saveHeroes(defaults).then(() => defaults);
  }).catch(e => {
    console.error('Firebase read error:', e);
    return getDefaultHeroes();
  });
}

function saveHeroes(heroes) {
  return db.ref('heroes').set(heroes).catch(e => console.error('Firebase write error:', e));
}

function onHeroesChange(callback) {
  db.ref('heroes').on('value', snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      callback(Array.isArray(data) ? data : Object.values(data));
    }
  });
}

// ── NEWS ─────────────────────────────────────────────────────
function loadNews() {
  return db.ref('news').once('value').then(snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Array.isArray(data) ? data : Object.values(data);
    }
    const defaults = getDefaultNews();
    return saveNews(defaults).then(() => defaults);
  }).catch(e => {
    console.error('Firebase read error:', e);
    return getDefaultNews();
  });
}

function saveNews(news) {
  return db.ref('news').set(news).catch(e => console.error('Firebase write error:', e));
}

function onNewsChange(callback) {
  db.ref('news').on('value', snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      callback(Array.isArray(data) ? data : Object.values(data));
    }
  });
}

// ── DEFAULT HEROES ───────────────────────────────────────────
function getDefaultHeroes() {
  return [
    {
      id:1, alias:'Cóndor', realName:'Desconocido', corp:'Aurora Corporation', type:'NPC',
      role:'Defender', country:'Chile', score:9840, karma:0, risk:'low', occupation:'Héroe institucional',
      attrs:{fighting:11,agility:9,strength:10,reason:7,intuition:8,presence:10},
      powers:[
        {name:'Vuelo',level:'major',desc:'Velocidad supersónica'},
        {name:'Superfuerza',level:'massive',desc:'Fuerza clase 80 toneladas'},
        {name:'Resistencia extrema',level:'major',desc:'Resistencia a daño balístico'},
      ],
      talents:['Combate aéreo','Tácticas militares','Liderazgo'],
      drawbacks:['Lealtad institucional absoluta'],
      relationships:[{name:'Aurora Corporation',type:'empleador'}],
      personality:'Personalidad: pragmático, frío bajo presión\nImpulso: estabilidad nacional\nFalla: incapaz de cuestionar el sistema',
      publicSlogan:'Orden antes del caos.',
      publicBio:'Figura institucional de alta visibilidad en operativos nacionales.',
      flags:['Conoce ORÁCULO','Ha aprobado eliminaciones preventivas'],
      karmaLog:[], scoreLog:[{delta:0,note:'Registro inicial',date:'01/01/2024'}]
    },
    {
      id:2, alias:'Viento Sur', realName:'', corp:'Aurora Corporation', type:'NPC',
      role:'Striker', country:'Chile', score:6200, karma:4, risk:'med', occupation:'Héroe de patrulla',
      attrs:{fighting:7,agility:10,strength:6,reason:6,intuition:8,presence:7},
      powers:[
        {name:'Manipulación de aire',level:'major',desc:'Control de vientos'},
        {name:'Vuelo',level:'basic',desc:'Velocidad moderada'},
      ],
      talents:['Acrobacia','Patrullaje urbano'],
      drawbacks:['Impulsivo'],
      relationships:[{name:'Cóndor',type:'superior'}],
      personality:'Personalidad: idealista, impulsivo\nImpulso: proteger vulnerables\nFalla: actúa antes de pensar',
      publicSlogan:'El viento siempre responde.',
      publicBio:'Especialista en patrullaje urbano y apoyo aéreo.',
      flags:['Sospechoso de filtrar información','Vigilancia nivel 2'],
      karmaLog:[{session:1,delta:4,pos:4,neg:0,note:'+4 / 0',date:'01/01/2024'}],
      scoreLog:[{delta:0,note:'Registro inicial',date:'01/01/2024'}]
    },
  ];
}

function getDefaultNews() {
  return [
    {id:1,source:'heroindex',category:'comunicado',headline:'HeroIndex reporta 99.7% de cobertura heroica en Santiago',body:'La capital chilena mantiene el índice más alto de respuesta heroica certificada del continente.',corp:'',date:'15/05/2024'},
    {id:2,source:'corp',category:'operacion',headline:'Aurora Corporation despliega Equipo Alfa en zona norte',body:'Operación Amanecer completada con éxito en las regiones de Tarapacá y Antofagasta.',corp:'Aurora Corporation',date:'12/05/2024'},
    {id:3,source:'oracle',category:'clasificado',headline:'[CLASIFICADO] Tres eliminaciones preventivas — Sector Norte',body:'ORÁCULO registra resolución de tres individuos con Risk Index crítico. Borrado mediático aplicado.',corp:'',date:'10/05/2024'},
  ];
}

// ── EXPORT / IMPORT ──────────────────────────────────────────
function exportData(heroes) {
  const b = new Blob([JSON.stringify(heroes, null, 2)], {type:'application/json'});
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
    try { const d=JSON.parse(e.target.result); if(Array.isArray(d)) cb(d); else alert('Archivo inválido.'); }
    catch { alert('Error al leer el archivo.'); }
  };
  r.readAsText(file);
}
