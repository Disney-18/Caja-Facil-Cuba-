// ============================================================
// CajaFácil Cuba - Núcleo compartido (versión multi-negocio)
// Desarrollado por Disney Gutiérrez Guevara
// ============================================================

const State = {
  negocioActivo: null,
  negocios: [],
  productos: [],
  ventas: [],
  turnos: [],
  turno: null,
  conteos: [],
  movimientos: [],
  ajustes: {
    negocio: 'Mi Negocio',
    tasaUSD: 320,
    tema: 'light',
    moneda: 'CUP'
  }
};

let _estadoCargado = false;

async function cargarEstado() {
  if (_estadoCargado) return;

  await migrarSiEsNecesario();

  const ajustes = await IDB.metaGet('ajustes', null);
  if (ajustes) State.ajustes = ajustes;

  State.negocios = await IDB.getAll(IDB.STORES.NEGOCIOS);

  const activoId = await IDB.metaGet('negocio_activo', null);
  let negocio = State.negocios.find(n => n.id === activoId);

  if (!negocio && State.negocios.length) {
    negocio = State.negocios[0];
    await IDB.metaSet('negocio_activo', negocio.id);
  }

  if (negocio) {
    State.negocioActivo = negocio;
    await cargarDatosNegocio(negocio.id);
  }

  _estadoCargado = true;
}

async function cargarDatosNegocio(negocioId) {
  const [productos, ventas, turnos, conteos, movimientos] = await Promise.all([
    IDB.getByIndex(IDB.STORES.PRODUCTOS, 'negocio_id', negocioId),
    IDB.getByIndex(IDB.STORES.VENTAS, 'negocio_id', negocioId),
    IDB.getByIndex(IDB.STORES.TURNOS, 'negocio_id', negocioId),
    IDB.getByIndex(IDB.STORES.CONTEOS, 'negocio_id', negocioId),
    IDB.getByIndex(IDB.STORES.MOVIMIENTOS, 'negocio_id', negocioId)
  ]);

  State.productos = productos;
  State.ventas = ventas.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  State.turnos = turnos;
  State.turno = turnos.find(t => t.estado === 'abierto') || null;
  State.conteos = conteos.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  State.movimientos = movimientos.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

async function cambiarNegocio(negocioId) {
  const n = State.negocios.find(x => x.id === negocioId);
  if (!n) return;
  await IDB.metaSet('negocio_activo', n.id);
  await IDB.metaSet('negocio_activo_objeto', n);
  State.negocioActivo = n;
  await cargarDatosNegocio(n.id);
  pintarNegocioActivo();
  toast('Negocio: ' + n.nombre);
  window.dispatchEvent(new CustomEvent('negocio-cambiado'));
}

async function guardarProducto(p) {
  p.negocio_id = State.negocioActivo?.id || null;
  await IDB.put(IDB.STORES.PRODUCTOS, p);
  const i = State.productos.findIndex(x => x.id === p.id);
  if (i >= 0) State.productos[i] = p; else State.productos.push(p);
}

async function eliminarProducto(id) {
  await IDB.del(IDB.STORES.PRODUCTOS, id);
  State.productos = State.productos.filter(x => x.id !== id);
}

async function guardarVenta(v) {
  v.negocio_id = State.negocioActivo?.id || null;
  await IDB.put(IDB.STORES.VENTAS, v);
  State.ventas.unshift(v);

  for (const item of v.items) {
    const p = State.productos.find(x => x.id === item.id);
    if (p) {
      p.stock = (p.stock || 0) - item.cant;
      await IDB.put(IDB.STORES.PRODUCTOS, p);
    }
  }
}

async function guardarTurno(t) {
  t.negocio_id = State.negocioActivo?.id || null;
  await IDB.put(IDB.STORES.TURNOS, t);
  const i = State.turnos.findIndex(x => x.id === t.id);
  if (i >= 0) State.turnos[i] = t; else State.turnos.push(t);
  State.turno = t.estado === 'abierto' ? t : null;
}

async function guardarConteoDB(c) {
  c.negocio_id = State.negocioActivo?.id || null;
  await IDB.put(IDB.STORES.CONTEOS, c);
  State.conteos.unshift(c);
}

async function eliminarConteo(id) {
  await IDB.del(IDB.STORES.CONTEOS, id);
  State.conteos = State.conteos.filter(c => c.id !== id);
}

async function guardarAjustes() {
  await IDB.metaSet('ajustes', State.ajustes);
}

async function guardarMovimiento(m) {
  m.negocio_id = State.negocioActivo?.id || null;
  await IDB.put(IDB.STORES.MOVIMIENTOS, m);
  const i = State.movimientos.findIndex(x => x.id === m.id);
  if (i >= 0) State.movimientos[i] = m; else State.movimientos.unshift(m);
}

async function guardarNegocio(n) {
  await IDB.put(IDB.STORES.NEGOCIOS, n);
  const i = State.negocios.findIndex(x => x.id === n.id);
  if (i >= 0) State.negocios[i] = n; else State.negocios.push(n);
}

async function eliminarNegocio(id) {
  const productos = await IDB.getByIndex(IDB.STORES.PRODUCTOS, 'negocio_id', id);
  const ventas = await IDB.getByIndex(IDB.STORES.VENTAS, 'negocio_id', id);
  const turnos = await IDB.getByIndex(IDB.STORES.TURNOS, 'negocio_id', id);
  const conteos = await IDB.getByIndex(IDB.STORES.CONTEOS, 'negocio_id', id);
  const movimientos = await IDB.getByIndex(IDB.STORES.MOVIMIENTOS, 'negocio_id', id);

  for (const x of productos) await IDB.del(IDB.STORES.PRODUCTOS, x.id);
  for (const x of ventas) await IDB.del(IDB.STORES.VENTAS, x.id);
  for (const x of turnos) await IDB.del(IDB.STORES.TURNOS, x.id);
  for (const x of conteos) await IDB.del(IDB.STORES.CONTEOS, x.id);
  for (const x of movimientos) await IDB.del(IDB.STORES.MOVIMIENTOS, x.id);
  await IDB.del(IDB.STORES.NEGOCIOS, id);

  State.negocios = State.negocios.filter(n => n.id !== id);
}

const fmt = n => (Number(n) || 0).toLocaleString('es-CU');
const money = (n, cur = 'CUP') => `${fmt(n)} ${cur}`;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function applyTheme() {
  document.documentElement.classList.toggle('dark', State.ajustes.tema === 'dark');
  const btn = document.getElementById('btn-theme');
  if (btn) btn.innerHTML = `<i class="ti ti-${State.ajustes.tema === 'dark' ? 'sun' : 'moon'}"></i>`;
}

async function toggleTheme() {
  State.ajustes.tema = State.ajustes.tema === 'dark' ? 'light' : 'dark';
  await guardarAjustes();
  applyTheme();
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

function pintarNegocioActivo() {
  const el = document.getElementById('negocio-activo');
  if (!el) return;
  if (!State.negocioActivo) {
    el.innerHTML = `<i class="ti ti-building-store"></i> <span>Sin negocio</span>`;
    return;
  }
  el.innerHTML = `
    <i class="ti ${State.negocioActivo.icono || 'ti-building-store'}"
       style="color:${State.negocioActivo.color || 'var(--primary)'}"></i>
    <span>${State.negocioActivo.nombre}</span>
  `;
}

// ------------------------------------------------------------
// Service Worker con auto-actualización
// ------------------------------------------------------------

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });

  let recargando = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recargando) return;
    recargando = true;
    toast('Actualizando a la nueva versión...');
    setTimeout(() => location.reload(), 900);
  });

  navigator.serviceWorker.ready.then(reg => {
    reg.addEventListener('updatefound', () => {
      const nuevo = reg.installing;
      if (!nuevo) return;
      nuevo.addEventListener('statechange', () => {
        if (nuevo.state === 'installed' && navigator.serviceWorker.controller) {
          nuevo.postMessage({ tipo: 'SKIP_WAITING' });
        }
      });
    });

    // Buscar actualizaciones cada 30 minutos mientras la app esté abierta
    setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await cargarEstado();
  applyTheme();
  markActiveNav();
  pintarNegocioActivo();

  const btn = document.getElementById('btn-theme');
  if (btn) btn.addEventListener('click', toggleTheme);

  window.dispatchEvent(new CustomEvent('estado-listo'));
});
