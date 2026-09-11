// ============================================================
// CajaFácil Cuba - Núcleo compartido
// ============================================================

const DB = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem('cfc_' + key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    localStorage.setItem('cfc_' + key, JSON.stringify(value));
  }
};

const State = {
  productos: DB.get('productos', []),
  ventas: DB.get('ventas', []),
  turno: DB.get('turno', null),
  conteos: DB.get('conteos', []),
  ajustes: DB.get('ajustes', {
    negocio: 'Mi Negocio',
    tasaUSD: 320,
    tema: 'light',
    moneda: 'CUP'
  })
};

function saveState() {
  DB.set('productos', State.productos);
  DB.set('ventas', State.ventas);
  DB.set('turno', State.turno);
  DB.set('conteos', State.conteos);
  DB.set('ajustes', State.ajustes);
}

const fmt = n => (Number(n) || 0).toLocaleString('es-CU');
const money = (n, cur = 'CUP') => `${fmt(n)} ${cur}`;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function applyTheme() {
  document.documentElement.classList.toggle('dark', State.ajustes.tema === 'dark');
  const btn = document.getElementById('btn-theme');
  if (btn) btn.innerHTML = `<i class="ti ti-${State.ajustes.tema === 'dark' ? 'sun' : 'moon'}"></i>`;
}

function toggleTheme() {
  State.ajustes.tema = State.ajustes.tema === 'dark' ? 'light' : 'dark';
  saveState(); applyTheme();
}

function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2200);
}

function markActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-bottom a').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === page);
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  markActiveNav();
  const btn = document.getElementById('btn-theme');
  if (btn) btn.addEventListener('click', toggleTheme);
});
