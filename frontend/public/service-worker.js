// service-worker.js

// --- Konfigurasi IndexedDB ---
const DB_NAME = 'auth-db';
const TOKEN_STORE_NAME = 'tokens';
const DB_VERSION = 1;

// --- Variabel Konfigurasi ---
let REFRESH_TOKEN_ENDPOINT = '';

// --- State Management ---
// Promise "in-flight" untuk refresh token tetap diperlukan untuk menghindari panggilan ganda.
let tokenRefreshPromise = null;

// --- Helper Functions ---
const log = (...args) => console.log('SW:', ...args);

/**
 * Membuka koneksi ke IndexedDB.
 * Meng-handle pembuatan atau upgrade object store.
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(TOKEN_STORE_NAME)) {
                db.createObjectStore(TOKEN_STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Mengambil nilai dari IndexedDB.
 * @param {string} key - Kunci dari item yang akan diambil ('accessToken' atau 'refreshToken').
 */
async function getToken(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(TOKEN_STORE_NAME, 'readonly');
        const store = transaction.objectStore(TOKEN_STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result ? request.result.value : null);
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Menyimpan nilai ke IndexedDB.
 * @param {string} key - Kunci dari item yang akan disimpan.
 * @param {any} value - Nilai yang akan disimpan.
 */
async function setToken(key, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(TOKEN_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(TOKEN_STORE_NAME);
        const request = store.put({ id: key, value });
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Menghapus semua token dari IndexedDB.
 */
async function clearTokens() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(TOKEN_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(TOKEN_STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}


/**
 * Fungsi untuk mengambil token baru menggunakan refresh token dari IndexedDB.
 */
async function refreshAccessToken() {
    const refreshToken = await getToken('refreshToken');
    if (!refreshToken) {
        log('Refresh token tidak ada, tidak dapat me-refresh.');
        return Promise.reject(new Error('No refresh token'));
    }

    if (tokenRefreshPromise) {
        log('Mengikuti proses refresh yang sudah berjalan...');
        return tokenRefreshPromise;
    }

    log('Memulai proses refresh access token...');
    tokenRefreshPromise = fetch(REFRESH_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
    })
    .then(async (response) => {
        if (!response.ok) {
            log('Refresh token gagal. Menghapus semua token.');
            await clearTokens();
            throw new Error('Refresh token failed');
        }
        const newTokens = await response.json();
        await setToken('accessToken', newTokens.access_token);
        await setToken('refreshToken', newTokens.refresh_token);
        log('Token berhasil di-refresh dan disimpan di IndexedDB.');
        return newTokens.access_token;
    })
    .finally(() => {
        tokenRefreshPromise = null;
    });

    return tokenRefreshPromise;
}

// --- Event Listeners ---

self.addEventListener('install', () => {
    log('Event: install. Melewati waiting...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    log('Event: activate. Mengambil alih kontrol klien...');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', async (event) => {
    log('Event: message diterima dari klien.', event.data.type);
    const { type, payload } = event.data;

    switch (type) {
        case 'SET_TOKENS':
            await setToken('accessToken', payload.accessToken);
            await setToken('refreshToken', payload.refreshToken);
            log('Token telah disimpan di IndexedDB.');
            break;
        case 'CLEAR_TOKENS':
            await clearTokens();
            log('Token telah dihapus dari IndexedDB.');
            break;
        case 'SET_CONFIG':
            REFRESH_TOKEN_ENDPOINT = payload.refreshTokenUrl;
            log('URL Konfigurasi telah diatur.');
            break;
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
    }
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/')) {
        return;
    }

    log(`Event: fetch terdeteksi untuk: ${url.pathname}`);

    event.respondWith(
        (async () => {
            const accessToken = await getToken('accessToken');
            if (!accessToken) {
                log('Tidak ada access token di IndexedDB, meneruskan permintaan tanpa otorisasi.');
                return fetch(request);
            }
            
            const clonedRequest = request.clone();
            const headers = new Headers(clonedRequest.headers);
            headers.set('Authorization', `Bearer ${accessToken}`);
            
            const modifiedRequest = new Request(clonedRequest, { headers });

            try {
                const response = await fetch(modifiedRequest);

                if (response.status === 401) {
                    log('Permintaan gagal dengan 401. Mencoba me-refresh token...');
                    try {
                        const newAccessToken = await refreshAccessToken();
                        
                        const newHeaders = new Headers(request.headers);
                        newHeaders.set('Authorization', `Bearer ${newAccessToken}`);
                        const retryRequest = new Request(request, { headers: newHeaders });

                        log('Mengulangi permintaan dengan token baru...');
                        return fetch(retryRequest);
                    } catch {
                        log('Gagal me-refresh token. Mengembalikan respons 401 asli.');
                        return response;
                    }
                }
                return response;
            } catch (error) {
                log('Kesalahan jaringan saat fetch:', error);
                throw error;
            }
        })()
    );
});
