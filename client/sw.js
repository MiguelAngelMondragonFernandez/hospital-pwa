importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCZgu1E_xrpOIaaSPExLzehHb9PwL1nNhA",
    authDomain: "authfluttertwitterclone.firebaseapp.com",
    projectId: "authfluttertwitterclone",
    storageBucket: "authfluttertwitterclone.firebasestorage.app",
    messagingSenderId: "485188841768",
    appId: "1:485188841768:web:eae53681a3930b7a4fa01d"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[sw.js] Received background message ', payload);

    const notificationTitle = payload.notification ? payload.notification.title : (payload.data ? payload.data.title : 'Notificación');
    const notificationOptions = {
        body: payload.notification ? payload.notification.body : (payload.data ? payload.data.body : ''),
        icon: './img/icons/icon-192x192.png',
        data: payload.data
    };

    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'BACKGROUND_MSG_RECEIVED',
                payload: payload
            });
        });
    });

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

const CACHE_NAME = 'hospital-pwa-cache-v2';
const DYNAMIC_CACHE = 'hospital-pwa-dynamic-v2';

// 1. LISTA DE INSTALACIÓN (SOLO ARCHIVOS LOCALES)
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './island.html',
    './nurse.html',
    './stretcher.html',
    './manifest.json',
    './images/icons/icon-192.png',
    './images/icons/icon-512.png',

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
    './js/nurse-notifications.js',
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
                    return caches.match(event.request).then(cachedResponse => {
                        if (cachedResponse) return cachedResponse;

                        // Si NO está en caché (ej: POST o datos nuevos), devolvemos un JSON de error controlado
                        // Esto evita el error "Failed to convert value to 'Response'"
                        return new Response(JSON.stringify({
                            message: "Estás offline y esta información no está en caché.",
                            offline: true
                        }), {
                            status: 503,
                            statusText: "Service Unavailable",
                            headers: { 'Content-Type': 'application/json' }
                        });
                    });
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
                // Retornar una respuesta de error controlada para evitar "Failed to convert value to 'Response'"
                return new Response('Offline', { status: 404, statusText: 'Not Found' });
            });
        })
    );
});

// 5. FUNCIÓN DE LIMPIEZA DE CACHÉ
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

// 6. BACKGROUND SYNC
// Note: importScripts won't work with ES modules syntax in idb-helper.js if this SW is not treated as module.
// However, standard SW importScripts cannot import ES modules natively in all browsers without type:module.
// To keep it simple given the project structure, we will inline the IDB logic or use a non-module approach.
// BUT, since user project seems module-based (import/export), let's try a different approach:
// We will assume the SW environment can handle the code if we just define the helpers here or load a non-module version.
// For robustness, I will inline the minimal IDB helper logic HERE to separate it from the module system used in 'client/js'.

// --- INLINED IDB HELPER FOR SW ---
const DB_NAME = 'hospital-pwa-db';
const DB_VERSION = 1;
const STORE_NAME = 'sync-posts';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function readAllData(storeName) {
    return openDB().then((db) => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    });
}

function deleteItemFromData(storeName, id) {
    return openDB().then((db) => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = (event) => reject(event.target.error);
        });
    });
}
// ---------------------------------

self.addEventListener('sync', (event) => {
    console.log('[SW] Background Sync detected:', event.tag);
    if (event.tag === 'sync-patients' || event.tag === 'sync-nurses' || event.tag === 'sync-beds') {
        console.log('[SW] Syncing pending data...');
        event.waitUntil(
            readAllData(STORE_NAME).then((data) => {
                return Promise.all(data.map((dt) => {
                    console.log("[SW] Sending synced data:", dt);
                    return fetch(dt.url, {
                        method: dt.method,
                        headers: dt.headers,
                        body: JSON.stringify(dt.body) // stored as plain object
                    })
                        .then((res) => {
                            if (res.ok) {
                                console.log("[SW] Sync success for:", dt.id);
                                // Delete from IDB
                                return deleteItemFromData(STORE_NAME, dt.id);
                            } else {
                                console.error("[SW] Sync failed response:", res);
                            }
                        })
                        .catch((err) => {
                            console.error("[SW] Sync error (network?):", err);
                        });
                }));
            })
        );
    }
});