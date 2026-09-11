function renderReportes() {
  const hoy = new Date().toDateString();
  const ventasHoy = State.ventas.filter(v => new Date(v.fecha).toDateString() === hoy);
  const totalHoy = ventasHoy.reduce((s, v) => s + v.total, 0);
  const totalTodo = State.ventas.reduce((s, v) => s + v.total, 0);

  document.getElementById('r-hoy').textContent = money(totalHoy);
  document.getElementById('r-total').textContent = money(totalTodo);
  document.getElementById('r-count').textContent = State.ventas.length;

  const cont = document.getElementById('historial-ventas');
  if (!State.ventas.length) {
    cont.innerHTML = `<div class="empty"><i class="ti ti-receipt-off"></i>Sin ventas</div>`;
    return;
  }
  cont.innerHTML = State.ventas.slice().reverse().slice(0, 30).map(v => {
    const fecha = new Date(v.fecha).toLocaleString('es-CU');
    const items = v.items.map(i => `${i.cant}x ${i.nombre}`).join(', ');
    return `
      <div style="padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between">
          <div style="flex:1">
            <div style="font-size:12px;color:var(--muted)">${fecha}</div>
            <div style="font-size:13px;margin-top:2px">${items}</div>
          </div>
          <div style="font-weight:700;color:var(--primary)">${money(v.total)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function exportarCSV() {
  if (!State.ventas.length) { toast('Sin datos'); return; }
  const rows = [['Fecha', 'Productos', 'Total']];
  State.ventas.forEach(v => {
    rows.push([
      new Date(v.fecha).toLocaleString('es-CU'),
      v.items.map(i => `${i.cant}x ${i.nombre}`).join(' | '),
      v.total
    ]);
  });
  const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ventas_${Date.now()}.csv`;
  a.click();
}

document.addEventListener('DOMContentLoaded', () => {
  renderReportes();
  document.getElementById('btn-export').addEventListener('click', exportarCSV);
});