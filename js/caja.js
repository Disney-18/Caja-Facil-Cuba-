// ============================================================
// CajaFácil Cuba - Caja y turnos con validación
// Desarrollado por Disney Gutiérrez Guevara
// ============================================================

function ventasTurno() {
  if (!State.turno) return [];
  return State.ventas.filter(v => v.turno_id === State.turno.id);
}

function renderCaja() {
  const t = State.turno;
  const estado = document.getElementById('estado-caja');
  const panelAbrir = document.getElementById('panel-abrir');
  const panelActivo = document.getElementById('panel-activo');

  if (!t) {
    estado.innerHTML = `<div class="empty"><i class="ti ti-lock"></i>No hay turno abierto</div>`;
    panelAbrir.style.display = 'block';
    panelActivo.style.display = 'none';
    return;
  }

  const ventas = ventasTurno();
  const totalVentas = ventas.reduce((s, v) => s + v.total, 0);
  const totalRetiros = (t.retiros || []).reduce((s, r) => s + r.monto, 0);
  const efectivo = t.inicial + totalVentas - totalRetiros;
  const fecha = new Date(t.inicio).toLocaleString('es-CU');

  estado.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div>
        <div style="font-size:12px;color:var(--muted)">TURNO ABIERTO</div>
        <div style="font-weight:600">${fecha}</div>
      </div>
      <span class="badge badge-ok">Activo</span>
    </div>
    <table>
      <tr><td>Monto inicial</td><td style="text-align:right">${money(t.inicial)}</td></tr>
      <tr><td>Ventas (${ventas.length})</td><td style="text-align:right">${money(totalVentas)}</td></tr>
      <tr><td>Retiros</td><td style="text-align:right">${money(totalRetiros)}</td></tr>
      <tr><td style="font-weight:700">Efectivo esperado</td><td style="text-align:right;font-weight:700;color:var(--primary)">${money(efectivo)}</td></tr>
    </table>
    ${(t.retiros || []).length ? `
      <div style="margin-top:10px;font-size:12px;color:var(--muted)">
        <strong>Retiros:</strong>
        ${t.retiros.map(r => `<div>${money(r.monto)} — ${r.motivo || 'Sin motivo'}</div>`).join('')}
      </div>` : ''}
  `;
  panelAbrir.style.display = 'none';
  panelActivo.style.display = 'block';
}

async function abrirTurno() {
  const v = Validar.numero(document.getElementById('monto-inicial').value || 0, 0, 999999999);
  if (!v.ok) { toast('Monto inicial: ' + v.msg); return; }

  const t = {
    id: uid(),
    inicio: new Date().toISOString(),
    fin: null,
    inicial: v.valor,
    retiros: [],
    estado: 'abierto'
  };
  await guardarTurno(t);
  toast('Turno abierto');
  renderCaja();
}

async function retiro() {
  const vMonto = Validar.numero(document.getElementById('monto-retiro').value, 0.01, 999999999);
  if (!vMonto.ok) { toast('Monto: ' + vMonto.msg); return; }

  const vMotivo = Validar.texto(document.getElementById('motivo-retiro').value || '', 0, 100);
  if (!vMotivo.ok) { toast('Motivo: ' + vMotivo.msg); return; }

  State.turno.retiros.push({
    id: uid(),
    monto: vMonto.valor,
    motivo: vMotivo.valor,
    fecha: new Date().toISOString()
  });
  await guardarTurno(State.turno);
  document.getElementById('monto-retiro').value = '';
  document.getElementById('motivo-retiro').value = '';
  toast('Retiro registrado');
  renderCaja();
}

async function cerrarTurno() {
  if (!confirm('¿Cerrar el turno actual?')) return;
  const t = { ...State.turno };
  const ventas = ventasTurno();
  const totalVentas = ventas.reduce((s, v) => s + v.total, 0);
  const totalRetiros = t.retiros.reduce((s, r) => s + r.monto, 0);
  const efectivo = t.inicial + totalVentas - totalRetiros;
  t.fin = new Date().toISOString();
  t.totalVentas = totalVentas;
  t.totalRetiros = totalRetiros;
  t.efectivoFinal = efectivo;
  t.cantidadVentas = ventas.length;
  t.estado = 'cerrado';
  await guardarTurno(t);
  toast('Turno cerrado');
  renderCaja();
}

window.addEventListener('estado-listo', () => {
  renderCaja();
  document.getElementById('btn-abrir').addEventListener('click', abrirTurno);
  document.getElementById('btn-retiro').addEventListener('click', retiro);
  document.getElementById('btn-cerrar').addEventListener('click', cerrarTurno);
});

window.addEventListener('negocio-cambiado', () => {
  renderCaja();
});
