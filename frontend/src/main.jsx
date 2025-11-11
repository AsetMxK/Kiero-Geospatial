import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import './index.css';
import { initAuthServiceWorker } from './lib/auth-sw-client.js';

const queryClient = new QueryClient();
const container = document.getElementById('root');

/**
 * Titik masuk utama untuk aplikasi React.
 * Fungsi asinkron ini pertama-tama menginisialisasi service worker otentikasi,
 * memastikan service worker tersebut siap sebelum antarmuka pengguna aplikasi di-render. Hal ini mencegah
 * kondisi balapan (race condition) terkait otentikasi. Setelah service worker siap,
 * fungsi ini me-render komponen root React (`App`) ke dalam DOM.
 * Jika inisialisasi gagal, fungsi ini menampilkan pesan kesalahan di dalam container root.
 * @async
 */
async function main() {
  try {
    await initAuthServiceWorker();

    if (container) {
      const root = createRoot(container);
      root.render(
        <React.StrictMode>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </React.StrictMode>
      );
    }
  } catch (error) {
    console.error("Gagal memulai aplikasi:", error);
    if(container) {
      container.innerHTML = `<div style="padding: 20px;"><h1>Gagal memuat aplikasi</h1><p>Terjadi kesalahan saat inisialisasi. Silakan coba muat ulang halaman.</p><pre>${error.message}</pre></div>`;
    }
  }
}

// Jalankan fungsi utama
main();
