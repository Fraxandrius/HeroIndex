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
let storage = null;
let storageCompatPromise = null;

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


function getFirebaseStorageInstance() {
  if (storage) return storage;
  if (typeof firebase !== 'undefined' && typeof firebase.storage === 'function') {
    storage = firebase.storage();
    return storage;
  }
  return null;
}

function loadFirebaseStorageCompat() {
  if (getFirebaseStorageInstance()) return Promise.resolve(storage);
  if (storageCompatPromise) return storageCompatPromise;
  if (typeof document === 'undefined') return Promise.resolve(null);
  storageCompatPromise = new Promise(resolve => {
    const existing = document.querySelector('script[data-firebase-storage-compat="true"], script[src*="firebase-storage-compat"]');
    if (existing && typeof firebase !== 'undefined' && typeof firebase.storage === 'function') {
      resolve(getFirebaseStorageInstance());
      return;
    }
    const script = existing || document.createElement('script');
    const done = () => resolve(getFirebaseStorageInstance());
    script.dataset.firebaseStorageCompat = 'true';
    script.src = script.src || 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage-compat.js';
    script.onload = done;
    script.onerror = () => resolve(null);
    setTimeout(done, 3500);
    if (!existing) document.head.appendChild(script);
  });
  return storageCompatPromise;
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

// ── SHARED CONTENT HELPERS ───────────────────────────────────
// TODO: Production security requires Firebase Auth plus Realtime Database and Storage security rules.
function normalizeDbList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter(Boolean);
  return Object.entries(data).map(([id, value]) => ({ id, ...(value || {}) }));
}

function sortContentNewestFirst(items=[]) {
  return [...items].sort((a,b)=>{
    const aTime = Date.parse(a.createdAt || a.date || 0) || Number(a.id || 0) || 0;
    const bTime = Date.parse(b.createdAt || b.date || 0) || Number(b.id || 0) || 0;
    return bTime - aTime;
  });
}

function normalizeCmsNews(n={}) {
  const source = n.source || 'heroindex';
  const publicBody = n.publicVersion || n.body || '';
  return {
    ...n,
    id: n.id || Date.now(),
    title: n.title || n.headline || 'Actualización HeroIndex',
    headline: n.headline || n.title || 'Actualización HeroIndex',
    body: publicBody,
    publicVersion: publicBody,
    corporateVersion: n.corporateVersion || '',
    oracleVersion: n.oracleVersion || '',
    source,
    category: n.category || 'comunicado',
    imageUrl: n.imageUrl || '',
    views: Number(n.views || 0),
    likes: Number(n.likes || 0),
    shares: Number(n.shares || 0),
    commentsCount: Number(n.commentsCount || 0),
    tags: Array.isArray(n.tags) ? n.tags : String(n.tags || '').split(',').map(t=>t.trim()).filter(Boolean),
    published: n.published !== false,
    createdAt: n.createdAt || n.date || new Date().toISOString(),
    date: n.date || (n.createdAt ? new Date(n.createdAt).toLocaleDateString('es-CL') : new Date().toLocaleDateString('es-CL')),
    visibility: n.visibility || (source === 'oracle' ? 'gm' : 'public')
  };
}

function loadNews() {
  if (!db) {
    const fallback = sortContentNewestFirst(getDefaultNews().map(normalizeCmsNews));
    console.info('[CMS] Loaded news count:', fallback.length, '(fallback)');
    return Promise.resolve(fallback);
  }
  return db.ref('news').once('value').then(snapshot => {
     const rows = snapshot.exists() ? normalizeDbList(snapshot.val()).map(normalizeCmsNews) : getDefaultNews().map(normalizeCmsNews);
    const sorted = sortContentNewestFirst(rows);
    console.info('[CMS] Loaded news count:', sorted.length, 'from /news');
    return sorted;
  }).catch(e => {
    console.error('Firebase news read error:', e);
    return sortContentNewestFirst(getDefaultNews().map(normalizeCmsNews));
  });
}

function saveNews(news) {
  if (!db) { console.warn('Firebase unavailable: shared news was not saved.'); return Promise.resolve(); }
  const payload = {};
  (news || []).forEach(item => {
    const normalized = normalizeCmsNews(item);
    payload[normalized.id] = normalized;
  });
  return db.ref('news').set(payload).catch(e => console.error('Firebase news write error:', e));
}

function createNewsContent(item) {
  if (!db) return Promise.reject(new Error('Firebase Realtime Database no disponible para contenido compartido.'));
  const ref = db.ref('news').push();
  const payload = normalizeCmsNews({ ...item, id: ref.key, createdAt: new Date().toISOString() });
  console.info('[CMS] Saving news to database path:', `news/${ref.key}`);
  return ref.set(payload).then(() => {
    console.info('[CMS] News saved:', payload);
    return payload;
  });
}

function deleteNewsContent(id) {
  if (!db) return Promise.reject(new Error('Firebase Realtime Database no disponible.'));
  return db.ref(`news/${id}`).remove();
}

function onNewsChange(callback) {
   if (!db) { callback(sortContentNewestFirst(getDefaultNews().map(normalizeCmsNews))); return; }
  db.ref('news').on('value', snapshot => {
    const rows = sortContentNewestFirst(normalizeDbList(snapshot.val()).map(normalizeCmsNews));
    console.info('[CMS] Loaded news count:', rows.length, 'from /news listener');
    callback(rows);
  });
}

function normalizeCmsAd(ad={}) {
  return {
    ...ad,
    id: ad.id || Date.now(),
    brand: ad.brand || ad.sponsor || 'HeroIndex Partner',
    headline: ad.headline || ad.title || 'Campaña pública HeroIndex',
    body: ad.body || ad.cta || '',
    imageUrl: ad.imageUrl || ad.image || '',
    placement: ad.placement || 'home',
    slotId: ad.slotId || '',
    slotProfile: ad.slotProfile || '',
    imageOnly: !!ad.imageOnly,
    active: ad.active !== false,
    createdAt: ad.createdAt || new Date().toISOString(),
    updatedAt: ad.updatedAt || ad.createdAt || new Date().toISOString()
  };
}

function loadAds() {
  if (!db) return Promise.resolve([]);
   return db.ref('ads').once('value').then(snapshot => {
    const rows = sortContentNewestFirst(normalizeDbList(snapshot.val()).map(normalizeCmsAd));
    console.info('[CMS] Loaded ads count:', rows.length, 'from /ads');
    return rows;
  }).catch(e => {
    console.error('Firebase ads read error:', e);
    return [];
  });
}

function createAdContent(item) {
  if (!db) return Promise.reject(new Error('Firebase Realtime Database no disponible para anuncios compartidos.'));
  const ref = db.ref('ads').push();
  const payload = normalizeCmsAd({ ...item, id: ref.key, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
 console.info('[CMS] Saving ad to database path:', `ads/${ref.key}`);
  return ref.set(payload).then(() => {
    console.info('[CMS] Ad saved:', payload);
    return payload;
  });
}

function createAdSlotContent(placement='home', item={}) {
  if (!db) return Promise.reject(new Error('Firebase Realtime Database no disponible para slots publicitarios.'));
  const slotId = item.slotId || `${placement}-visual-slot`;
  const adsRef = db.ref('ads');
  return adsRef.once('value').then(snapshot => {
    const updates = {};
    normalizeDbList(snapshot.val()).forEach(ad => {
      if (ad.active !== false && (ad.slotId === slotId || (!ad.slotId && ad.placement === placement && ad.imageOnly))) {
        updates[`${ad.id}/active`] = false;
        updates[`${ad.id}/updatedAt`] = new Date().toISOString();
      }
    });
    if (Object.keys(updates).length) return adsRef.update(updates);
    return null;
  }).then(() => createAdContent({ ...item, placement, slotId, active: true, imageOnly: true }));
}

function normalizeCmsComment(c={}) {
  return {
    ...c,
    id: c.id || Date.now(),
    authorType: c.authorType || 'anonymous',
    authorName: c.authorName || 'Usuario anónimo',
    authorHeroSlug: c.authorHeroSlug || '',
    body: c.body || '',
    likes: Number(c.likes || 0),
    createdAt: c.createdAt || new Date().toISOString()
  };
}

function loadComments(newsId) {
  if (!db || !newsId) return Promise.resolve([]);
  return db.ref(`comments/${newsId}`).once('value').then(snapshot => normalizeDbList(snapshot.val()).map(normalizeCmsComment)).catch(e => {
    console.error('Firebase comments read error:', e);
    return [];
  });
}

function createNewsComment(newsId, item) {
  if (!db) return Promise.reject(new Error('Firebase Realtime Database no disponible para comentarios compartidos.'));
  if (!newsId) return Promise.reject(new Error('Selecciona una noticia.'));
  const ref = db.ref(`comments/${newsId}`).push();
  const payload = normalizeCmsComment({ ...item, id: ref.key, createdAt: new Date().toISOString() });
  return ref.set(payload)
    .then(() => db.ref(`news/${newsId}/commentsCount`).transaction(v => (Number(v) || 0) + 1))
    .then(() => payload);
}

function uploadContentImage(file, folder='content') {
  if (!file) return Promise.resolve('');
  console.info('[CMS] Uploading image...', { folder, name:file.name, size:file.size });
  return loadFirebaseStorageCompat().then(activeStorage => {
    if (!activeStorage) {
      throw new Error('Firebase Storage no disponible. Verifica que firebase-storage-compat.js cargue en index.html y que Storage esté activado en Firebase Console.');
    }
    const safeName = String(file.name || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${folder}/${Date.now()}-${safeName}`;
    return activeStorage.ref(path).put(file)
      .then(snapshot => snapshot.ref.getDownloadURL())
      .then(url => {
        console.info('[CMS] Image URL obtained:', url);
        return url;
      })
      .catch(error => {
        if (error?.code === 'storage/unauthorized') {
          throw new Error('Firebase Storage rechazó la subida (storage/unauthorized). Revisa las Storage Rules para permitir escritura en las carpetas news/ y ads/ durante el prototipo.');
        }
        throw error;
      });
  });
}

// Legacy alias kept for older code paths.
function saveNewsLegacy(news) { return saveNews(news); }

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

function getHomeRankedHeroes(heroes=[]) {
  return [...heroes]
    .filter(h => h && h.alias)
    .sort((a,b)=>(b.score||0)-(a.score||0));
}

function homeCompact(value, fallback='12K') {
  const n = Number(value || 0);
  if (!n) return fallback;
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n/1000)}K`;
  return String(n);
}

function homeTag(value, fallback='HeroIndex') {
  const raw = String(value || fallback)
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9]/g,'')
    .slice(0,28);
  return `#${raw || fallback}`;
}

function getHomeStories(heroes=[]) {
  const top = getHomeRankedHeroes(heroes).slice(0,6).map(h=>(
    { name:h.alias, initials:h.alias.slice(0,2).toUpperCase(), avatar:h.publicAvatar||'', heroId:h.id }
  ));
 const onboarding = top.length ? [] : [
    { name:'Nuevo', initials:'N+' },
    { name:'Ranking', initials:'#1' }
  ];
  const lowRoster = top.length > 0 && top.length < 3 ? [{ name:'Scouting', initials:'SC' }] : [];
  return [
    ...top,
        ...onboarding,
    ...lowRoster,
    { name:'FanFeed', initials:'FF' },
    { name:'Marcas', initials:'AD' },
    { name:'Alertas', initials:'AL' },
    { name:'ORÁCULO', initials:'OR', oracle:true }
  ];
}

function getFeaturedHashtags(item={}, heroes=[]) {
  const ranked = getHomeRankedHeroes(heroes);
  const matchedHero = ranked.find(h => String(item.headline||'').toLowerCase().includes(String(h.alias||'').toLowerCase())) || ranked[0];
  return [
    '#HeroIndexLive',
    item.category ? homeTag(item.category) : '#GoldenAge',
    matchedHero ? homeTag(matchedHero.alias) : '#HeroesDelDia',
    item.corp ? homeTag(item.corp) : '#FanFeed'
  ].slice(0,4);
}

function getHomeSocialPosts({heroes=[], news=[], session={type:'public'}}={}) {
  const ranked = getHomeRankedHeroes(heroes);
  const top = ranked[0] || null;
  const second = ranked[1] || null;
  const leadNews = news[0] || {};
  const topAlias = top?.alias || 'los héroes verificados';
  const secondAlias = second?.alias || 'la nueva generación heroica';
  const topCorp = top?.corp || leadNews.corp || 'HeroIndex Partners';
  const approval = top ? Math.max(54, Math.min(98, Math.round((top.score||0)/120))) : 87;
  const likesBase = top ? Math.max(18000, (top.score||0)*18) : 48000;
  const newsBody = leadNews.headline
    ? `${leadNews.headline}. ${leadNews.body || 'La cobertura pública sigue en desarrollo dentro de HeroIndex.'}`
    : `${topAlias} lidera la conversación pública mientras HeroIndex prepara nuevas fichas para héroes emergentes.`;

  return [
       {
      source:'heroindex', sourceLabel:'HeroIndex Official', avatar:'HI', badge:'Verificado', badgeType:'verified', tone:'official', date:leadNews.date || 'Hoy · 08:30',
      body:newsBody,
      hashtags:['#HeroIndexLive', top ? homeTag(top.alias) : '#RankingGlobal', leadNews.category ? homeTag(leadNews.category) : '#GoldenAge'],
      engagement:{likes:homeCompact(likesBase,'48K'),comments:homeCompact(Math.round(likesBase/14),'7.2K'),shares:homeCompact(Math.round(likesBase/7),'12K')}
    },
    {
      source:'public', sourceLabel:'FanFeed', avatar:'FF', badge:'Tendencia', badgeType:'trend', tone:'public', date:'Hoy · 09:10',
      body:`Fans empujan a ${secondAlias} al centro del feed con clips, edits y reacciones en vivo. Cada nuevo héroe agregado aparecerá automáticamente en esta conversación.`,
      hashtags:['#FanFeed', second ? homeTag(second.alias) : '#NuevosHeroes', '#GoldenAge'],
      engagement:{likes:homeCompact(second ? (second.score||0)*15 : 92000,'92K'),comments:homeCompact(second ? (second.score||0) : 8100,'8.1K'),shares:homeCompact(second ? Math.round((second.score||0)*2.4) : 19000,'19K')}
    },
    {
      source:'corp', sourceLabel:'Corporate Newsroom', avatar:'CN', badge:'Newsroom', badgeType:'corp', tone:'corp', date:'Hoy · 09:42',
      body:`${topCorp} presenta una agenda de reputación pública centrada en seguridad, formación y presencia mediática heroica.`,
      hashtags:[homeTag(topCorp), '#FutureHeroes', '#Newsroom'],
      engagement:{likes:'38K',comments:'2.4K',shares:'6.8K'}
    },
    {
      source:'sponsor', sourceLabel:'Sponsor · VOLT Energy', avatar:'VE', badge:'Promoted', badgeType:'promo', tone:'sponsor', date:'Hoy · 10:05',
      body:'Nueva red de recarga instantánea para exotrajes: menos tiempo en taller, más héroes en acción.',
      hashtags:['#VOLT','#HeroTech','#Ad'], engagement:{likes:'27K',comments:'1.2K',shares:'3.1K'}
    },
    {
      source:'alert', sourceLabel:'Civil Alert', avatar:'CA', badge:'Alerta Pública', badgeType:'alert', tone:'public', date:'Hoy · 10:22',
      body:`Alerta ciudadana activa: equipos locales solicitan apoyo y visibilidad pública. Aprobación estimada de respuesta heroica: ${approval}%.`,
      hashtags:['#CivilAlert', top ? homeTag(top.country || top.corp || top.alias) : '#Seguridad', '#Respuesta'],
      engagement:{likes:'12K',comments:'4.3K',shares:'9.4K'},
      oracleNote: session.type==='gm' ? 'El origen del incidente coincide con activo encubierto en prueba.' : ''
    }
  ];
}

function getHomeClips(heroes=[]){
  const ranked = getHomeRankedHeroes(heroes);
  const palette = [
    'linear-gradient(135deg,#2f1f65,#0ea5e9)',
    'linear-gradient(135deg,#9d174d,#7c3aed)',
    'linear-gradient(135deg,#0f766e,#2563eb)'
  ];
  const heroClips = ranked.slice(0,3).map((h,i)=>({
    title: i===0 ? `${h.alias}: ${Math.max(7, Math.min(30, Math.round((h.score||0)/700)))} días en la cima` : `${h.alias}: ascenso viral`,
    meta: `${h.corp || 'HeroIndex'} · ${i===0?'8:21':'6:10'}`,
    bg: palette[i]
  }));
  const fallbackClips = [
    {title:'Top 5 rescates de la semana',meta:'HeroIndex Recap · 11:02',bg:'linear-gradient(135deg,#0f766e,#2563eb)'},
    {title:'Nuevos héroes: perfiles que debes seguir',meta:'FanFeed Studio · 5:40',bg:'linear-gradient(135deg,#9d174d,#7c3aed)'},
    {title:'Aurora Academy: clase abierta',meta:'Corporate Live · 4:44',bg:'linear-gradient(135deg,#78350f,#f59e0b)'},
    {title:'Cómo funciona el ranking público',meta:'HeroIndex Explains · 3:18',bg:'linear-gradient(135deg,#1e3a8a,#06b6d4)'}
 ];
  return [...heroClips, ...fallbackClips].slice(0,4);
}