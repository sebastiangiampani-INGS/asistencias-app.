let GOOGLE_CLIENT_ID = "668983104531-e5bqm8dpnmp9o6itgnt9m9hnev59uf7u.apps.googleusercontent.com";
let CURRENT_USER = null;

function getIdToken()  { return localStorage.getItem('id_token'); }
function setIdToken(t) { localStorage.setItem('id_token', t); }
function clearIdToken(){ localStorage.removeItem('id_token'); }

function waitForGoogle() {
  return new Promise((resolve, reject) => {
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (window.google && google.accounts && google.accounts.id) {
        clearInterval(timer);
        resolve();
      }
      if (tries > 50) { clearInterval(timer); reject(new Error('Google Identity no cargó')); }
    }, 100);
  });
}

async function initGoogle(onLoggedIn) {
  await waitForGoogle();

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: async (resp) => {
      setIdToken(resp.credential);
      await loadMe();
      if (typeof onLoggedIn === 'function') onLoggedIn();
    }
  });

  const btn = document.getElementById('gbtn');
  if (btn) google.accounts.id.renderButton(btn, { theme: 'outline', size: 'large', text: 'signin_with' });

  const t = getIdToken();
  if (t) {
    try { await loadMe(); if (typeof onLoggedIn === 'function') onLoggedIn(); }
    catch { clearIdToken(); }
  }
}

async function authFetch(url, opts = {}) {
  const token = getIdToken();
  const headers = Object.assign({}, opts.headers || {}, { 'Authorization': 'Bearer ' + token });
  if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, Object.assign({}, opts, { headers }));
  if (!res.ok) {
    const j = await res.json().catch(()=>({}));
    throw new Error(j.error || ('Error HTTP ' + res.status));
  }
  return res.json();
}

async function loadMe() {
  CURRENT_USER = await authFetch('/api/me');
  const el = document.getElementById('userbox');
  if (el) el.innerHTML = `<span class="brand">Asistencias</span><div class="user"><span>${CURRENT_USER.name} · ${CURRENT_USER.email} · <b>${CURRENT_USER.role}</b></span></div>`;
  document.getElementById('authed')?.classList.remove('hidden');
  document.getElementById('login')?.classList.add('hidden');
}

function logout() {
  clearIdToken();
  location.reload();
}
