// ============================================================
// CajaFácil Cuba - Inventario con validación
// Desarrollado por Disney Gutiérrez Guevara
// ============================================================

let editId = null;

function renderInventario(filtro = '') {
  const tb = document.getElementById('lista');
  const q = filtro.trim().toLowerCase();
  const lista = State.productos.filter(p =>
    !q || p.nombre.toLowerCase().includes(q) || (p.codigo || '').toLowerCase().includes(q)
  );
  if (!lista.length) {
    tb.innerHTML = `<tr><td colspan="4"><div class="empty"><i class="ti ti-box-off"></i>Sin productos</div></td></tr>`;
    return;
  }
  tb.innerHTML = lista.map(p => `
    <tr>
      <td>
        <div style="font-weight:600">${p.nombre}</div>
        <div style="font-size:11px;color:var(--muted)">${p.codigo || '—'}</div>
      </td>
      <td>${fmt(p.precio)}</td>
      <td>
        <span class="badge ${p.stock <= 0 ? 'badge-danger' : p.stock < 5 ? 'badge-warn' : 'badge-ok'}">
          ${p.stock}
        </span>
      </td>
      <td style="text-align:right">
        <button class="icon-btn" style="width:32px;height:32px" onclick="editar('${p.id}')"><i class="ti ti-pencil"></i></button>
        <button class="icon-btn" style="width:32px;height:32px" onclick="eliminar('${p.id}')"><i class="ti ti-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

function mostrarForm(show) {
  document.getElementById('form-card').style.display = show ? 'block' : 'none';
}

function nuevo() {
  editId = null;
  document.getElementById('p-nombre').value = '';
  document.getElementById('p-codigo').value = '';
  document.getElementById('p-precio').value = '';
  document.getElementById('p-stock').value = '';
  mostrarForm(true);
}

function editar(id) {
  const p = State.productos.find(x => x.id === id);
  if (!p) return;
  editId = id;
  document.getElementById('p-nombre').value = p.nombre;
  document.getElementById('p-codigo').value = p.codigo || '';
  document.getElementById('p-precio').value = p.precio;
  document.getElementById('p-stock').value = p.stock;
  mostrarForm(true);
}

async function guardar() {
  const vNombre = Validar.texto(document.getElementById('p-nombre').value, 1, 80);
  if (!vNombre.ok) { toast('Nombre: ' + vNombre.msg); return; }

  const vCodigo = Validar.texto(document.getElementById('p-codigo').value || '', 0, 40);
  if (!vCodigo.ok) { toast('Código: ' + vCodigo.msg); return; }

  const vPrecio = Validar.numero(document.getElementById('p-precio').value, 0, 999999999);
  if (!vPrecio.ok) { toast('Precio: ' + vPrecio.msg); return; }

  const vStock = Validar.entero(document.getElementById('p-stock').value, 0, 999999999);
  if (!vStock.ok) { toast('Stock: ' + vStock.msg); return; }

  const nombre = vNombre.valor;
  const codigo = vCodigo.valor;
  const precio = vPrecio.valor;
  const stock = vStock.valor;

  if (editId) {
    const p = State.productos.find(x => x.id === editId);
    Object.assign(p, { nombre, codigo, precio, stock });
    await guardarProducto(p);
  } else {
    await guardarProducto({ id: uid(), nombre, codigo, precio, stock });
  }
  mostrarForm(false);
  renderInventario(document.getElementById('filtro').value);
  toast('Guardado');
}

async function eliminar(id) {
  if (!confirm('¿Eliminar producto?')) return;
  await eliminarProducto(id);
  renderInventario(document.getElementById('filtro').value);
}

window.addEventListener('estado-listo', () => {
  renderInventario();
  document.getElementById('btn-nuevo').addEventListener('click', nuevo);
  document.getElementById('btn-cancelar').addEventListener('click', () => mostrarForm(false));
  document.getElementById('btn-guardar').addEventListener('click', guardar);
  document.getElementById('filtro').addEventListener('input', e => renderInventario(e.target.value));
});

window.addEventListener('negocio-cambiado', () => {
  renderInventario(document.getElementById('filtro')?.value || '');
});
