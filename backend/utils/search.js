const acronyms = {
  'dki': ['daerah', 'khusus', 'ibukota']
};

/**
 * Membersihkan dan mengubah string menjadi array kata-kata (token).
 * Fungsi ini mengubah string menjadi huruf kecil, menghapus tanda baca umum,
 * dan membaginya menjadi kata-kata individual (token).
 * Contoh: "Daerah Khusus Ibukota Jakarta" -> ['daerah', 'khusus', 'ibukota', 'jakarta']
 * @param {string} str String input yang akan di-tokenize.
 * @returns {string[]} Sebuah array token kata yang sudah dibersihkan.
 */
const tokenize = (str) => {
  if (!str) return [];
  return str
    .toLowerCase()
    .replace(/[.,]/g, '')
    .split(/\s+/)
    .filter(Boolean);
};

/**
 * Menghitung skor relevansi antara query pencarian dan nama wilayah.
 * Algoritma berbasis token ini dirancang untuk menangani akronim dan sinonim.
 * Memberikan skor tinggi untuk kecocokan akronim (misalnya, "dki" vs. "daerah khusus ibukota")
 * dan menambahkan poin untuk setiap kata lain yang cocok. Bonus kecil diberikan untuk jumlah token yang sama persis.
 * @param {string} query Query pencarian pengguna (misalnya, "Daerah Khusus Ibukota Jakarta").
 * @param {string} regionName Nama wilayah dari database (misalnya, "DKI Jakarta").
 * @returns {number} Skor numerik yang merepresentasikan kualitas kecocokan. Semakin tinggi semakin baik.
 */
const calculateMatchScore = (query, regionName) => {
  const queryTokens = new Set(tokenize(query));
  const regionTokens = new Set(tokenize(regionName));

  let score = 0;

  for (const token of regionTokens) {
    if (acronyms[token]) {
      const isMatch = acronyms[token].every(expandedToken => queryTokens.has(expandedToken));
      if (isMatch) {
        score += 100;
      }
    }
  }
  for (const token of queryTokens) {
    if (acronyms[token]) {
      const isMatch = acronyms[token].every(expandedToken => regionTokens.has(expandedToken));
      if (isMatch) {
        score += 100;
      }
    }
  }

  const intersection = new Set([...queryTokens].filter(token => regionTokens.has(token)));

  for (const match of intersection) {
    if (!acronyms[match] && !Object.values(acronyms).flat().includes(match)) {
      score += 10;
    }
  }

  if (queryTokens.size === regionTokens.size) {
    score += 5;
  }

  return score;
};


/**
 * Melakukan iterasi melalui daftar kandidat wilayah dan menemukan kecocokan terbaik untuk query pencarian yang diberikan.
 * Fungsi ini menggunakan `calculateMatchScore` untuk menilai setiap wilayah dan mengembalikan yang memiliki skor tertinggi,
 * asalkan memenuhi ambang batas minimum.
 * @export
 * @param {string} query - Query pencarian pengguna.
 * @param {Array<object>} regions - Array objek wilayah dari database. Setiap objek harus memiliki properti 'nama'.
 * @returns {object|null} Objek wilayah yang paling cocok, atau null jika tidak ada kecocokan yang sesuai.
 */
export const findBestMatch = (query, regions) => {
  if (!regions || regions.length === 0) {
    return null;
  }

  let bestMatch = null;
  let highestScore = 0;

  for (const region of regions) {
    const score = calculateMatchScore(query, region.nama);

    if (score > highestScore && score >= 10) {
      highestScore = score;
      bestMatch = region;
    }
  }

  return bestMatch;
};