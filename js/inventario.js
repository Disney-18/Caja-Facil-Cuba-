// ============================================================
// CajaFácil Cuba - Inventario renovado + Bloque 4.1
// Escaneo, etiquetas, importar y exportar CSV
// Desarrollado por Disney Gutiérrez Guevara
// ============================================================

let editId = null;
let panelProductoId = null;
let streamEscaner = null;
let intervaloEscaner = null;
let modoEscaner = 'producto';

// ------------------------------------------------------------
// Render principal
// ------------------------------------------------------------

function renderInventario(filtro = '', categoriaId = '', filtroStock = '') {
  const tb = document.getElementById('lista');
  const q = filtro.trim().toLowerCase();

  const lista = State.productos.filter(p => {
    if (categoriaId && p.categoria_id !== categoriaId) return false;

    if (filtroStock === 'bajo') {
      const min = p.stock_minimo || 0;
      if (!(min > 0 && (p.stock || 0) <= min)) return false;
    } else if (filtroStock === 'disponible') {
      if ((p.stock || 0) <= 0) return false;
    }

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

function aplicarFiltros() {
  renderInventario(
    document.getElementById('filtro').value,
    document.getElementById('filtro-categoria').value,
    document.getElementById('filtro-stock').value
  );
}

// ------------------------------------------------------------
// Formularios
// ------------------------------------------------------------

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
  aplicarFiltros();
  toast('Guardado');
}

async function guardarCategoriaHandler() {
  const v = Validar.texto(document.getElementById('c-nombre').value, 1, 40);
  if (!v.ok) { toast('Nombre: ' + v.msg); return; }
  await guardarCategoria({ id: uid(), nombre: v.valor });
  document.getElementById('c-nombre').value = '';
  renderListaCategorias();
  renderSelectores();
  aplicarFiltros();
  toast('Categoría creada');
}

async function borrarCategoria(id) {
  if (!confirm('¿Eliminar esta categoría? Los productos quedarán sin categoría.')) return;
  await eliminarCategoria(id);
  renderListaCategorias();
  renderSelectores();
  aplicarFiltros();
}

// ------------------------------------------------------------
// Panel de detalle
// ------------------------------------------------------------

function abrirProducto(id) {
  const p = State.productos.find(x => x.id === id);
  if (!p) return;
  panelProductoId = id;

  const movs = State.movimientosInv.filter(m => m.producto_id === id).slice(0, 30);
  const margen = p.costo > 0 ? ((p.precio - p.costo) / p.costo) * 100 : null;
  const tieneCodigo = p.codigo && p.codigo.trim().length > 0;

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

    ${tieneCodigo ? `
    <div class="card">
      <strong style="display:block;margin-bottom:10px">Etiqueta</strong>
      <div style="display:flex;gap:10px;margin-bottom:10px">
        <button class="btn" style="flex:1" onclick="mostrarEtiqueta('${p.id}','barcode')">
          <i class="ti ti-barcode"></i> Código de barras
        </button>
        <button class="btn" style="flex:1" onclick="mostrarEtiqueta('${p.id}','qr')">
          <i class="ti ti-qrcode"></i> Código QR
        </button>
      </div>
      <div id="etiqueta-zona"></div>
    </div>
    ` : `
    <div class="card">
      <div style="font-size:13px;color:var(--muted)">
        Este producto no tiene código. Añádele uno para generar su etiqueta.
      </div>
    </div>
    `}

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
  aplicarFiltros();
}

async function eliminarProductoPanel(id) {
  if (!confirm('¿Eliminar este producto y su historial de movimientos?')) return;
  await eliminarProducto(id);
  cerrarPanel();
  aplicarFiltros();
  toast('Producto eliminado');
}

// ------------------------------------------------------------
// Etiquetas: código de barras y QR
// ------------------------------------------------------------

function mostrarEtiqueta(id, tipo) {
  const p = State.productos.find(x => x.id === id);
  if (!p || !p.codigo) return;

  const zona = document.getElementById('etiqueta-zona');
  zona.innerHTML = `
    <div id="etiqueta-imprimible" class="etiqueta">
      <div class="etiqueta-nombre">${p.nombre}</div>
      <div class="etiqueta-precio">${money(p.precio)}</div>
      <div class="etiqueta-codigo" id="etiqueta-grafico"></div>
      <div class="etiqueta-codigo-texto">${p.codigo}</div>
    </div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn btn-primary" style="flex:1" onclick="imprimirEtiqueta()">
        <i class="ti ti-printer"></i> Imprimir
      </button>
      <button class="btn" onclick="document.getElementById('etiqueta-zona').innerHTML=''">
        Cerrar
      </button>
    </div>
  `;

  if (tipo === 'barcode') {
    try {
      JsBarcode('#etiqueta-grafico', p.codigo, {
        format: 'CODE128',
        displayValue: false,
        height: 50,
        margin: 0
      });
    } catch {
      zona.querySelector('#etiqueta-grafico').innerHTML = 'Código no válido para barras';
    }
  } else {
    const cont = zona.querySelector('#etiqueta-grafico');
    cont.innerHTML = '';
    const canvas = document.createElement('canvas');
    cont.appendChild(canvas);
    if (window.QRCode && QRCode.toCanvas) {
      QRCode.toCanvas(canvas, p.codigo, { width: 140, margin: 1 });
    } else {
      cont.innerHTML = 'Generador QR no disponible';
    }
  }
}

function imprimirEtiqueta() {
  const contenido = document.getElementById('etiqueta-imprimible');
  if (!contenido) return;

  const ventana = window.open('', '_blank', 'width=400,height=600');
  ventana.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Etiqueta</title>
      <style>
        body {
          font-family: system-ui, sans-serif;
          padding: 20px;
          text-align: center;
          color: #000;
        }
        .etiqueta {
          display: inline-block;
          border: 1px solid #000;
          padding: 12px;
          border-radius: 8px;
          min-width: 200px;
        }
        .etiqueta-nombre {
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .etiqueta-precio {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .etiqueta-codigo svg,
        .etiqueta-codigo canvas {
          max-width: 100%;
          height: auto;
        }
        .etiqueta-codigo-texto {
          font-size: 11px;
          margin-top: 4px;
          letter-spacing: 1px;
        }
      </style>
    </head>
    <body>${contenido.outerHTML}</body>
    </html>
  `);
  ventana.document.close();
  ventana.focus();
  setTimeout(() => { ventana.print(); }, 300);
}

// ------------------------------------------------------------
// Escáner de códigos de barras
// ------------------------------------------------------------

async function abrirEscaner(modo = 'producto') {
  modoEscaner = modo;

  if (!('BarcodeDetector' in window)) {
    toast('Escáner no soportado en este navegador');
    return;
  }

  const modal = document.getElementById('modal-escanner');
  modal.style.display = 'flex';

  const info = document.getElementById('escanner-info');
  info.textContent = 'Iniciando cámara...';

  try {
    streamEscaner = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    const video = document.getElementById('video-escanner');
    video.srcObject = streamEscaner;
    await video.play();

    info.textContent = 'Apunta la cámara al código de barras';

    const detector = new BarcodeDetector({
      formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code']
    });

    intervaloEscaner = setInterval(async () => {
      try {
        const codigos = await detector.detect(video);
        if (codigos.length > 0) {
          const valor = codigos[0].rawValue;
          detenerEscaner();
          aplicarCodigoEscaneado(valor);
        }
      } catch {}
    }, 400);

  } catch (e) {
    toast('No se pudo acceder a la cámara');
    cerrarEscaner();
  }
}

function detenerEscaner() {
  if (intervaloEscaner) {
    clearInterval(intervaloEscaner);
    intervaloEscaner = null;
  }
  if (streamEscaner) {
    streamEscaner.getTracks().forEach(t => t.stop());
    streamEscaner = null;
  }
}

function cerrarEscaner() {
  detenerEscaner();
  document.getElementById('modal-escanner').style.display = 'none';
}

function aplicarCodigoEscaneado(valor) {
  if (modoEscaner === 'producto') {
    document.getElementById('p-codigo').value = valor;
  }
  toast('Código: ' + valor);
}

// ------------------------------------------------------------
// Importar y exportar CSV
// ------------------------------------------------------------

function exportarInventarioCSV() {
  if (!State.productos.length) { toast('Sin productos'); return; }

  const filas = [['Nombre', 'Codigo', 'Categoria', 'Unidad', 'Precio', 'Costo', 'Stock', 'StockMinimo']];

  for (const p of State.productos) {
    filas.push([
      p.nombre,
      p.codigo || '',
      p.categoria_id ? nombreCategoria(p.categoria_id) : '',
      p.unidad || 'unidad',
      p.precio || 0,
      p.costo || 0,
      p.stock || 0,
      p.stock_minimo || 0
    ]);
  }

  const csv = filas.map(f => f.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `inventario_${Date.now()}.csv`;
  a.click();
}

function abrirImportadorCSV() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,text/csv';
  input.onchange = e => {
    const file = e.target.files[0];
    if (file) importarCSV(file);
  };
  input.click();
}

function importarCSV(file) {
  const reader = new FileReader();
  reader.onload = async ev => {
    try {
      const texto = String(ev.target.result).replace(/^\ufeff/, '');
      const lineas = texto.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lineas.length < 2) { toast('Archivo vacío'); return; }

      const cabecera = parsearLineaCSV(lineas[0]).map(s => s.trim().toLowerCase());
      const idx = {
        nombre: cabecera.indexOf('nombre'),
        codigo: cabecera.indexOf('codigo'),
        categoria: cabecera.indexOf('categoria'),
        unidad: cabecera.indexOf('unidad'),
        precio: cabecera.indexOf('precio'),
        costo: cabecera.indexOf('costo'),
        stock: cabecera.indexOf('stock'),
        stockMinimo: cabecera.indexOf('stockminimo')
      };

      if (idx.nombre === -1) { toast('Falta la columna Nombre'); return; }

      let importados = 0;
      const nuevasCategorias = {};

      for (let i = 1; i < lineas.length; i++) {
        const celdas = parsearLineaCSV(lineas[i]);
        const nombre = (celdas[idx.nombre] || '').trim();
        if (!nombre) continue;

        let categoria_id = null;
        if (idx.categoria !== -1 && celdas[idx.categoria]) {
          const nombreCat = celdas[idx.categoria].trim();
          if (nombreCat) {
            let cat = State.categorias.find(c => c.nombre.toLowerCase() === nombreCat.toLowerCase());
            if (!cat) {
              cat = nuevasCategorias[nombreCat] || { id: uid(), nombre: nombreCat };
              nuevasCategorias[nombreCat] = cat;
            }
            categoria_id = cat.id;
          }
        }

        const producto = {
          id: uid(),
          nombre,
          codigo: idx.codigo !== -1 ? (celdas[idx.codigo] || '').trim() : '',
          categoria_id,
          unidad: idx.unidad !== -1 ? (celdas[idx.unidad] || 'unidad').trim() : 'unidad',
          precio: idx.precio !== -1 ? parseFloat(celdas[idx.precio]) || 0 : 0,
          costo: idx.costo !== -1 ? parseFloat(celdas[idx.costo]) || 0 : 0,
          stock: idx.stock !== -1 ? parseFloat(celdas[idx.stock]) || 0 : 0,
          stock_minimo: idx.stockMinimo !== -1 ? parseFloat(celdas[idx.stockMinimo]) || 0 : 0,
          creado: new Date().toISOString()
        };

        await guardarProducto(producto);
        importados++;
      }

      for (const nombreCat in nuevasCategorias) {
        await guardarCategoria(nuevasCategorias[nombreCat]);
      }

      renderSelectores();
      aplicarFiltros();
      toast(`${importados} productos importados`);
    } catch (err) {
      console.error(err);
      toast('Error al leer el archivo');
    }
  };
  reader.readAsText(file);
}

function parsearLineaCSV(linea) {
  const celdas = [];
  let actual = '';
  let dentro = false;

  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      if (dentro && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else {
        dentro = !dentro;
      }
    } else if (c === ',' && !dentro) {
      celdas.push(actual);
      actual = '';
    } else {
      actual += c;
    }
  }
  celdas.push(actual);
  return celdas;
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

  document.getElementById('btn-escanear-producto').addEventListener('click', () => abrirEscaner('producto'));
  document.getElementById('btn-importar').addEventListener('click', abrirImportadorCSV);
  document.getElementById('btn-exportar-inv').addEventListener('click', exportarInventarioCSV);

  document.getElementById('p-precio').addEventListener('input', actualizarMargen);
  document.getElementById('p-costo').addEventListener('input', actualizarMargen);

  document.getElementById('filtro').addEventListener('input', aplicarFiltros);
  document.getElementById('filtro-categoria').addEventListener('change', aplicarFiltros);
  document.getElementById('filtro-stock').addEventListener('change', aplicarFiltros);
});

window.addEventListener('negocio-cambiado', () => {
  renderSelectores();
  aplicarFiltros();
});

window.cerrarPanel = cerrarPanel;
window.abrirProducto = abrirProducto;
window.mostrarEtiqueta = mostrarEtiqueta;
window.imprimirEtiqueta = imprimirEtiqueta;
window.cerrarEscaner = cerrarEscaner;
window.abrirEscaner = abrirEscaner;
