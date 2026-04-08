import axios from 'axios';
import { getAccessToken, getRefreshToken, storeTokens, clearTokens } from './tokenService';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000';
const API_BASE_URL = GATEWAY_URL;
const REFRESH_TOKEN_ENDPOINT = `${GATEWAY_URL}/auth-proxy/proxy-refresh`;

let isRefreshing = false;
let failedQueue = [];

// ============================================================================
// BroadcastChannel untuk sinkronisasi token antar tabs
// ============================================================================
const AUTH_CHANNEL_NAME = 'auth_channel';
let authChannel = null;

/**
 * Inisialisasi BroadcastChannel untuk sinkronisasi token antar tabs browser.
 * Jika satu tab berhasil refresh token, tab lain akan menerima notifikasi.
 */
const initAuthChannel = () => {
  if (typeof BroadcastChannel === 'undefined') {
    console.warn('BroadcastChannel not supported in this browser');
    return;
  }

  authChannel = new BroadcastChannel(AUTH_CHANNEL_NAME);

  authChannel.onmessage = (event) => {
    const { type, access_token, refresh_token } = event.data;

    if (type === 'TOKEN_REFRESHED' && access_token && refresh_token) {
      // Tab lain berhasil refresh token, simpan tokens baru
      storeTokens(access_token, refresh_token);
    } else if (type === 'TOKENS_CLEARED') {
      // Tab lain menghapus tokens (logout atau refresh gagal)
      clearTokens();
    }
  };
};

// Inisialisasi channel saat module dimuat
initAuthChannel();

/**
 * Broadcast token baru ke semua tabs lain.
 * @param {string} accessToken - Access token baru
 * @param {string} refreshToken - Refresh token baru
 */
const broadcastTokenRefresh = (accessToken, refreshToken) => {
  if (authChannel) {
    authChannel.postMessage({
      type: 'TOKEN_REFRESHED',
      access_token: accessToken,
      refresh_token: refreshToken
    });
  }
};

/**
 * Broadcast bahwa tokens telah dihapus ke semua tabs lain.
 */
const broadcastTokensClear = () => {
  if (authChannel) {
    authChannel.postMessage({ type: 'TOKENS_CLEARED' });
  }
};

// ============================================================================

/**
 * Memproses semua permintaan yang mengantri.
 * Jika sukses (ada token baru), coba lagi permintaannya.
 * Jika gagal, tolak semua permintaan di antrian.
 * @param {Error|null} error - Error jika refresh gagal
 * @param {string|null} token - Access token baru jika refresh sukses
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken(); // Ambil token dari sessionStorage
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = getRefreshToken();
    if (error.response?.status === 401 && refreshToken && !originalRequest._retry) {

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshApiClient = axios.create();
        const response = await refreshApiClient.post(REFRESH_TOKEN_ENDPOINT, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;
        storeTokens(access_token, refresh_token);

        // Broadcast ke tabs lain bahwa token telah di-refresh
        broadcastTokenRefresh(access_token, refresh_token);

        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;

        processQueue(null, access_token);

        return apiClient(originalRequest);

      } catch (refreshError) {
        console.error('Gagal me-refresh token:', refreshError);
        clearTokens();

        // Broadcast ke tabs lain bahwa tokens telah dihapus
        broadcastTokensClear();

        processQueue(refreshError, null);

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response && error.response.status >= 500) {
      const message = error.response.data?.message || 'Terjadi kesalahan internal pada server. Silakan coba lagi nanti.';
      window.dispatchEvent(new CustomEvent('AXIOS_ERROR', { detail: message }));
    }

    return Promise.reject(error);
  }
);

export default apiClient;