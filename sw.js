// ─── Service Worker · Maison QR ───────────────────────────────────────────
// Versión: incrementá este número cada vez que cambiés algo del menú o la app
const VERSION   = 'v1';
const CACHE     = 'maison-qr-' + VERSION;

// Archivos que se cachean al instalar (la app completa)
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/data/menu.json',
];

// ─── Instalación: guarda todos los archivos en cache ──────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(PRECACHE);
    })
  );
  // Activa inmediatamente sin esperar que cierren otras pestañas
  self.skipWaiting();
});

// ─── Activación: borra caches viejas ──────────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) { return key !== CACHE; })
          .map(function(key)   { return caches.delete(key); })
      );
    })
  );
  // Toma control de todas las pestañas abiertas
  self.clients.claim();
});

// ─── Fetch: estrategia "network first, cache fallback" ────────────────────
// Primero intenta la red (para tener precios actualizados).
// Si la red falla (WiFi malo del restaurante), sirve desde cache.
self.addEventListener('fetch', function(event) {
  // Solo intercepta GET — deja pasar POST (pagos, pedidos)
  if (event.request.method !== 'GET') return;

  // No interceptes requests a dominios externos (MercadoPago, etc.)
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Si la red respondió bien, guarda una copia en cache y devuelve
        var copy = response.clone();
        caches.open(CACHE).then(function(cache) {
          cache.put(event.request, copy);
        });
        return response;
      })
      .catch(function() {
        // Red falló → busca en cache
        return caches.match(event.request).then(function(cached) {
          if (cached) return cached;
          // Si no hay cache ni red, devuelve index.html (para navegación offline)
          return caches.match('/index.html');
        });
      })
  );
});

// ─── Background sync: reintenta pedidos fallidos ──────────────────────────
// Si el pago falla por red, lo reintenta cuando vuelve la conexión
self.addEventListener('sync', function(event) {
  if (event.tag === 'retry-order') {
    event.waitUntil(retryPendingOrders());
  }
});

async function retryPendingOrders() {
  // Abre IndexedDB donde guardamos pedidos pendientes
  // (implementado en index.html → saveOrderLocally)
  var db = await openDB();
  var orders = await db.getAll('pending');
  for (var order of orders) {
    try {
      var res = await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(order),
      });
      if (res.ok) await db.delete('pending', order.id);
    } catch (e) {
      // Sigue intentando en el próximo sync
    }
  }
}

function openDB() {
  return new Promise(function(resolve, reject) {
    var req = indexedDB.open('maisonqr', 1);
    req.onupgradeneeded = function(e) {
      e.target.result.createObjectStore('pending', { keyPath: 'id' });
    };
    req.onsuccess = function(e) {
      var db = e.target.result;
      resolve({
        getAll: function(store) {
          return new Promise(function(res) {
            var tx  = db.transaction(store, 'readonly');
            var req = tx.objectStore(store).getAll();
            req.onsuccess = function() { res(req.result); };
          });
        },
        delete: function(store, id) {
          return new Promise(function(res) {
            var tx = db.transaction(store, 'readwrite');
            tx.objectStore(store).delete(id);
            tx.oncomplete = res;
          });
        },
      });
    };
    req.onerror = reject;
  });
}
