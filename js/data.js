const STORAGE_KEY = 'heroindex-v7';

function defaultHeroes() {
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

function loadHeroes() {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch(e) {}
  const d = defaultHeroes(); saveHeroes(d); return d;
}
function saveHeroes(h) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(h)); } catch(e) { console.error(e); } }

function exportData(heroes) {
  const b = new Blob([JSON.stringify(heroes, null, 2)], { type: 'application/json' });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u; a.download = `heroindex-${new Date().toLocaleDateString('es-CL').replace(/\//g,'-')}.json`;
  a.click(); URL.revokeObjectURL(u);
}
function importData(file, cb) {
  const r = new FileReader();
  r.onload = e => { try { const d = JSON.parse(e.target.result); if (Array.isArray(d)) cb(d); else alert('Archivo inválido.'); } catch { alert('Error al leer el archivo.'); } };
  r.readAsText(file);
}
