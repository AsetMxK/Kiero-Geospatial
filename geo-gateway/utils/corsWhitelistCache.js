import prisma from '../config/prismaClient.js';

let allowedOriginsWhitelist = new Set();
let isCacheInitialized = false;
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // Refresh setiap 5 menit

/**
 * Mengambil semua `allowedOrigins` dari database dan membangun kembali cache Set di memori.
 * Fungsi ini dijadwalkan untuk berjalan secara berkala untuk menjaga agar daftar putih CORS tetap terbaru.
 * @export
 * @async
 */
export async function refreshWhitelistCache() {
    console.log('Refreshing CORS whitelist cache...');
    try {
        const allClients = await prisma.client.findMany({
            select: { allowedOrigins: true }
        });

        const newWhitelist = new Set();
        allClients.forEach(client => {
            if (client.allowedOrigins && client.allowedOrigins.trim()) {
                client.allowedOrigins.split(',').forEach(o => {
                    const trimmedOrigin = o.trim();
                    if (trimmedOrigin) {
                        newWhitelist.add(trimmedOrigin);
                    }
                });
            }
        });

        allowedOriginsWhitelist = newWhitelist;
        isCacheInitialized = true;
        console.log(`CORS whitelist cache refreshed. ${allowedOriginsWhitelist.size} origins loaded.`);

    } catch (error) {
        console.error("Error refreshing CORS whitelist cache:", error);
    }
}

/**
 * Memeriksa apakah sebuah origin ada di dalam cache daftar putih CORS.
 * @export
 * @param {string} origin - Origin yang akan diperiksa (misalnya, 'https://example.com').
 * @returns {boolean} `true` jika origin diizinkan, `false` jika tidak.
 */
export function isOriginAllowed(origin) {
    if (!isCacheInitialized) {
        console.warn("CORS check before cache initialization, denying origin:", origin);
        return false;
    }
    return allowedOriginsWhitelist.has(origin);
}

refreshWhitelistCache();

setInterval(refreshWhitelistCache, REFRESH_INTERVAL_MS);