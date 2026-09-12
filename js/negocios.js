// ============================================================
// CajaFácil Cuba - Gestión de negocios
// Desarrollado por Disney Gutiérrez Guevara
// ============================================================

const ICONOS_DISPONIBLES = [
  'ti-building-store',
  'ti-shopping-cart',
  'ti-coffee',
  'ti-bread',
  'ti-meat',
  'ti-plant-2',
  'ti-shirt',
  'ti-tools',
  'ti-flask',
  'ti-device-mobile',
  'ti-book',
  'ti-cut',
  'ti-pill',
  'ti-truck',
  'ti-building-warehouse'
];

const COLORES_DISPONIBLES = [
  '#2563eb',
  '#16a34a',
  '#dc2626',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#be185d',
  '#0f766e',
  '#4338ca',
  '#b45309'
];

let editId = null;

function renderNegocios() {
  const cont = document.getElementById('lista-negocios');
  if (!State.negocios.length) {
    cont.innerHTML = `<div class="empty"><i class="ti ti-building-store-off"></i>Sin negocios creados</div>`;
    return;
  }
  cont.innerHTML = State.negocios.map(n => {
    const activo = n.id === State.negocioActivo?.id;
    return `
      <div class="card" style="margin-bottom:10px;${activo ? 'border-color:var(--primary);border-width:2px' : ''}">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:${n.color || 'var(--primary)'}20;color:${n.color || 'var(--primary)'};flex-shrink:0">
            <i class="ti ${n.icono || 'ti-building-store'}" style="font-size:24px"></i>
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:15px">${n.nombre}</div>
            <div style="font-size:12px;color:var(--muted)">
              ${n.tipo || 'general'} · ${n.creado ? new Date(n.creado).toLocaleDateString('es-CU') : ''}
            </div>
          </div>
          ${activo ? `<span class="badge badge-ok">Activo</span>` : ''}
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          ${activo ? '' : `<button class="btn btn-primary" style="flex:1" onclick="activar('${n.id}')"><i class="ti ti-check"></i> Activar</button>`}
          <button class="btn" onclick="editarNegocio('${n.id}')"><i class="ti ti-pencil"></i></button>
          <button class="btn btn-danger" onclick="borrarNegocio('${n.id}')"><i class="ti ti-trash"></i></button>
        </div>
      </div>
    `;
  }).join('');
}

function renderSelectorIconos(seleccionado) {
  const cont = document.getElementById('iconos');
  cont.innerHTML = ICONOS_DISPONIBLES.map(ic => `
    <button type="button" class="icon-btn ${ic === seleccionado ? 'icon-seleccionado' : ''}"
            data-icono="${ic}" onclick="seleccionarIcono('${ic}')">
      <i class="ti ${ic}"></i>
    </button>
  `).join('');
}

function renderSelectorColores(seleccionado) {
  const cont = document.getElementById('colores');
  cont.innerHTML = COLORES_DISPONIBLES.map(c => `
    <button type="button" class="color-btn ${c === seleccionado ? 'color-seleccionado' : ''}"
            style="background:${c}" data-color="${c}" onclick="seleccionarColor('${c}')"></button>
  `).join('');
}

let iconoElegido = 'ti-building-store';
let colorElegido = '#2563eb';

function seleccionarIcono(ic) {
  iconoElegido = ic;
  document.querySelectorAll('#iconos .icon-btn').forEach(b => {
    b.classList.toggle('icon-seleccionado', b.dataset.icono === ic);
  });
}

function seleccionarColor(c) {
  colorElegido = c;
  document.querySelectorAll('#colores .color-btn').forEach(b => {
    b.classList.toggle('color-seleccionado', b.dataset.color === c);
  });
}

function mostrarForm(show) {
  document.getElementById('form-negocio').style.display = show ? 'block' : 'none';
}

function nuevoNegocio() {
  editId = null;
  document.getElementById('n-nombre').value = '';
  document.getElementById('n-tipo').value = '';
  iconoElegido = 'ti-building-store';
  colorElegido = '#2563eb';
  renderSelectorIconos(iconoElegido);
  renderSelectorColores(colorElegido);
  document.getElementById('form-titulo').textContent = 'Nuevo negocio';
  mostrarForm(true);
}

function editarNegocio(id) {
  const n = State.negocios.find(x => x.id === id);
  if (!n) return;
  editId = id;
  document.getElementById('n-nombre').value = n.nombre;
  document.getElementById('n-tipo').value = n.tipo || '';
  iconoElegido = n.icono || 'ti-building-store';
  colorElegido = n.color || '#2563eb';
  renderSelectorIconos(iconoElegido);
  renderSelectorColores(colorElegido);
  document.getElementById('form-titulo').textContent = 'Editar negocio';
  mostrarForm(true);
}

async function guardarNegocioHandler() {
  const nombre = document.getElementById('n-nombre').value.trim();
  const tipo = document.getElementById('n-tipo').value.trim();
  if (!nombre) { toast('Nombre requerido'); return; }

  if (editId) {
    const n = State.negocios.find(x => x.id === editId);
    Object.assign(n, { nombre, tipo, icono: iconoElegido, color: colorElegido });
    await guardarNegocio(n);
    if (State.negocioActivo?.id === editId) {
      State.negocioActivo = n;
      pintarNegocioActivo();
    }
  } else {
    const nuevo = {
      id: 'neg_' + uid(),
      nombre,
      tipo,
      icono: iconoElegido,
      color: colorElegido,
      creado: new Date().toISOString()
    };
    await guardarNegocio(nuevo);
    if (!State.negocioActivo) {
      await cambiarNegocio(nuevo.id);
    }
  }

  mostrarForm(false);
  renderNegocios();
  toast('Guardado');
}

async function activar(id) {
  await cambiarNegocio(id);
  renderNegocios();
}

async function borrarNegocio(id) {
  if (State.negocios.length === 1) {
    toast('Debe existir al menos un negocio');
    return;
  }
  const n = State.negocios.find(x => x.id === id);
  if (!n) return;
  if (!confirm(`¿Eliminar "${n.nombre}" y TODOS sus datos (productos, ventas, turnos, conteos)? Esta acción no se puede deshacer.`)) return;

  await eliminarNegocio(id);

  if (State.negocioActivo?.id === id) {
    const primero = State.negocios[0];
    if (primero) await cambiarNegocio(primero.id);
  }

  renderNegocios();
  toast('Negocio eliminado');
}

window.addEventListener('estado-listo', () => {
  renderNegocios();
  renderSelectorIconos(iconoElegido);
  renderSelectorColores(colorElegido);
  document.getElementById('btn-nuevo').addEventListener('click', nuevoNegocio);
  document.getElementById('btn-cancelar').addEventListener('click', () => mostrarForm(false));
  document.getElementById('btn-guardar').addEventListener('click', guardarNegocioHandler);
});

window.addEventListener('negocio-cambiado', () => {
  renderNegocios();
});
