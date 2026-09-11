const DENOMS = {
  CUP: [5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5],
  USD: [100, 50, 20, 10, 5, 1]
};

let cantidades = {};

function renderTabla() {
  const moneda = document.getElementById('moneda').value;
  const tb = document.getElementById('tabla-contador');
  cantidades = {};
  tb.innerHTML = DENOMS[moneda].map(d => {
    cantidades[d] = 0;
    return `
      <tr>
        <td style="font-weight:600">${fmt(d)} ${moneda}</td>
        <td>
          <div style="display:flex;align-items:center;gap:4px">
            <button class="icon-btn" style="width:30px;height:30px" onclick="cambiar(${d},-1)">−</button>
            <input class="input" style="width:60px;text-align:center;padding:6px" type="number" min="0"
              value="0" data-d="${d}" oninput="setCant(${d},this.value)">
            <button class="icon-btn" style="width:30px;height:30px" onclick="cambiar(${d},1)">+</button>
          </div>
        </td>
        <td style="text-align:right" id="sub-${d}">0</td>
      </tr>
    `;
  }).join('');
  calcular();
}

function setCant(d, v) {
  cantidades[d] = Math.max(0, parseInt(v) || 0);
  calcular();
}

function cambiar(d, delta) {
  cantidades[d] = Math.max(0, (cantidades[d] || 0) + delta);
  const inp = document.querySelector(`input[data-d="${d}"]`);
  if (inp) inp.value = cantidades[d];
  calcular();
}

function calcular() {
  const moneda = document.getElementById('moneda').value;
  let total = 0;
  for (const d in cantidades) {
    const sub = d * cantidades[d];
    const el = document.getElementById('sub-' + d);
    if (el) el.textContent = fmt(sub);
    total += sub;
  }
  document.getElementById('total-contado').textContent = money(total, moneda);

  const esperado = parseFloat(document.getElementById('esperado').value) || 0;
  const box = document.getElementById('diff-box');
  const val = document.getElementById('diff-valor');
  if (esperado > 0) {
    box.style.display = 'block';
    const diff = total - esperado;
    val.textContent = (diff >= 0 ? '+' : '') + money(diff, moneda);
    val.style.color = diff === 0 ? 'var(--success)' : diff > 0 ? 'var(--warning)' : 'var(--danger)';
  } else {
    box.style.display = 'none';
  }
}

function guardarConteo() {
  const moneda = document.getElementById('moneda').value;
  const total = Object.entries(cantidades).reduce((s, [d, c]) => s + d * c, 0);
  if (total === 0) { toast('Nada que guardar'); return; }
  State.conteos.unshift({
    id: uid(),
    fecha: new Date().toISOString(),
    moneda,
    cantidades: { ...cantidades },
    total
  });
  saveState();
  renderHistorial();
  toast('Conteo guardado');
}

function borrar() {
  if (!confirm('¿Borrar el conteo actual?')) return;
  renderTabla();
  document.getElementById('esperado').value = '';
}

function renderHistorial() {
  const cont = document.getElementById('historial');
  if (!State.conteos.length) {
    cont.innerHTML = `<div class="empty"><i class="ti ti-history-off"></i>Sin conteos guardados</div>`;
    return;
  }
  cont.innerHTML = State.conteos.slice(0, 15).map(c => {
    const fecha = new Date(c.fecha).toLocaleString('es-CU');
    return `
      <div style="padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:600">${money(c.total, c.moneda)}</div>
            <div style="font-size:11px;color:var(--muted)">${fecha}</div>
          </div>
          <button class="icon-btn" style="width:32px;height:32px" onclick="borrarHistorial('${c.id}')">
            <i class="ti ti-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function borrarHistorial(id) {
  State.conteos = State.conteos.filter(c => c.id !== id);
  saveState();
  renderHistorial();
}

document.addEventListener('DOMContentLoaded', () => {
  renderTabla();
  renderHistorial();
  document.getElementById('moneda').addEventListener('change', renderTabla);
  document.getElementById('esperado').addEventListener('input', calcular);
  document.getElementById('btn-guardar').addEventListener('click', guardarConteo);
  document.getElementById('btn-borrar').addEventListener('click', borrar);
});