// ============================================================
// CajaFácil Cuba - Migración de localStorage a IndexedDB
// Se ejecuta una sola vez, en la primera carga tras actualizar
// Desarrollado por Disney Gutiérrez Guevara
// ============================================================

const MIGRACION_VERSION = 1;

async function migrarSiEsNecesario() {
  const yaMigrado = await IDB.metaGet('migracion_v' + MIGRACION_VERSION, false);
  if (yaMigrado) return { migrado: false, razon: 'ya_migrado' };

  const productos = leerLS('cfc_productos', []);
  const ventas = leerLS('cfc_ventas', []);
  const turno = leerLS('cfc_turno', null);
  const conteos = leerLS('cfc_conteos', []);
  const ajustes = leerLS('cfc_ajustes', null);
  const turnosCerrados = leerLS('cfc_turnosCerrados', []);

  const hayDatos = productos.length || ventas.length || turno ||
                   conteos.length || turnosCerrados.length || ajustes;

  let negocio = await IDB.metaGet('negocio_activo_objeto', null);
  if (!negocio) {
    negocio = {
      id: 'neg_' + Date.now().toString(36),
      nombre: ajustes?.negocio || 'Mi Negocio',
      tipo: 'general',
      color: '#2563eb',
      icono: 'ti-building-store',
      creado: new Date().toISOString()
    };
    await IDB.put(IDB.STORES.NEGOCIOS, negocio);
    await IDB.metaSet('negocio_activo', negocio.id);
    await IDB.metaSet('negocio_activo_objeto', negocio);
  }

  if (!hayDatos) {
    await IDB.metaSet('migracion_v' + MIGRACION_VERSION, true);
    if (!ajustes) {
      await IDB.metaSet('ajustes', {
        negocio: negocio.nombre,
        tasaUSD: 320,
        tema: 'light',
        moneda: 'CUP'
      });
    } else {
      await IDB.metaSet('ajustes', ajustes);
    }
    return { migrado: false, razon: 'sin_datos_previos' };
  }

  for (const p of productos) {
    await IDB.put(IDB.STORES.PRODUCTOS, {
      ...p,
      negocio_id: negocio.id,
      creado: p.creado || new Date().toISOString()
    });
  }

  for (const v of ventas) {
    await IDB.put(IDB.STORES.VENTAS, {
      ...v,
      negocio_id: negocio.id,
      turno_id: v.turno || null
    });
  }

  if (turno) {
    await IDB.put(IDB.STORES.TURNOS, {
      id: turno.id,
      negocio_id: negocio.id,
      inicio: turno.inicio,
      inicial: turno.inicial || 0,
      retiros: turno.retiros || [],
      estado: 'abierto',
      fin: null
    });
  }

  for (const t of turnosCerrados) {
    await IDB.put(IDB.STORES.TURNOS, {
      id: t.id,
      negocio_id: negocio.id,
      inicio: t.inicio,
      fin: t.fin,
      inicial: t.inicial || 0,
      retiros: t.retiros || [],
      totalVentas: t.totalVentas || 0,
      totalRetiros: t.totalRetiros || 0,
      efectivoFinal: t.efectivoFinal || 0,
      cantidadVentas: t.cantidadVentas || 0,
      estado: 'cerrado'
    });
  }

  for (const c of conteos) {
    await IDB.put(IDB.STORES.CONTEOS, {
      ...c,
      negocio_id: negocio.id
    });
  }

  await IDB.metaSet('ajustes', ajustes || {
    negocio: negocio.nombre,
    tasaUSD: 320,
    tema: 'light',
    moneda: 'CUP'
  });

  await IDB.metaSet('migracion_v' + MIGRACION_VERSION, true);

  return {
    migrado: true,
    productos: productos.length,
    ventas: ventas.length,
    conteos: conteos.length,
    turnosCerrados: turnosCerrados.length
  };
}

function leerLS(clave, fallback) {
  try {
    const v = localStorage.getItem(clave);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

window.migrarSiEsNecesario = migrarSiEsNecesario;
