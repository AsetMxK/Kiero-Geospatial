import axios from 'axios';
import { getAccessToken, getRefreshToken, storeTokens, clearTokens } from './tokenService';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:4000';
const API_BASE_URL = `${GATEWAY_URL}/api`;
const REFRESH_TOKEN_ENDPOINT = `${GATEWAY_URL}/auth-proxy/proxy-refresh`;

let isRefreshing = false;
let failedQueue = [];

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

        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;

        processQueue(null, access_token);

        return apiClient(originalRequest);

      } catch (refreshError) {
        console.error('Gagal me-refresh token:', refreshError);
        clearTokens();
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