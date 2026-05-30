// ── AUTH SYSTEM ───────────────────────────────────────────────
// Gestiona sesiones: GM, héroe con código, o invitado público

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
function setGMChrome(isGM, active = false) {
  const shouldShowGM = !!isGM;
  const shouldActivateGM = shouldShowGM && !!active;
  if (typeof gmActive !== 'undefined') gmActive = shouldActivateGM;
  document.body.classList.toggle('gm-active', shouldActivateGM);

  const deskToggle = document.getElementById('gm-toggle-desk');
  const mobileToggle = document.getElementById('gm-toggle-mobile');
  [deskToggle, mobileToggle].forEach(toggle => {
    if (!toggle) return;
    toggle.checked = shouldActivateGM;
    toggle.disabled = !shouldShowGM;
  });

  const deskRow = deskToggle?.closest('.gm-toggle-row');
  if (deskRow) deskRow.style.display = shouldShowGM ? '' : 'none';
  const modalRow = mobileToggle?.closest('.modal-toggle-row');
  if (modalRow) modalRow.style.display = shouldShowGM ? '' : 'none';

  const dot = document.getElementById('gm-dot');
  if (dot) dot.classList.toggle('show', shouldActivateGM);
  const notifBtn = document.querySelector('.notif-btn');
  if (notifBtn) notifBtn.style.display = shouldShowGM ? '' : 'none';
}

function applySession() {
  if (!currentSession) return;
  const isGM = currentSession.type === 'gm';
  setGMChrome(isGM, isGM);
  if (isGM) {
    updateSessionBadge('⬡ GM', '#ff4444');
    } else if (currentSession.type === 'hero') {
    updateSessionBadge(currentSession.alias, null);
  } else {
    updateSessionBadge('Público', null);
  }
  // Hide nav items based on role
  if (currentSession.type !== 'gm') {
    document.querySelectorAll('[data-page="gm"]').forEach(el => el.style.display = 'none');
    document.querySelectorAll('[data-page="karma"],[data-page="misiones"]')
      .forEach(el => el.style.display = 'none');
  }
  if (currentSession.type !== 'hero') {
    document.querySelectorAll('[data-page="miperfil"]').forEach(el => el.style.display = 'none');
  }
}
function updateSessionBadge(label, color) {
  const safeLabel = label || 'Invitado';
  const sessionColor = color || 'var(--text)';
  const desk = document.getElementById('session-label-desktop');
  const mobile = document.getElementById('session-label-mobile');
  if (desk) {
    desk.textContent = safeLabel;
    desk.style.color = sessionColor;
  }
  if (mobile) {
    mobile.textContent = safeLabel;
    mobile.style.color = sessionColor;
  }
}
  
function switchProfile() {
  logout(false);
}

function logout(confirmFirst = true) {
  if (confirmFirst && !confirm('¿Cerrar sesión?')) return;
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
   if (!pass) {
    setMsg('login-gm-msg', 'Ingresa la contraseña GM', 'error');
    return;
    }
   setMsg('login-gm-msg', 'Validando...', '');
  loadGMPasswordHash().then(async hash => {
    if (!hash) {
      try {
        const passHash = await sha256(pass);
        localStorage.setItem('heroindex-gmhash', JSON.stringify(passHash));
        setMsg('login-gm-msg', 'GM configurado localmente. Intenta de nuevo con la misma contraseña.', 'success');
      } catch {
        setMsg('login-gm-msg', 'Acceso GM no configurado. Define config/gmPasswordHash en Firebase.', 'error');
      }
      return;
    }
    const passHash = await sha256(pass);
    if (passHash === hash) {
      setMsg('login-gm-msg', 'Acceso concedido', 'success');
      setTimeout(() => {
        saveSession({ type: 'gm' });
        startApp();
      }, 600);
    } else {
      setMsg('login-gm-msg', 'Contraseña incorrecta', 'error');
    }
  });
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── PUBLIC ACCESS ─────────────────────────────────────────────

// ── PUBLIC ACCESS ─────────────────────────────────────────────
function continueAsPublic() {
  saveSession({ type: 'public' });
  startApp();
}