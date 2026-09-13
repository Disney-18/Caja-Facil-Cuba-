// ============================================================
// CajaFácil Cuba - Ajustes, guía, historial, FAQ, privacidad y términos
// Bloque 4.1: historial actualizado a v1.3.0
// Desarrollado por Disney Gutiérrez Guevara
// ============================================================

function cargarAjustes() {
  document.getElementById('a-tasa').value = State.ajustes.tasaUSD || 0;
}

async function guardarAjustesHandler() {
  const vTasa = Validar.numero(document.getElementById('a-tasa').value, 0, 999999);
  if (!vTasa.ok) { toast('Tasa: ' + vTasa.msg); return; }

  State.ajustes.tasaUSD = vTasa.valor;
  await guardarAjustes();
  toast('Ajustes guardados');
}

async function exportarDatos() {
  const todosNegocios = await IDB.getAll(IDB.STORES.NEGOCIOS);
  const todasCategorias = await IDB.getAll(IDB.STORES.CATEGORIAS);
  const todosProductos = await IDB.getAll(IDB.STORES.PRODUCTOS);
  const todosMovInv = await IDB.getAll(IDB.STORES.MOVIMIENTOS_INV);
  const todasVentas = await IDB.getAll(IDB.STORES.VENTAS);
  const todosTurnos = await IDB.getAll(IDB.STORES.TURNOS);
  const todosConteos = await IDB.getAll(IDB.STORES.CONTEOS);
  const todosMovimientos = await IDB.getAll(IDB.STORES.MOVIMIENTOS);

  const data = {
    version: 4,
    fecha: new Date().toISOString(),
    negocios: todosNegocios,
    categorias: todasCategorias,
    productos: todosProductos,
    movimientos_inv: todosMovInv,
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
      if (d.categorias) for (const x of d.categorias) await IDB.put(IDB.STORES.CATEGORIAS, x);
      if (d.productos) for (const x of d.productos) await IDB.put(IDB.STORES.PRODUCTOS, x);
      if (d.movimientos_inv) for (const x of d.movimientos_inv) await IDB.put(IDB.STORES.MOVIMIENTOS_INV, x);
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
  await IDB.clear(IDB.STORES.CATEGORIAS);
  await IDB.clear(IDB.STORES.PRODUCTOS);
  await IDB.clear(IDB.STORES.MOVIMIENTOS_INV);
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
    historial: { titulo: 'Historial de cambios', html: HISTORIAL },
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
    Entra en Ajustes y pulsa "Gestionar negocios" para crear o editar el
    negocio activo. Puedes tener varios negocios dentro de la misma app,
    cada uno con sus productos, ventas y caja por separado. Configura también
    la tasa de cambio del dólar si trabajas con ambas monedas.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">2. Crea categorías</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    En Inventario pulsa "Categoría" para crear las categorías que uses en tu
    negocio: bebidas, alimentos, aseo, etc. Cada producto puede pertenecer a
    una categoría, y podrás filtrar el inventario por ella.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">3. Agrega tus productos</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    En Inventario pulsa "Producto". Rellena el nombre, código, categoría,
    unidad de medida, precio sugerido, costo, stock actual y stock mínimo.
    El precio es solo una sugerencia: al vender podrás cambiarlo si lo
    necesitas. Puedes usar el botón de escanear para leer el código de barras
    con la cámara.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">4. Abre un turno de caja</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Antes de vender, entra en Caja y pulsa "Abrir turno". Escribe el monto de
    dinero con el que empiezas el día. Esto sirve para llevar un control
    preciso de las ganancias y del efectivo que debe haber al final.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">5. Registra una venta</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Ve a la sección Vender. Busca el producto por nombre o código y tócalo
    para agregarlo al ticket. Ajusta la cantidad y, si quieres, cambia el
    precio. Si lo cambias, el campo se marca en amarillo para que lo veas.
    Cuando termines, pulsa "Cobrar". El stock se descuenta automáticamente.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">6. Registra entradas y salidas</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    En Inventario, toca un producto para abrir su detalle. Ahí puedes
    registrar entradas de mercancía (compras), salidas (mermas, roturas) y
    ajustes por conteo físico. Cada movimiento queda registrado en el
    historial del producto.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">7. Imprime etiquetas</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Si un producto tiene código, en su detalle puedes generar una etiqueta
    con código de barras o código QR, con el nombre y el precio. Pulsa
    "Imprimir" para enviarla a la impresora.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">8. Importa productos desde CSV</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    En Inventario pulsa "Importar" para cargar productos desde un archivo
    CSV. El archivo debe tener columnas: Nombre, Codigo, Categoria, Unidad,
    Precio, Costo, Stock, StockMinimo. Si las categorías no existen, se
    crean automáticamente.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">9. Cuenta el efectivo con el contador</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    En la sección Contador introduce cuántos billetes o monedas tienes de cada
    denominación. La aplicación calcula el total automáticamente. Si escribes
    el monto esperado en caja, te muestra la diferencia y te avisa si sobra o
    falta dinero.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">10. Cierra el turno</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Al final del día, usa el contador para revisar cuánto efectivo tienes.
    Luego entra en Caja y pulsa "Cerrar turno". La aplicación guarda un resumen
    con las ventas del día, los retiros y el efectivo final.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">11. Consulta reportes</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    En Reportes puedes ver el total vendido hoy, el total histórico y el
    listado de las últimas transacciones. También puedes exportar todo a un
    archivo CSV para abrirlo en Excel o compartirlo.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">12. Maneja varios negocios</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    En Ajustes pulsa "Gestionar negocios". Cada negocio tiene sus propios
    productos, ventas, turnos, categorías y conteos. El negocio activo
    aparece en la parte superior de cada pantalla. Toca ese botón para
    cambiar de negocio o crear uno nuevo.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">13. Haz copias de seguridad</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Entra en Ajustes y pulsa "Exportar datos (JSON)". Se descargará un archivo
    con toda la información de todos tus negocios. Guárdalo en un lugar
    seguro. Si cambias de teléfono o reinstalas el navegador, puedes importar
    ese archivo para recuperar todo.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">Recomendaciones</strong>
  <ul style="font-size:14px;line-height:1.7;margin:0;padding-left:20px">
    <li>Exporta una copia de seguridad cada semana.</li>
    <li>No borres los datos del navegador si no has exportado antes.</li>
    <li>Configura el stock mínimo para que te avise cuando falte mercancía.</li>
    <li>Cierra el turno todos los días para llevar un control ordenado.</li>
  </ul>
</div>
`;

const HISTORIAL = `
<div class="card">
  <strong style="display:block;margin-bottom:8px">Historial de cambios y actualizaciones</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Registro cronológico de todas las mejoras y funciones añadidas a
    CajaFácil Cuba desde su primera versión hasta la actualidad.
  </p>
</div>

<div class="card">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
    <strong style="font-size:16px;color:var(--primary)">Versión 1.0.0</strong>
    <span style="font-size:12px;color:var(--muted)">Primera versión</span>
  </div>
  <ul style="font-size:14px;line-height:1.7;margin:0;padding-left:20px">
    <li>Punto de venta con ticket editable y búsqueda de productos.</li>
    <li>Inventario con alta, edición y eliminación de productos.</li>
    <li>Contador de efectivo con denominaciones CUP y USD.</li>
    <li>Caja y turnos con registro de retiros (sangría) y cierre diario.</li>
    <li>Reportes de ventas del día e historial completo.</li>
    <li>Exportación de ventas a CSV.</li>
    <li>Copia de seguridad en archivo JSON.</li>
    <li>Tema claro y oscuro.</li>
    <li>Guía de uso, preguntas frecuentes, política de privacidad y
        términos y condiciones.</li>
    <li>Funciona 100% offline.</li>
  </ul>
</div>

<div class="card">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
    <strong style="font-size:16px;color:var(--primary)">Versión 1.1.0</strong>
    <span style="font-size:12px;color:var(--muted)">Bloque 1 y 2</span>
  </div>
  <ul style="font-size:14px;line-height:1.7;margin:0;padding-left:20px">
    <li>Migración de datos de almacenamiento local a IndexedDB.</li>
    <li>Soporte para múltiples negocios dentro de la misma aplicación.</li>
    <li>Selector de negocio activo en la parte superior de cada pantalla.</li>
    <li>Nueva sección "Negocios" para crear, editar y eliminar negocios.</li>
    <li>Cada negocio con su propio inventario, ventas, caja y conteos,
        completamente separados.</li>
    <li>Ícono y color personalizado por negocio.</li>
    <li>Migración automática de datos antiguos a la nueva estructura
        multi-negocio.</li>
    <li>Sistema de auto-actualización de la aplicación.</li>
  </ul>
</div>

<div class="card">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
    <strong style="font-size:16px;color:var(--primary)">Versión 1.2.0</strong>
    <span style="font-size:12px;color:var(--muted)">Bloque 3</span>
  </div>
  <ul style="font-size:14px;line-height:1.7;margin:0;padding-left:20px">
    <li>Botón de instalación de la aplicación dentro de Ajustes.</li>
    <li>Validación de formularios en productos, negocios, caja,
        contador y ajustes.</li>
    <li>Mensajes de error claros cuando se introduce un dato inválido.</li>
    <li>Manejo global de errores: si algo falla, la aplicación avisa al
        usuario y no se queda en blanco.</li>
    <li>Eliminada la duplicidad del campo "Nombre del negocio" en Ajustes.
        Ahora la gestión se hace únicamente desde "Gestionar negocios".</li>
    <li>Mejoras en el sistema de auto-actualización: la aplicación revisa
        cambios cada 30 minutos y al abrirse.</li>
    <li>Historial de cambios y actualizaciones dentro de Ajustes.</li>
  </ul>
</div>

<div class="card">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
    <strong style="font-size:16px;color:var(--primary)">Versión 1.3.0</strong>
    <span style="font-size:12px;color:var(--muted)">Bloque 4 y 4.1</span>
  </div>
  <ul style="font-size:14px;line-height:1.7;margin:0;padding-left:20px">
    <li>Precios variables: el precio es solo una sugerencia y puede
        cambiarse en cada venta.</li>
    <li>Categorías de productos configurables por el usuario.</li>
    <li>Unidades de medida: unidad, libra, kilogramo, litro, metro,
        paquete, caja y docena.</li>
    <li>Costo y margen de ganancia por producto.</li>
    <li>Stock mínimo por producto con alertas visuales.</li>
    <li>Panel de alertas en la pantalla de venta cuando hay productos
        con stock bajo o agotado.</li>
    <li>Entradas de mercancía (compras a proveedores).</li>
    <li>Salidas de inventario (mermas, roturas).</li>
    <li>Ajustes por conteo físico.</li>
    <li>Historial de movimientos por producto.</li>
    <li>Filtro de productos por categoría y por estado de stock.</li>
    <li>Escaneo de códigos de barras con la cámara del teléfono.</li>
    <li>Generación e impresión de etiquetas con código de barras o QR.</li>
    <li>Importación masiva de productos desde archivo CSV.</li>
    <li>Exportación del inventario completo a CSV.</li>
    <li>Cantidades y stock con soporte para decimales.</li>
    <li>Actualización del historial de cambios y de la versión visible.</li>
  </ul>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:8px">Próximas versiones</strong>
  <p style="font-size:14px;line-height:1.6;margin:0 0 10px 0">
    Funciones planificadas para futuras actualizaciones:
  </p>
  <ul style="font-size:14px;line-height:1.7;margin:0;padding-left:20px">
    <li>Descuentos por ticket o por producto.</li>
    <li>Cobro mixto: efectivo, transferencia y USD en una misma venta.</li>
    <li>Ventas en espera.</li>
    <li>Cliente ocasional o registrado.</li>
    <li>Notas en la venta.</li>
    <li>Impresión de ticket en formato 58 mm u 80 mm.</li>
    <li>Envío del ticket por WhatsApp.</li>
    <li>Registro de vendedores con roles y permisos por PIN.</li>
    <li>Ingresos y gastos por categorías, tanto para el negocio como
        para finanzas personales.</li>
    <li>Control de deudas por cobrar y por pagar.</li>
    <li>Presupuestos mensuales y metas de ahorro.</li>
    <li>Reportes por fecha, producto, vendedor y forma de pago.</li>
    <li>Gráficos de evolución y exportación a PDF.</li>
  </ul>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">Notas sobre actualizaciones</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    CajaFácil Cuba se actualiza automáticamente. Cuando haya una nueva
    versión disponible, la aplicación la descargará sola y se reiniciará
    con los cambios. No es necesario desinstalar ni reinstalar nada, y tus
    datos se conservan intactos entre actualizaciones.
  </p>
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
    descarguen los estilos, los íconos y las librerías de códigos de barras
    y QR. Después funciona sin internet.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">¿Dónde se guardan mis datos?</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    En tu propio dispositivo. La aplicación usa una base de datos interna
    del navegador llamada IndexedDB, más robusta y con mayor capacidad que
    el almacenamiento tradicional.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">¿Puedo tener varios negocios en la misma app?</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Sí. Cada negocio tiene sus propios productos, categorías, ventas, turnos
    y conteos, completamente separados. Puedes cambiar de negocio en cualquier
    momento desde el botón que aparece en la parte superior de cada pantalla.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">¿Los precios son fijos?</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    No. El precio del producto es solo una sugerencia. Al agregarlo al ticket
    de venta puedes cambiarlo libremente. Si el precio es distinto al
    sugerido, el campo se marca en amarillo para que lo tengas presente.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">¿Cómo funcionan las alertas de stock?</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Cada producto puede tener un stock mínimo. Cuando el stock baja a ese
    número o menos, la app lo marca con color y aparece un aviso en la
    pantalla de venta. Así sabes qué reponer sin revisar manualmente.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">¿Puedo escanear códigos de barras?</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Sí. En el formulario de producto hay un botón de escanear que abre la
    cámara y lee el código automáticamente. Funciona en navegadores
    compatibles (Chrome para Android, por ejemplo).
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">¿Puedo imprimir etiquetas con código de barras?</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Sí. En el detalle de cualquier producto que tenga código, puedes generar
    una etiqueta con código de barras o QR y pulsar "Imprimir". Sale con el
    nombre, el precio y el código del producto.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">¿Cómo importo productos desde un archivo?</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    En Inventario pulsa "Importar" y elige un archivo CSV. El archivo debe
    tener estas columnas: Nombre, Codigo, Categoria, Unidad, Precio, Costo,
    Stock, StockMinimo. Si las categorías no existen, se crean solas.
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
    Abre la web con internet. Cuando el navegador lo permita, aparecerá una
    tarjeta en Ajustes con el botón "Instalar en mi teléfono". También puedes
    hacerlo desde el menú del navegador con "Añadir a pantalla de inicio".
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
  <strong style="display:block;margin-bottom:6px">¿Cómo me entero de las actualizaciones?</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    La aplicación se actualiza sola. Cuando haya cambios, verás un aviso
    breve indicando que se está aplicando la nueva versión. También puedes
    consultar el historial completo en Ajustes, dentro de "Historial de
    cambios".
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
    ninguna otra información del usuario. La cámara solo se usa cuando el
    usuario decide escanear un código de barras, y la imagen no se guarda ni
    se envía a ningún lado.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">2. Dónde se guarda la información</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    Toda la información que introduces (negocios, categorías, productos,
    movimientos, ventas, conteos, turnos y ajustes) se guarda exclusivamente
    en la base de datos interna del navegador de tu dispositivo. Nunca sale
    de él.
  </p>
</div>

<div class="card">
  <strong style="display:block;margin-bottom:6px">3. Uso de internet</strong>
  <p style="font-size:14px;line-height:1.6;margin:0">
    La aplicación solo usa internet la primera vez que se abre, para descargar
    los recursos visuales (estilos, íconos y librerías de códigos de barras y
    QR), y para buscar actualizaciones de la propia aplicación. En ningún caso
    se envían datos del usuario.
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
    visuales TailwindCSS y Tabler Icons, y las librerías de generación de
    códigos de barras y QR. Ninguna de ellas accede a la información de la
    aplicación.
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
    turnos de caja. Soporta múltiples negocios dentro de una misma instalación.
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
