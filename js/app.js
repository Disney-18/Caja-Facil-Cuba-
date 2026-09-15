// ============================================================
// CajaFácil Cuba - Núcleo compartido (versión multi-negocio)
// Bloque 5: vendedores, clientes, ventas en espera
// Desarrollado por Disney Gutiérrez Guevara
// ============================================================

const UNIDADES = [
  { id: 'unidad', nombre: 'Unidad' },
  { id: 'libra', nombre: 'Libra' },
  { id: 'kg', nombre: 'Kilogramo' },
  { id: 'litro', nombre: 'Litro' },
  { id: 'metro', nombre: 'Metro' },
  { id: 'paquete', nombre: 'Paquete' },
  { id: 'caja', nombre: 'Caja' },
  { id: 'docena', nombre: 'Docena' }
];

const FORMAS_PAGO = [
  { id: 'efectivo', nombre: 'Efectivo CUP' },
  { id: 'transferencia', nombre: 'Transferencia CUP' },
  { id: 'usd', nombre: 'Efectivo USD' },
  { id: 'qr', nombre: 'Pago por QR' }
];

const State = {
  negocioActivo: null,
  negocios: [],
  categorias: [],
  productos: [],
  movimientosInv: [],
  vendedores: [],
  clientes: [],
  ventas: [],
  ventasEnEspera: [],
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
let _deferredPrompt = null;

window.addEventListener('error', e => {
  console.error('[Error global]', e.error || e.message);
  try { toast('Ocurrió un error. Vuelve a intentarlo.'); } catch {}
});

window.addEventListener('unhandledrejection', e => {
  console.error('[Promesa rechazada]', e.reason);
  try { toast('Ocurrió un error. Vuelve a intentarlo.'); } catch {}
});

const Validar = {
  texto(v, min = 1, max = 80) {
    const s = String(v || '').trim();
    if (s.length < min) return { ok: false, msg: `Mínimo ${min} caracteres` };
    if (s.length > max) return { ok: false, msg: `Máximo ${max} caracteres` };
    return { ok: true, valor: s };
  },
  numero(v, min = 0, max = 999999999) {
    const n = Number(v);
    if (isNaN(n)) return { ok: false, msg: 'Debe ser un número' };
    if (n < min) return { ok: false, msg: `Mínimo ${min}` };
    if (n > max) return { ok: false, msg: `Máximo ${max}` };
    return { ok: true, valor: n };
  },
  entero(v, min = 0, max = 999999999) {
    const n = parseInt(v, 10);
    if (isNaN(n)) return { ok: false, msg: 'Debe ser un número entero' };
    if (n < min) return { ok: false, msg: `Mínimo ${min}` };
    if (n > max) return { ok: false, msg: `Máximo ${max}` };
    return { ok: true, valor: n };
  }
};

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
  const [
    categorias, productos, movimientosInv, vendedores, clientes,
    ventas, turnos, conteos, movimientos
  ] = await Promise.all([
    IDB.getByIndex(IDB.STORES.CATEGORIAS, 'negocio_id', negocioId),
    IDB.getByIndex(IDB.STORES.PRODUCTOS, 'negocio_id', negocioId),
    IDB.getByIndex(IDB.STORES.MOVIMIENTOS_INV, 'negocio_id', negocioId),
    IDB.getByIndex(IDB.STORES.VENDEDORES, 'negocio_id', negocioId),
    IDB.getByIndex(IDB.STORES.CLIENTES, 'negocio_id', negocioId),
    IDB.getByIndex(IDB.STORES.VENTAS, 'negocio_id', negocioId),
    IDB.getByIndex(IDB.STORES.TURNOS, 'negocio_id', negocioId),
    IDB.getByIndex(IDB.STORES.CONTEOS, 'negocio_id', negocioId),
    IDB.getByIndex(IDB.STORES.MOVIMIENTOS, 'negocio_id', negocioId)
  ]);

  State.categorias = categorias.sort((a, b) => a.nombre.localeCompare(b.nombre));
  State.productos = productos;
  State.movimientosInv = movimientosInv.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  State.vendedores = vendedores.sort((a, b) => a.nombre.localeCompare(b.nombre));
  State.clientes = clientes.sort((a, b) => a.nombre.localeCompare(b.nombre));
  State.ventas = ventas.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  State.turnos = turnos;
  State.turno = turnos.find(t => t.estado === 'abierto') || null;
  State.conteos = conteos.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  State.movimientos = movimientos.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  State.ventasEnEspera = ventas.filter(v => v.estado === 'espera');
  State.ventas = State.ventas.filter(v => v.estado !== 'espera');
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

// ------------------------------------------------------------
// Productos
// ------------------------------------------------------------

async function guardarProducto(p) {
  p.negocio_id = State.negocioActivo?.id || null;
  await IDB.put(IDB.STORES.PRODUCTOS, p);
  const i = State.productos.findIndex(x => x.id === p.id);
  if (i >= 0) State.productos[i] = p; else State.productos.push(p);
}

async function eliminarProducto(id) {
  await IDB.del(IDB.STORES.PRODUCTOS, id);
  State.productos = State.productos.filter(x => x.id !== id);

  const movs = State.movimientosInv.filter(m => m.producto_id === id);
  for (const m of movs) await IDB.del(IDB.STORES.MOVIMIENTOS_INV, m.id);
  State.movimientosInv = State.movimientosInv.filter(m => m.producto_id !== id);
}

// ------------------------------------------------------------
// Categorías
// ------------------------------------------------------------

async function guardarCategoria(c) {
  c.negocio_id = State.negocioActivo?.id || null;
  await IDB.put(IDB.STORES.CATEGORIAS, c);
  const i = State.categorias.findIndex(x => x.id === c.id);
  if (i >= 0) State.categorias[i] = c; else State.categorias.push(c);
  State.categorias.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

async function eliminarCategoria(id) {
  await IDB.del(IDB.STORES.CATEGORIAS, id);
  State.categorias = State.categorias.filter(x => x.id !== id);
  for (const p of State.productos.filter(p => p.categoria_id === id)) {
    p.categoria_id = null;
    await IDB.put(IDB.STORES.PRODUCTOS, p);
  }
}

function nombreCategoria(id) {
  if (!id) return 'Sin categoría';
  const c = State.categorias.find(x => x.id === id);
  return c ? c.nombre : 'Sin categoría';
}

// ------------------------------------------------------------
// Movimientos de inventario
// ------------------------------------------------------------

async function registrarMovimientoInv(m) {
  m.negocio_id = State.negocioActivo?.id || null;
  await IDB.put(IDB.STORES.MOVIMIENTOS_INV, m);
  State.movimientosInv.unshift(m);

  const p = State.productos.find(x => x.id === m.producto_id);
  if (p) {
    if (m.tipo === 'entrada') {
      p.stock = (p.stock || 0) + m.cantidad;
    } else if (m.tipo === 'salida') {
      p.stock = (p.stock || 0) - m.cantidad;
    } else if (m.tipo === 'ajuste') {
      p.stock = m.cantidad;
    }
    if (m.costo_unitario) p.costo = m.costo_unitario;
    await IDB.put(IDB.STORES.PRODUCTOS, p);
  }
}

// ------------------------------------------------------------
// Vendedores
// ------------------------------------------------------------

async function guardarVendedor(v) {
  v.negocio_id = State.negocioActivo?.id || null;
  await IDB.put(IDB.STORES.VENDEDORES, v);
  const i = State.vendedores.findIndex(x => x.id === v.id);
  if (i >= 0) State.vendedores[i] = v; else State.vendedores.push(v);
  State.vendedores.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

async function eliminarVendedor(id) {
  await IDB.del(IDB.STORES.VENDEDORES, id);
  State.vendedores = State.vendedores.filter(x => x.id !== id);
}

function nombreVendedor(id) {
  if (!id) return 'Sin vendedor';
  const v = State.vendedores.find(x => x.id === id);
  return v ? v.nombre : 'Sin vendedor';
}

// ------------------------------------------------------------
// Clientes
// ------------------------------------------------------------

async function guardarCliente(c) {
  c.negocio_id = State.negocioActivo?.id || null;
  await IDB.put(IDB.STORES.CLIENTES, c);
  const i = State.clientes.findIndex(x => x.id === c.id);
  if (i >= 0) State.clientes[i] = c; else State.clientes.push(c);
  State.clientes.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

async function eliminarCliente(id) {
  await IDB.del(IDB.STORES.CLIENTES, id);
  State.clientes = State.clientes.filter(x => x.id !== id);
}

function nombreCliente(id) {
  if (!id) return 'Cliente ocasional';
  const c = State.clientes.find(x => x.id === id);
  return c ? c.nombre : 'Cliente ocasional';
}

// ------------------------------------------------------------
// Ventas
// ------------------------------------------------------------

async function guardarVenta(v) {
  v.negocio_id = State.negocioActivo?.id || null;
  if (!v.estado) v.estado = 'cerrada';
  await IDB.put(IDB.STORES.VENTAS, v);

  if (v.estado === 'espera') {
    const i = State.ventasEnEspera.findIndex(x => x.id === v.id);
    if (i >= 0) State.ventasEnEspera[i] = v; else State.ventasEnEspera.unshift(v);
    return;
  }

  State.ventas.unshift(v);

  for (const item of v.items) {
    const p = State.productos.find(x => x.id === item.id);
    if (p) {
      const stockAntes = p.stock || 0;
      p.stock = stockAntes - item.cant;
      await IDB.put(IDB.STORES.PRODUCTOS, p);

      await IDB.put(IDB.STORES.MOVIMIENTOS_INV, {
        id: uid(),
        negocio_id: v.negocio_id,
        producto_id: p.id,
        tipo: 'salida',
        cantidad: item.cant,
        costo_unitario: p.costo || 0,
        motivo: 'Venta',
        fecha: v.fecha,
        venta_id: v.id
      });
    }
  }
}

async function finalizarVentaEnEspera(id, extras) {
  const venta = State.ventasEnEspera.find(v => v.id === id);
  if (!venta) return;
  Object.assign(venta, extras || {});
  venta.estado = 'cerrada';
  venta.fecha = new Date().toISOString();
  await guardarVenta(venta);
  State.ventasEnEspera = State.ventasEnEspera.filter(v => v.id !== id);
}

async function eliminarVentaEnEspera(id) {
  await IDB.del(IDB.STORES.VENTAS, id);
  State.ventasEnEspera = State.ventasEnEspera.filter(v => v.id !== id);
}

// ------------------------------------------------------------
// Turnos, conteos, ajustes, movimientos
// ------------------------------------------------------------

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
  const categorias = await IDB.getByIndex(IDB.STORES.CATEGORIAS, 'negocio_id', id);
  const productos = await IDB.getByIndex(IDB.STORES.PRODUCTOS, 'negocio_id', id);
  const movInv = await IDB.getByIndex(IDB.STORES.MOVIMIENTOS_INV, 'negocio_id', id);
  const vendedores = await IDB.getByIndex(IDB.STORES.VENDEDORES, 'negocio_id', id);
  const clientes = await IDB.getByIndex(IDB.STORES.CLIENTES, 'negocio_id', id);
  const ventas = await IDB.getByIndex(IDB.STORES.VENTAS, 'negocio_id', id);
  const turnos = await IDB.getByIndex(IDB.STORES.TURNOS, 'negocio_id', id);
  const conteos = await IDB.getByIndex(IDB.STORES.CONTEOS, 'negocio_id', id);
  const movimientos = await IDB.getByIndex(IDB.STORES.MOVIMIENTOS, 'negocio_id', id);

  for (const x of categorias) await IDB.del(IDB.STORES.CATEGORIAS, x.id);
  for (const x of productos) await IDB.del(IDB.STORES.PRODUCTOS, x.id);
  for (const x of movInv) await IDB.del(IDB.STORES.MOVIMIENTOS_INV, x.id);
  for (const x of vendedores) await IDB.del(IDB.STORES.VENDEDORES, x.id);
  for (const x of clientes) await IDB.del(IDB.STORES.CLIENTES, x.id);
  for (const x of ventas) await IDB.del(IDB.STORES.VENTAS, x.id);
  for (const x of turnos) await IDB.del(IDB.STORES.TURNOS, x.id);
  for (const x of conteos) await IDB.del(IDB.STORES.CONTEOS, x.id);
  for (const x of movimientos) await IDB.del(IDB.STORES.MOVIMIENTOS, x.id);
  await IDB.del(IDB.STORES.NEGOCIOS, id);

  State.negocios = State.negocios.filter(n => n.id !== id);
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

const fmt = n => (Number(n) || 0).toLocaleString('es-CU');
const money = (n, cur = 'CUP') => `${fmt(n)} ${cur}`;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function nombreUnidad(id) {
  const u = UNIDADES.find(x => x.id === id);
  return u ? u.nombre : 'Unidad';
}

function nombreFormaPago(id) {
  const f = FORMAS_PAGO.find(x => x.id === id);
  return f ? f.nombre : id;
}

function margenGanancia(p) {
  if (!p.costo || p.costo <= 0) return null;
  return ((p.precio - p.costo) / p.costo) * 100;
}

function productosStockBajo() {
  return State.productos.filter(p => {
    const min = p.stock_minimo || 0;
    return min > 0 && (p.stock || 0) <= min;
  });
}

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
// Instalación PWA
// ------------------------------------------------------------

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _deferredPrompt = e;
  const card = document.getElementById('card-instalar');
  if (card) card.style.display = 'block';
});

window.addEventListener('appinstalled', () => {
  _deferredPrompt = null;
  const card = document.getElementById('card-instalar');
  if (card) card.style.display = 'none';
  toast('App instalada');
});

async function instalarPWA() {
  if (!_deferredPrompt) {
    toast('La instalación no está disponible');
    return;
  }
  _deferredPrompt.prompt();
  const { outcome } = await _deferredPrompt.userChoice;
  if (outcome === 'accepted') toast('Instalando...');
  _deferredPrompt = null;
  const card = document.getElementById('card-instalar');
  if (card) card.style.display = 'none';
}

// ------------------------------------------------------------
// Service Worker
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

  const btnInstalar = document.getElementById('btn-instalar');
  if (btnInstalar) btnInstalar.addEventListener('click', instalarPWA);

  window.dispatchEvent(new CustomEvent('estado-listo'));
});
