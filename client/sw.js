const CACHE_NAME = 'hospital-pwa-cache-v2';
const DYNAMIC_CACHE = 'hospital-pwa-dynamic-v2';

// 1. LISTA DE INSTALACIÓN (SOLO ARCHIVOS LOCALES)
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './island.html',
    './nurse.html',
    './stretcher.html',

    // Vistas HTML
    './island/beds.html',
    './island/nurses.html',
    './island/patients.html',
    './nurse/beds.html',
    './nurse/patients.html',

    // Scripts JS
    './js/app.js',
    './js/config.js',
    './js/nurse.js',
    './js/stretcher.js',
    './js/island/beds.js',
    './js/island/nurses.js',
    './js/island/patients.js',
    './js/island/utils.js',

    // Librerías Externas (CDN)
    // 'https://cdn.tailwindcss.com', // REMOVED: CORS Error
    'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'
];

// 2. INSTALACIÓN
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Instalando...');
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('[Service Worker] Cacheando archivos...');
            for (const asset of ASSETS_TO_CACHE) {
                try {
                    await cache.add(asset);
                } catch (error) {
                    console.error(`[SW] Error al cachear: ${asset}`, error);
                }
            }
        })
    );
});

// 3. ACTIVACIÓN
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activando...');
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
                    console.log('[Service Worker] Borrando caché antiguo:', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

// 4. INTERCEPTOR DE PETICIONES (FETCH)
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // ESTRATEGIA 1: Network First (Para la API - Datos frescos)
    // Buscamos si la URL contiene "/api/"
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    // Si la respuesta es válida, la clonamos al caché y la devolvemos
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(event.request, responseToCache);
                            trimCache(DYNAMIC_CACHE, 50);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Si falla la red (offline), intentamos devolver lo que haya en caché
                    console.log('[SW] API offline/fallo, buscando en caché:', event.request.url);
                    return caches.match(event.request);
                })
        );
        return; // Importante salir aquí para no ejecutar la estrategia 2
    }

    // ESTRATEGIA 2: Cache First (Para archivos estáticos - Velocidad)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // A. Si está en caché, lo devolvemos
            if (cachedResponse) {
                return cachedResponse;
            }

            // B. Si no está, vamos a la red
            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }

                // Guardamos en caché dinámico lo nuevo
                const responseToCache = networkResponse.clone();

                if (event.request.url.startsWith('http')) {
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(event.request, responseToCache);
                        trimCache(DYNAMIC_CACHE, 50);
                    });
                }

                return networkResponse;
            }).catch(() => {
                console.log('[SW] Offline y sin caché:', event.request.url);
            });
        })
    );
});

// 5. FUNCIÓN DE LIMPIEZA DE CACHÉ
function trimCache(cacheName, maxItems) {
    caches.open(cacheName).then(cache => {
        cache.keys().then(keys => {
            if (keys.length > maxItems) {
                // Borramos el más viejo (el primero en la lista)
                cache.delete(keys[0])
                    .then(() => {
                        // Llamada recursiva hasta llegar al límite
                        trimCache(cacheName, maxItems);
                    });
            }
        });
    });
}