// ── AUTH SYSTEM ───────────────────────────────────────────────
// Gestiona sesiones: GM, héroe con código, o invitado público

const GM_PASSWORD = 'oraculo2049'; // Cámbialo por el que quieras

let currentSession = null;
// currentSession = { type: 'gm' }
// currentSession = { type: 'hero', heroId: 123, alias: 'Eclipse' }
// currentSession = { type: 'public' }

// ── INIT LOGIN ────────────────────────────────────────────────
function initLogin() {
  // Check if session saved in sessionStorage (persists while tab is open)
  const saved = sessionStorage.getItem('heroindex-session');
  if (saved) {
    try {
      currentSession = JSON.parse(saved);
      startApp();
      return;
    } catch(e) {}
  }
  // Show login screen
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

function saveSession(session) {
  currentSession = session;
  sessionStorage.setItem('heroindex-session', JSON.stringify(session));
}

function startApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  applySession();
  // Trigger app init
  initHeroIndex();
}

// ── APPLY SESSION — what the user sees ───────────────────────
function applySession() {
  if (!currentSession) return;

  if (currentSession.type === 'gm') {
    document.body.classList.add('gm-active');
    const dot = document.getElementById('gm-dot');
    if (dot) dot.classList.add('show');
    updateSessionBadge('⬡ GM', '#ff4444');
  } else {
    // Heroes and public NEVER get GM mode
    document.body.classList.remove('gm-active');
    // Hide the GM toggle completely
    const toggleDesk = document.getElementById('gm-toggle-desk');
    if (toggleDesk) toggleDesk.closest('.gm-toggle-row').style.display = 'none';
    const notifBtn = document.querySelector('.notif-btn');
    if (notifBtn) notifBtn.style.display = 'none';
    if (currentSession.type === 'hero') {
      updateSessionBadge(currentSession.alias, null);
    } else {
      updateSessionBadge('Invitado', null);
    }
  }
  // Hide nav items based on role
  if (currentSession.type !== 'gm') {
    document.querySelectorAll('[data-page="gm"]').forEach(el => el.style.display = 'none');
  }
  if (currentSession.type === 'public') {
    document.querySelectorAll('[data-page="karma"],[data-page="misiones"],[data-page="perfil"]')
      .forEach(el => el.style.display = 'none');
}

function updateSessionBadge(label, color) {
  const topbarRight = document.querySelector('.topbar-right');
  if (!topbarRight) return;
  const existing = topbarRight.querySelector('.session-badge');
  if (existing) existing.remove();

  const badge = document.createElement('div');
  badge.className = 'session-badge';
  badge.style.cursor = 'pointer';
  badge.title = 'Cerrar sesión';
  badge.onclick = logout;
  badge.innerHTML = `<span style="color:${color||'var(--muted2)'};">${label}</span>`;
  topbarRight.insertBefore(badge, topbarRight.firstChild);
}

function logout() {
  if (!confirm('¿Cerrar sesión?')) return;
  sessionStorage.removeItem('heroindex-session');
  currentSession = null;
  location.reload();
}

// ── LOGIN STEPS ───────────────────────────────────────────────
function loginStep(step) {
  document.querySelectorAll('.login-step').forEach(el => el.style.display = 'none');
  document.getElementById('login-step-' + step).style.display = 'flex';
  clearLoginMsgs();
}

function clearLoginMsgs() {
  document.querySelectorAll('.login-msg').forEach(el => { el.textContent = ''; el.className = 'login-msg'; });
}

function setMsg(id, text, type) {
  const el = document.getElementById(id);
  if (el) { el.textContent = text; el.className = 'login-msg ' + type; }
}

// ── HERO LOGIN FLOW ───────────────────────────────────────────
let pendingHero = null; // hero object while creating code

function checkHeroAlias() {
  const alias = document.getElementById('login-alias').value.trim();
  if (!alias) { setMsg('login-alias-msg', 'Ingresa tu alias', 'error'); return; }

  setMsg('login-alias-msg', 'Buscando...', '');

  loadHeroes().then(heroes => {
    const hero = heroes.find(h => h.alias.toLowerCase() === alias.toLowerCase());
    if (!hero) {
      setMsg('login-alias-msg', 'Alias no encontrado. Pídele al GM que te registre.', 'error');
      return;
    }
    pendingHero = hero;

    if (!hero.accessCode) {
      // First time — create code
      document.getElementById('login-hero-name-display').textContent = hero.alias;
      loginStep('create-code');
    } else {
      // Already has code — enter it
      document.getElementById('login-hero-name-display2').textContent = hero.alias;
      loginStep('enter-code');
    }
  });
}

function createHeroCode() {
  const code = document.getElementById('login-new-code').value.trim().toLowerCase();
  if (code.length < 6) { setMsg('login-code-msg', 'Mínimo 6 caracteres', 'error'); return; }
  if (!/^[a-z0-9\-]+$/.test(code)) { setMsg('login-code-msg', 'Solo letras, números y guiones', 'error'); return; }

  setMsg('login-code-msg', 'Registrando...', '');

  // Check code not already taken
  loadHeroes().then(heroes => {
    const taken = heroes.find(h => h.accessCode === code);
    if (taken) { setMsg('login-code-msg', 'Ese código ya está en uso, elige otro', 'error'); return; }

    // Assign code to hero
    const idx = heroes.findIndex(h => h.id === pendingHero.id);
    if (idx === -1) { setMsg('login-code-msg', 'Error al guardar, intenta de nuevo', 'error'); return; }
    heroes[idx].accessCode = code;

    saveHeroes(heroes).then(() => {
      setMsg('login-code-msg', '¡Código registrado!', 'success');
      setTimeout(() => {
        saveSession({ type: 'hero', heroId: pendingHero.id, alias: pendingHero.alias });
        startApp();
      }, 800);
    });
  });
}

function enterHeroCode() {
  const code = document.getElementById('login-code').value.trim().toLowerCase();
  if (!code) { setMsg('login-enter-msg', 'Ingresa tu código', 'error'); return; }
  if (!pendingHero) { loginStep('hero'); return; }

  if (code === pendingHero.accessCode) {
    setMsg('login-enter-msg', '¡Acceso concedido!', 'success');
    setTimeout(() => {
      saveSession({ type: 'hero', heroId: pendingHero.id, alias: pendingHero.alias });
      startApp();
    }, 600);
  } else {
    setMsg('login-enter-msg', 'Código incorrecto', 'error');
  }
}

// ── GM LOGIN ──────────────────────────────────────────────────
function enterGM() {
  const pass = document.getElementById('login-gm-pass').value;
  if (pass === GM_PASSWORD) {
    setMsg('login-gm-msg', 'Acceso concedido', 'success');
    setTimeout(() => {
      saveSession({ type: 'gm' });
      startApp();
    }, 600);
  } else {
    setMsg('login-gm-msg', 'Contraseña incorrecta', 'error');
  }
}

// ── PUBLIC ACCESS ─────────────────────────────────────────────
// triggered by "Continuar como invitado" button which calls loginStep('public')
// but we need it to actually start the app
document.addEventListener('DOMContentLoaded', () => {
  // Override the public button to start app directly
  const btn = document.querySelector('[onclick="loginStep(\'public\')"]');
  if (btn) btn.onclick = () => {
    saveSession({ type: 'public' });
    startApp();
  };
  };
});
