/**
 * Menghasilkan warna HSL (Hue, Saturation, Lightness) yang deterministik dari sebuah string input.
 * Fungsi ini menggunakan algoritma hash sederhana untuk mengubah string menjadi nilai hue,
 * memastikan bahwa string yang sama akan selalu menghasilkan warna yang sama.
 * Ini berguna untuk memberikan warna yang konsisten pada wilayah peta berdasarkan namanya.
 *
 * @param {string} str - String input, misalnya nama provinsi atau kabupaten.
 * @returns {string} String warna dalam format HSL, contoh: 'hsl(120, 70%, 60%)'.
 */
export function stringToHslColor(str) {
  if (!str) return '#CCCCCC';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

export const getInitialDateRange = () => {
  const params = new URLSearchParams(window.location.search);
  const startParam = params.get('startDate');
  const endParam = params.get('endDate');

  if (startParam && endParam) {
    const startDate = new Date(startParam);
    const endDate = new Date(endParam);
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      return { startDate, endDate, key: 'selection' };
    }
  }
  return {
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
    key: 'selection'
  };
};