const SERVICE_WORKER_PATH = '/service-worker.js';

/**
 * Fungsi pembantu internal yang menangani logika pendaftaran dan aktivasi Service Worker (SW).
 * Fungsi ini menunggu SW siap, menangani kasus di mana SW baru sedang menunggu,
 * dan memuat ulang halaman jika diperlukan untuk memastikan SW mengambil kontrol.
 * @async
 * @private
 */
async function registerAndActivateSW() {
  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, { scope: '/' });

  // Listener ini akan memicu reload jika SW baru mengambil alih.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Service Worker baru telah aktif. Halaman akan dimuat ulang.');
    window.location.reload();
  });

  // Tunggu hingga SW siap.
  await navigator.serviceWorker.ready;

  // Jika ada SW versi baru yang sedang menunggu.
  if (registration.waiting) {
    console.log("Service Worker baru sedang menunggu. Meminta untuk skip waiting...");
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  // Jika halaman ini belum dikontrol oleh SW (load pertama kali),
  // reload diperlukan agar SW dapat mencegat request dari awal.
  if (!navigator.serviceWorker.controller) {
    console.log('Service Worker baru saja aktif. Halaman akan dimuat ulang untuk mengambil kontrol.');
    // Beri sedikit waktu sebelum reload untuk memastikan SW siap sepenuhnya
    setTimeout(() => {
      window.location.reload();
    }, 150); // buffer
    // Saat reload terjadi, promise ini tidak akan pernah resolve, yang tidak masalah.
  } else {
    console.log('Service Worker sudah aktif dan mengontrol halaman ini.');
    // SW sudah siap, lanjutkan memuat aplikasi.
    return Promise.resolve();
  }
}

/**
 * Menginisialisasi Service Worker otentikasi.
 * Mendaftarkan SW dan memastikan ia aktif dan mengontrol halaman sebelum aplikasi utama dimuat.
 * @export
 * @returns {Promise<void>} Sebuah promise yang akan resolve setelah SW siap.
 */
export function initAuthServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker tidak didukung di browser ini.');
    return Promise.resolve();
  }

  // Panggil fungsi async di luar promise executor
  return registerAndActivateSW();
}

/**
 * Fungsi utilitas internal untuk mengirim pesan ke Service Worker yang aktif.
 * @param {any} message Pesan yang akan dikirim (harus dapat di-serialisasi).
 * @private
 */
function postMessageToSW(message) {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  } else {
    console.error("Tidak dapat mengirim pesan: Service Worker controller tidak tersedia.");
  }
}

/**
 * Mengirim URL endpoint konfigurasi ke Service Worker.
 * @export
 * @param {string} proxyTokenUrl URL untuk endpoint proxy token.
 * @param {string} refreshTokenUrl URL untuk endpoint refresh token.
 */
export function sendConfigToSW(proxyTokenUrl, refreshTokenUrl) {
    postMessageToSW({
        type: 'SET_CONFIG',
        payload: { proxyTokenUrl, refreshTokenUrl }
    });
}

/**
 * Mengirim token (access dan refresh) ke Service Worker untuk disimpan dengan aman.
 * @export
 * @param {string} accessToken Token akses JWT.
 * @param {string} refreshToken Token refresh.
 */
export function sendTokensToSW(accessToken, refreshToken) {
  postMessageToSW({
    type: 'SET_TOKENS',
    payload: { accessToken, refreshToken },
  });
}

/**
 * Memerintahkan Service Worker untuk menghapus semua token yang tersimpan.
 * Berguna untuk proses logout.
 * @export
 */
export function clearTokensInSW() {
  postMessageToSW({ type: 'CLEAR_TOKENS' });
}
