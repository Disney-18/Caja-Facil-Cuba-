function cargarAjustes() {
  document.getElementById('a-negocio').value = State.ajustes.negocio || '';
  document.getElementById('a-tasa').value = State.ajustes.tasaUSD || 0;
}

function guardarAjustes() {
  State.ajustes.negocio = document.getElementById('a-negocio').value.trim();
  State.ajustes.tasaUSD = parseFloat(document.getElementById('a-tasa').value) || 0;
  saveState();
  toast('Ajustes guardados');
}

function exportarDatos() {
  const data = {
    productos: State.productos,
    ventas: State.ventas,
    turno: State.turno,
    conteos: State.conteos,
    ajustes: State.ajustes,
    turnosCerrados: DB.get('turnosCerrados', [])
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `caja-facil-backup-${Date.now()}.json`;
  a.click();
}

function importarDatos(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const d = JSON.parse(e.target.result);
      State.productos = d.productos || [];
      State.ventas = d.ventas || [];
      State.turno = d.turno || null;
      State.conteos = d.conteos || [];
      State.ajustes = d.ajustes || State.ajustes;
      saveState();
      toast('Datos importados');
      cargarAjustes();
    } catch {
      toast('Archivo inválido');
    }
  };
  reader.readAsText(file);
}

function resetTodo() {
  if (!confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) return;
  ['productos','ventas','turno','conteos','ajustes','turnosCerrados'].forEach(k => localStorage.removeItem('cfc_' + k));
  location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
  cargarAjustes();
  document.getElementById('btn-guardar').addEventListener('click', guardarAjustes);
  document.getElementById('btn-exportar').addEventListener('click', exportarDatos);
  document.getElementById('file-import').addEventListener('change', e => {
    if (e.target.files[0]) importarDatos(e.target.files[0]);
  });
  document.getElementById('btn-reset').addEventListener('click', resetTodo);
});