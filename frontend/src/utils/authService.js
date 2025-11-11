import { sendTokensToSW, clearTokensInSW, sendConfigToSW } from '../lib/auth-sw-client.js';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:4000';
const PROXY_TOKEN_ENDPOINT = `${GATEWAY_URL}/auth-proxy/proxy-token`;
const REFRESH_TOKEN_ENDPOINT = `${GATEWAY_URL}/auth-proxy/proxy-refresh`;
const API_BASE_URL = `${GATEWAY_URL}/api`;
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;

sendConfigToSW(PROXY_TOKEN_ENDPOINT, REFRESH_TOKEN_ENDPOINT);

let initialAuthPromise = null;

/**
 * Menjalankan alur otentikasi awal (client credentials) untuk mendapatkan token
 * saat aplikasi pertama kali dimuat. Menggunakan sebuah promise untuk memastikan
 * proses ini hanya berjalan satu kali meskipun ada beberapa permintaan gagal secara bersamaan.
 * @private
 * @async
 * @returns {Promise<Response>} Promise yang me-resolve dengan respons dari server token.
 * @throws {Error} Jika otentikasi gagal.
 */
async function initialAuthentication() {
    if (!CLIENT_ID) {
        throw new Error('VITE_CLIENT_ID tidak ditemukan di variabel lingkungan frontend.');
    }
    console.log('Memulai autentikasi awal...');
    try {
        const response = await fetch(PROXY_TOKEN_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: CLIENT_ID }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gagal mendapatkan token awal: ${errorData.error_description || response.statusText}`);
        }

        const tokenData = await response.json();
        await sendTokensToSW(tokenData.access_token, tokenData.refresh_token);
        console.log('Autentikasi awal berhasil, token dikirim ke SW.');
        return response;

    } catch (error) {
        console.error('Error selama autentikasi awal:', error);
        await clearTokensInSW();
        throw error;
    }
}


/**
 * Menjalankan alur otentikasi untuk konteks iframe, menggunakan JWT Assertion
 * yang diterima dari jendela induk (`parent window`).
 * @export
 * @async
 * @param {string} assertion - JWT Assertion yang ditandatangani oleh aplikasi pihak ketiga.
 * @returns {Promise<Response>} Promise yang me-resolve dengan respons dari server token.
 * @throws {Error} Jika assertion tidak ada atau otentikasi gagal.
 */
export async function authenticateWithAssertion(assertion) {
    if (!assertion) {
        throw new Error('JWT Assertion is required for iframe authentication.');
    }
    console.log('Memulai autentikasi iframe dengan assertion...');
    try {
        const response = await fetch(PROXY_TOKEN_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assertion }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gagal mendapatkan token dengan assertion: ${errorData.error_description || response.statusText}`);
        }

        const tokenData = await response.json();
        await sendTokensToSW(tokenData.access_token, tokenData.refresh_token);
        console.log('Autentikasi iframe berhasil, token dikirim ke SW.');
        return response;
    } catch (error) {
        console.error('Error selama autentikasi assertion:', error);
        await clearTokensInSW();
        throw error;
    }
}

/**
 * Sebuah wrapper di sekitar `fetch` yang secara otomatis menangani otentikasi.
 * Fungsi ini mendelegasikan penyisipan token ke Service Worker. Jika permintaan
 * gagal dengan status 401 (Unauthorized), fungsi ini akan mencoba memicu alur
 * otentikasi ulang (`initialAuthentication`) dan kemudian mencoba kembali permintaan asli.
 * @export
 * @async
 * @param {string} endpoint - URL lengkap atau path API (misalnya, '/v1/geo/provinsi').
 * @param {object} [options={}] - Opsi standar untuk `fetch` (method, body, dll.).
 * @returns {Promise<Response>} Promise yang me-resolve dengan objek `Response` dari `fetch`.
 */
export async function fetchAuthenticated(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, options);

    if (response.status === 401 && !url.includes('/oauth/refresh')) {
        console.log('Fetch gagal dengan 401, mencoba re-autentikasi...');
        
        // Hanya jalankan autentikasi awal jika belum pernah dijalankan atau sudah selesai.
        if (!initialAuthPromise) {
            initialAuthPromise = initialAuthentication();
        }

        try {
            await initialAuthPromise;
            console.log('Mencoba ulang permintaan asli setelah re-autentikasi...');
            return await fetch(url, options);
        } finally {
            initialAuthPromise = null;
        }
    }
    
    return response;
}
