/* Device-local, versioned persistence. No credentials or personal data. */
window.MersenneCache = (() => {
  const memory = new Map();
  let opening;
  function database() {
    if (opening) return opening;
    opening = new Promise(resolve => {
      if (!window.indexedDB) return resolve(null);
      const timer = setTimeout(() => resolve(null), 2000);
      try {
        const request = indexedDB.open('mersenne-lab-results', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('results', {keyPath:'key'});
        request.onsuccess = () => {clearTimeout(timer); resolve(request.result);};
        request.onerror = request.onblocked = () => {clearTimeout(timer); resolve(null);};
      } catch {clearTimeout(timer); resolve(null);}
    });
    return opening;
  }
  async function get(key) {
    if (memory.has(key)) return memory.get(key);
    const db = await database();
    if (!db) return null;
    return new Promise(resolve => {
      const timer = setTimeout(() => resolve(null), 2000);
      const done = value => {clearTimeout(timer); resolve(value);};
      try {
        const request = db.transaction('results').objectStore('results').get(key);
        request.onsuccess = () => done(request.result?.schema === 2 ? request.result.payload : null);
        request.onerror = () => done(null);
      } catch {done(null);}
    });
  }
  async function put(key, payload) {
    memory.set(key, payload);
    const db = await database();
    if (!db) return false;
    return new Promise(resolve => {
      const timer = setTimeout(() => resolve(false), 3000);
      const done = ok => {clearTimeout(timer); resolve(ok);};
      try {
        const tx = db.transaction('results', 'readwrite');
        tx.objectStore('results').put({key, schema:2, payload, savedAt:Date.now()});
        tx.oncomplete = () => done(true);
        tx.onerror = tx.onabort = () => done(false);
      } catch {done(false);}
    });
  }
  return {get, put};
})();
