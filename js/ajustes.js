function cargarAjustes() {
  document.getElementById('a-negocio').value = State.negocioActivo?.nombre || State.ajustes.negocio || '';
  document.getElementById('a-tasa').value = State.ajustes.tasaUSD || 0;
}

async function guardarAjustesHandler() {
  const nombre = document.getElementById('a-negocio').value.trim();
  State.ajustes.tasaUSD = parseFloat(document.getElementById('a-tasa').value) || 0;
  if (nombre && State.negocioActivo) {
    State.negocioActivo.nombre = nombre;
    await guardarNegocio(State.negocioActivo);
    pintarNegocioActivo();
  }
  State.ajustes.negocio = nombre;
  await guardarAjustes();
  toast('Ajustes guardados');
}

async function exportarDatos() {
  const todosNegocios = await IDB.getAll(IDB.STORES.NEGOCIOS);
  const todosProductos = await IDB.getAll(IDB.STORES.PRODUCTOS);
  const todasVentas = await IDB.getAll(IDB.STORES.VENTAS);
  const todosTurnos = await IDB.getAll(IDB.STORES.TURNOS);
  const todosConteos = await IDB.getAll(IDB.STORES.CONTEOS);
  const todosMovimientos = await IDB.getAll(IDB.STORES.MOVIMIENTOS);

  const data = {
    version: 2,
    fecha: new Date().toISOString(),
    negocios: todosNegocios,
    productos: todosProductos,
    ventas: todasVentas,
    turnos: todosTurnos,
    conteos: todosConteos,
    movimientos: todosMovimientos,
    ajustes: State.ajustes
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `caja-facil-backup-${Date.now()}.json`;
  a.click();
}

function importarDatos(file) {
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const d = JSON.parse(e.target.result);

      if (d.negocios) for (const x of d.negocios) await IDB.put(IDB.STORES.NEGOCIOS, x);
      if (d.productos) for (const x of d.productos) await IDB.put(IDB.STORES.PRODUCTOS, x);
      if (d.ventas) for (const x of d.ventas) await IDB.put(IDB.STORES.VENTAS, x);
      if (d.turnos) for (const x of d.turnos) await IDB.put(IDB.STORES.TURNOS, x);
      if (d.conteos) for (const x of d.conteos) await IDB.put(IDB.STORES.CONTEOS, x);
      if (d.movimientos) for (const x of d.movimientos) await IDB.put(IDB.STORES.MOVIMIENTOS, x);
      if (d.ajustes) {
        State.ajustes = d.ajustes;
        await guardarAjustes();
      }

      toast('Datos importados. Recargando...');
      setTimeout(() => location.reload(), 900);
    } catch {
      toast('Archivo inválido');
    }
  };
  reader.readAsText(file);
}

async function resetTodo() {
  if (!confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) return;
  await IDB.clear(IDB.STORES.NEGOCIOS);
  await IDB.clear(IDB.STORES.PRODUCTOS);
  await IDB.clear(IDB.STORES.VENTAS);
  await IDB.clear(IDB.STORES.TURNOS);
  await IDB.clear(IDB.STORES.CONTEOS);
  await IDB.clear(IDB.STORES.MOVIMIENTOS);
  await IDB.clear(IDB.STORES.META);
  toast('Datos borrados. Recargando...');
  setTimeout(() => location.reload(), 900);
}

function abrirSeccion(id) {
  const panel = document.getElementById('panel');
  const titulo = document.getElementById('panel-titulo');
  const cont = document.getElementById('panel-contenido');

  const secciones = {
    guia: { titulo: 'Guía de uso', html: GUIA },
    faq: { titulo: 'Preguntas frecuentes', html: FAQ },
    privacidad: { titulo: 'Política de privacidad', html: PRIVACIDAD },
    terminos: { titulo: 'Términos y condiciones', html: TERMINOS }
  };

  const s = secciones[id];
  if (!s) return;
  titulo.textContent = s.titulo;
  cont.innerHTML = s.html;
  panel.style.display = 'block';
  panel.scrollTop = 0;
}

function cerrarPanel() {
  document.getElementById('panel').style.display = 'none';
}

window.addEventListener('estado-listo', () => {
  cargarAjustes();
  document.getElementById('btn-guardar').addEventListener('click', guardarAjustesHandler);
  document.getElementById('btn-exportar').addEventListener('click', exportarDatos);
  document.getElementById('file-import').addEventListener('change', e => {
    if (e.target.files[0]) importarDatos(e.target.files[0]);
  });
  document.getElementById('btn-reset').addEventListener('click', resetTodo);
});

window.addEventListener('negocio-cambiado', () => {
  cargarAjustes();
});

const GUIA = `
<div class="card">
  <strong style="display:block;margin-bottom:8px">Bienvenido a CajaFácil Cuba</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    CajaFácil Cuba es una aplicación para gestionar las ventas, el inventario
    y la caja de tu negocio. Funciona sin conexión a internet y guarda toda
    la información en tu propio dispositivo.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">1. Configura tu negocio</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Antes de empezar, entra en Ajustes y escribe el nombre de tu negocio y la
    tasa de cambio del dólar si trabajas con ambas monedas. Guarda los cambios.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">2. Agrega tus productos</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Ve a la sección Inventario y pulsa "Nuevo producto". Rellena el nombre, el
    código (si lo usas), el precio y la cantidad disponible. Repite el proceso
    con cada producto que vendas. Puedes editar o eliminar cualquier producto
    tocando su botón correspondiente.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">3. Abre un turno de caja</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Antes de vender, entra en Caja y pulsa "Abrir turno". Escribe el monto de
    dinero con el que empiezas el día. Esto sirve para llevar un control
    preciso de las ganancias y del efectivo que debe haber al final.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">4. Registra una venta</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Ve a la sección Vender. Busca el producto por nombre o código y tócalo
    para agregarlo al ticket. Ajusta las cantidades con los botones más y menos.
    Cuando termines, pulsa "Cobrar". El stock se descuenta automáticamente y la
    venta queda registrada en el historial.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">5. Cuenta el efectivo con el contador</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    En la sección Contador introduce cuántos billetes o monedas tienes de cada
    denominación. La aplicación calcula el total automáticamente. Si escribes
    el monto esperado en caja, te muestra la diferencia y te avisa si sobra o
    falta dinero. Puedes guardar el conteo para consultarlo después.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">6. Retira dinero de la caja (sangría)</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Si necesitas sacar dinero de la caja durante el día, entra en Caja,
    escribe el monto, el motivo y pulsa "Registrar retiro". La aplicación
    descuenta ese monto del efectivo esperado al cerrar el turno.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">7. Cierra el turno</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Al final del día, usa el contador para revisar cuánto efectivo tienes.
    Luego entra en Caja y pulsa "Cerrar turno". La aplicación guarda un resumen
    con las ventas del día, los retiros y el efectivo final.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">8. Consulta reportes</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    En Reportes puedes ver el total vendido hoy, el total histórico y el
    listado de las últimas transacciones. También puedes exportar todo a un
    archivo CSV para abrirlo en Excel o compartirlo.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">9. Haz copias de seguridad</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Entra en Ajustes y pulsa "Exportar datos (JSON)". Se descargará un archivo
    con toda la información de tu negocio. Guárdalo en un lugar seguro. Si
    cambias de teléfono o reinstalas el navegador, puedes importar ese archivo
    para recuperar todo.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">10. Instala la app en tu teléfono</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Abre la aplicación con conexión a internet la primera vez. En el menú del
    navegador, selecciona "Añadir a pantalla de inicio" o "Instalar app". A
    partir de ese momento tendrás un ícono propio y podrás abrirla sin internet.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">Recomendaciones</strong>
  <ul style="font-size:14px;line-height:1.7;margin:0;padding-left:20px">
    <li>Exporta una copia de seguridad cada semana.</li>
    <li>No borres los datos del navegador si no has exportado antes.</li>
    <li>Mantén el stock actualizado para evitar vender sin existencias.</li>
    <li>Cierra el turno todos los días para llevar un control ordenado.</li>
  </ul>
</div>
`;

const FAQ = `
<div class="card">
  <strong style="display:block;margin-bottom:6px">¿La aplicación es realmente gratis?</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Sí. CajaFácil Cuba es completamente gratuita. No tiene licencias, ni
    suscripciones, ni anuncios, ni compras dentro de la aplicación.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">¿Necesito internet para usarla?</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    No. Solo necesitas conexión la primera vez que la abres, para que se
    descarguen los estilos y los íconos. Después funciona sin internet.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">¿Dónde se guardan mis datos?</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    En tu propio dispositivo. Desde esta versión la aplicación usa una base
    de datos interna del navegador llamada IndexedDB, más robusta y con mayor
    capacidad que el almacenamiento anterior.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">¿Puedo usar la app en varios teléfonos?</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Sí, pero cada teléfono tiene sus propios datos. Para pasar la información
    de un dispositivo a otro usa la exportación e importación de Ajustes.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">¿Qué pasa si borro los datos del navegador?</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Se pierde toda la información que no hayas exportado antes. Por eso
    recomendamos hacer copias de seguridad frecuentes desde Ajustes.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">¿Cómo instalo la aplicación en mi teléfono?</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Abre la web con internet, entra en el menú del navegador y elige "Añadir a
    pantalla de inicio" o "Instalar app". Quedará un ícono en tu pantalla como
    cualquier otra aplicación.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">¿Qué significan sobrante y faltante en el contador?</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Si cuentas más dinero del que debería haber, aparece un sobrante. Si
    cuentas menos, aparece un faltante. Se calcula comparando el total contado
    con el monto esperado que hayas escrito.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">¿Puedo trabajar con dólares y pesos a la vez?</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Sí. En Ajustes puedes configurar la tasa de cambio USD a CUP. El contador
    también permite alternar entre ambas monedas.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">¿Cómo recupero mis datos si cambio de teléfono?</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Exporta un archivo JSON desde el teléfono antiguo. En el nuevo, entra en
    Ajustes, pulsa "Importar datos" y selecciona ese archivo. Toda la
    información se restaura.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">¿La aplicación tiene publicidad?</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    No. No hay anuncios, ni rastreo, ni recopilación de datos personales.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">¿Puedo vender sin haber abierto un turno?</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Sí, pero la venta no quedará asociada a ningún turno. Se recomienda abrir
    un turno al inicio del día para llevar un control correcto del efectivo.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">¿Qué hago si la app no se instala como PWA?</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Abre la web con buena conexión la primera vez, espera unos segundos y
    vuelve a intentar desde el menú del navegador. Si sigue sin funcionar,
    revisa que no estés usando una ventana de incógnito.
  </p>
</div>
`;

const PRIVACIDAD = `
<div class="card">
  <strong style="display:block;margin-bottom:8px">Política de privacidad</strong>
  <p style="font-size:13px;color:var(--muted);margin:0 0 12px 0">
    Última actualización: septiembre 2026
  </p>
  <p style="font-size:14px;line-height:1.6;margin:0">
    En CajaFácil Cuba la privacidad de nuestros usuarios es una prioridad. Esta
    política explica de forma clara qué datos se manejan y cómo se protegen.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">1. Datos que se recopilan</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    CajaFácil Cuba no recopila ningún dato personal. No solicita nombre,
    correo electrónico, teléfono, ubicación, contactos, cámara, micrófono ni
    ninguna otra información del usuario.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">2. Dónde se guarda la información</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Toda la información que introduces (productos, ventas, conteos, turnos y
    ajustes) se guarda exclusivamente en la base de datos interna del
    navegador de tu dispositivo. Nunca sale de él.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">3. Uso de internet</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    La aplicación solo usa internet la primera vez que se abre, para descargar
    los recursos visuales (estilos e íconos). Después funciona de forma
    totalmente offline. No se envían ni reciben datos del usuario en ningún
    momento.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">4. Cookies y rastreo</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    No se utilizan cookies, ni píxeles de seguimiento, ni herramientas de
    analítica. No se rastrea la actividad del usuario dentro ni fuera de la
    aplicación.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">5. Publicidad</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    La aplicación no muestra publicidad de ningún tipo y no comparte
    información con anunciantes.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">6. Terceros</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    No se comparten datos con terceros porque no se recopilan datos. Los
    únicos servicios externos que se cargan la primera vez son las librerías
    visuales TailwindCSS y Tabler Icons, que no acceden a la información de
    la aplicación.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">7. Seguridad</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Como los datos permanecen en tu dispositivo, la seguridad depende de las
    medidas que tú mismo tomes (bloqueo de pantalla, respaldos periódicos,
    entre otras). Recomendamos exportar una copia de seguridad con
    regularidad.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">8. Derechos del usuario</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Puedes eliminar toda la información almacenada en cualquier momento desde
    Ajustes, pulsando "Borrar todos los datos". También puedes desinstalar la
    aplicación desde tu navegador.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">9. Menores de edad</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    La aplicación no está dirigida a menores de edad y no recopila información
    de ningún usuario, independientemente de su edad.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">10. Cambios en esta política</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Cualquier cambio futuro en esta política se reflejará en esta misma
    sección con su fecha de actualización.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">Contacto</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Para consultas sobre privacidad, contacta al desarrollador:
    <strong>Disney Gutiérrez Guevara</strong>.
  </p>
</div>
`;

const TERMINOS = `
<div class="card">
  <strong style="display:block;margin-bottom:8px">Términos y condiciones de uso</strong>
  <p style="font-size:13px;color:var(--muted);margin:0 0 12px 0">
    Última actualización: septiembre 2026
  </p>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Al utilizar CajaFácil Cuba aceptas los siguientes términos. Si no estás de
    acuerdo con ellos, te pedimos que no uses la aplicación.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">1. Objeto de la aplicación</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    CajaFácil Cuba es una herramienta de gestión comercial que permite
    registrar ventas, controlar inventario, contar efectivo y administrar
    turnos de caja. Está destinada a pequeños y medianos negocios.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">2. Uso gratuito</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    La aplicación se ofrece de forma gratuita. No existen licencias,
    suscripciones, ni pagos de ningún tipo. El desarrollador puede agregar
    funciones opcionales en el futuro sin afectar el uso básico actual.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">3. Responsabilidad del usuario</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    El usuario es el único responsable de la información que introduce en la
    aplicación, de mantener copias de seguridad y de la veracidad de los datos
    utilizados en su negocio.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">4. Pérdida de datos</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    El desarrollador no se responsabiliza por pérdidas de datos derivadas de:
    borrado de la caché o del almacenamiento del navegador, daños en el
    dispositivo, reinstalación del sistema, uso de ventanas de incógnito o
    falta de copias de seguridad.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">5. Exactitud de los cálculos</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    La aplicación realiza cálculos automáticos de totales, diferencias y
    conversiones según los datos introducidos por el usuario. El desarrollador
    no garantiza la exactitud de los resultados si los datos de entrada son
    incorrectos. El usuario debe verificar siempre la información crítica.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">6. Disponibilidad</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    La aplicación funciona localmente en el dispositivo. Su disponibilidad
    depende del navegador del usuario y no del desarrollador. No se garantiza
    un funcionamiento ininterrumpido ni la compatibilidad con todos los
    dispositivos del mercado.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">7. Prohibiciones</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    No está permitido:
  </p>
  <ul style="font-size:14px;line-height:1.7;margin:8px 0 0 0;padding-left:20px">
    <li>Usar la aplicación para actividades ilegales.</li>
    <li>Redistribuirla como producto propio sin mencionar al autor original.</li>
    <li>Modificarla para eliminar la mención de autoría.</li>
    <li>Venderla o sublicenciarla sin autorización del desarrollador.</li>
  </ul>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">8. Propiedad intelectual</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    CajaFácil Cuba es un proyecto desarrollado por Disney Gutiérrez Guevara.
    Se distribuye bajo licencia MIT, lo que permite su uso, modificación y
    redistribución, siempre citando al autor original.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">9. Limitación de responsabilidad</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    El desarrollador no será responsable de daños directos o indirectos,
    pérdidas económicas, lucro cesante, ni perjuicios derivados del uso o de
    la imposibilidad de uso de la aplicación.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">10. Modificaciones</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    El desarrollador puede actualizar estos términos en cualquier momento.
    Las modificaciones se reflejarán en esta misma sección con su fecha
    correspondiente. El uso continuado de la aplicación implica la aceptación
    de los términos vigentes.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">11. Legislación aplicable</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Estos términos se interpretan conforme a las leyes vigentes en la
    República de Cuba.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">Contacto</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Para dudas sobre estos términos, contacta al desarrollador:
    <strong>Disney Gutiérrez Guevara</strong>.
  </p>
</div>
`;

window.abrirSeccion = abrirSeccion;
window.cerrarPanel = cerrarPanel;
