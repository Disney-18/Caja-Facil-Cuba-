// ============================================================
// CajaFácil Cuba - Inventario renovado
// Bloque 4: categorías, unidades, precios variables, movimientos
// Desarrollado por Disney Gutiérrez Guevara
// ============================================================

let editId = null;
let panelProductoId = null;

function renderInventario(filtro = '', categoriaId = '') {
  const tb = document.getElementById('lista');
  const q = filtro.trim().toLowerCase();
  const lista = State.productos.filter(p => {
    if (categoriaId && p.categoria_id !== categoriaId) return false;
    if (!q) return true;
    return p.nombre.toLowerCase().includes(q) || (p.codigo || '').toLowerCase().includes(q);
  });

  if (!lista.length) {
    tb.innerHTML = `<tr><td colspan="4"><div class="empty"><i class="ti ti-box-off"></i>Sin productos</div></td></tr>`;
    return;
  }

  tb.innerHTML = lista.map(p => {
    const min = p.stock_minimo || 0;
    const stock = p.stock || 0;
    const badge = min > 0 && stock <= min ? (stock <= 0 ? 'badge-danger' : 'badge-warn') : 'badge-ok';
    const cat = p.categoria_id ? nombreCategoria(p.categoria_id) : '';
    const uni = p.unidad ? nombreUnidad(p.unidad) : 'Unidad';
    return `
      <tr>
        <td onclick="abrirProducto('${p.id}')" style="cursor:pointer">
          <div style="font-weight:600">${p.nombre}</div>
          <div style="font-size:11px;color:var(--muted)">${cat ? cat + ' · ' : ''}${uni}${p.codigo ? ' · ' + p.codigo : ''}</div>
        </td>
        <td onclick="abrirProducto('${p.id}')" style="cursor:pointer">${fmt(p.precio)}</td>
        <td onclick="abrirProducto('${p.id}')" style="cursor:pointer">
          <span class="badge ${badge}">${fmt(stock)}</span>
        </td>
        <td style="text-align:right">
          <button class="icon-btn" style="width:32px;height:32px" onclick="abrirProducto('${p.id}')"><i class="ti ti-eye"></i></button>
          <button class="icon-btn" style="width:32px;height:32px" onclick="editarProducto('${p.id}')"><i class="ti ti-pencil"></i></button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderSelectores() {
  const selCat = document.getElementById('p-categoria');
  selCat.innerHTML = `<option value="">Sin categoría</option>` +
    State.categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');

  const selUni = document.getElementById('p-unidad');
  selUni.innerHTML = UNIDADES.map(u => `<option value="${u.id}">${u.nombre}</option>`).join('');

  const filtroCat = document.getElementById('filtro-categoria');
  filtroCat.innerHTML = `<option value="">Todas las categorías</option>` +
    State.categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
}

function renderListaCategorias() {
  const cont = document.getElementById('lista-categorias');
  if (!State.categorias.length) {
    cont.innerHTML = `<div class="empty"><i class="ti ti-tag-off"></i>Sin categorías</div>`;
    return;
  }
  cont.innerHTML = State.categorias.map(c => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
      <span>${c.nombre}</span>
      <button class="icon-btn" style="width:32px;height:32px" onclick="borrarCategoria('${c.id}')">
        <i class="ti ti-trash"></i>
      </button>
    </div>
  `).join('');
}

function mostrarFormProducto(show) {
  document.getElementById('form-producto').style.display = show ? 'block' : 'none';
  if (show) document.getElementById('form-categoria').style.display = 'none';
}

function mostrarFormCategoria(show) {
  document.getElementById('form-categoria').style.display = show ? 'block' : 'none';
  if (show) {
    document.getElementById('form-producto').style.display = 'none';
    renderListaCategorias();
  }
}

function nuevoProducto() {
  editId = null;
  document.getElementById('p-nombre').value = '';
  document.getElementById('p-codigo').value = '';
  document.getElementById('p-categoria').value = '';
  document.getElementById('p-unidad').value = 'unidad';
  document.getElementById('p-precio').value = '';
  document.getElementById('p-costo').value = '';
  document.getElementById('p-stock').value = '';
  document.getElementById('p-stock-minimo').value = '0';
  document.getElementById('form-producto-titulo').textContent = 'Nuevo producto';
  actualizarMargen();
  mostrarFormProducto(true);
}

function editarProducto(id) {
  const p = State.productos.find(x => x.id === id);
  if (!p) return;
  editId = id;
  document.getElementById('p-nombre').value = p.nombre;
  document.getElementById('p-codigo').value = p.codigo || '';
  document.getElementById('p-categoria').value = p.categoria_id || '';
  document.getElementById('p-unidad').value = p.unidad || 'unidad';
  document.getElementById('p-precio').value = p.precio;
  document.getElementById('p-costo').value = p.costo || '';
  document.getElementById('p-stock').value = p.stock;
  document.getElementById('p-stock-minimo').value = p.stock_minimo || 0;
  document.getElementById('form-producto-titulo').textContent = 'Editar producto';
  actualizarMargen();
  mostrarFormProducto(true);
}

function actualizarMargen() {
  const precio = parseFloat(document.getElementById('p-precio').value) || 0;
  const costo = parseFloat(document.getElementById('p-costo').value) || 0;
  const el = document.getElementById('p-margen');
  if (costo > 0 && precio > 0) {
    const m = ((precio - costo) / costo) * 100;
    const ganancia = precio - costo;
    el.innerHTML = `Margen: <strong>${m.toFixed(1)}%</strong> · Ganancia por unidad: <strong>${fmt(ganancia)} CUP</strong>`;
  } else {
    el.innerHTML = '';
  }
}

async function guardarProductoHandler() {
  const vN = Validar.texto(document.getElementById('p-nombre').value, 1, 80);
  if (!vN.ok) { toast('Nombre: ' + vN.msg); return; }

  const vC = Validar.texto(document.getElementById('p-codigo').value || '', 0, 40);
  if (!vC.ok) { toast('Código: ' + vC.msg); return; }

  const vP = Validar.numero(document.getElementById('p-precio').value, 0, 999999999);
  if (!vP.ok) { toast('Precio: ' + vP.msg); return; }

  const vCo = Validar.numero(document.getElementById('p-costo').value || 0, 0, 999999999);
  if (!vCo.ok) { toast('Costo: ' + vCo.msg); return; }

  const vS = Validar.numero(document.getElementById('p-stock').value || 0, 0, 999999999);
  if (!vS.ok) { toast('Stock: ' + vS.msg); return; }

  const vM = Validar.numero(document.getElementById('p-stock-minimo').value || 0, 0, 999999999);
  if (!vM.ok) { toast('Stock mínimo: ' + vM.msg); return; }

  const datos = {
    nombre: vN.valor,
    codigo: vC.valor,
    categoria_id: document.getElementById('p-categoria').value || null,
    unidad: document.getElementById('p-unidad').value || 'unidad',
    precio: vP.valor,
    costo: vCo.valor,
    stock: vS.valor,
    stock_minimo: vM.valor
  };

  if (editId) {
    const p = State.productos.find(x => x.id === editId);
    Object.assign(p, datos);
    await guardarProducto(p);
  } else {
    await guardarProducto({ id: uid(), ...datos, creado: new Date().toISOString() });
  }

  mostrarFormProducto(false);
  renderInventario(document.getElementById('filtro').value, document.getElementById('filtro-categoria').value);
  toast('Guardado');
}

async function guardarCategoriaHandler() {
  const v = Validar.texto(document.getElementById('c-nombre').value, 1, 40);
  if (!v.ok) { toast('Nombre: ' + v.msg); return; }
  await guardarCategoria({ id: uid(), nombre: v.valor });
  document.getElementById('c-nombre').value = '';
  renderListaCategorias();
  renderSelectores();
  renderInventario(document.getElementById('filtro').value, document.getElementById('filtro-categoria').value);
  toast('Categoría creada');
}

async function borrarCategoria(id) {
  if (!confirm('¿Eliminar esta categoría? Los productos quedarán sin categoría.')) return;
  await eliminarCategoria(id);
  renderListaCategorias();
  renderSelectores();
  renderInventario(document.getElementById('filtro').value, document.getElementById('filtro-categoria').value);
}

// ------------------------------------------------------------
// Panel de detalle del producto
// ------------------------------------------------------------

function abrirProducto(id) {
  const p = State.productos.find(x => x.id === id);
  if (!p) return;
  panelProductoId = id;

  const movs = State.movimientosInv.filter(m => m.producto_id === id).slice(0, 30);
  const margen = p.costo > 0 ? ((p.precio - p.costo) / p.costo) * 100 : null;

  const html = `
    <div class="card">
      <div style="font-size:18px;font-weight:700">${p.nombre}</div>
      <div style="font-size:12px;color:var(--muted);margin-top:4px">
        ${p.categoria_id ? nombreCategoria(p.categoria_id) : 'Sin categoría'} · ${nombreUnidad(p.unidad || 'unidad')}
        ${p.codigo ? ' · ' + p.codigo : ''}
      </div>

      <table style="margin-top:12px">
        <tr><td>Precio sugerido</td><td style="text-align:right;font-weight:600">${money(p.precio)}</td></tr>
        ${p.costo > 0 ? `<tr><td>Costo</td><td style="text-align:right">${money(p.costo)}</td></tr>` : ''}
        ${margen !== null ? `<tr><td>Margen</td><td style="text-align:right;color:var(--success);font-weight:600">${margen.toFixed(1)}%</td></tr>` : ''}
        <tr><td>Stock actual</td><td style="text-align:right;font-weight:600">${fmt(p.stock)} ${nombreUnidad(p.unidad || 'unidad').toLowerCase()}</td></tr>
        ${p.stock_minimo > 0 ? `<tr><td>Stock mínimo</td><td style="text-align:right">${fmt(p.stock_minimo)}</td></tr>` : ''}
      </table>
    </div>

    <div class="card">
      <strong style="display:block;margin-bottom:10px">Registrar movimiento</strong>

      <label>Tipo</label>
      <select class="input" id="m-tipo">
        <option value="entrada">Entrada de mercancía</option>
        <option value="salida">Salida (merma, rotura)</option>
        <option value="ajuste">Ajuste (conteo físico)</option>
      </select>

      <div class="grid grid-2" style="margin-top:12px">
        <div>
          <label>Cantidad</label>
          <input class="input" id="m-cantidad" type="number" min="0" step="0.01">
        </div>
        <div>
          <label>Costo unitario (opcional)</label>
          <input class="input" id="m-costo" type="number" min="0" step="0.01">
        </div>
      </div>

      <label style="margin-top:12px">Motivo</label>
      <input class="input" id="m-motivo" placeholder="Ej: compra a proveedor, rotura, conteo mensual" maxlength="100">

      <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="registrarMovimientoPanel()">
        <i class="ti ti-check"></i> Registrar
      </button>
    </div>

    <div class="card">
      <strong style="display:block;margin-bottom:10px">Movimientos recientes</strong>
      ${movs.length ? movs.map(m => `
        <div style="padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:600">
                ${m.tipo === 'entrada' ? '+' : m.tipo === 'salida' ? '−' : '='} ${fmt(m.cantidad)}
                <span style="font-size:11px;color:var(--muted);font-weight:400"> · ${m.motivo || 'Sin motivo'}</span>
              </div>
              <div style="font-size:11px;color:var(--muted)">${new Date(m.fecha).toLocaleString('es-CU')}</div>
            </div>
          </div>
        </div>
      `).join('') : `<div class="empty"><i class="ti ti-history-off"></i>Sin movimientos</div>`}
    </div>

    <div class="card">
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" style="flex:1" onclick="cerrarPanelYEditar('${p.id}')">
          <i class="ti ti-pencil"></i> Editar
        </button>
        <button class="btn btn-danger" onclick="eliminarProductoPanel('${p.id}')">
          <i class="ti ti-trash"></i> Eliminar
        </button>
      </div>
    </div>
  `;

  document.getElementById('panel-titulo').textContent = 'Detalle del producto';
  document.getElementById('panel-contenido').innerHTML = html;
  document.getElementById('panel').style.display = 'block';
  document.getElementById('panel').scrollTop = 0;
}

function cerrarPanel() {
  document.getElementById('panel').style.display = 'none';
}

function cerrarPanelYEditar(id) {
  cerrarPanel();
  editarProducto(id);
}

async function registrarMovimientoPanel() {
  const vC = Validar.numero(document.getElementById('m-cantidad').value, 0.01, 999999999);
  if (!vC.ok) { toast('Cantidad: ' + vC.msg); return; }

  const vCo = Validar.numero(document.getElementById('m-costo').value || 0, 0, 999999999);
  if (!vCo.ok) { toast('Costo: ' + vCo.msg); return; }

  const vM = Validar.texto(document.getElementById('m-motivo').value || '', 0, 100);
  if (!vM.ok) { toast('Motivo: ' + vM.msg); return; }

  const tipo = document.getElementById('m-tipo').value;

  await registrarMovimientoInv({
    id: uid(),
    producto_id: panelProductoId,
    tipo,
    cantidad: vC.valor,
    costo_unitario: vCo.valor,
    motivo: vM.valor || (tipo === 'entrada' ? 'Entrada de mercancía' : tipo === 'salida' ? 'Salida' : 'Ajuste'),
    fecha: new Date().toISOString()
  });

  toast('Movimiento registrado');
  abrirProducto(panelProductoId);
  renderInventario(document.getElementById('filtro').value, document.getElementById('filtro-categoria').value);
}

async function eliminarProductoPanel(id) {
  if (!confirm('¿Eliminar este producto y su historial de movimientos?')) return;
  await eliminarProducto(id);
  cerrarPanel();
  renderInventario(document.getElementById('filtro').value, document.getElementById('filtro-categoria').value);
  toast('Producto eliminado');
}

// ------------------------------------------------------------
// Arranque
// ------------------------------------------------------------

window.addEventListener('estado-listo', () => {
  renderSelectores();
  renderInventario();

  document.getElementById('btn-nuevo-producto').addEventListener('click', nuevoProducto);
  document.getElementById('btn-nueva-categoria').addEventListener('click', () => mostrarFormCategoria(true));
  document.getElementById('btn-guardar-producto').addEventListener('click', guardarProductoHandler);
  document.getElementById('btn-cancelar-producto').addEventListener('click', () => mostrarFormProducto(false));
  document.getElementById('btn-guardar-categoria').addEventListener('click', guardarCategoriaHandler);
  document.getElementById('btn-cerrar-categoria').addEventListener('click', () => mostrarFormCategoria(false));

  document.getElementById('p-precio').addEventListener('input', actualizarMargen);
  document.getElementById('p-costo').addEventListener('input', actualizarMargen);

  document.getElementById('filtro').addEventListener('input', e => {
    renderInventario(e.target.value, document.getElementById('filtro-categoria').value);
  });
  document.getElementById('filtro-categoria').addEventListener('change', e => {
    renderInventario(document.getElementById('filtro').value, e.target.value);
  });
});

window.addEventListener('negocio-cambiado', () => {
  renderSelectores();
  renderInventario(document.getElementById('filtro')?.value || '', document.getElementById('filtro-categoria')?.value || '');
});

window.cerrarPanel = cerrarPanel;
window.abrirProducto = abrirProducto;
