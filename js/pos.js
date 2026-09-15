// ============================================================
// CajaFácil Cuba - Punto de venta simplificado
// Bloque 5: descuentos, cobro mixto, espera, cliente, vendedor
// Desarrollado por Disney Gutiérrez Guevara
// ============================================================

let ticket = [];
let descuentoTicket = { tipo: 'porciento', valor: 0 };
let notaVenta = '';
let clienteId = null;
let vendedorId = null;
let ventaEditandoId = null;
let formaPago = 'efectivo';
let formaPagoMixto = null;
let montoMixto = 0;

// ------------------------------------------------------------
// Alertas
// ------------------------------------------------------------

function renderAlertas() {
  const bajos = productosStockBajo();
  const card = document.getElementById('card-alertas');
  if (!card) return;

  if (!bajos.length) {
    card.style.display = 'none';
    return;
  }

  card.style.display = 'block';
  document.getElementById('alertas-titulo').textContent =
    bajos.length === 1 ? '1 producto con stock bajo' : `${bajos.length} productos con stock bajo`;
  document.getElementById('alertas-detalle').textContent =
    bajos.slice(0, 3).map(p => p.nombre).join(', ') + (bajos.length > 3 ? '...' : '');
}

function renderBadgeEspera() {
  const badge = document.getElementById('badge-espera');
  if (!badge) return;
  if (State.ventasEnEspera.length === 0) {
    badge.style.display = 'none';
  } else {
    badge.style.display = 'inline-block';
    badge.textContent = State.ventasEnEspera.length;
  }
}

// ------------------------------------------------------------
// Búsqueda y ticket
// ------------------------------------------------------------

function renderResultados(q) {
  const cont = document.getElementById('resultados');
  const query = q.trim().toLowerCase();
  if (!query) { cont.innerHTML = ''; return; }

  const matches = State.productos.filter(p =>
    p.nombre.toLowerCase().includes(query) || (p.codigo || '').toLowerCase().includes(query)
  ).slice(0, 8);

  if (!matches.length) {
    cont.innerHTML = `<div class="empty"><i class="ti ti-search-off"></i>Sin resultados</div>`;
    return;
  }

  cont.innerHTML = matches.map(p => {
    const uni = nombreUnidad(p.unidad || 'unidad');
    const cat = p.categoria_id ? nombreCategoria(p.categoria_id) : '';
    const stock = p.stock || 0;
    const min = p.stock_minimo || 0;
    const alerta = min > 0 && stock <= min;
    return `
      <div class="card" style="padding:10px;margin:6px 0;cursor:pointer" onclick="addTicket('${p.id}')">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="flex:1;min-width:0">
            <div style="font-weight:600">${p.nombre}</div>
            <div style="font-size:12px;color:var(--muted)">
              Stock: ${fmt(stock)} ${uni.toLowerCase()} · ${cat || 'Sin categoría'}
              ${alerta ? ' · <span style="color:var(--warning);font-weight:600">Stock bajo</span>' : ''}
            </div>
          </div>
          <div style="font-weight:600;color:var(--primary);margin-left:8px">${money(p.precio)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function addTicket(id) {
  const p = State.productos.find(x => x.id === id);
  if (!p) return;
  if (p.stock <= 0) { toast('Sin stock'); return; }

  const item = ticket.find(t => t.id === id);
  if (item) {
    if (item.cant + 1 > p.stock) { toast('Stock insuficiente'); return; }
    item.cant++;
  } else {
    ticket.push({
      id,
      nombre: p.nombre,
      precio: p.precio,
      precioSugerido: p.precio,
      cant: 1,
      unidad: p.unidad || 'unidad',
      descuento: { tipo: 'porciento', valor: 0 }
    });
  }
  renderTicket();
  document.getElementById('buscar').value = '';
  document.getElementById('resultados').innerHTML = '';
}

function calcularItem(item) {
  const bruto = item.precio * item.cant;
  const d = item.descuento || { tipo: 'porciento', valor: 0 };
  let desc = 0;
  if (d.tipo === 'porciento') desc = bruto * (d.valor / 100);
  else desc = d.valor;
  desc = Math.min(desc, bruto);
  return { bruto, desc, neto: bruto - desc };
}

function calcularTotales() {
  let subtotal = 0;
  let descItems = 0;
  for (const item of ticket) {
    const c = calcularItem(item);
    subtotal += c.bruto;
    descItems += c.desc;
  }

  const baseTicket = subtotal - descItems;
  let descTicket = 0;
  if (descuentoTicket.tipo === 'porciento') descTicket = baseTicket * (descuentoTicket.valor / 100);
  else descTicket = descuentoTicket.valor;
  descTicket = Math.min(descTicket, baseTicket);

  return {
    subtotal,
    descItems,
    descTicket,
    total: baseTicket - descTicket
  };
}

function renderTicket() {
  const tb = document.getElementById('ticket');
  if (!ticket.length) {
    tb.innerHTML = `<tr><td colspan="5"><div class="empty"><i class="ti ti-shopping-cart-off"></i>Ticket vacío</div></td></tr>`;
  } else {
    tb.innerHTML = ticket.map((t, i) => {
      const uni = nombreUnidad(t.unidad).toLowerCase();
      const precioCambiado = t.precio !== t.precioSugerido;
      const c = calcularItem(t);
      const tieneDesc = c.desc > 0;
      return `
        <tr>
          <td>
            <div>${t.nombre}</div>
            <div style="font-size:11px;color:var(--muted)">${uni}${tieneDesc ? ' · descuento aplicado' : ''}</div>
          </td>
          <td>
            <div style="display:flex;align-items:center;gap:2px">
              <button class="icon-btn" style="width:26px;height:26px" onclick="changeCant(${i},-1)">−</button>
              <input class="input" style="width:52px;text-align:center;padding:4px;font-size:13px"
                     type="number" min="0" step="0.01" value="${t.cant}"
                     onchange="setCant(${i}, this.value)">
              <button class="icon-btn" style="width:26px;height:26px" onclick="changeCant(${i},1)">+</button>
            </div>
          </td>
          <td>
            <input class="input" style="width:70px;padding:4px;font-size:13px;${precioCambiado ? 'border-color:var(--warning)' : ''}"
                   type="number" min="0" step="0.01" value="${t.precio}"
                   onchange="setPrecio(${i}, this.value)">
          </td>
          <td>${fmt(c.neto)}</td>
          <td>
            <button class="icon-btn" style="width:26px;height:26px" title="Descuento" onclick="abrirDescuentoItem(${i})"><i class="ti ti-discount-2"></i></button>
            <button class="icon-btn" style="width:26px;height:26px" onclick="delItem(${i})"><i class="ti ti-x"></i></button>
          </td>
        </tr>
      `;
    }).join('');
  }

  const tot = calcularTotales();
  document.getElementById('subtotal').textContent = money(tot.subtotal);
  document.getElementById('descuento-ticket').textContent = money(tot.descItems + tot.descTicket);
  document.getElementById('total').textContent = money(tot.total);
}

function setCant(i, valor) {
  const v = Validar.numero(valor, 0.01, 999999);
  if (!v.ok) { toast('Cantidad: ' + v.msg); renderTicket(); return; }
  const p = State.productos.find(x => x.id === ticket[i].id);
  if (p && v.valor > p.stock) { toast('Stock insuficiente'); renderTicket(); return; }
  ticket[i].cant = v.valor;
  renderTicket();
}

function setPrecio(i, valor) {
  const v = Validar.numero(valor, 0, 999999999);
  if (!v.ok) { toast('Precio: ' + v.msg); renderTicket(); return; }
  ticket[i].precio = v.valor;
  renderTicket();
}

function changeCant(i, d) {
  const p = State.productos.find(x => x.id === ticket[i].id);
  const nueva = ticket[i].cant + d;
  if (p && nueva > p.stock) { toast('Stock insuficiente'); return; }
  if (nueva <= 0) ticket.splice(i, 1);
  else ticket[i].cant = nueva;
  renderTicket();
}

function delItem(i) { ticket.splice(i, 1); renderTicket(); }
function vaciarTicket() {
  ticket = [];
  descuentoTicket = { tipo: 'porciento', valor: 0 };
  notaVenta = '';
  clienteId = null;
  vendedorId = null;
  ventaEditandoId = null;
  document.getElementById('nota-venta').style.display = 'none';
  document.getElementById('texto-cliente').textContent = 'Cliente ocasional';
  document.getElementById('texto-vendedor').textContent = 'Sin vendedor';
  renderTicket();
}

// ------------------------------------------------------------
// Descuento del ticket
// ------------------------------------------------------------

function abrirModalDescuento() {
  document.getElementById('desc-tipo').value = descuentoTicket.tipo;
  document.getElementById('desc-valor').value = descuentoTicket.valor;
  document.getElementById('modal-descuento').style.display = 'flex';
}

function cerrarModalDescuento() {
  document.getElementById('modal-descuento').style.display = 'none';
}

function aplicarDescuento() {
  const v = Validar.numero(document.getElementById('desc-valor').value, 0, 999999999);
  if (!v.ok) { toast('Valor: ' + v.msg); return; }
  descuentoTicket = { tipo: document.getElementById('desc-tipo').value, valor: v.valor };
  cerrarModalDescuento();
  renderTicket();
}

function quitarDescuento() {
  descuentoTicket = { tipo: 'porciento', valor: 0 };
  cerrarModalDescuento();
  renderTicket();
}

let itemDescuentoIndex = null;

function abrirDescuentoItem(i) {
  itemDescuentoIndex = i;
  const item = ticket[i];
  const actual = item.descuento || { tipo: 'porciento', valor: 0 };
  const v = prompt(`Descuento para "${item.nombre}".\nEscribe el valor. Si empieza con $, será monto fijo. Si no, será porcentaje.\nEjemplos: 10 (10%) o $50 (50 CUP)`, actual.valor || 0);
  if (v === null) return;
  const texto = String(v).trim();
  let tipo = 'porciento';
  let valor = 0;
  if (texto.startsWith('$')) {
    tipo = 'monto';
    valor = parseFloat(texto.slice(1)) || 0;
  } else {
    valor = parseFloat(texto) || 0;
  }
  item.descuento = { tipo, valor };
  renderTicket();
}

// ------------------------------------------------------------
// Nota
// ------------------------------------------------------------

function abrirModalNota() {
  document.getElementById('nota-texto').value = notaVenta;
  document.getElementById('modal-nota').style.display = 'flex';
}

function cerrarModalNota() {
  document.getElementById('modal-nota').style.display = 'none';
}

function guardarNota() {
  const v = Validar.texto(document.getElementById('nota-texto').value || '', 0, 200);
  if (!v.ok) { toast('Nota: ' + v.msg); return; }
  notaVenta = v.valor;
  const zona = document.getElementById('nota-venta');
  if (notaVenta) {
    zona.style.display = 'block';
    zona.textContent = 'Nota: ' + notaVenta;
  } else {
    zona.style.display = 'none';
  }
  cerrarModalNota();
}

// ------------------------------------------------------------
// Cliente
// ------------------------------------------------------------

function abrirModalCliente() {
  renderListaClientes();
  document.getElementById('modal-cliente').style.display = 'flex';
}

function cerrarModalCliente() {
  document.getElementById('modal-cliente').style.display = 'none';
}

function renderListaClientes(filtro = '') {
  const cont = document.getElementById('lista-clientes');
  const q = filtro.trim().toLowerCase();
  const lista = State.clientes.filter(c =>
    !q || c.nombre.toLowerCase().includes(q) || (c.telefono || '').includes(q)
  );

  if (!lista.length) {
    cont.innerHTML = `<div class="empty" style="padding:20px"><i class="ti ti-users-off"></i>Sin clientes</div>`;
    return;
  }

  cont.innerHTML = lista.map(c => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="seleccionarCliente('${c.id}')">
      <div>
        <div style="font-weight:600">${c.nombre}</div>
        ${c.telefono ? `<div style="font-size:11px;color:var(--muted)">${c.telefono}</div>` : ''}
      </div>
      <i class="ti ti-chevron-right" style="color:var(--muted)"></i>
    </div>
  `).join('');
}

function seleccionarCliente(id) {
  clienteId = id;
  document.getElementById('texto-cliente').textContent = nombreCliente(id);
  cerrarModalCliente();
}

function quitarCliente() {
  clienteId = null;
  document.getElementById('texto-cliente').textContent = 'Cliente ocasional';
  cerrarModalCliente();
}

async function crearClienteRapido() {
  const vN = Validar.texto(document.getElementById('nuevo-cliente-nombre').value, 1, 60);
  if (!vN.ok) { toast('Nombre: ' + vN.msg); return; }
  const vT = Validar.texto(document.getElementById('nuevo-cliente-telefono').value || '', 0, 20);
  if (!vT.ok) { toast('Teléfono: ' + vT.msg); return; }

  const nuevo = {
    id: uid(),
    nombre: vN.valor,
    telefono: vT.valor,
    creado: new Date().toISOString()
  };
  await guardarCliente(nuevo);

  document.getElementById('nuevo-cliente-nombre').value = '';
  document.getElementById('nuevo-cliente-telefono').value = '';

  seleccionarCliente(nuevo.id);
}

// ------------------------------------------------------------
// Vendedor
// ------------------------------------------------------------

function abrirModalVendedor() {
  renderListaVendedores();
  document.getElementById('modal-vendedor').style.display = 'flex';
}

function cerrarModalVendedor() {
  document.getElementById('modal-vendedor').style.display = 'none';
}

function renderListaVendedores() {
  const cont = document.getElementById('lista-vendedores');
  if (!State.vendedores.length) {
    cont.innerHTML = `<div class="empty" style="padding:20px"><i class="ti ti-users-off"></i>Sin vendedores</div>`;
    return;
  }

  cont.innerHTML = State.vendedores.map(v => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="seleccionarVendedor('${v.id}')">
      <div style="font-weight:600">${v.nombre}</div>
      <i class="ti ti-chevron-right" style="color:var(--muted)"></i>
    </div>
  `).join('');
}

function seleccionarVendedor(id) {
  vendedorId = id;
  document.getElementById('texto-vendedor').textContent = nombreVendedor(id);
  cerrarModalVendedor();
}

function quitarVendedor() {
  vendedorId = null;
  document.getElementById('texto-vendedor').textContent = 'Sin vendedor';
  cerrarModalVendedor();
}

async function crearVendedorRapido() {
  const vN = Validar.texto(document.getElementById('nuevo-vendedor-nombre').value, 1, 60);
  if (!vN.ok) { toast('Nombre: ' + vN.msg); return; }

  const nuevo = {
    id: uid(),
    nombre: vN.valor,
    creado: new Date().toISOString()
  };
  await guardarVendedor(nuevo);

  document.getElementById('nuevo-vendedor-nombre').value = '';
  seleccionarVendedor(nuevo.id);
}

// ------------------------------------------------------------
// Modal de cobro
// ------------------------------------------------------------

function abrirModalCobro() {
  if (!ticket.length) { toast('Ticket vacío'); return; }

  const tot = calcularTotales();
  document.getElementById('cobro-total').textContent = money(tot.total);

  formaPago = 'efectivo';
  formaPagoMixto = null;
  montoMixto = 0;
  document.getElementById('mixto-detalle').style.display = 'none';
  document.getElementById('mixto-detalle').innerHTML = '';
  document.getElementById('cobro-recibido').value = '';
  document.getElementById('cobro-cambio').innerHTML = '';

  actualizarBotonesPago();
  document.getElementById('modal-cobro').style.display = 'flex';
}

function cerrarModalCobro() {
  document.getElementById('modal-cobro').style.display = 'none';
}

function actualizarBotonesPago() {
  document.querySelectorAll('[data-pago]').forEach(b => {
    const activo = b.dataset.pago === formaPago;
    b.classList.toggle('btn-primary', activo);
    b.classList.toggle('btn', !activo);
  });
}

function setFormaPago(fp) {
  formaPago = fp;
  actualizarBotonesPago();
}

function activarMixto() {
  const tot = calcularTotales();
  const mitad = Math.round(tot.total / 2);

  formaPagoMixto = formaPago === 'efectivo' ? 'transferencia' : 'efectivo';
  montoMixto = mitad;

  const cont = document.getElementById('mixto-detalle');
  cont.style.display = 'block';
  cont.innerHTML = `
    <div style="padding:10px;background:var(--bg);border-radius:8px">
      <div style="font-size:13px;margin-bottom:8px">Primera forma: <strong>${nombreFormaPago(formaPago)}</strong></div>
      <label>Segunda forma: ${nombreFormaPago(formaPagoMixto)}</label>
      <input class="input" type="number" min="0" step="0.01" id="mixto-monto" value="${montoMixto}" onchange="setMontoMixto(this.value)">
      <div style="font-size:12px;color:var(--muted);margin-top:6px" id="mixto-resumen"></div>
    </div>
  `;
  actualizarMixtoResumen();
}

function setMontoMixto(v) {
  const vv = Validar.numero(v, 0, 999999999);
  if (!vv.ok) { toast('Monto: ' + vv.msg); return; }
  montoMixto = vv.valor;
  actualizarMixtoResumen();
}

function actualizarMixtoResumen() {
  const tot = calcularTotales();
  const resto = tot.total - montoMixto;
  const el = document.getElementById('mixto-resumen');
  if (el) el.innerHTML = `Resto en ${nombreFormaPago(formaPago)}: <strong>${money(resto)}</strong>`;
}

function confirmarCobro() {
  const tot = calcularTotales();
  const total = tot.total;

  const recibido = parseFloat(document.getElementById('cobro-recibido').value) || 0;
  const zonaCambio = document.getElementById('cobro-cambio');

  if (formaPago === 'efectivo' || formaPago === 'usd') {
    if (recibido > 0 && recibido < total) {
      zonaCambio.innerHTML = `<span style="color:var(--danger)">Falta: ${money(total - recibido)}</span>`;
      return;
    }
  }

  if (formaPago === 'efectivo' && recibido > 0) {
    zonaCambio.innerHTML = `<span style="color:var(--success)">Cambio: ${money(recibido - total)}</span>`;
  }

  ejecutarCobro({
    total,
    subtotal: tot.subtotal,
    descuento: tot.descItems + tot.descTicket,
    formaPago,
    formaPagoMixto,
    montoMixto: formaPagoMixto ? montoMixto : 0,
    recibido
  });
}

async function ejecutarCobro(datos) {
  const venta = {
    id: ventaEditandoId || uid(),
    fecha: new Date().toISOString(),
    items: [...ticket],
    subtotal: datos.subtotal,
    descuento: datos.descuento,
    total: datos.total,
    turno_id: State.turno?.id || null,
    vendedor_id: vendedorId,
    cliente_id: clienteId,
    nota: notaVenta,
    forma_pago: datos.formaPago,
    forma_pago_mixto: datos.formaPagoMixto,
    monto_mixto: datos.montoMixto,
    recibido: datos.recibido,
    estado: 'cerrada'
  };

  if (ventaEditandoId) {
    await finalizarVentaEnEspera(ventaEditandoId, venta);
  } else {
    await guardarVenta(venta);
  }

  toast('Venta registrada');
  cerrarModalCobro();
  vaciarTicket();
  renderAlertas();
  renderBadgeEspera();
}

// ------------------------------------------------------------
// Ventas en espera
// ------------------------------------------------------------

async function ponerEnEspera() {
  if (!ticket.length) { toast('Ticket vacío'); return; }
  const tot = calcularTotales();

  const venta = {
    id: uid(),
    fecha: new Date().toISOString(),
    items: [...ticket],
    subtotal: tot.subtotal,
    descuento: tot.descuento + tot.descTicket,
    total: tot.total,
    turno_id: State.turno?.id || null,
    vendedor_id: vendedorId,
    cliente_id: clienteId,
    nota: notaVenta,
    estado: 'espera'
  };

  await guardarVenta(venta);
  toast('Venta en espera');
  vaciarTicket();
  renderBadgeEspera();
}

function abrirModalEspera() {
  renderListaEspera();
  document.getElementById('modal-espera').style.display = 'flex';
}

function cerrarModalEspera() {
  document.getElementById('modal-espera').style.display = 'none';
}

function renderListaEspera() {
  const cont = document.getElementById('lista-espera');
  if (!State.ventasEnEspera.length) {
    cont.innerHTML = `<div class="empty"><i class="ti ti-clock-off"></i>Sin ventas en espera</div>`;
    return;
  }

  cont.innerHTML = State.ventasEnEspera.map(v => {
    const fecha = new Date(v.fecha).toLocaleString('es-CU');
    const cliente = v.cliente_id ? nombreCliente(v.cliente_id) : 'Cliente ocasional';
    const items = v.items.map(i => `${fmt(i.cant)}x ${i.nombre}`).join(', ');
    return `
      <div style="padding:12px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:8px">
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:15px">${money(v.total)}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">${fecha} · ${cliente}</div>
            <div style="font-size:12px;margin-top:4px">${items}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-top:8px">
          <button class="btn btn-primary" style="flex:1" onclick="recuperarEspera('${v.id}')">
            <i class="ti ti-arrow-back-up"></i> Recuperar
          </button>
          <button class="btn btn-danger" onclick="borrarEspera('${v.id}')">
            <i class="ti ti-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function recuperarEspera(id) {
  const venta = State.ventasEnEspera.find(v => v.id === id);
  if (!venta) return;

  ticket = venta.items.map(i => ({ ...i }));
  descuentoTicket = { tipo: 'porciento', valor: 0 };
  notaVenta = venta.nota || '';
  clienteId = venta.cliente_id || null;
  vendedorId = venta.vendedor_id || null;
  ventaEditandoId = venta.id;

  if (notaVenta) {
    document.getElementById('nota-venta').style.display = 'block';
    document.getElementById('nota-venta').textContent = 'Nota: ' + notaVenta;
  }
  document.getElementById('texto-cliente').textContent = nombreCliente(clienteId);
  document.getElementById('texto-vendedor').textContent = nombreVendedor(vendedorId);

  cerrarModalEspera();
  renderTicket();
  toast('Venta recuperada');
}

async function borrarEspera(id) {
  if (!confirm('¿Eliminar esta venta en espera?')) return;
  await eliminarVentaEnEspera(id);
  renderListaEspera();
  renderBadgeEspera();
}

// ------------------------------------------------------------
// Arranque
// ------------------------------------------------------------

window.addEventListener('estado-listo', () => {
  renderTicket();
  renderAlertas();
  renderBadgeEspera();

  document.getElementById('buscar').addEventListener('input', e => renderResultados(e.target.value));
  document.getElementById('btn-vaciar').addEventListener('click', vaciarTicket);
  document.getElementById('btn-cobrar').addEventListener('click', abrirModalCobro);
  document.getElementById('btn-esperar').addEventListener('click', ponerEnEspera);
  document.getElementById('btn-espera').addEventListener('click', abrirModalEspera);
  document.getElementById('btn-descuento-ticket').addEventListener('click', abrirModalDescuento);
  document.getElementById('btn-notas').addEventListener('click', abrirModalNota);
  document.getElementById('btn-cliente').addEventListener('click', abrirModalCliente);
  document.getElementById('btn-vendedor').addEventListener('click', abrirModalVendedor);
  document.getElementById('btn-clientes').addEventListener('click', abrirModalCliente);
  document.getElementById('btn-activar-mixto').addEventListener('click', activarMixto);

  document.getElementById('buscar-cliente').addEventListener('input', e => renderListaClientes(e.target.value));

  document.getElementById('cobro-recibido').addEventListener('input', () => {
    const tot = calcularTotales();
    const r = parseFloat(document.getElementById('cobro-recibido').value) || 0;
    const zona = document.getElementById('cobro-cambio');
    if (r === 0) { zona.innerHTML = ''; return; }
    if (r < tot.total) {
      zona.innerHTML = `<span style="color:var(--danger)">Falta: ${money(tot.total - r)}</span>`;
    } else {
      zona.innerHTML = `<span style="color:var(--success)">Cambio: ${money(r - tot.total)}</span>`;
    }
  });
});

window.addEventListener('negocio-cambiado', () => {
  vaciarTicket();
  renderAlertas();
  renderBadgeEspera();
});

window.cerrarModalCobro = cerrarModalCobro;
window.setFormaPago = setFormaPago;
window.confirmarCobro = confirmarCobro;
window.cerrarModalDescuento = cerrarModalDescuento;
window.aplicarDescuento = aplicarDescuento;
window.quitarDescuento = quitarDescuento;
window.cerrarModalNota = cerrarModalNota;
window.guardarNota = guardarNota;
window.cerrarModalCliente = cerrarModalCliente;
window.seleccionarCliente = seleccionarCliente;
window.quitarCliente = quitarCliente;
window.crearClienteRapido = crearClienteRapido;
window.cerrarModalVendedor = cerrarModalVendedor;
window.seleccionarVendedor = seleccionarVendedor;
window.quitarVendedor = quitarVendedor;
window.crearVendedorRapido = crearVendedorRapido;
window.cerrarModalEspera = cerrarModalEspera;
window.recuperarEspera = recuperarEspera;
window.borrarEspera = borrarEspera;
window.setMontoMixto = setMontoMixto;
window.abrirDescuentoItem = abrirDescuentoItem;
