let ticket = [];

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
  cont.innerHTML = matches.map(p => `
    <div class="card" style="padding:10px;margin:6px 0;cursor:pointer" onclick="addTicket('${p.id}')">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-weight:600">${p.nombre}</div>
          <div style="font-size:12px;color:var(--muted)">Stock: ${p.stock} · ${p.codigo || 'sin código'}</div>
        </div>
        <div style="font-weight:600;color:var(--primary)">${money(p.precio)}</div>
      </div>
    </div>
  `).join('');
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
    ticket.push({ id, nombre: p.nombre, precio: p.precio, cant: 1 });
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
    tb.innerHTML = ticket.map((t, i) => `
      <tr>
        <td>${t.nombre}</td>
        <td>
          <button class="icon-btn" style="width:28px;height:28px" onclick="changeCant(${i},-1)">−</button>
          <span style="margin:0 6px">${t.cant}</span>
          <button class="icon-btn" style="width:28px;height:28px" onclick="changeCant(${i},1)">+</button>
        </td>
        <td>${fmt(t.precio)}</td>
        <td>${fmt(t.precio * t.cant)}</td>
        <td><button class="icon-btn" style="width:28px;height:28px" onclick="delItem(${i})"><i class="ti ti-x"></i></button></td>
      </tr>
    `).join('');
  }
  const total = ticket.reduce((s, t) => s + t.precio * t.cant, 0);
  document.getElementById('total').textContent = money(total);
}

function changeCant(i, d) {
  ticket[i].cant += d;
  if (ticket[i].cant <= 0) ticket.splice(i, 1);
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
}

window.addEventListener('estado-listo', () => {
  renderTicket();
  document.getElementById('buscar').addEventListener('input', e => renderResultados(e.target.value));
  document.getElementById('btn-vaciar').addEventListener('click', vaciarTicket);
  document.getElementById('btn-cobrar').addEventListener('click', cobrar);
});

window.addEventListener('negocio-cambiado', () => {
  ticket = [];
  renderTicket();
});
