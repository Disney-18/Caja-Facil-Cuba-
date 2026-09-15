// ============================================================
// CajaFácil Cuba - Capa de acceso a IndexedDB
// Bloque 5: vendedores y clientes
// Desarrollado por Disney Gutiérrez Guevara
// ============================================================

const DB_NAME = 'caja-facil-cuba';
const DB_VERSION = 3;

const STORES = {
  META: 'meta',
  NEGOCIOS: 'negocios',
  CATEGORIAS: 'categorias',
  PRODUCTOS: 'productos',
  MOVIMIENTOS_INV: 'movimientos_inv',
  VENDEDORES: 'vendedores',
  CLIENTES: 'clientes',
  VENTAS: 'ventas',
  TURNOS: 'turnos',
  CONTEOS: 'conteos',
  MOVIMIENTOS: 'movimientos'
};

let dbInstance = null;

function abrirDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = e => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META, { keyPath: 'clave' });
      }

      if (!db.objectStoreNames.contains(STORES.NEGOCIOS)) {
        const s = db.createObjectStore(STORES.NEGOCIOS, { keyPath: 'id' });
        s.createIndex('nombre', 'nombre', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CATEGORIAS)) {
        const s = db.createObjectStore(STORES.CATEGORIAS, { keyPath: 'id' });
        s.createIndex('negocio_id', 'negocio_id', { unique: false });
        s.createIndex('nombre', 'nombre', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PRODUCTOS)) {
        const s = db.createObjectStore(STORES.PRODUCTOS, { keyPath: 'id' });
        s.createIndex('negocio_id', 'negocio_id', { unique: false });
        s.createIndex('categoria_id', 'categoria_id', { unique: false });
        s.createIndex('codigo', 'codigo', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.MOVIMIENTOS_INV)) {
        const s = db.createObjectStore(STORES.MOVIMIENTOS_INV, { keyPath: 'id' });
        s.createIndex('negocio_id', 'negocio_id', { unique: false });
        s.createIndex('producto_id', 'producto_id', { unique: false });
        s.createIndex('fecha', 'fecha', { unique: false });
        s.createIndex('tipo', 'tipo', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.VENDEDORES)) {
        const s = db.createObjectStore(STORES.VENDEDORES, { keyPath: 'id' });
        s.createIndex('negocio_id', 'negocio_id', { unique: false });
        s.createIndex('nombre', 'nombre', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CLIENTES)) {
        const s = db.createObjectStore(STORES.CLIENTES, { keyPath: 'id' });
        s.createIndex('negocio_id', 'negocio_id', { unique: false });
        s.createIndex('nombre', 'nombre', { unique: false });
        s.createIndex('telefono', 'telefono', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.VENTAS)) {
        const s = db.createObjectStore(STORES.VENTAS, { keyPath: 'id' });
        s.createIndex('negocio_id', 'negocio_id', { unique: false });
        s.createIndex('fecha', 'fecha', { unique: false });
        s.createIndex('turno_id', 'turno_id', { unique: false });
        s.createIndex('vendedor_id', 'vendedor_id', { unique: false });
        s.createIndex('cliente_id', 'cliente_id', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.TURNOS)) {
        const s = db.createObjectStore(STORES.TURNOS, { keyPath: 'id' });
        s.createIndex('negocio_id', 'negocio_id', { unique: false });
        s.createIndex('estado', 'estado', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CONTEOS)) {
        const s = db.createObjectStore(STORES.CONTEOS, { keyPath: 'id' });
        s.createIndex('negocio_id', 'negocio_id', { unique: false });
        s.createIndex('fecha', 'fecha', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.MOVIMIENTOS)) {
        const s = db.createObjectStore(STORES.MOVIMIENTOS, { keyPath: 'id' });
        s.createIndex('negocio_id', 'negocio_id', { unique: false });
        s.createIndex('tipo', 'tipo', { unique: false });
        s.createIndex('fecha', 'fecha', { unique: false });
      }
    };

    req.onsuccess = e => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };

    req.onerror = () => reject(req.error);
  });
}

async function put(store, objeto) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(objeto);
    req.onsuccess = () => resolve(objeto);
    req.onerror = () => reject(req.error);
  });
}

async function get(store, id) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function getAll(store) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function getByIndex(store, indexName, valor) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const idx = tx.objectStore(store).index(indexName);
    const req = idx.getAll(valor);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function del(store, id) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

async function clear(store) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).clear();
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

async function contar(store) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function metaGet(clave, fallback = null) {
  const r = await get(STORES.META, clave);
  return r ? r.valor : fallback;
}

async function metaSet(clave, valor) {
  return put(STORES.META, { clave, valor });
}

const IDB = {
  STORES,
  abrirDB,
  put,
  get,
  getAll,
  getByIndex,
  del,
  clear,
  contar,
  metaGet,
  metaSet
};

window.IDB = IDB;
