const DB_NAME = 'hope-haven-offline';
const STORE = 'books';
const VERSION = 1;

let _dbPromise = null;

function openDb() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

async function withStore(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const result = fn(store);
    tx.oncomplete = () => resolve(result?.result);
    tx.onerror = () => reject(tx.error);
  });
}

const offlineCache = {
  // Download + persist the e-book file for offline reading
  async save(ebookId, title, url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status === 403 ? 'Download not allowed' : `Download failed (${res.status})`);
    const blob = await res.blob();
    const record = { id: `ebook_${ebookId}`, ebookId, title, blob, format: blob.type, downloadedAt: Date.now() };
    await withStore('readwrite', (store) => store.put(record));
    return record;
  },
  async get(ebookId) {
    const result = await withStore('readonly', (store) => store.get(`ebook_${ebookId}`));
    return result || null;
  },
  async has(ebookId) {
    return !!(await offlineCache.get(ebookId));
  },
  async remove(ebookId) {
    await withStore('readwrite', (store) => store.delete(`ebook_${ebookId}`));
  },
  async list() {
    const result = await withStore('readonly', (store) => store.getAll());
    return result || [];
  }
};

export default offlineCache;