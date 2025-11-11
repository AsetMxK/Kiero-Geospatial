const PIN_HISTORY_KEY = 'pinHistory';

/**
 * Menghasilkan ID unik untuk sebuah pin.
 * Menggunakan kombinasi timestamp dan angka acak untuk kesederhanaan.
 * @returns {string} ID unik yang dihasilkan.
 */
export const generatePinId = () => {
  return `pin_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Mengambil riwayat pin dari localStorage.
 * @returns {Array<object>} Sebuah array objek pin, atau array kosong jika tidak ada riwayat.
 */
export const getPinHistory = () => {
  try {
    const historyJson = localStorage.getItem(PIN_HISTORY_KEY);
    if (historyJson) {
      const history = JSON.parse(historyJson);
      if (Array.isArray(history)) {
        return history;
      }
    }
  } catch (error) {
    console.error('Gagal mem-parsing riwayat pin dari localStorage:', error);
  }
  return [];
};

/**
 * Menambahkan pin baru ke dalam riwayat di localStorage.
 * @param {object} pin - Data pin yang akan ditambahkan, tanpa ID.
 * @returns {object} Objek pin baru yang telah dibuat beserta ID-nya.
 */
export const addPinToHistory = (pin) => {
  const history = getPinHistory();
  const newPin = {
    ...pin,
    id: generatePinId(),
  };
  const updatedHistory = [...history, newPin];
  localStorage.setItem(PIN_HISTORY_KEY, JSON.stringify(updatedHistory));
  return newPin;
};

/**
 * Menghapus pin dari riwayat di localStorage.
 * @param {string} pinId - ID dari pin yang akan dihapus.
 */
export const removePinFromHistory = (pinId) => {
  const history = getPinHistory();
  const updatedHistory = history.filter((pin) => pin.id !== pinId);
  localStorage.setItem(PIN_HISTORY_KEY, JSON.stringify(updatedHistory));
};

/**
 * Memperbarui data pin di dalam riwayat di localStorage.
 * @param {object} updatedPin - Objek data pin yang telah diperbarui.
 */
export const updatePinInHistory = (updatedPin) => {
  const history = getPinHistory();
  const updatedHistory = history.map((pin) =>
    pin.id === updatedPin.id ? updatedPin : pin
  );
  localStorage.setItem(PIN_HISTORY_KEY, JSON.stringify(updatedHistory));
};