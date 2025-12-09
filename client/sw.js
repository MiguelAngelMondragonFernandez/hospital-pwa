const CACHE_NAME = 'hospital-pwa-v1';
const DYNAMIC_CACHE = 'hospital-pwa-dynamic-v1';

// Lista de archivos estáticos esenciales para que la app funcione offline
// Basado en tu estructura de carpetas
const ASSETS_TO_CACHE = [
    './',                     // Root
    './index.html',           // Login
    './island.html',          // Dashboard Isla
    './nurse.html',           // Dashboard Enfermero
    
    // Vistas de Isla
    './island/beds.html',
    './island/nurses.html',
    './island/patients.html',
    './island/history.html', // Si existe

    // Vistas de Enfermero
    './nurse/beds.html',
    './nurse/patients.html',
    
    // Scripts Globales
    './js/app.js',
    './js/config.js',
    './js/utils.js',
    
    // Scripts Específicos
    './js/island/beds.js',
    './js/island/nurses.js',
    // Agrega aquí otros scripts JS que sean vitales
    
    // Estilos (CDN de Tailwind)
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'
];

// 1. INSTALACIÓN: Cacheamos los recursos estáticos (Shell de la App)
self.addEventListener('install', event => {
    console.log('[Service Worker] Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[Service Worker] Pre-cacheando App Shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting(); // Forza la activación inmediata
});

// 2. ACTIVACIÓN: Limpiamos cachés viejos
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activando...');
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
                    console.log('[Service Worker] Borrando caché viejo:', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

// 3. FETCH: Interceptamos las peticiones
self.addEventListener('fetch', event => {
    const { request } = event;

    // A. ESTRATEGIA PARA API (Datos dinámicos): Network First, fallback to Cache
    // Si la URL incluye tu puerto de backend o la palabra /api/
    if (request.url.includes('/api/') || request.url.includes(':8082')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Si la red responde bien, guardamos una copia en caché dinámico y retornamos
                    return caches.open(DYNAMIC_CACHE).then(cache => {
                        cache.put(request.url, response.clone());
                        return response;
                    });
                })
                .catch(() => {
                    // Si la red falla (Offline), buscamos en el caché dinámico
                    return caches.match(request);
                })
        );
        return;
    }

    // B. ESTRATEGIA PARA ASSETS (HTML, JS, CSS): Cache First, fallback to Network
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse; // Devuelve desde caché si existe
            }
            return fetch(request).then(networkResponse => {
                // Si no está en caché, lo buscamos en la red y lo guardamos (opcional para archivos nuevos)
                /* return caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, networkResponse.clone());
                    return networkResponse;
                }); 
                */
               return networkResponse;
            });
        }).catch(() => {
            // Fallback genérico si no hay red y no está en caché (Opcional: página 404 offline)
            if (request.headers.get('accept').includes('text/html')) {
                return caches.match('./index.html'); // O una página offline.html dedicada
            }
        })
    );
});