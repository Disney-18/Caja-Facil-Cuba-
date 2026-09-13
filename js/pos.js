// ============================================================
// CajaFácil Cuba - Punto de venta con precios variables
// Bloque 4: precio editable, unidad de medida, alertas de stock
// Desarrollado por Disney Gutiérrez Guevara
// ============================================================

let ticket = [];

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
      unidad: p.unidad || 'unidad'
    });
  }
  renderTicket();
  document.getElementById('buscar').value = '';
  document.getElementById('resultados').innerHTML = '';
}

function renderTicket() {
  const tb = document.getElementById('ticket');
  if (!ticket.length) {
    tb.innerHTML = `<tr><td colspan="5"><div class="empty"><i class="ti ti-shopping-cart-off"></i>Ticket vacío</div></td></tr>`;
  } else {
    tb.innerHTML = ticket.map((t, i) => {
      const uni = nombreUnidad(t.unidad).toLowerCase();
      const precioCambiado = t.precio !== t.precioSugerido;
      return `
        <tr>
          <td>
            <div>${t.nombre}</div>
            <div style="font-size:11px;color:var(--muted)">${uni}</div>
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
          <td>${fmt(t.precio * t.cant)}</td>
          <td><button class="icon-btn" style="width:26px;height:26px" onclick="delItem(${i})"><i class="ti ti-x"></i></button></td>
        </tr>
      `;
    }).join('');
  }
  const total = ticket.reduce((s, t) => s + t.precio * t.cant, 0);
  document.getElementById('total').textContent = money(total);
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
function vaciarTicket() { ticket = []; renderTicket(); }

async function cobrar() {
  if (!ticket.length) { toast('Ticket vacío'); return; }
  const total = ticket.reduce((s, t) => s + t.precio * t.cant, 0);
  await guardarVenta({
    id: uid(),
    fecha: new Date().toISOString(),
    items: [...ticket],
    total,
    turno_id: State.turno?.id || null
  });
  toast('Venta registrada');
  vaciarTicket();
  renderAlertas();
}

window.addEventListener('estado-listo', () => {
  renderTicket();
  renderAlertas();
  document.getElementById('buscar').addEventListener('input', e => renderResultados(e.target.value));
  document.getElementById('btn-vaciar').addEventListener('click', vaciarTicket);
  document.getElementById('btn-cobrar').addEventListener('click', cobrar);
});

window.addEventListener('negocio-cambiado', () => {
  ticket = [];
  renderTicket();
  renderAlertas();
});
