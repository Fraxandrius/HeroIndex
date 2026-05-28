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

const hasFirebase = typeof firebase !== 'undefined' && firebase?.initializeApp;
if (hasFirebase) firebase.initializeApp(firebaseConfig);
const db = hasFirebase ? firebase.database() : null;

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}


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
 if (!db) {
    const localHeroes = readLocal('heroindex-heroes', null);
    return Promise.resolve(Array.isArray(localHeroes) && localHeroes.length ? localHeroes : getDefaultHeroes());
  }
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
  if (!db) { writeLocal('heroindex-heroes', heroes); return Promise.resolve(); }
  return db.ref('heroes').set(heroes).catch(e => console.error('Firebase write error:', e));
}

function onHeroesChange(callback) {
   if (!db) { callback(readLocal('heroindex-heroes', getDefaultHeroes())); return; }
  db.ref('heroes').on('value', snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      callback(Array.isArray(data) ? data : Object.values(data));
    }
  });
}

// ── NEWS ─────────────────────────────────────────────────────
function loadNews() {
  if (!db) {
    const localNews = readLocal('heroindex-news', null);
    return Promise.resolve(Array.isArray(localNews) && localNews.length ? localNews : getDefaultNews());
  }
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
 if (!db) { writeLocal('heroindex-news', news); return Promise.resolve(); }
  return db.ref('news').set(news).catch(e => console.error('Firebase write error:', e));
}

function onNewsChange(callback) {
  if (!db) { callback(readLocal('heroindex-news', getDefaultNews())); return; }
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

function getHomeMediaSlots() {
  return [
    {
      id: 'ad-main',
            title: 'VOLT Energy · Grid Zero-Latency',
      sponsor: 'VOLT Energy',
      cta: 'Explorar infraestructura',
      image: 'images/ads/heroindex-main.jpg',
       fallbackColor: 'linear-gradient(135deg,#03202f 0%,#005775 100%)'
    },
    {
      id: 'ad-aurora',
      title: 'Aurora Academy · Ingreso 2049',
      sponsor: 'Aurora Academy',
      cta: 'Postular ahora',
      image: 'images/ads/aurora-recruitment.jpg',
      fallbackColor: 'linear-gradient(135deg,#201031 0%,#4f1d73 100%)'
    },
    {
      id: 'ad-insure',
      title: 'HeroInsure · Cobertura de Daño Colateral',
      sponsor: 'HeroInsure',
      cta: 'Ver pólizas',
      image: '',
      fallbackColor: 'linear-gradient(135deg,#1f240d 0%,#4f5f18 100%)'
    },
    {
      id: 'ad-kuvyn',
      title: 'KÜVYN Wearables · Telemetría táctica civil',
      sponsor: 'KÜVYN',
      cta: 'Conocer productos',
      image: '',
      fallbackColor: 'linear-gradient(135deg,#1b1628 0%,#2f2a5e 100%)'
    }
  ];
}


function getHomeTrendingTopics() {
  return [
    { tag: '#CrisisCostera', pulse: '+18%' },
    { tag: '#AuroraWatch', pulse: '+11%' },
    { tag: '#CorredorNorte', pulse: '+9%' }
  ];
}


function getHomeFeaturedStory() {
  return {
    label: 'HERO OF THE DAY',
    title: 'Cóndor lidera corredor humanitario nocturno en la zona costera',
    summary: 'Cobertura combinada entre brigadas civiles, rescate aéreo y coordinación intercorporativa. HeroIndex registra máximo de confianza pública en 14 días.',
    metrics: [
      { label: 'VISTAS', value: '2.4M' },
      { label: 'APROBACIÓN', value: '91%' },
      { label: 'COMPARTIDOS', value: '186K' },
      { label: 'TRUST INDEX', value: '+12' }
    ]
  };
}

function getHomeSocialPosts() {
  return [
     { source: 'heroindex', tag: 'Oficial', tone:'official', channel:'global', signal:98, date: 'Hoy · 08:30', headline: 'HeroIndex activa cobertura prioritaria en litoral central', body: 'Se desplegaron 12 equipos certificados en menos de 9 minutos. Ciudadanos pueden seguir estado en vivo.', engagement: { likes:'48K', comments:'7.2K', shares:'12K' } },
    { source: 'public', tag: 'Comunidad', tone:'public', channel:'foryou', signal:88, date: 'Hoy · 09:10', headline: '“Viento Sur respondió en 3 minutos”', body: 'Reporte ciudadano verificado por sensores municipales. Aplausos en estación Puerto Norte.', engagement: { likes:'22K', comments:'1.8K', shares:'4.1K' } },
    { source: 'corp', tag: 'Newsroom', tone:'corp', channel:'corporativo', signal:82, date: 'Hoy · 09:42', headline: 'Aurora Academy abre 240 becas para entrenamiento metahumano', body: 'Programa de entrenamiento técnico-social con certificación HeroIndex.', engagement: { likes:'12K', comments:'980', shares:'2.9K' } },
    { source: 'sponsor', tag: 'Patrocinado', tone:'sponsor', channel:'corporativo', signal:74, date: 'Hoy · 10:05', headline: 'VOLT Energy impulsa red de estaciones de recarga de exotrajes', body: 'Alianza con cinco corporaciones para reducir tiempos de despliegue urbano.', engagement: { likes:'9.1K', comments:'640', shares:'1.3K' } },
    { source: 'oracle', tag: 'Clasificado', tone:'gm', channel:'gm', signal:100, date: 'Hoy · 10:22', headline: '[CENSURADO] Evento con divergencia narrativa en Distrito Norte', body: 'Post retirado por ORÁCULO. Referencia de incidente disponible solo para modo GM.', engagement: { likes:'—', comments:'—', shares:'—' }, gmOnly: true, censored: true }
  ];
}
