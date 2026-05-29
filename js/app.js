// ── STATE ────────────────────────────────────────────────────
let heroes = [];
let gmActive = true;
let selectedKarmaHero = null;
let karmaChecks = {};
let missionHeroes = new Set();
let missionSelections = {};
let miniChart = null;
let csvPending = [];
let powerFieldCount = 0;
let rankingScope = 'global';   // 'global' | 'pais' | 'corp'
let newsTab = 'all';
let newsSource = 'heroindex';  // composer source
let rankingFilter = '';        // selected country or corp name
let profileSearch = '';
let myProfileDraft = null;


// ── CONSTANTS ────────────────────────────────────────────────
const ATTR_LABELS = {
  fighting:'Fighting', agility:'Agility', strength:'Strength',
  reason:'Reason', intuition:'Intuition', presence:'Presence'
};
const ATTR_DESCS = {
  fighting:'Combate', agility:'Coordinación', strength:'Fuerza',
  reason:'Inteligencia', intuition:'Instinto', presence:'Carisma'
};

const GOOD_KARMA = [
  {id:'g1',label:'Participaste en una escena de acción',pts:1},
  {id:'g2',label:'Participaste en una escena social',pts:1},
  {id:'g3',label:'Actuaste según tu personalidad',pts:1},
  {id:'g4',label:'Actuaste según tu impulso (drive)',pts:1},
  {id:'g5',label:'Actuaste según tu falla (flaw)',pts:1,note:'Superarla completamente otorga 2 pts — marca también la siguiente'},
  {id:'g5b',label:'Superaste tu falla completamente',pts:2,note:'Solo si la superaste del todo'},
  {id:'g6',label:'Arriesgaste tu vida por un compañero o relación clave',pts:1},
  {id:'g7',label:'Salvaste las vidas de civiles inocentes',pts:1},
  {id:'g8',label:'Cumpliste las responsabilidades de tu ocupación',pts:1},
  {id:'g9',label:'Superaste un desafío causado por uno de tus defectos',pts:1},
  {id:'g10',label:'Realizaste una acción extraordinaria que hizo ovacionar al grupo',pts:1},
];
const BAD_KARMA = [
  {id:'b1',label:'No acudiste en ayuda de un compañero o relación clave',pts:-1},
  {id:'b2',label:'No acudiste en ayuda de civiles inocentes',pts:-1},
  {id:'b3',label:'Fallaste las responsabilidades de tu ocupación',pts:-1},
  {id:'b4',label:'Destruiste una o más zonas del entorno',pts:-1},
  {id:'b5',label:'Mataste a alguien',pts:-1},
  {id:'b6',label:'Realizaste otra acción inmoral (determinada por el GM)',pts:-1},
];

const FACTORS = {
  resultado:{label:'Resultado',desc:'',opts:[{label:'Éxito total',val:300},{label:'Éxito parcial',val:100},{label:'Fracaso',val:-150}]},
  amenaza:{label:'Amenaza',desc:'',opts:[{label:'Global',val:200},{label:'Nacional',val:100},{label:'Local',val:50},{label:'Menor',val:0}]},
  civiles:{label:'Civiles',desc:'',opts:[{label:'Muchos salvados',val:200},{label:'Algunos',val:100},{label:'Sin daño',val:0},{label:'Muertos',val:-400}]},
  colateral:{label:'Daño colateral',desc:'',opts:[{label:'Ninguno',val:100},{label:'Menor',val:0},{label:'Mayor',val:-100},{label:'Catastrófico',val:-300}]},
  media:{label:'Cobertura mediática',desc:'Lo que el mundo vio.',opts:[{label:'Positiva',val:150},{label:'Neutral',val:0},{label:'Negativa',val:-100},{label:'Viral negativa',val:-300}]},
  corp:{label:'Aprobación corp.',desc:'¿Convenía a Aurora?',opts:[{label:'Alineado',val:100},{label:'Neutral',val:0},{label:'En conflicto',val:-150}]},
};

// ── CORP / COUNTRY META ─────────────────────────────────────
const CORPS = {
  'Aurora Corporation': { color: '#00c8ff', icon: '🔵', country: 'Chile' },
  'Valkyr Industries':  { color: '#ff5252', icon: '🔴', country: 'Estados Unidos' },
  'Solaris International': { color: '#ffab40', icon: '🟠', country: 'Japón' },
  'Helix Dynamics':     { color: '#00e676', icon: '🟢', country: 'Europa' },
  'Eden Initiative':    { color: '#66bb6a', icon: '🌿', country: 'Canadá' },
  'Nexus Technologies': { color: '#c084fc', icon: '🟣', country: 'Global' },
};
const COUNTRY_FLAGS = {
  'Chile':'🇨🇱','Estados Unidos':'🇺🇸','Japón':'🇯🇵','Europa':'🇪🇺',
  'Canadá':'🇨🇦','Brasil':'🇧🇷','México':'🇲🇽','Argentina':'🇦🇷',
  'Independiente':'⚪','Global':'🌐',
};
function getCorpColor(corp){ return CORPS[corp]?.color || 'var(--muted2)'; }
function getCorpIcon(corp){  return CORPS[corp]?.icon  || '⬡'; }
function getFlag(country){   return COUNTRY_FLAGS[country] || '🌐'; }

// ── UTILS ────────────────────────────────────────────────────
const AV_COLORS=[
  {bg:'#0a2218',c:'#00e676'},{bg:'#0a1830',c:'#00c8ff'},{bg:'#200a0a',c:'#ff5252'},
  {bg:'#1a0a28',c:'#c084fc'},{bg:'#201400',c:'#ffab40'},{bg:'#001a1a',c:'#26c6da'},
];
function avColor(a){let h=0;for(let c of a)h+=c.charCodeAt(0);return AV_COLORS[h%AV_COLORS.length];}
function initials(a){return a.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);}
function scoreColor(s){if(s>=8000)return'#00e676';if(s>=5000)return'#00c8ff';if(s>=2000)return'#ffab40';return'#ff5252';}
function attrColor(v){if(v>=10)return'#00e676';if(v>=7)return'#00c8ff';if(v>=5)return'#ffab40';return'#ff5252';}
function attrDesc(v){const d=['','Poor','Typical','Good','Great','Extraordinary','Incredible','Amazing','Astounding','Phenomenal','Awesome','Godlike','Invincible'];return d[Math.min(12,Math.max(1,v))]||'';}
function riskClass(r){return{low:'badge-low',med:'badge-med',high:'badge-high',critical:'badge-critical'}[r]||'badge-low';}
function riskLabel(r){return{low:'Bajo',med:'Moderado',high:'Alto',critical:'Crítico'}[r]||'Bajo';}
function today(){return new Date().toLocaleDateString('es-CL');}
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2800);}
function makeAv(alias,size=''){
  const av=avColor(alias);const cls=size==='md'?'av-md':'av';
  return `<div class="${cls}" style="background:${av.bg};color:${av.c};border:1px solid ${av.c}33">${initials(alias)}</div>`;
}
function makeHeroAv(h,size=''){
  if(h?.publicAvatar){
    const cls=size==='md'?'av-md':'av';
    return `<img src="${h.publicAvatar}" alt="avatar" class="${cls}" style="object-fit:cover;border:1px solid var(--border2)">`;
  }
  return makeAv(h?.alias||'?',size);
}

// Health = (Fighting+Agility+Strength)/2 rounded up
// Resolve = (Reason+Intuition+Presence)/2 rounded up
function calcHealth(attrs){
  if(!attrs) return '—';
  const f=attrs.fighting||0,a=attrs.agility||0,s=attrs.strength||0;
  if(!f&&!a&&!s) return '—';
  return Math.ceil((f+a+s)/2);
}
function calcResolve(attrs){
  if(!attrs) return '—';
  const r=attrs.reason||0,i=attrs.intuition||0,p=attrs.presence||0;
  if(!r&&!i&&!p) return '—';
  return Math.ceil((r+i+p)/2);
}

function canViewPrivateHero(session, heroId){
  return session.type==='gm' || (session.type==='hero' && currentSession.heroId===heroId);
}
function canAccessPage(session, page){
  if(['gm','karma','misiones'].includes(page)) return session.type==='gm';
  if(page==='miperfil') return session.type==='hero';
  return true;
}
function canManageNews(session){ return session.type==='gm'; }
function getNewsVisibilityByRole(session){
  if(session.type==='gm') return ['public','heroes','gm'];
  if(session.type==='hero') return ['public','heroes'];
  return ['public'];
}
function normalizeNewsItem(n){
  if(n.visibility) return n;
  if(n.source==='oracle') return {...n, visibility:'gm'};
  return {...n, visibility:'public'};
}
function cleanPublicText(txt=''){
  return String(txt)
    .replace(/[<>]/g,'')
    .replace(/\s+/g,' ')
    .trim();
}

// ── NAVIGATION ───────────────────────────────────────────────
function showPage(name, btn){
  // Permission check
  const session = currentSession || {type:'public'};
  if(!canAccessPage(session,name)) return;
  
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.snav,.bnav').forEach(b=>b.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  document.querySelectorAll(`[data-page="${name}"]`).forEach(b=>b.classList.add('active'));
  if(name==='inicio')   renderHome();
  if(name==='ranking')  renderRanking();
  if(name==='perfil')   renderProfiles();
  if(name==='miperfil') renderMyProfile();
  if(name==='karma')    renderKarmaChips();
  if(name==='misiones') renderMissionChips();
  if(name==='gm')       renderGMList();
  if(name==='noticias') renderNewsFeed();
}

// ── GM TOGGLE ────────────────────────────────────────────────
function toggleGM(src){
  const d=document.getElementById('gm-toggle-desk');
  const m=document.getElementById('gm-toggle-mobile');
  if(src==='desk'  &&m) m.checked=d.checked;
  if(src==='mobile'&&d) d.checked=m.checked;
  gmActive=(d||m).checked;
  document.body.classList.toggle('gm-active',gmActive);
  const dot=document.getElementById('gm-dot');
  if(dot) dot.classList.toggle('show',gmActive);
  renderAll();
}
function toggleGMModal(){document.getElementById('gm-modal').style.display='flex';}
function closeGMModal(e){if(e.target===document.getElementById('gm-modal'))document.getElementById('gm-modal').style.display='none';}

// ── RENDER ALL ───────────────────────────────────────────────
function renderAll(){renderHome();renderRanking();renderProfiles();}

// ── HOME — SOCIAL MEDIA PLATFORM ────────────────────────────
function isHomeOracleActive(session=currentSession||{type:'public'}){
  return session.type==='gm' && gmActive && document.body.classList.contains('gm-active');
}

function getHomeViewSession(session=currentSession||{type:'public'}){
  if(isHomeOracleActive(session)) return session;
  if(session.type==='hero') return session;
  return {type:'public'};
}

function renderHome(){
  const sorted=[...heroes].sort((a,b)=>b.score-a.score).map((h,i)=>({...h,deltaTag:i%3===0?'up':(i%4===0?'down':'steady')}));
  const session=getHomeViewSession();
  renderHomeMasthead(sorted, session);
   
  // Alerts
  const ALERTS=[
    {icon:'🔥',name:'INCENDIO INDUSTRIAL',level:'high',levelLabel:'ALTO',loc:'San Bernardo, Chile',time:'00:24:15'},
    {icon:'🌊',name:'RESCATE MARÍTIMO',level:'med',levelLabel:'MEDIO',loc:'Talcahuano, Chile',time:'00:18:30'},
    {icon:'🏢',name:'EVENTO SÍSMICO',level:'low',levelLabel:'BAJO',loc:"Región de O'Higgins",time:'01:05:00'},
  ];
  const al=document.getElementById('alerts-list');
  if(al) al.innerHTML=ALERTS.map(a=>`
    <div class="alert-item threat-${a.level}">
      <div class="alert-icon threat-${a.level}">${a.icon}</div>
      <div class="alert-info">
        <div class="alert-name">${a.name}</div>
        <div class="alert-level threat-${a.level}">Nivel: ${a.levelLabel}</div>
        <div class="alert-loc">📍 ${a.loc}</div>
      </div>
      <div class="alert-time"><div class="alert-timer">${a.time}</div><div class="alert-timer-sub">Tiempo estimado</div></div>
    </div>`).join('');

  // Top heroes
  const hr=document.getElementById('home-ranking');
  if(hr){
    if(!sorted.length){
      hr.innerHTML=renderHomeRosterEmpty(session);
    }else{
      const cards=sorted.slice(0,6).map((h,i)=>{
        const move=getScoreMove(h.deltaTag);
        return `<div class="hero-trend-card ${session.type==='hero'&&session.heroId===h.id?'is-me':''}" onclick="openHeroModal(${h.id})">
          <div class="hero-trend-head"><span class="hero-trend-pos">#${i+1}</span><span class="hero-trend-move ${move.cls}">${move.icon} ${move.label}</span></div>
          <div class="hero-trend-body">
            ${makeHeroAv(h,'md')}
            <div class="hero-trend-info">
              <div class="hr-name">${h.alias}</div>
              <div class="hero-trend-sub" style="color:${getCorpColor(h.corp)}">${getCorpIcon(h.corp||'')} ${h.corp||'Independiente'}</div>
              <div class="hr-badges">${getHeroPublicBadges(h)}</div>
            </div>
            <div class="hero-trend-score"><b style="color:${scoreColor(h.score)}">${h.score.toLocaleString('es-CL')}</b><span>${Math.max(52,Math.min(98,Math.round(h.score/120)))}% aprobación</span></div>
          </div>
          </div>`;
      }).join('');
      hr.innerHTML=cards+renderHomeRosterNote(sorted.length, session);
    }
  }

      // Home headline media
  const featured=document.getElementById('featured-media');
  if(featured){
    loadNews().then(all=>{
      const visibility=getNewsVisibilityByRole(session);
      const news=all.map(normalizeNewsItem).filter(n=>visibility.includes(n.visibility||'public'));
      const top=news[0];
      featured.innerHTML=top?renderFeaturedMedia(top, session.type==='gm', heroes):'<div class="news-empty">Sin cobertura destacada.</div>';
    });
  }
  
  renderHomeStories(session);
  renderHomeSocialFeed(session);
  renderHomeClips(heroes);
  renderHomeAds();
}


function renderHomeRosterEmpty(session){
  const cta=session.type==='gm'
    ? '<button class="home-empty-cta" onclick="showPage(\'gm\')">Registrar primer héroe →</button>'
    : '<button class="home-empty-cta" onclick="showPage(\'perfil\')">Ver perfiles públicos →</button>';
  return `<div class="home-empty-state">
    <div class="home-empty-icon">✨</div>
    <div class="home-empty-title">El ranking todavía está por estrenarse</div>
    <div class="home-empty-body">HeroIndex ya puede funcionar como portada pública, pero necesita héroes registrados para llenar historias, clips y rankings con celebridades reales del universo.</div>
    ${cta}
  </div>`;
}

function renderHomeRosterNote(count, session){
  if(count>=3) return '';
  const copy=count===1
    ? 'Solo hay un héroe registrado: el feed usará más piezas editoriales hasta que agregues rivales, aliados y nuevas corporaciones.'
    : 'Hay dos héroes registrados: el feed ya puede comparar tendencias, pero ganará variedad cuando agregues más perfiles.';
  const cta=session.type==='gm'?'<button onclick="showPage(\'gm\')">Agregar héroes</button>':'';
  return `<div class="home-roster-note"><span>${copy}</span>${cta}</div>`;
}

function renderHomeMasthead(sorted, session){
  const masthead=document.getElementById('home-masthead');
  if(!masthead) return;

  const topHero=sorted[0];
  const me=session.type==='hero'?heroes.find(h=>h.id===session.heroId):null;
  const totalH=heroes.length;
  const corps=new Set(heroes.map(h=>h.corp||'Independiente')).size;
  const highRisk=heroes.filter(h=>h.risk==='high'||h.risk==='critical').length;
   const title=!totalH
    ? 'La portada está lista para el primer héroe'
    : (session.type==='hero'&&me
      ? `${me.alias}, tu reputación pública está en vivo`
      : (session.type==='gm'
        ? 'ORÁCULO observa la narrativa debajo del espectáculo'
        : 'La era dorada se transmite en vivo'));
  const body=!totalH
    ? 'Cuando registres héroes, HeroIndex llenará automáticamente historias, rankings, clips y conversación social con sus datos públicos.'
    : (session.type==='hero'&&me
      ? 'Gestiona cómo fans, prensa, corporaciones y gobiernos leen cada rescate, clip y titular asociado a tu nombre.'
      : (session.type==='gm'
        ? 'La portada pública permanece aspiracional; esta franja privada revela divergencias, riesgos y control narrativo para dirección de juego.'
        : 'HeroIndex reúne ranking, clips, perfiles y cobertura ciudadana para seguir a los héroes que sostienen el presente.' ));
  const topName=topHero?topHero.alias:'Roster en preparación';
  const oracleRibbon=session.type==='gm'?`
    <div class="masthead-oracle gm-only">
      <span>ORÁCULO / GM</span>
      <b>${highRisk}</b> activos en riesgo alto+
    </div>`:'';
  const heroChip=me?`<span>👤 Tu perfil: <b>${me.alias}</b></span>`:`<span>🌍 Feed público global</span>`;

  masthead.innerHTML=`
    <div class="masthead-copy">
      <div class="masthead-kicker">HeroIndex Live · Celebridad heroica · Ranking global</div>
      <h1>${title}</h1>
      <p>${body}</p>
      <div class="masthead-actions">
        <button class="btn-primary" onclick="showPage('ranking')">Ver ranking global →</button>
        <button class="btn-sec" onclick="showPage('noticias')">Abrir noticias</button>
      </div>
    </div>
    <aside class="masthead-media-card">
      ${oracleRibbon}
      <div class="masthead-live-pill">● En vivo ahora</div>
      <div class="masthead-hero-label">Héroe destacado</div>
      <div class="masthead-hero-name">${topName}</div>
      <div class="masthead-hero-sub">${topHero?(getCorpIcon(topHero.corp||'')+' '+(topHero.corp||'Independiente')):'Agrega héroes desde el Panel GM para activar la cartelera'}</div>
      <div class="masthead-chip-row">
        <span>${topHero?'🏆 #1 hoy':'🆕 Nuevo universo'}</span>
        ${heroChip}
        <span>🏢 ${corps} corporaciones</span>
        <span>✅ ${totalH} verificados</span>
      </div>
    </aside>`;
}

function getHeroPublicBadges(h){
  const out=['<span class="mini-badge verified">✔ Verificado</span>'];
  if((h.corp||'').toLowerCase().includes('aurora')) out.push('<span class="mini-badge sponsor">Sponsor</span>');
  if(!h.corp || h.corp==='Independiente') out.push('<span class="mini-badge indie">Independiente</span>');
  if((h.type||'').toUpperCase()==='PC') out.push('<span class="mini-badge public">En tendencia</span>');
  return out.slice(0,3).join('');
}

function getScoreMove(deltaTag='steady'){
  if(deltaTag==='up') return {icon:'▲',label:'Sube',cls:'up'};
  if(deltaTag==='down') return {icon:'▼',label:'Baja',cls:'down'};
  return {icon:'◆',label:'Estable',cls:'steady'};
}

function renderFeaturedMedia(n,isGM, heroList=heroes){
  const tags=(typeof getFeaturedHashtags==='function'?getFeaturedHashtags(n, heroList):['#HeroIndex','#Live']);
  return `<article class="featured-media source-${n.source}">
    <div class="featured-badge-row"><span class="news-source ${n.source}">${SOURCE_LABELS[n.source]||'HeroIndex'}</span><span class="social-tag">${CAT_LABELS[n.category]||n.category}</span><span class="news-date">${n.date}</span></div>
    <h2 class="featured-title">${n.headline}</h2>
    <div class="featured-body">${n.body||'Cobertura en desarrollo. Más detalles en el feed oficial.'}</div>
     <div class="featured-placeholder"><span>▶ HeroIndex Media</span><small>4.8M reproducciones · 96K comentarios</small></div>
    <div class="featured-hashtags">${tags.map(t=>`<span>${t}</span>`).join('')}</div>
    ${isGM?'<div class="featured-oracle gm-only">ORÁCULO: divergencia detectada entre narrativa pública y reporte interno.</div>':''}
  </article>`;
}

function renderHomeStories(session=getHomeViewSession()){
  const row=document.getElementById('home-stories');
  if(!row) return;
    const stories=(typeof getHomeStories==='function'?getHomeStories(heroes):[])
    .filter(st=>!st.oracle || session.type==='gm');
  row.innerHTML=stories.map(st=>`<div class="story-item ${st.oracle?'story-oracle':''}">
    <div class="story-ring">${st.avatar?`<img src="${st.avatar}" alt="${st.name}">`:`<span>${st.initials||initials(st.name)}</span>`}</div>
    <div class="story-name">${st.name}</div>
  </div>`).join('');
}

function renderHomeSocialFeed(session=getHomeViewSession()){
  const feed=document.getElementById('home-news-feed');
  if(!feed) return;
  loadNews().then(all=>{
    const visibility=getNewsVisibilityByRole(session);
    const news=all.map(normalizeNewsItem).filter(n=>visibility.includes(n.visibility||'public'));
    const posts=(typeof getHomeSocialPosts==='function'?getHomeSocialPosts({heroes,news,session}):[])
      .filter(p=>!p.gmOnly || session.type==='gm');
    feed.innerHTML=posts.map(p=>renderSocialPost(p, session.type==='gm')).join('')||'<div class="news-empty">Sin publicaciones disponibles.</div>';
  });
}

function renderSocialPost(p,isGM){
    const censored=p.oracleNote?`<div class="social-censored">ORÁCULO: ${p.oracleNote}</div>`:'';
  return `<article class="social-post tone-${p.tone}${p.gmOnly?' gm-post':''}">
     <div class="social-meta"><span class="post-avatar">${p.avatar||initials(p.sourceLabel||p.source)}</span><strong>${p.sourceLabel||p.source}</strong><span class="social-badge ${p.badgeType||''}">${p.badge||p.tag}</span><span class="news-date">${p.date}</span></div>
    <div class="social-body">${p.body}</div>
    <div class="featured-hashtags">${(p.hashtags||[]).map(t=>`<span>${t}</span>`).join('')}</div>
    ${isGM&&p.oracleNote?censored:''}
    <div class="social-engagement">❤ ${p.engagement.likes} · 💬 ${p.engagement.comments} · ↻ ${p.engagement.shares}</div><div class="social-actions"><span>Me gusta</span><span>Comentar</span><span>Compartir</span></div>
  </article>`;
}

function renderHomeAds(){
  const adEl=document.getElementById('home-ads');
  if(!adEl) return;
  const slots=(typeof getHomeMediaSlots==='function')?getHomeMediaSlots():[];
  adEl.innerHTML=slots.map(slot=>`<div class="ad-slot">
    <div class="ad-visual" style="background:${slot.fallbackColor}">
      <img src="${slot.image}" alt="${slot.title}" onerror="this.style.display='none'">
      <div class="ad-overlay">
        <div class="ad-sponsor">${slot.sponsor}</div>
        <div class="ad-title">${slot.title}</div>
        <button class="btn-sec ad-cta">${slot.cta}</button>
      </div>
    </div>
  </div>`).join('')||'<div class="news-empty">Sin espacios comerciales activos.</div>';
}

function renderMiniChart(hero){
  const canvas=document.getElementById('mini-chart'); if(!canvas) return;
  if(miniChart){miniChart.destroy();miniChart=null;}
  let scores=[2000,2400,2200,2800,3200,3000,3600,4000];
  if(hero&&hero.scoreLog&&hero.scoreLog.length>2){
    let run=hero.scoreLog[0].delta||1000;
    scores=hero.scoreLog.slice(-8).map(l=>{run+=l.delta;return Math.max(0,run);});
  }
  if(hero) scores=[...scores.slice(0,-1),hero.score];
  miniChart=new Chart(canvas,{type:'line',data:{labels:scores.map(()=>''),datasets:[{data:scores,borderColor:'#00c8ff',borderWidth:2,pointBackgroundColor:'#00c8ff',pointRadius:3,tension:0.4,fill:true,backgroundColor:(ctx)=>{const g=ctx.chart.ctx.createLinearGradient(0,0,0,70);g.addColorStop(0,'rgba(0,200,255,0.18)');g.addColorStop(1,'rgba(0,200,255,0)');return g;}}]},options:{responsive:false,plugins:{legend:{display:false},tooltip:{enabled:false}},scales:{x:{display:false},y:{display:false}},animation:{duration:600}}});
}

// ── RANKING ──────────────────────────────────────────────────
function setRankingScope(scope, btn){
  rankingScope = scope;
  rankingFilter = '';
  document.querySelectorAll('.rtab').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderRanking();
}

function getFilteredHeroes(){
  if(rankingScope === 'global') return [...heroes].sort((a,b)=>b.score-a.score);
  if(rankingScope === 'pais'){
    const f = rankingFilter || null;
    return [...heroes].filter(h => f ? (h.country||'Independiente')===f : true).sort((a,b)=>b.score-a.score);
  }
  if(rankingScope === 'corp'){
    const f = rankingFilter || null;
    return [...heroes].filter(h => f ? (h.corp||'Independiente')===f : true).sort((a,b)=>b.score-a.score);
  }
  return [...heroes].sort((a,b)=>b.score-a.score);
}

function renderFilterChips(){
  const filterRow = document.getElementById('ranking-filter-row');
  const chips     = document.getElementById('filter-chips');
  const label     = document.getElementById('filter-label');
  const thScope   = document.getElementById('rth-scope');
  if(!filterRow||!chips) return;

  if(rankingScope === 'global'){
    filterRow.style.display = 'none';
    if(thScope) thScope.textContent = 'País';
    return;
  }
  filterRow.style.display = 'flex';

  if(rankingScope === 'pais'){
    if(label) label.textContent = 'PAÍS:';
    if(thScope) thScope.textContent = 'País';
    const countries = [...new Set(heroes.map(h=>h.country||'Independiente'))].sort();
    chips.innerHTML = ['Todos',...countries].map(c=>`
      <div class="filter-chip ${c==='Todos'?(!rankingFilter?'active':''):(rankingFilter===c?'active':'')}"
        onclick="setRankingFilter('${c}')">
        ${c==='Todos'?'🌐 Todos':(getFlag(c)+' '+c)}
      </div>`).join('');
  }

  if(rankingScope === 'corp'){
    if(label) label.textContent = 'CORP:';
    if(thScope) thScope.textContent = 'Corporación';
    const corps = [...new Set(heroes.map(h=>h.corp||'Independiente'))].sort();
    chips.innerHTML = ['Todos',...corps].map(c=>`
      <div class="filter-chip corp-chip ${c==='Todos'?(!rankingFilter?'active':''):(rankingFilter===c?'active':'')}"
        onclick="setRankingFilter('${c}')">
        ${c==='Todos'?'⬡ Todos':(getCorpIcon(c)+' '+c)}
      </div>`).join('');
  }
}

function setRankingFilter(val){
  rankingFilter = val === 'Todos' ? '' : val;
  renderRanking();
}

function renderRanking(){
  const session = currentSession || { type:'public' };
  const showKarma = session.type==='gm';
  const showRisk = session.type==='gm';
  const karmaHeader=document.getElementById('rth-karma');
  if(karmaHeader) karmaHeader.style.display=showKarma?'table-cell':'none';
  const riskHeader=document.getElementById('rth-risk');
  if(riskHeader) riskHeader.style.display=showRisk?'table-cell':'none';
  renderFilterChips();
  const sorted = getFilteredHeroes();
  const medals = ['gold','silver','bronze'];

  // Scope header
  const scopeTitleEl = document.getElementById('scope-title');
  const scopeCountEl = document.getElementById('scope-count');
  if(scopeTitleEl){
    if(rankingScope==='global') scopeTitleEl.textContent = 'TODOS LOS HÉROES';
    else if(rankingScope==='pais') scopeTitleEl.textContent = rankingFilter ? (getFlag(rankingFilter)+' '+rankingFilter.toUpperCase()) : 'TODOS LOS PAÍSES';
    else scopeTitleEl.textContent = rankingFilter ? (getCorpIcon(rankingFilter)+' '+rankingFilter.toUpperCase()) : 'TODAS LAS CORPORACIONES';
  }
  if(scopeCountEl) scopeCountEl.textContent = sorted.length + ' héroe(s)';

  // Top 3
  const t3=document.getElementById('top3-area');
  if(t3) t3.innerHTML=sorted.slice(0,3).map((h,i)=>{
    const scopeDetail = rankingScope==='pais'
      ? `<div style="font-size:10px;color:var(--muted)">${getFlag(h.country||'Independiente')} ${h.country||'Independiente'}</div>`
      : rankingScope==='corp'
      ? `<div style="font-size:10px;color:${getCorpColor(h.corp)}">${getCorpIcon(h.corp||'')} ${h.corp||'Independiente'}</div>`
      : `<div class="top-corp">${h.corp||'—'}</div>`;
    return `<div class="top-card ${medals[i]}">
      <div class="top-pos">${['🥇','🥈','🥉'][i]}</div>
      ${makeHeroAv(h)}
      <div class="top-name">${h.alias}</div>
      ${scopeDetail}
      <div class="top-score" style="color:${scoreColor(h.score)}">${h.score.toLocaleString('es-CL')}</div>
       ${showKarma?`<div class="top-karma">Karma: ${h.karma}</div>`:''}
    </div>`;
  }).join('');

  // Table
  const tb=document.getElementById('ranking-body');
  if(tb) tb.innerHTML=sorted.map((h,i)=>{
    const last=h.scoreLog&&h.scoreLog.length>1?h.scoreLog[h.scoreLog.length-1].delta:0;
    const chg=last>0?`<span style="font-size:10px;color:var(--green);margin-left:4px">▲${last}</span>`:last<0?`<span style="font-size:10px;color:var(--red);margin-left:4px">▼${Math.abs(last)}</span>`:'';
    const pct=Math.round((h.score/10000)*100);
    const roleBadge=h.role?`<span class="role-badge" style="font-size:9px;padding:3px 8px">${h.role}</span>`:'—';
    const scopeCell = rankingScope==='corp'
      ? `<td><span style="font-size:12px;color:${getCorpColor(h.corp)}">${getCorpIcon(h.corp||'')} ${h.corp||'Independiente'}</span></td>`
      : `<td><span style="font-size:12px">${getFlag(h.country||'Independiente')} ${h.country||'Independiente'}</span></td>`;
     const canSeePrivate = canViewPrivateHero(session, h.id);
    const health = canSeePrivate ? calcHealth(h.attrs||{}) : '—';
    const resolve = canSeePrivate ? calcResolve(h.attrs||{}) : '—';
    const statsMini = (health!=='—'||resolve!=='—') ? `<div class="mini-stat-row"><span class="mini-stat">❤️${health}</span><span class="mini-stat">🧠${resolve}</span></div>` : '';
    return `<tr style="cursor:pointer" onclick="openHeroModal(${h.id})">
      <td style="font-family:'DM Mono',monospace;font-size:12px;color:var(--muted)">${i+1}</td>
      <td><div style="display:flex;align-items:center;gap:8px">${makeHeroAv(h)}<div><div style="font-weight:600;font-size:13px">${h.alias}${chg}</div>${statsMini}</div></div></td>
      <td><div class="sbar-wrap"><div class="sbar"><div class="sbar-fill" style="width:${pct}%;background:${scoreColor(h.score)}"></div></div><span class="sval" style="color:${scoreColor(h.score)}">${h.score.toLocaleString('es-CL')}</span></div></td>
      <td style="display:${showKarma?'table-cell':'none'}"><span style="font-family:'DM Mono',monospace;font-size:13px;font-weight:600;color:var(--green)">${h.karma}</span></td>
      ${scopeCell}
      <td>${roleBadge}</td>
      <td><span class="badge ${h.type==='PC'?'badge-pc':'badge-npc'}">${h.type}</span></td>
      <td class="gm-col" style="display:${showRisk?'table-cell':'none'}"><span class="badge ${riskClass(h.risk)}">${riskLabel(h.risk)}</span></td>
    </tr>`;
  }).join('')||`<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--muted)">Sin héroes en esta categoría</td></tr>`;
}

// ── HERO DETAIL MODAL ────────────────────────────────────────
function openHeroModal(id){
  const h=heroes.find(h=>h.id===id); if(!h) return;
  const session = currentSession || { type:'public' };
  const canSeePrivate = canViewPrivateHero(session, h.id);
  const av=avColor(h.alias);
  const attrs=canSeePrivate?(h.attrs||{}):{};
  const health=calcHealth(attrs);
  const resolve=calcResolve(attrs);
  const hasAttrs=Object.values(attrs).some(v=>v>0);

  // Attrs block
  const attrsHtml=hasAttrs?`
    <div class="attrs-grid">
      ${Object.entries(ATTR_LABELS).map(([key,label])=>{
        const v=attrs[key]||0;const pct=Math.round((v/12)*100);
        return `<div class="attr-box">
          <div class="attr-name">${label.toUpperCase()}</div>
          <div class="attr-val" style="color:${attrColor(v)}">${v||'—'}</div>
          <div class="attr-desc">${v?attrDesc(v):''}</div>
          ${v?`<div class="attr-bar"><div class="attr-bar-fill" style="width:${pct}%;background:${attrColor(v)}"></div></div>`:''}
        </div>`;
      }).join('')}
    </div>
    <div class="derived-row">
      <div class="derived-box">
        <div class="derived-icon">❤️</div>
        <div><div class="derived-label">HEALTH</div><div class="derived-val" style="color:var(--red)">${health}</div><div class="derived-formula">(Fgt+Agi+Str)÷2</div></div>
      </div>
      <div class="derived-box">
        <div class="derived-icon">🧠</div>
        <div><div class="derived-label">RESOLVE</div><div class="derived-val" style="color:var(--accent)">${resolve}</div><div class="derived-formula">(Rea+Int+Pre)÷2</div></div>
      </div>
    </div>` : '<p style="font-size:12px;color:var(--muted);margin-bottom:12px">Sin atributos registrados.</p>';

  // Powers
  const powersHtml=h.powers&&h.powers.length?`
    <div class="powers-list">
      ${h.powers.map(p=>`<div class="power-item">
        <span class="power-level ${p.level||'basic'}">${(p.level||'basic').toUpperCase()}</span>
        <div><div class="power-name">${p.name}</div>${p.desc?`<div class="power-desc">${p.desc}</div>`:''}</div>
      </div>`).join('')}
    </div>` : '<p style="font-size:12px;color:var(--muted)">Contenido privado protegido.</p>';

  // Talents & Drawbacks
  const talentsHtml=canSeePrivate&&h.talents&&h.talents.length?`<div class="talents-grid">${h.talents.map(t=>`<span class="talent-tag">${t}</span>`).join('')}</div>`:'<p style="font-size:12px;color:var(--muted)">Contenido privado protegido.</p>';
  const drawbacksHtml=canSeePrivate&&h.drawbacks&&h.drawbacks.length?`<div class="talents-grid">${h.drawbacks.map(d=>`<span class="drawback-tag">${d}</span>`).join('')}</div>`:'<p style="font-size:12px;color:var(--muted)">Contenido privado protegido.</p>';

  // Relationships
  const relsHtml=canSeePrivate&&h.relationships&&h.relationships.length?`<div class="relationships-list">${h.relationships.map(r=>`<div class="rel-item"><div class="rel-name">${r.name}</div><div class="rel-type">${r.type}</div></div>`).join('')}</div>`:'<p style="font-size:12px;color:var(--muted)">Contenido privado protegido.</p>';
  
  // GM-only section
    const gmSection=session.type==='gm'?`
    <div class="divider"></div>
    <div class="card-label" style="color:var(--gm-red)">ORÁCULO — DATOS CLASIFICADOS</div>
    ${h.realName?`<div style="font-size:13px;margin-bottom:8px"><span style="color:var(--muted);font-size:11px">Identidad real: </span><span style="color:var(--gm-red);font-weight:600">${h.realName}</span></div>`:''}
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <span style="font-size:12px;color:var(--muted)">Risk Index</span>
      <span class="badge ${riskClass(h.risk)}">${riskLabel(h.risk)}</span>
    </div>
    ${h.flags&&h.flags.length?`<div>${h.flags.map(f=>`<div class="flag-item">${f}</div>`).join('')}</div>`:''}
  `:'';

  const content=`
    <button class="hero-modal-close" onclick="document.getElementById('hero-modal').style.display='none'">✕</button>
    <div class="hero-modal-header">
       ${h.publicAvatar?`<img src="${h.publicAvatar}" alt="avatar" class="av-md" style="width:56px;height:56px;object-fit:cover;border:1px solid ${av.c}33">`:`<div class="av-md" style="background:${av.bg};color:${av.c};border:1px solid ${av.c}33;width:56px;height:56px;font-size:18px">${initials(h.alias)}</div>`}
      <div style="flex:1">
        <div style="font-family:'Orbitron',sans-serif;font-size:20px;font-weight:700;color:var(--text)">${h.alias}</div>
        ${h.realName&&session.type==='gm'?`<div style="font-size:12px;color:var(--gm-red)">${h.realName}</div>`:''}
        <div style="font-size:12px;color:var(--muted);margin-top:2px">${h.corp||'—'} · ${h.country?getFlag(h.country)+' '+h.country:''} ${h.occupation?'· '+h.occupation:''}</div>
        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
          <span class="badge ${h.type==='PC'?'badge-pc':'badge-npc'}">${h.type}</span>
          ${h.role?`<span class="role-badge">${h.role}</span>`:''}
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-family:'Orbitron',sans-serif;font-size:26px;font-weight:700;color:${scoreColor(h.score)}">${h.score.toLocaleString('es-CL')}</div>
        <div style="font-size:10px;color:var(--muted);letter-spacing:1px">HEROINDEX</div>
        ${canSeePrivate?`<div style="font-size:14px;color:var(--green);font-weight:600;margin-top:4px">Karma: ${h.karma}</div>`:''}      
        </div>
    </div>

    ${h.publicStatus?`<div style="font-size:11px;color:var(--accent);margin-bottom:6px">● ${h.publicStatus}</div>`:''}
    ${h.publicSlogan?`<div style="font-size:12px;color:var(--muted2);margin-bottom:6px">"${h.publicSlogan}"</div>`:''}
    ${h.publicBio?`<div style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:10px">${h.publicBio}</div>`:''}
    ${canSeePrivate&&h.personality?`<div style="font-size:13px;color:var(--muted2);white-space:pre-line;line-height:1.6;margin-bottom:1rem;padding:12px;background:var(--surface2);border-radius:8px;border-left:2px solid var(--border2)">${h.personality}</div>`:''}
    
    <div class="card-label" style="color:var(--accent)">ATRIBUTOS</div>
    ${attrsHtml}

    <div class="card-label" style="color:var(--accent)">PODERES</div>
    ${powersHtml}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem">
      <div>
        <div class="card-label" style="color:var(--accent)">TALENTOS</div>
        ${talentsHtml}
      </div>
      <div>
        <div class="card-label" style="color:var(--amber)">DEFECTOS</div>
        ${drawbacksHtml}
      </div>
    </div>

    <div class="divider"></div>
    <div class="card-label" style="color:var(--accent)">RELACIONES CLAVE</div>
    ${relsHtml}

    ${gmSection}
  `;
  document.getElementById('hero-modal-content').innerHTML=content;
  document.getElementById('hero-modal').style.display='flex';
}

function closeHeroModal(e){
  if(e.target===document.getElementById('hero-modal'))
    document.getElementById('hero-modal').style.display='none';
}

// ── KARMA ────────────────────────────────────────────────────
function renderKarmaChips(){
  const pcs=heroes.filter(h=>h.type==='PC');
  const el=document.getElementById('karma-chips'); if(!el) return;
  el.innerHTML=pcs.length?pcs.map(h=>`<div class="chip ${selectedKarmaHero&&selectedKarmaHero.id===h.id?'active':''}" onclick="selectKarmaHero(${h.id})">${h.alias}</div>`).join(''):'<p style="color:var(--muted);font-size:13px">No hay PCs. Agrégalos en el panel GM.</p>';
}

function selectKarmaHero(id){
  selectedKarmaHero=heroes.find(h=>h.id===id)||null;
  karmaChecks={};
  renderKarmaChips();
  const panel=document.getElementById('karma-panel'); if(!panel) return;
  if(!selectedKarmaHero){panel.style.display='none';return;}
  panel.style.display='block';
  const av=avColor(selectedKarmaHero.alias);
  const avEl=document.getElementById('kh-av');
  if(avEl){Object.assign(avEl.style,{background:av.bg,color:av.c,border:`1px solid ${av.c}33`,width:'46px',height:'46px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'600',fontSize:'15px',fontFamily:"'Orbitron',sans-serif"});avEl.textContent=initials(selectedKarmaHero.alias);}
  const nn=document.getElementById('kh-name'); if(nn) nn.textContent=selectedKarmaHero.alias;
  const nc=document.getElementById('kh-corp'); if(nc) nc.textContent=selectedKarmaHero.corp||'';
  const ksd=document.getElementById('k-score-delta'); if(ksd) ksd.value='';
  const ksn=document.getElementById('k-score-note');  if(ksn) ksn.value='';
  renderChecks(); updateKarmaMetrics();
}

function renderChecks(){
  const good=document.getElementById('good-checks');
  if(good) good.innerHTML=GOOD_KARMA.map(q=>{
    const on=karmaChecks[q.id];
    return `<label class="check-item ${on?'good-on':''}" id="ci-${q.id}">
      <input type="checkbox" ${on?'checked':''} onchange="toggleCheck('${q.id}','good')">
      <div style="flex:1"><span class="check-label">${q.label}</span>${q.note?`<div class="check-note">${q.note}</div>`:''}</div>
      <span class="check-pts" style="color:${on?'var(--green)':'var(--muted)'}">${q.pts>0?'+':''}${q.pts}</span>
    </label>`;
  }).join('');
  const bad=document.getElementById('bad-checks');
  if(bad) bad.innerHTML=BAD_KARMA.map(q=>{
    const on=karmaChecks[q.id];
    return `<label class="check-item ${on?'bad-on':''}" id="ci-${q.id}">
      <input type="checkbox" ${on?'checked':''} onchange="toggleCheck('${q.id}','bad')" style="accent-color:var(--red)">
      <span class="check-label">${q.label}</span>
      <span class="check-pts" style="color:${on?'var(--red)':'var(--muted)'}">${q.pts}</span>
    </label>`;
  }).join('');
}

function toggleCheck(id,type){
  karmaChecks[id]=!karmaChecks[id];
  const el=document.getElementById('ci-'+id);
  if(el){
    el.className=`check-item ${karmaChecks[id]?(type==='good'?'good-on':'bad-on'):''}`;
    const pts=el.querySelector('.check-pts');
    if(pts) pts.style.color=karmaChecks[id]?(type==='good'?'var(--green)':'var(--red)'):'var(--muted)';
  }
  updateKarmaMetrics();
}

function updateKarmaMetrics(){
  if(!selectedKarmaHero) return;
  let pos=0,neg=0;
  GOOD_KARMA.forEach(q=>{if(karmaChecks[q.id])pos+=q.pts;});
  BAD_KARMA.forEach(q=>{if(karmaChecks[q.id])neg+=q.pts;});
  const delta=pos+neg;
  const newTotal=Math.max(0,selectedKarmaHero.karma+delta);
  const cur=document.getElementById('km-cur');   if(cur) cur.textContent=selectedKarmaHero.karma;
  const de=document.getElementById('km-delta');  if(de){de.textContent=(delta>=0?'+':'')+delta;de.style.color=delta>0?'var(--green)':delta<0?'var(--red)':'var(--muted)';}
  const tot=document.getElementById('km-total'); if(tot) tot.textContent=newTotal;
}

function confirmSession(){
  if(!selectedKarmaHero) return;
  let pos=0,neg=0;
  GOOD_KARMA.forEach(q=>{if(karmaChecks[q.id])pos+=q.pts;});
  BAD_KARMA.forEach(q=>{if(karmaChecks[q.id])neg+=q.pts;});
  const delta=pos+neg;
  const hero=heroes.find(h=>h.id===selectedKarmaHero.id); if(!hero) return;
  const oldKarma=hero.karma;
  hero.karma=Math.max(0,hero.karma+delta);
  if(!hero.karmaLog) hero.karmaLog=[];
  hero.karmaLog.push({session:hero.karmaLog.length+1,delta,pos,neg,note:`+${pos} / ${neg}`,date:today()});
  const sdEl=document.getElementById('k-score-delta');
  const snEl=document.getElementById('k-score-note');
  const sd=parseInt(sdEl&&sdEl.value)||0;
  if(sd!==0){
    hero.score=Math.max(0,Math.min(10000,hero.score+sd));
    if(!hero.scoreLog)hero.scoreLog=[];
    hero.scoreLog.push({delta:sd,note:(snEl&&snEl.value.trim())||'Sesión',date:today()});
  }
  saveHeroes(heroes).then(()=>{

  // ── visual confirmation ──
  const alias=hero.alias;
  const karmaMsg=delta===0?'sin cambio karma':`karma ${oldKarma} → ${hero.karma}`;
  const scoreMsg=sd!==0?` · score ${sd>=0?'+':''}${sd}`:'';
  showSessionResult(alias, delta, hero.karma, sd, hero.score);
  }); // end saveHeroes.then

  // ── full reset ──
  selectedKarmaHero=null;
  karmaChecks={};
  const panel=document.getElementById('karma-panel');
  if(panel) panel.style.display='none';
  renderKarmaChips();
  renderAll();
}

function showSessionResult(alias, karmaDelta, newKarma, scoreDelta, newScore){
  // inject a temporary confirmation card above the chips
  const container=document.getElementById('karma-chips');
  if(!container) return;
  const div=document.createElement('div');
  div.id='session-confirm-card';
  div.style.cssText='background:var(--surface);border:1px solid rgba(0,230,118,0.3);border-radius:var(--radius-lg);padding:1.25rem;margin-bottom:1rem;animation:fadeUp 0.2s ease';
  const kColor=karmaDelta>0?'var(--green)':karmaDelta<0?'var(--red)':'var(--muted)';
  const sColor=scoreDelta>0?'var(--green)':scoreDelta<0?'var(--red)':'var(--muted)';
  div.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-family:'Orbitron',sans-serif;font-size:11px;letter-spacing:1px;color:var(--green);margin-bottom:4px">✓ SESIÓN CONFIRMADA</div>
        <div style="font-weight:600;font-size:15px">${alias}</div>
      </div>
      <div style="display:flex;gap:12px">
        <div style="text-align:center">
          <div style="font-size:10px;color:var(--muted);font-family:'Orbitron',sans-serif;letter-spacing:1px">KARMA</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:22px;font-weight:700;color:${kColor}">${karmaDelta>=0?'+':''}${karmaDelta}</div>
          <div style="font-size:11px;color:var(--muted)">Total: ${newKarma}</div>
        </div>
        ${scoreDelta!==0?`<div style="text-align:center">
          <div style="font-size:10px;color:var(--muted);font-family:'Orbitron',sans-serif;letter-spacing:1px">SCORE</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:22px;font-weight:700;color:${sColor}">${scoreDelta>=0?'+':''}${scoreDelta}</div>
          <div style="font-size:11px;color:var(--muted)">${newScore.toLocaleString('es-CL')}</div>
        </div>`:''}
      </div>
    </div>`;
  // remove any previous confirm card
  const prev=document.getElementById('session-confirm-card');
  if(prev) prev.remove();
  container.parentNode.insertBefore(div,container);
  // auto-remove after 4 seconds
  setTimeout(()=>{const el=document.getElementById('session-confirm-card');if(el)el.remove();},4000);
}

// ── MISSION ──────────────────────────────────────────────────
function renderMissionChips(){
  const el=document.getElementById('m-chips'); if(!el) return;
  el.innerHTML=heroes.map(h=>`<div class="chip ${missionHeroes.has(h.id)?'active':''}" onclick="toggleMHero(${h.id})">${h.alias}</div>`).join('')||'<span style="color:var(--muted);font-size:12px">Sin héroes.</span>';
  if(!document.getElementById('factors-grid').childElementCount) buildFactors();
  updateMissionResult();
}

function toggleMHero(id){missionHeroes.has(id)?missionHeroes.delete(id):missionHeroes.add(id);renderMissionChips();updateMissionResult();}

function buildFactors(){
  const grid=document.getElementById('factors-grid'); if(!grid) return;
  grid.innerHTML=Object.entries(FACTORS).map(([key,f])=>{
    const desc=f.desc?`<div class="factor-desc">${f.desc}</div>`:'';
    return `<div class="factor-block"><div class="factor-title">${f.label}</div>${desc}<div class="factor-opts">${f.opts.map((o,i)=>{const vs=o.val>0?`+${o.val}`:o.val===0?'±0':`${o.val}`;return `<div class="fopt" id="fopt-${key}-${i}" onclick="selectFactor('${key}',${i})"><span>${o.label}</span><span class="fopt-val">${vs}</span></div>`;}).join('')}</div></div>`;
  }).join('');
}

function selectFactor(key,idx){
  FACTORS[key].opts.forEach((_,i)=>{const e=document.getElementById(`fopt-${key}-${i}`);if(e)e.className='fopt';});
  const sel=document.getElementById(`fopt-${key}-${idx}`);
  const val=FACTORS[key].opts[idx].val;
  if(sel) sel.className=`fopt ${val>0?'sel-pos':val<0?'sel-neg':'sel-neu'}`;
  missionSelections[key]={val,label:FACTORS[key].opts[idx].label};
  updateMissionResult();
}

function updateMissionResult(){
  const keys=Object.keys(FACTORS);
  const allDone=keys.every(k=>missionSelections[k]);
  const btn=document.getElementById('m-apply-btn');
  const deltaEl=document.getElementById('m-delta');
  if(!allDone){
    if(deltaEl){deltaEl.textContent='—';deltaEl.style.color='var(--muted)';}
    ['m-tag','m-breakdown','m-narrative','tension-alert'].forEach(id=>{const e=document.getElementById(id);if(e){if(id==='m-tag')e.textContent='';else if(id==='m-breakdown')e.innerHTML='';else e.style.display='none';}});
    if(btn) btn.disabled=true; return;
  }
  let total=0,rows='';
  keys.forEach(k=>{const s=missionSelections[k];total+=s.val;const vs=s.val>0?`+${s.val}`:s.val===0?'±0':`${s.val}`;const col=s.val>0?'var(--green)':s.val<0?'var(--red)':'var(--muted)';rows+=`<div class="br-row"><span>${FACTORS[k].label}: ${s.label}</span><span style="color:${col};font-family:'DM Mono',monospace">${vs}</span></div>`;});
  const tc=total>0?'var(--green)':total<0?'var(--red)':'var(--muted)';
  rows+=`<div class="br-row br-total"><span>Total</span><span style="color:${tc};font-family:'DM Mono',monospace">${total>=0?'+':''}${total}</span></div>`;
  if(deltaEl){deltaEl.textContent=(total>=0?'+':'')+total;deltaEl.style.color=tc;}
  const bd=document.getElementById('m-breakdown'); if(bd) bd.innerHTML=rows;
  const rv=missionSelections['resultado']?.val||0,cv=missionSelections['corp']?.val||0,mv=missionSelections['media']?.val||0;
  const hasTension=(rv>=100&&(cv<0||mv<0))||(rv<0&&(cv>0||mv>0));
  const ta=document.getElementById('tension-alert'); if(ta) ta.style.display=hasTension?'block':'none';
  const {tag,text}=getMissionNarrative(total,missionSelections);
  const tagEl=document.getElementById('m-tag'); if(tagEl) tagEl.textContent=tag;
  const narr=document.getElementById('m-narrative');
  if(narr){narr.textContent=text;narr.className='m-narrative'+(hasTension?' tension-narrative':'');narr.style.display='block';}
  if(btn){btn.disabled=missionHeroes.size===0;btn.textContent='Aplicar a héroes seleccionados →';btn.className='btn-primary';}
  const st=document.getElementById('m-status'); if(st) st.style.display='none';
}

function getMissionNarrative(total,sel){
  const rv=sel['resultado']?.val||0,cv=sel['corp']?.val||0,mv=sel['media']?.val||0,civ=sel['civiles']?.val||0;
  if(total>=600) return{tag:'MISIÓN EJEMPLAR',text:'HeroIndex registra esta operación como referencia institucional. Los sponsors estarán interesados.'};
  if(total>=300) return{tag:'RESULTADO POSITIVO',text:'La misión suma al historial. El sistema la usará como argumento de utilidad pública.'};
  if(total>0&&cv<0) return{tag:'VICTORIA SIN RECONOCIMIENTO',text:'El resultado fue positivo, pero la corporación no quería visibilidad. El score sube menos de lo que debería.'};
  if(total>0&&mv<0) return{tag:'ÉXITO IGNORADO',text:'Lo que ocurrió fue efectivo, pero la narrativa pública no lo refleja. El sistema mide percepción, no realidad.'};
  if(total===0) return{tag:'MISIÓN NEUTRAL',text:'Sin impacto en el ranking. El héroe existió esta semana.'};
  if(total<0&&rv>=100) return{tag:'TENSIÓN SISTÉMICA',text:'El héroe cumplió el objetivo, pero el daño colateral destruyó el beneficio. El sistema castiga lo que el mundo vio.'};
  if(civ<=-400) return{tag:'INCIDENTE CRÍTICO',text:'Civiles muertos. HeroIndex activa protocolo de contención mediática.'};
  if(total<=-500) return{tag:'CRISIS DE REPUTACIÓN',text:'El sistema considera este resultado una amenaza institucional. Monitoreo incrementado.'};
  return{tag:'RESULTADO NEGATIVO',text:'La misión resta al historial. Si el patrón continúa, la corporación revisará el contrato.'};
}

function applyMission(){
  if(!missionHeroes.size) return;
  if(!Object.keys(FACTORS).every(k=>missionSelections[k])) return;
  let total=0; Object.keys(FACTORS).forEach(k=>total+=missionSelections[k].val);
  const nameEl=document.getElementById('m-name');
  const name=(nameEl&&nameEl.value.trim())||'Misión sin nombre';
  const affected=[];
  heroes.forEach(h=>{
    if(!missionHeroes.has(h.id))return;
    h.score=Math.max(0,Math.min(10000,h.score+total));
    if(!h.scoreLog)h.scoreLog=[];
    h.scoreLog.push({delta:total,note:name,date:today()});
    affected.push(h.alias);
  });
  saveHeroes(heroes).then(()=>renderAll());

  // ── show mission result card ──
  showMissionResult(name, total, affected);

  // ── full reset ──
  missionHeroes=new Set();
  missionSelections={};
  resetMissionForm();
}

function showMissionResult(name, delta, affected){
  const target=document.getElementById('page-misiones');
  if(!target) return;
  const div=document.createElement('div');
  div.id='mission-confirm-card';
  const dColor=delta>0?'var(--green)':delta<0?'var(--red)':'var(--muted)';
  div.style.cssText='background:var(--surface);border:1px solid rgba(0,200,255,0.25);border-radius:var(--radius-lg);padding:1.25rem;margin-bottom:1rem;animation:fadeUp 0.2s ease';
  div.innerHTML=`
    <div style="font-family:'Orbitron',sans-serif;font-size:10px;letter-spacing:1px;color:var(--accent);margin-bottom:8px">✓ MISIÓN APLICADA</div>
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-weight:600;font-size:15px">${name}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:3px">${affected.join(', ')}</div>
      </div>
      <div style="text-align:right">
        <div style="font-family:'Orbitron',sans-serif;font-size:30px;font-weight:900;color:${dColor}">${delta>=0?'+':''}${delta}</div>
        <div style="font-size:11px;color:var(--muted)">HeroIndex Score</div>
      </div>
    </div>`;
  const prev=document.getElementById('mission-confirm-card');
  if(prev) prev.remove();
  target.insertBefore(div, target.firstChild.nextSibling);
  setTimeout(()=>{const el=document.getElementById('mission-confirm-card');if(el)el.remove();},4000);
}

function resetMissionForm(){
  // clear factor selections visually
  Object.keys(FACTORS).forEach(key=>{
    FACTORS[key].opts.forEach((_,i)=>{
      const e=document.getElementById(`fopt-${key}-${i}`);
      if(e) e.className='fopt';
    });
  });
  // clear hero chips
  renderMissionChips();
  // clear name
  const nm=document.getElementById('m-name'); if(nm) nm.value='';
  // clear result panel
  const deltaEl=document.getElementById('m-delta'); if(deltaEl){deltaEl.textContent='—';deltaEl.style.color='var(--muted)';}
  const tagEl=document.getElementById('m-tag'); if(tagEl) tagEl.textContent='';
  const bd=document.getElementById('m-breakdown'); if(bd) bd.innerHTML='';
  const narr=document.getElementById('m-narrative'); if(narr) narr.style.display='none';
  const ta=document.getElementById('tension-alert'); if(ta) ta.style.display='none';
  const st=document.getElementById('m-status'); if(st) st.style.display='none';
  const btn=document.getElementById('m-apply-btn');
  if(btn){btn.textContent='Aplicar a héroes seleccionados →';btn.className='btn-primary';btn.disabled=true;}
}

// ── PROFILES ─────────────────────────────────────────────────
function renderProfiles(){
  const session = currentSession || { type:'public' };
  const sorted=[...heroes].sort((a,b)=>b.score-a.score);
const qEl=document.getElementById('profile-search');
  profileSearch=(qEl?.value||'').trim().toLowerCase();
  const filtered=sorted.filter(h=>{
    if(!profileSearch) return true;
    return [h.alias,h.corp,h.role].filter(Boolean).join(' ').toLowerCase().includes(profileSearch);
  });
  const pg=document.getElementById('profiles-grid'); if(!pg) return;
   pg.innerHTML=filtered.map(h=>{
    const av=avColor(h.alias);
    const canSeePrivate = canViewPrivateHero(session, h.id);
    const attrs=canSeePrivate?(h.attrs||{}):{};
    const health=calcHealth(attrs);
    const resolve=calcResolve(attrs);
    const hasAttrs=Object.values(attrs).some(v=>v>0);
    const miniAttrs=hasAttrs?`<div class="mini-attrs">${Object.entries(ATTR_LABELS).map(([key,label])=>{const v=attrs[key]||0;return `<div class="mini-attr"><div class="mini-attr-name">${label.slice(0,3).toUpperCase()}</div><div class="mini-attr-val" style="color:${v?attrColor(v):'var(--muted)'}">${v||'—'}</div></div>`;}).join('')}</div>
    <div style="display:flex;gap:8px;margin-bottom:8px;font-size:12px">
      <span>❤️ <strong style="color:var(--red)">${health}</strong></span>
      <span>🧠 <strong style="color:var(--accent)">${resolve}</strong></span>
    </div>`:'';
     const powersSnippet=canSeePrivate&&h.powers&&h.powers.length?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">${h.powers.slice(0,3).map(p=>`<span class="power-level ${p.level||'basic'}" style="font-size:9px">${p.name}</span>`).join('')}${h.powers.length>3?`<span style="font-size:11px;color:var(--muted)">+${h.powers.length-3} más</span>`:''}</div>`:'';
    const flags=session.type==='gm'&&h.flags&&h.flags.length?`<div class="gm-flag" style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)"><div class="flags-title">ORÁCULO — FLAGS</div>${h.flags.map(f=>`<div class="flag-item">${f}</div>`).join('')}</div>`:'';
    const real=session.type==='gm'&&h.realName?`<div class="profile-real gm-flag">Identidad: ${h.realName}</div>`:'';
    const risk=session.type==='gm'?`<div class="gm-flag" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><span style="font-size:11px;color:var(--muted)">Risk Index</span><span class="badge ${riskClass(h.risk)}">${riskLabel(h.risk)}</span></div>`:'';
    const klog=canSeePrivate&&h.karmaLog&&h.karmaLog.length?h.karmaLog.slice(-3).reverse().map(l=>`<div class="klog-row"><span>Sesión ${l.session} · ${l.date}</span><span style="color:${l.delta>=0?'var(--green)':'var(--red)'};font-family:'DM Mono',monospace">${l.delta>=0?'+':''}${l.delta}</span></div>`).join(''):'<span style="font-size:11px;color:var(--muted)">Perfil público protegido</span>';
    const pctS=Math.round((h.score/10000)*100),pctK=Math.min(100,h.karma*5);
    return `<div class="profile-card ${gmActive?'gm-card':''}" style="cursor:pointer" onclick="openHeroModal(${h.id})">
      <div class="profile-header">
        ${h.publicAvatar?`<img src="${h.publicAvatar}" alt="avatar" class="av-md" style="object-fit:cover;border:1px solid ${av.c}33">`:`<div class="av-md" style="background:${av.bg};color:${av.c};border:1px solid ${av.c}33">${initials(h.alias)}</div>`}
        <div><div class="profile-name">${h.alias}</div>${real}<div class="profile-corp">${h.corp||'—'}${h.country?' · '+getFlag(h.country)+' '+h.country:''}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
          <span class="badge ${h.type==='PC'?'badge-pc':'badge-npc'}">${h.type}</span>
          ${h.role?`<span class="role-badge" style="font-size:9px;padding:3px 8px">${h.role}</span>`:''}
        </div></div>
      </div>
      ${powersSnippet}
      ${hasAttrs?miniAttrs:''}
      ${cleanPublicText(h.publicStatus)?`<div style="font-size:11px;color:var(--accent);margin-bottom:8px">● ${cleanPublicText(h.publicStatus)}</div>`:''}
      ${cleanPublicText(h.publicSlogan)?`<div style="font-size:12px;color:var(--muted2);margin-bottom:8px">"${cleanPublicText(h.publicSlogan)}"</div>`:''}
      ${cleanPublicText(h.publicBio)?`<div style="font-size:11px;color:var(--muted);margin-bottom:8px">${cleanPublicText(h.publicBio)}</div>`:''}
      <div class="dbar-row"><span class="dbar-label">SCORE</span><div class="dbar"><div class="dbar-fill" style="width:${pctS}%;background:${scoreColor(h.score)}"></div></div><span class="dbar-val" style="color:${scoreColor(h.score)}">${h.score.toLocaleString('es-CL')}</span></div>
      ${canSeePrivate?`<div class="dbar-row"><span class="dbar-label">KARMA</span><div class="dbar"><div class="dbar-fill" style="width:${pctK}%;background:var(--green)"></div></div><span class="dbar-val" style="color:var(--green)">${h.karma}</span></div>`:''}
      ${risk}
      <div class="divider"></div>
      <div style="font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:1px;color:var(--muted);margin-bottom:6px">${canSeePrivate?'KARMA — ÚLTIMAS SESIONES':'VISTA PÚBLICA'}</div>
      ${klog}${flags}
      <div style="text-align:center;font-size:11px;color:var(--muted);margin-top:10px">Clic para ver ficha completa →</div>
    </div>`;
  }).join('')||'<p style="color:var(--muted)">Sin héroes registrados.</p>';
}

function renderMyProfile(){
  const session = currentSession || { type:'public' };
  const page=document.getElementById('page-miperfil');
  if(!page) return;
  if(session.type!=='hero'){
    page.innerHTML='<div class="page-header"><h1 class="page-title">MI PERFIL PÚBLICO</h1><p class="page-sub">Disponible solo para héroes.</p></div>';
    return;
  }
  const me=heroes.find(h=>h.id===session.heroId);
  if(!me) return;
  const slogan=document.getElementById('my-slogan');
  const bio=document.getElementById('my-bio');
  const pv=document.getElementById('my-avatar-preview');
  const identity=document.getElementById('my-profile-identity');
  if(slogan) slogan.value=me.publicSlogan||'';
  if(bio) bio.value=me.publicBio||'';
  if(pv) pv.innerHTML=me.publicAvatar?`<img src="${me.publicAvatar}" alt="avatar" style="width:100%;height:100%;object-fit:cover">`:'';
const rank=[...heroes].sort((a,b)=>b.score-a.score).findIndex(h=>h.id===me.id)+1;
  const ps=document.getElementById('my-profile-stats');
  if(ps) ps.innerHTML=`<div style="font-size:12px;color:var(--muted2)">Alias: <strong>${me.alias}</strong> · Rol: ${me.role||'—'} · Corp: ${me.corp||'—'}</div><div style="font-size:12px;color:var(--muted2);margin-top:4px">Score: <strong style="color:${scoreColor(me.score)}">${me.score.toLocaleString('es-CL')}</strong> · Ranking global: <strong>#${rank}</strong></div>`;
if(identity) identity.innerHTML=`<span class="badge badge-pc">✔ Verificado</span> <span style="font-size:12px;color:var(--muted2);margin-left:8px">ID público activo</span>`;
  const statusIn=document.getElementById('my-status');
  if(statusIn) statusIn.value=me.publicStatus||'';
  myProfileDraft = { slogan: me.publicSlogan||'', bio: me.publicBio||'', status: me.publicStatus||'' };
  bindMyProfileInputs();
  renderMyPublicPreview(me);
  const sl=document.getElementById('my-score-log');
  if(sl){
    const rows=(me.scoreLog||[]).slice(-5).reverse();
    sl.innerHTML=rows.length?rows.map(r=>`<div class="klog-row"><span>${r.date||'—'} · ${r.note||'Actualización'}</span><span style="color:${(r.delta||0)>=0?'var(--green)':'var(--red)'};font-family:'DM Mono',monospace">${(r.delta||0)>=0?'+':''}${r.delta||0}</span></div>`).join(''):'<span style="font-size:12px;color:var(--muted)">Sin movimientos recientes</span>';
  }
  const st=document.getElementById('my-profile-status');
  if(st) st.textContent = me.publicUpdatedAt ? `Última actualización: ${me.publicUpdatedAt}` : 'Aún no hay cambios guardados';
}
function bindMyProfileInputs(){
  const slogan=document.getElementById('my-slogan');
  const bio=document.getElementById('my-bio');
  const status=document.getElementById('my-status');
  if(slogan) slogan.oninput=onMyProfileInput;
  if(bio) bio.oninput=onMyProfileInput;
  if(status) status.oninput=onMyProfileInput;
  onMyProfileInput();
}
function onMyProfileInput(){
  const slogan=(document.getElementById('my-slogan')?.value||'').trim();
  const bio=(document.getElementById('my-bio')?.value||'').trim();
  const status=(document.getElementById('my-status')?.value||'').trim();
  const sc=document.getElementById('my-slogan-count');
  const bc=document.getElementById('my-bio-count');
  const stc=document.getElementById('my-status-count');
  if(sc) sc.textContent=`${slogan.length}/60`;
  if(bc) bc.textContent=`${bio.length}/180`;
  if(stc) stc.textContent=`${status.length}/80`;
  const dirty=!myProfileDraft || slogan!==myProfileDraft.slogan || bio!==myProfileDraft.bio || status!==myProfileDraft.status;
  const saveBtn=document.getElementById('my-save-btn');
  if(saveBtn) saveBtn.disabled=!dirty;
  const session=currentSession||{type:'public'};
  const me=heroes.find(h=>h.id===session.heroId);
  if(me) renderMyPublicPreview({...me,publicSlogan:slogan,publicBio:bio,publicStatus:status});
}
function renderMyPublicPreview(h){
  const el=document.getElementById('my-public-preview'); if(!el) return;
  const status=cleanPublicText(h.publicStatus||'');
  const slogan=cleanPublicText(h.publicSlogan||'');
  const bio=cleanPublicText(h.publicBio||'');
  el.innerHTML=`<div class="profile-card" style="margin:0">
    <div class="profile-header">${makeHeroAv(h,'md')}<div><div class="profile-name">${h.alias}</div><div class="profile-corp">${h.corp||'—'}${h.country?' · '+getFlag(h.country)+' '+h.country:''}</div></div></div>
   ${status?`<div style="font-size:11px;color:var(--accent);margin:6px 0">● ${status}</div>`:''}
    ${slogan?`<div style="font-size:12px;color:var(--muted2);margin:8px 0">"${slogan}"</div>`:''}
    ${bio?`<div style="font-size:11px;color:var(--muted)">${bio}</div>`:''}
  </div>`;
}

function saveMyPublicProfile(){
  const session = currentSession || { type:'public' };
  if(session.type!=='hero') return;
  const me=heroes.find(h=>h.id===session.heroId);
  if(!me) return;
  me.publicSlogan=cleanPublicText((document.getElementById('my-slogan')?.value||'').trim()).slice(0,60);
  me.publicBio=cleanPublicText((document.getElementById('my-bio')?.value||'').trim()).slice(0,180);
  me.publicStatus=cleanPublicText((document.getElementById('my-status')?.value||'').trim()).slice(0,80);
  me.publicUpdatedAt=today();
  saveHeroes(heroes).then(()=>{
    myProfileDraft = { slogan: me.publicSlogan||'', bio: me.publicBio||'', status: me.publicStatus||'' };
    renderProfiles();
    const st=document.getElementById('my-profile-status'); if(st) st.textContent=`Guardado ✓ · ${me.publicUpdatedAt}`;
    const saveBtn=document.getElementById('my-save-btn'); if(saveBtn) saveBtn.disabled=true;
    toast('Perfil público actualizado');
  });
}

function handleMyAvatarUpload(event){
  const session = currentSession || { type:'public' };
  if(session.type!=='hero') return;
  const file = event.target.files?.[0];
  if(!file) return;
  const allowed=['image/png','image/jpeg','image/webp'];
  if(!allowed.includes(file.type)){ toast('Formato no permitido (usa PNG, JPG o WEBP)'); return; }
  if(file.size > 1_000_000){ toast('Archivo muy pesado (máx 1MB)'); return; }
  const me=heroes.find(h=>h.id===session.heroId); if(!me) return;
  const reader=new FileReader();
  reader.onload=()=> {
    const img=new Image();
    img.onload=()=>{
      const c=document.createElement('canvas');
      const size=160; c.width=size; c.height=size;
      const ctx=c.getContext('2d');
      const srcW=img.width, srcH=img.height;
      const side=Math.min(srcW,srcH);
      const sx=Math.floor((srcW-side)/2);
      const sy=Math.floor((srcH-side)/2);
      ctx.drawImage(img,sx,sy,side,side,0,0,size,size);
      const data=c.toDataURL('image/jpeg',0.72);
      if(data.length>170000){ toast('Imagen excede tamaño recomendado'); return; }
      me.publicAvatar=data;
      me.publicUpdatedAt=today();
      saveHeroes(heroes).then(()=>{ renderMyProfile(); renderProfiles(); renderRanking(); renderHome(); toast('Foto pública actualizada'); });
    };
    img.src=reader.result;
  };
  reader.readAsDataURL(file);
}
function removeMyAvatar(){
  const session = currentSession || { type:'public' };
  if(session.type!=='hero') return;
  const me=heroes.find(h=>h.id===session.heroId); if(!me) return;
  me.publicAvatar='';
  me.publicUpdatedAt=today();
  saveHeroes(heroes).then(()=>{ renderMyProfile(); renderProfiles(); renderRanking(); toast('Foto eliminada'); });
}

// ── NEWS UI ───────────────────────────────────────────────────

function setNewsSource(src, btn){
  newsSource=src;
  document.querySelectorAll('.ctab').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active',src==='heroindex'?'hi':src==='corp'?'corp':'oracle');
  const corpField=document.getElementById('news-corp-field');
  if(corpField) corpField.style.display=src==='corp'?'block':'none';
  const catSel=document.getElementById('news-category');
  if(catSel&&src==='oracle') catSel.value='clasificado';
}

function setNewsTab(tab, btn){
  newsTab=tab;
  document.querySelectorAll('.ntab').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderNewsFeed();
}

function publishNews(){
  const session = currentSession || { type:'public' };
  if(!canManageNews(session)){ toast('Solo GM puede publicar noticias'); return; }
  const headline=document.getElementById('news-headline')?.value.trim();
  const body=document.getElementById('news-body')?.value.trim();
  const category=document.getElementById('news-category')?.value||'comunicado';
  const corp=newsSource==='corp'?(document.getElementById('news-corp-select')?.value||''):'';
  if(!headline){toast('El titular es obligatorio');return;}
  loadNews().then(currentNews=>{
    currentNews.unshift({
      id:Date.now(), source:newsSource, category, headline,
      body:body||'', corp, date:today(), visibility: newsSource==='oracle'?'gm':'public'
    });
    saveNews(currentNews).then(()=>{
      clearNewsForm();
      renderNewsFeed();
      renderHome();
      toast('Noticia publicada');
    });
  });
}

function clearNewsForm(){
  const h=document.getElementById('news-headline'); if(h) h.value='';
  const b=document.getElementById('news-body');     if(b) b.value='';
}

function deleteNews(id){
  const session = currentSession || { type:'public' };
  if(!canManageNews(session)){ toast('Solo GM puede eliminar noticias'); return; }
  loadNews().then(currentNews=>{
    const news=currentNews.filter(n=>n.id!==id);
    saveNews(news).then(()=>{ renderNewsFeed(); renderHome(); toast('Noticia eliminada'); });
  });
}

const CAT_CLASSES={comunicado:'cat-comunicado',operacion:'cat-operacion',cobertura:'cat-cobertura',rumor:'cat-rumor',clasificado:'cat-clasificado'};
const CAT_LABELS={comunicado:'Comunicado',operacion:'Operación',cobertura:'Cobertura mediática',rumor:'Rumor',clasificado:'CLASIFICADO'};
const SOURCE_LABELS={heroindex:'HEROINDEX INTL.',corp:'CORPORACIÓN',oracle:'ORÁCULO'};

function renderNewsItem(n, showDelete=false){
  const session = currentSession || { type:'public' };
  const deleteBtn=showDelete&&session.type==='gm'?`<button onclick="deleteNews(${n.id})" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;padding:4px;margin-top:4px">✕ eliminar</button>`:'';
  return `<div class="news-item source-${n.source}">
    <div class="news-meta">
      <span class="news-source ${n.source}">${SOURCE_LABELS[n.source]||n.source.toUpperCase()}</span>
      <span class="news-category ${CAT_CLASSES[n.category]||'cat-comunicado'}">${CAT_LABELS[n.category]||n.category}</span>
      ${n.corp?`<span class="news-corp-tag">${getCorpIcon(n.corp)} ${n.corp}</span>`:''}
      <span class="news-date">${n.date}</span>
    </div>
    <div class="news-headline">${n.headline}</div>
    ${n.body?`<div class="news-body">${n.body}</div>`:''}
    ${deleteBtn}
  </div>`;
}

function renderNewsFeed(){
  const session = currentSession || { type:'public' };
  const feed=document.getElementById('news-feed');
  if(!feed) return;
  feed.innerHTML='<div class="news-empty" style="color:var(--muted)">Cargando...</div>';
  loadNews().then(all=>{
     const visible = getNewsVisibilityByRole(session);
    const base = all.map(normalizeNewsItem).filter(n=>visible.includes(n.visibility));
    let filtered=base;
    if(newsTab==='heroindex') filtered=base.filter(n=>n.source==='heroindex');
    else if(newsTab==='corp')  filtered=base.filter(n=>n.source==='corp');
    else if(newsTab==='oracle') filtered=base.filter(n=>n.source==='oracle');
    else filtered=base;
    feed.innerHTML=filtered.length
      ?filtered.map(n=>renderNewsItem(n,true)).join('')
      :'<div class="news-empty">Sin noticias en esta categoría.</div>';
  });
}

// ── GM — POWERS FORM ─────────────────────────────────────────
function addPowerField(){
  const list=document.getElementById('powers-form-list'); if(!list) return;
  const idx=powerFieldCount++;
  const div=document.createElement('div');
  div.id=`pf-${idx}`;
  div.style.cssText='display:flex;gap:8px;align-items:flex-start;margin-bottom:8px;flex-wrap:wrap';
  div.innerHTML=`
    <select id="pl-${idx}" style="width:110px"><option value="basic">Basic</option><option value="major">Major</option><option value="massive">Massive</option></select>
    <input type="text" id="pn-${idx}" placeholder="Nombre del poder" style="flex:1;min-width:120px">
    <input type="text" id="pd-${idx}" placeholder="Descripción breve" style="flex:2;min-width:160px">
    <button class="btn-danger" onclick="document.getElementById('pf-${idx}').remove()">✕</button>`;
  list.appendChild(div);
}

function collectPowers(){
  const powers=[];
  document.querySelectorAll('[id^="pf-"]').forEach(div=>{
    const idx=div.id.split('-')[1];
    const name=document.getElementById(`pn-${idx}`)?.value.trim();
    if(!name) return;
    powers.push({name,level:document.getElementById(`pl-${idx}`)?.value||'basic',desc:document.getElementById(`pd-${idx}`)?.value.trim()||''});
  });
  return powers;
}

// ── GM — ADD HERO ────────────────────────────────────────────
function addHero(){
  const aliasEl=document.getElementById('n-alias');
  const alias=aliasEl&&aliasEl.value.trim();
  if(!alias){toast('El alias es obligatorio');return;}
  const score=Math.max(0,Math.min(10000,parseInt(document.getElementById('n-score')?.value)||1000));
  const flags=(document.getElementById('n-flags')?.value.trim()||'').split(';').map(f=>f.trim()).filter(Boolean);
  const talents=(document.getElementById('n-talents')?.value.trim()||'').split(';').map(t=>t.trim()).filter(Boolean);
  const drawbacks=(document.getElementById('n-drawbacks')?.value.trim()||'').split(';').map(d=>d.trim()).filter(Boolean);
  const relsRaw=(document.getElementById('n-relationships')?.value.trim()||'').split(';').map(r=>r.trim()).filter(Boolean);
  const relationships=relsRaw.map(r=>{const[name,...rest]=r.split(':');return{name:name.trim(),type:rest.join(':').trim()||'Relación'};});
  const get=id=>document.getElementById(id)?.value.trim()||'';
  const country=get('n-country');
  const attrs={
    fighting:parseInt(get('a-fighting'))||0,agility:parseInt(get('a-agility'))||0,
    strength:parseInt(get('a-strength'))||0,reason:parseInt(get('a-reason'))||0,
    intuition:parseInt(get('a-intuition'))||0,presence:parseInt(get('a-presence'))||0,
  };
  heroes.push({id:Date.now(),alias,realName:get('n-real'),corp:get('n-corp'),type:get('n-type')||'PC',role:get('n-role'),country,score,karma:0,risk:get('n-risk')||'low',occupation:get('n-occupation'),attrs,powers:collectPowers(),talents,drawbacks,relationships,personality:get('n-personality'),publicSlogan:'',publicBio:'',publicStatus:'',publicAvatar:'',flags,karmaLog:[],scoreLog:[{delta:0,note:'Registro inicial',date:today()}]});
  saveHeroes(heroes).then(()=>{renderAll();clearGMForm();toast(`${alias} registrado`);renderGMList();});
}

function clearGMForm(){
  ['n-alias','n-real','n-corp','n-score','n-occupation','n-talents','n-drawbacks','n-relationships','n-personality','n-flags','a-fighting','a-agility','a-strength','a-reason','a-intuition','a-presence'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  document.getElementById('n-type').value='PC';
  const nc=document.getElementById('n-country'); if(nc) nc.value='';
  document.getElementById('n-risk').value='low';
  document.getElementById('n-role').value='';
  const pl=document.getElementById('powers-form-list'); if(pl) pl.innerHTML='';
  powerFieldCount=0;
}

// ── CSV IMPORT ────────────────────────────────────────────────
const CSV_COLS=['alias','realName','corp','country','type','role','score','risk','occupation',
  'publicSlogan','publicStatus','publicBio','publicAvatar',
  'fighting','agility','strength','reason','intuition','presence',
  'powers','talents','drawbacks','relationships','personality','flags'];

function csvEscape(value=''){
  const str=String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g,'""')}"` : str;
}

function rowsToCSV(rows){
  return [CSV_COLS.map(csvEscape).join(','), ...rows.map(row=>CSV_COLS.map(col=>csvEscape(row[col]||'')).join(','))].join('\n');
}


function downloadCSVFile(filename, rows){
  const blob=new Blob([rowsToCSV(rows)],{type:'text/csv;charset=utf-8'});
  const u=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=u;a.download=filename;a.click();URL.revokeObjectURL(u);
}

function downloadTemplate(){
  downloadCSVFile('heroindex-plantilla.csv', [{
    alias:'Eclipse', realName:'Clara Vega', corp:'Aurora Corporation', country:'Chile', type:'NPC', role:'Blaster', score:'4500', risk:'med', occupation:'Detective',
    publicSlogan:'La luz siempre encuentra una grieta.', publicStatus:'Investigando actividad nocturna en Santiago.', publicBio:'Heroína urbana asociada a investigaciones de alto perfil y rescates mediáticos.', publicAvatar:'',
    fighting:'6', agility:'8', strength:'5', reason:'7', intuition:'9', presence:'6',
    powers:'Proyección de luz MAJOR:Dispara rayos de energía;Vuelo BASIC:Velocidad media',
    talents:'Investigación;Armas de fuego', drawbacks:'Miedo a la oscuridad;Identidad semi-conocida', relationships:'Cóndor:mentor;Familia Vega:familia',
    personality:'Personalidad: observadora\nImpulso: buscar la verdad\nFalla: desconfía de la autoridad', flags:'Contacto con mercado negro;Bajo vigilancia nivel 1'
  }]);
}

function downloadStarterRosterTemplate(){
  downloadCSVFile('heroindex-starter-roster.csv', [
    {alias:'Violet Lightbeam',realName:'',corp:'Nexus Technologies',country:'Estados Unidos',type:'NPC',role:'Striker',score:'7100',risk:'med',occupation:'Speedster mediática',publicSlogan:'Más rápida que el rumor.',publicStatus:'En gira promocional con FanFeed.',publicBio:'Speedster emergente con alto engagement juvenil y contratos de streaming.',publicAvatar:'',fighting:'7',agility:'11',strength:'5',reason:'6',intuition:'8',presence:'9',powers:'Supervelocidad MASSIVE:Desplazamiento hipersónico;Reflejos MAJOR:Reacción sobrehumana',talents:'Acrobacia;Relaciones públicas',drawbacks:'Impulsiva;Dependencia de aprobación pública',relationships:'FanFeed:aliado mediático;Nexus Technologies:patrocinador',personality:'Personalidad: carismática\nImpulso: demostrar que merece la fama\nFalla: no sabe detenerse',flags:'Picos de estrés antes de cámaras'},
    {alias:'Atlas Prime',realName:'',corp:'Valkyr Industries',country:'Estados Unidos',type:'NPC',role:'Brawn',score:'8600',risk:'high',occupation:'Héroe franquicia',publicSlogan:'Si cae el cielo, yo lo sostengo.',publicStatus:'Entrenamiento abierto patrocinado por VOLT.',publicBio:'Ícono de fuerza corporativa y campañas deportivas internacionales.',publicAvatar:'',fighting:'9',agility:'6',strength:'12',reason:'5',intuition:'6',presence:'10',powers:'Superfuerza MASSIVE:Clase titánica;Invulnerabilidad MAJOR:Resiste artillería pesada',talents:'Atletismo;Intimidación;Marketing deportivo',drawbacks:'Orgullo;Daño colateral recurrente',relationships:'Valkyr Industries:empleador;HeroInsure:sponsor',personality:'Personalidad: competitivo\nImpulso: ganar siempre\nFalla: confunde fuerza con liderazgo',flags:'Incidentes de colateral maquillados'},
    {alias:'Mirage',realName:'',corp:'Independiente',country:'México',type:'PC',role:'Controller',score:'3900',risk:'low',occupation:'Ilusionista de rescate',publicSlogan:'No todo lo imposible es mentira.',publicStatus:'Aceptando colaboraciones de rescate urbano.',publicBio:'Heroína independiente especializada en evacuación, distracción táctica y rescates de bajo daño.',publicAvatar:'',fighting:'5',agility:'7',strength:'4',reason:'8',intuition:'9',presence:'8',powers:'Ilusiones MAJOR:Proyecta imágenes realistas;Invisibilidad BASIC:Ocultamiento temporal',talents:'Engaño;Teatro;Primeros auxilios',drawbacks:'Recursos limitados;Desconfianza corporativa',relationships:'Comunidad local:protectorado',personality:'Personalidad: empática\nImpulso: proteger sin venderse\nFalla: evita pedir ayuda',flags:'Sin contrato corporativo'}
  ]);
}

function handleCSV(input){
  const file=input.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const parsed=parseCSVText(e.target.result);
      if(parsed.length<2){toast('El CSV debe tener al menos una fila de datos');return;}
      const headers=parsed[0].map(h=>h.trim());
      const rows=parsed.slice(1).filter(vals=>vals.some(v=>String(v||'').trim())).map(vals=>{
        const obj={};
        headers.forEach((h,i)=>obj[h]=(vals[i]||'').trim());
        return obj;
      });
      csvPending=rows.map(parseCSVRow).filter(Boolean);
      if(!csvPending.length){toast('No se encontraron héroes válidos en el CSV');return;}
      showCSVPreview(csvPending);
    }catch(err){toast('Error al leer el CSV: '+err.message);}
  };
  reader.readAsText(file);
}

function parseCSVText(text=''){
  const rows=[]; let row=[]; let cur=''; let quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='"'){
      if(quoted && text[i+1]==='"'){ cur+='"'; i++; }
      else quoted=!quoted;
    }else if(ch===',' && !quoted){
      row.push(cur); cur='';
    }else if((ch==='\n' || ch==='\r') && !quoted){
      if(ch==='\r' && text[i+1]==='\n') i++;
      row.push(cur); cur='';
      if(row.some(v=>String(v||'').trim())) rows.push(row);
      row=[];
    }else cur+=ch;
  }
  row.push(cur);
  if(row.some(v=>String(v||'').trim())) rows.push(row);
  return rows;
}

function parseCSVRow(row){
  if(!row.alias) return null;
  const typeRaw=String(row.type||'NPC').trim().toUpperCase();
  const riskRaw=String(row.risk||'low').trim().toLowerCase();
  const attrs={
    fighting:parseInt(row.fighting)||0,agility:parseInt(row.agility)||0,
    strength:parseInt(row.strength)||0,reason:parseInt(row.reason)||0,
    intuition:parseInt(row.intuition)||0,presence:parseInt(row.presence)||0,
  };
  const powers=(row.powers||'').split(';').map(p=>{
    p=p.trim(); if(!p) return null;
    const[nameLevel,...descParts]=p.split(':');
    const parts=nameLevel.trim().split(' ');
    const levelRaw=parts[parts.length-1].toLowerCase();
    const levels=['basic','major','massive'];
    const level=levels.includes(levelRaw)?levelRaw:'basic';
    const name=levels.includes(levelRaw)?parts.slice(0,-1).join(' '):parts.join(' ');
    return{name:name.trim(),level,desc:descParts.join(':').trim()};
  }).filter(Boolean);
  const talents=(row.talents||'').split(';').map(t=>t.trim()).filter(Boolean);
  const drawbacks=(row.drawbacks||'').split(';').map(d=>d.trim()).filter(Boolean);
  const relsRaw=(row.relationships||'').split(';').map(r=>r.trim()).filter(Boolean);
  const relationships=relsRaw.map(r=>{const[name,...rest]=r.split(':');return{name:name.trim(),type:rest.join(':').trim()||'Relación'};});
  const flags=(row.flags||'').split(';').map(f=>f.trim()).filter(Boolean);
  return{
    id:Date.now()+Math.random(),
    alias:row.alias,realName:row.realName||'',corp:row.corp||'',country:row.country||'',
    type:typeRaw==='PC'?'PC':'NPC',
    role:row.role||'',
    score:Math.max(0,Math.min(10000,parseInt(String(row.score||'').replace(/[^0-9-]/g,''))||1000)),
    karma:0,risk:['low','med','high','critical'].includes(riskRaw)?riskRaw:'low',
    occupation:row.occupation||'',
    attrs,powers,talents,drawbacks,relationships,
    personality:(row.personality||'').replace(/\\n/g,'\n'),
    publicSlogan:row.publicSlogan||'',publicBio:row.publicBio||'',publicStatus:row.publicStatus||'',publicAvatar:row.publicAvatar||'',flags,karmaLog:[],
    scoreLog:[{delta:0,note:'Importado CSV',date:today()}]
  };
}

function showCSVPreview(rows){
  document.getElementById('csv-count').textContent=`${rows.length} héroe(s) listos para importar`;
  const previewCols=['alias','type','role','score','risk','fighting','agility','strength','reason','intuition','presence'];
  const table=document.getElementById('csv-table');
  table.innerHTML=`<thead><tr>${previewCols.map(c=>`<th>${c.toUpperCase()}</th>`).join('')}</tr></thead><tbody>${rows.map(h=>`<tr>${previewCols.map(c=>{const val=c==='score'?h[c].toLocaleString('es-CL'):(h.attrs&&h.attrs[c]!==undefined?h.attrs[c]:h[c])||'—';return `<td>${val}</td>`;}).join('')}</tr>`).join('')}</tbody>`;
  document.getElementById('csv-preview').style.display='block';
}

function confirmCSV(){
  if(!csvPending.length) return;
  heroes.push(...csvPending);
  saveHeroes(heroes).then(()=>{
  toast(`${csvPending.length} héroe(s) importados`);
  csvPending=[];
  document.getElementById('csv-preview').style.display='none';
  renderAll();renderGMList();
  });
}

function cancelCSV(){
  csvPending=[];
  document.getElementById('csv-preview').style.display='none';
}

// ── GM LIST ───────────────────────────────────────────────────
function removeHero(id){
  const h=heroes.find(h=>h.id===id);if(!h)return;
  if(!confirm(`¿Eliminar a ${h.alias}?`))return;
  heroes=heroes.filter(h=>h.id!==id);saveHeroes(heroes).then(()=>{renderAll();renderGMList();toast(`${h.alias} eliminado`);});
}

function updateScore(id){
  const h=heroes.find(h=>h.id===id);if(!h)return;
  const dEl=document.getElementById(`sd-${id}`);
  const nEl=document.getElementById(`sn-${id}`);
  const rEl=document.getElementById(`sr-${id}`);
  const d=parseInt(dEl?.value)||0;
  const note=nEl?.value.trim()||'Ajuste manual';
  const newRisk=rEl?.value;
  if(d!==0){
    h.score=Math.max(0,Math.min(10000,h.score+d));
    if(!h.scoreLog)h.scoreLog=[];
    h.scoreLog.push({delta:d,note,date:today()});
  }
  if(newRisk) h.risk=newRisk;
  saveHeroes(heroes).then(()=>{ renderAll(); renderGMList();
  // clear fields after re-render
  const dEl2=document.getElementById(`sd-${id}`); if(dEl2) dEl2.value='';
  const nEl2=document.getElementById(`sn-${id}`); if(nEl2) nEl2.value='';
  toast(`${h.alias} · Score: ${h.score.toLocaleString('es-CL')} · Risk: ${riskLabel(h.risk)}`); });
}

function renderGMList(){
  const sorted=[...heroes].sort((a,b)=>b.score-a.score);
  const gl=document.getElementById('gm-list');if(!gl)return;
  gl.innerHTML=sorted.map(h=>`<div class="gm-hero-row">
    <div class="gm-hero-top">
      <div style="display:flex;align-items:center;gap:10px">${makeAv(h.alias)}
        <div>
          <span style="font-weight:600">${h.alias}</span>
          <span class="badge ${h.type==='PC'?'badge-pc':'badge-npc'}" style="margin-left:6px">${h.type}</span>
          ${h.role?`<span class="role-badge" style="font-size:9px;padding:2px 8px;margin-left:4px">${h.role}</span>`:''}
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn-sec" style="font-size:11px;padding:5px 10px" onclick="openHeroModal(${h.id})">Ver ficha</button>
        <button class="btn-danger" onclick="removeHero(${h.id})">✕</button>
      </div>
    </div>
    <div class="gm-metrics">
      <div class="gm-metric"><div class="gm-metric-label">SCORE</div><div class="gm-metric-val" style="color:${scoreColor(h.score)}">${h.score.toLocaleString('es-CL')}</div></div>
      <div class="gm-metric"><div class="gm-metric-label">KARMA</div><div class="gm-metric-val" style="color:var(--green)">${h.karma}</div></div>
      <div class="gm-metric"><div class="gm-metric-label">RISK</div><div style="margin-top:6px"><span class="badge ${riskClass(h.risk)}">${riskLabel(h.risk)}</span></div></div>
    </div>
    <div class="gm-edit-row">
      <input type="number" id="sd-${h.id}" placeholder="Delta score" style="width:120px">
      <input type="text" id="sn-${h.id}" placeholder="Motivo" style="flex:1;min-width:100px">
      <select id="sr-${h.id}" style="width:130px">
        <option value="low" ${h.risk==='low'?'selected':''}>Risk: Bajo</option>
        <option value="med" ${h.risk==='med'?'selected':''}>Moderado</option>
        <option value="high" ${h.risk==='high'?'selected':''}>Alto</option>
        <option value="critical" ${h.risk==='critical'?'selected':''}>Crítico</option>
      </select>
      <button class="btn-sec" onclick="updateScore(${h.id})">OK</button>
    </div>
  </div>`).join('')||'<p style="color:var(--muted);font-size:13px">Sin héroes aún.</p>';
}

function doExport(){exportData(heroes);}
function handleImport(input){importData(input.files[0],data=>{heroes=data;saveHeroes(heroes).then(()=>{renderAll();renderGMList();toast('Datos importados correctamente');});});}

// ── INIT — llamado por auth.js después del login ──────────────
function initHeroIndex(){
// Apply role-based chrome from auth session (GM/hero/public)
if(currentSession?.type==='gm'){
  document.body.classList.add('gm-active');
  const dotEl=document.getElementById('gm-dot');if(dotEl) dotEl.classList.add('show');
}else{
  document.body.classList.remove('gm-active');
  const dotEl=document.getElementById('gm-dot');if(dotEl) dotEl.classList.remove('show');
}

// Show loading overlay
const appEl=document.getElementById('app');
if(appEl) appEl.style.opacity='0.3';

// Load from Firebase then render
loadHeroes().then(h=>{
  heroes=h;
  renderAll();
  if(appEl) appEl.style.opacity='1';

  // Real-time listeners
  onHeroesChange(updated=>{
    heroes=updated;
    renderAll();
  });
  onNewsChange(()=>{
    renderHome();
    const np=document.getElementById('page-noticias');
    if(np&&np.classList.contains('active')) renderNewsFeed();
   });
});
}
initLogin();

function renderHomeClips(heroList=heroes){
  const rail=document.getElementById('home-clips');
  if(!rail) return;
  const clips=(typeof getHomeClips==='function'?getHomeClips(heroList):[]);
  rail.innerHTML=clips.map(c=>`<div class="clip-card"><div class="clip-thumb" style="background:${c.bg}"><span>▶</span></div><div class="clip-title">${c.title}</div><div class="clip-meta">${c.meta}</div></div>`).join('');
}
