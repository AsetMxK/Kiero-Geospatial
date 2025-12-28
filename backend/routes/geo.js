import express from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/prismaClient.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// ============================================================================
// CACHING SYSTEM - In-memory cache untuk data geospasial statis
// ============================================================================

/**
 * Cache store dengan TTL (Time To Live).
 * Key: cache identifier (e.g., 'provinsi', 'kab-kota-62')
 * Value: { data: any, timestamp: number }
 */
const geoCache = new Map();

// Cache TTL: 1 jam (data geografis jarang berubah)
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Mengambil data dari cache jika masih valid.
 * @param {string} key - Cache key
 * @returns {any|null} Cached data atau null jika expired/tidak ada
 */
const getFromCache = (key) => {
  const cached = geoCache.get(key);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > CACHE_TTL_MS;
  if (isExpired) {
    geoCache.delete(key);
    return null;
  }

  return cached.data;
};

/**
 * Menyimpan data ke cache.
 * @param {string} key - Cache key
 * @param {any} data - Data untuk di-cache
 */
const setToCache = (key, data) => {
  geoCache.set(key, {
    data,
    timestamp: Date.now()
  });
};

/**
 * Pre-warm cache dengan data yang sering diakses.
 * Dipanggil saat aplikasi startup untuk menghindari cold-start latency.
 * @export
 * @async
 */
export const warmCache = async () => {
  console.log('🔥 Warming geo cache...');
  try {
    const query = Prisma.sql`
      SELECT DISTINCT id, level, tipe_adm, nama, kode_prov, kode_kab, kode_kec, luas, ST_AsGeoJSON(geom) as geom_geojson 
      FROM regions 
      WHERE level = 'provinsi'`;

    const results = await prisma.$queryRaw(query);
    const features = [];
    for (const item of results) {
      let geometry = null;
      if (item.geom_geojson) {
        try {
          geometry = JSON.parse(item.geom_geojson);
        } catch (e) {
          continue;
        }
      }
      const { geom_geojson, ...properties } = item;
      features.push({ type: "Feature", properties, geometry });
    }

    const responseData = {
      message: "Data retrieved successfully",
      data: features
    };

    setToCache('geo:provinsi', responseData);
    console.log(`✅ Cache warmed: geo:provinsi (${features.length} provinces)`);
  } catch (error) {
    console.error('⚠️ Failed to warm cache:', error.message);
  }
};

// ============================================================================

/**
 * Memformat array hasil query database menjadi array GeoJSON FeatureCollection.
 * Setiap item hasil dikonversi menjadi sebuah GeoJSON Feature, dengan geometrinya di-parse
 * dari string dan propertinya dipetakan dari kolom-kolom database.
 *
 * @param {Array<object>} results - Array objek data wilayah dari query database mentah.
 * @param {string} [results[].geom_geojson] - Objek geometri GeoJSON dalam bentuk string.
 * @param {string} results[].level - Level administratif wilayah.
 * @param {string} results[].tipe_adm - Kode tipe administratif.
 * @param {string} results[].nama - Nama wilayah.
 * @param {string} results[].kode_prov - Kode provinsi.
 * @param {string} [results[].kode_kab] - Kode kabupaten/kota.
 * @param {string} [results[].kode_kec] - Kode kecamatan.
 * @param {number} [results[].luas] - Luas wilayah.
 * @returns {Array<object>} Sebuah array objek GeoJSON Feature.
 */
const formatResultsToGeoJSON = (results) => {
  const features = [];
  for (const item of results) {
    let geometry = null;
    if (item.geom_geojson) {
      try {
        geometry = JSON.parse(item.geom_geojson);
      } catch (e) {
        console.error('Gagal mem-parsing GeoJSON untuk item:', item.nama, e);
        continue;
      }
    }

    // Pisahkan geom_geojson dari properti lainnya
    const { geom_geojson, ...properties } = item;

    features.push({
      type: "Feature",
      properties: properties,
      geometry: geometry,
    });
  }
  return features;
};

/**
 * Mengeksekusi query geospasial mentah menggunakan Prisma, memformat hasilnya ke GeoJSON,
 * dan mengirimkan respons. Mendukung caching opsional untuk data statis.
 *
 * @async
 * @param {import('express').Response} res - Objek response Express.
 * @param {Prisma.Sql} queryTemplate - Template query SQL mentah untuk dieksekusi.
 * @param {string} [cacheKey] - Opsional. Jika disediakan, hasil akan di-cache.
 * @returns {Promise<void>} Sebuah promise yang me-resolve ketika respons telah dikirim.
 */
const executeAndFormatGeoQuery = async (res, queryTemplate, cacheKey = null) => {
  try {
    // Cek cache terlebih dahulu jika cacheKey disediakan
    if (cacheKey) {
      const cachedData = getFromCache(cacheKey);
      if (cachedData) {
        res.set('X-Cache', 'HIT');
        return res.json(cachedData);
      }
    }

    const results = await prisma.$queryRaw(queryTemplate);
    const features = formatResultsToGeoJSON(results);
    const responseData = {
      message: "Data retrieved successfully",
      data: features
    };

    // Simpan ke cache jika cacheKey disediakan
    if (cacheKey) {
      setToCache(cacheKey, responseData);
      res.set('X-Cache', 'MISS');
    }

    res.json(responseData);
  } catch (error) {
    console.error('Geo query error:', error);
    res.locals.errorMessage = error.stack;
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @route GET /v1/geo/provinsi
 * @description Mengambil data GeoJSON untuk semua provinsi.
 * Endpoint ini melakukan query ke database untuk semua wilayah di level 'provinsi'
 * dan mengembalikan detail serta geometri mereka sebagai GeoJSON FeatureCollection.
 * @access Private
 * @param {import('express').Request} req - Objek request Express.
 * @param {import('express').Response} res - Objek response Express.
 * @returns {Promise<void>}
 */
router.get('/provinsi', async (req, res) => {
  const query = Prisma.sql`
    SELECT DISTINCT id, level, tipe_adm, nama, kode_prov, kode_kab, kode_kec, luas, ST_AsGeoJSON(geom) as geom_geojson 
    FROM regions 
    WHERE level = 'provinsi'`;
  // Cache provinsi data (jarang berubah)
  await executeAndFormatGeoQuery(res, query, 'geo:provinsi');
});

/**
 * @route GET /v1/geo/kab-kota/:provinceCode
 * @description Mengambil data GeoJSON untuk semua kabupaten/kota dalam provinsi tertentu.
 * Menggunakan parameter URL `provinceCode` untuk memfilter hasil.
 * @access Private
 * @param {import('express').Request} req - Objek request Express, berisi parameter `provinceCode`.
 * @param {import('express').Response} res - Objek response Express.
 * @returns {Promise<void>}
 */
router.get('/kab-kota/:provinceCode', async (req, res) => {
  const { provinceCode } = req.params;
  const query = Prisma.sql`
    SELECT DISTINCT id, level, tipe_adm, nama, kode_prov, kode_kab, kode_kec, luas, ST_AsGeoJSON(geom) as geom_geojson 
    FROM regions 
    WHERE level = 'kab_kota' AND kode_prov = ${provinceCode}`;
  // Cache per provinsi
  await executeAndFormatGeoQuery(res, query, `geo:kab-kota:${provinceCode}`);
});

/**
 * @route GET /v1/geo/kecamatan/:provinceCode/:kabkotaCode
 * @description Mengambil data GeoJSON untuk semua kecamatan dalam kabupaten/kota tertentu.
 * Menggunakan parameter URL `provinceCode` dan `kabkotaCode` untuk memfilter hasil.
 * @access Private
 * @param {import('express').Request} req - Objek request Express, berisi parameter `provinceCode` dan `kabkotaCode`.
 * @param {import('express').Response} res - Objek response Express.
 * @returns {Promise<void>}
 */
router.get('/kecamatan/:provinceCode/:kabkotaCode', async (req, res) => {
  const { provinceCode, kabkotaCode } = req.params;
  const query = Prisma.sql`
      SELECT DISTINCT id, level, tipe_adm, nama, kode_prov, kode_kab, kode_kec, luas, ST_AsGeoJSON(geom) as geom_geojson 
      FROM regions 
      WHERE level = 'kecamatan' AND kode_prov = ${provinceCode} AND kode_kab = ${kabkotaCode}`;
  await executeAndFormatGeoQuery(res, query);
});

/**
 * @route GET /v1/geo/desa/:provinceCode/:kabkotaCode/:kecamatanCode
 * @description Mengambil data GeoJSON untuk semua desa/kelurahan dalam kecamatan tertentu.
 * Menggunakan parameter URL `provinceCode`, `kabkotaCode`, dan `kecamatanCode` untuk pemfilteran yang presisi.
 * @access Private
 * @param {import('express').Request} req - Objek request Express, berisi parameter kode wilayah.
 * @param {import('express').Response} res - Objek response Express.
 * @returns {Promise<void>}
 */
router.get('/desa/:provinceCode/:kabkotaCode/:kecamatanCode', async (req, res) => {
  const { provinceCode, kabkotaCode, kecamatanCode } = req.params;
  const query = Prisma.sql`
      SELECT DISTINCT id, level, tipe_adm, nama, kode_prov, kode_kab, kode_kec, luas, ST_AsGeoJSON(geom) as geom_geojson 
      FROM regions 
      WHERE level = 'desa' AND kode_prov = ${provinceCode} AND kode_kab = ${kabkotaCode} AND kode_kec = ${kecamatanCode}`;
  await executeAndFormatGeoQuery(res, query);
});

/**
 * @route GET /v1/geo/search
 * @description Mencari wilayah berdasarkan nama dengan fuzzy search (pg_trgm).
 * @access Private
 */
router.get('/search', async (req, res) => {
  try {
    const { name, provinceCode, kabkotaCode, kecamatanCode } = req.query;

    if (!name) {
      return res.status(400).json({ message: 'Search term is required' });
    }

    const searchTerm = name.trim();
    const searchName = '%' + searchTerm.replace(/\s+/g, '') + '%';

    // Dynamic filters
    let provFilter = Prisma.sql``;
    if (provinceCode) {
      provFilter = Prisma.sql`AND r.kode_prov = ${provinceCode}`;
    }

    let kabFilter = Prisma.sql``;
    if (kabkotaCode) {
      kabFilter = Prisma.sql`AND r.kode_kab = ${kabkotaCode}`;
    }

    let kecFilter = Prisma.sql``;
    if (kecamatanCode) {
      kecFilter = Prisma.sql`AND r.kode_kec = ${kecamatanCode}`;
    }

    const query = Prisma.sql`
      SELECT r.id, r.level, r.tipe_adm, r.nama, r.kode_prov, r.kode_kab, r.kode_kec, r.luas,
             p.nama as nama_prov, k.nama as nama_kab, k.tipe_adm as tipe_adm_kab, c.nama as nama_kec,
             word_similarity(r.nama, ${searchTerm}) as sim_score
      FROM regions r
      LEFT JOIN regions p ON r.kode_prov = p.kode_prov AND p.level = 'provinsi'
      LEFT JOIN regions k ON r.kode_prov = k.kode_prov AND r.kode_kab = k.kode_kab AND k.level = 'kab_kota'
      LEFT JOIN regions c ON r.kode_prov = c.kode_prov AND r.kode_kab = c.kode_kab AND r.kode_kec = c.kode_kec AND c.level = 'kecamatan'
      WHERE 1=1
      ${provFilter}
      ${kabFilter}
      ${kecFilter}
      AND (word_similarity(r.nama, ${searchTerm}) > 0.1 OR r.nama ILIKE ${searchName})
      ORDER BY r.nama <-> ${searchTerm} ASC
      LIMIT 5
    `;

    const results = await prisma.$queryRaw(query);
    const features = formatResultsToGeoJSON(results);
    res.json({ data: features });

  } catch (error) {
    console.error('Search error:', error);
    res.locals.errorMessage = error.stack;
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/find-by-point', async (req, res) => {
  try {
    const { lat, lng, includeGeometry } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and Longitude are required' });
    }

    const pointWKT = `POINT(${lng} ${lat})`;

    // 1. Try to find Desa (most specific)
    const foundDesa = await prisma.$queryRaw`
        SELECT id, level, tipe_adm, nama, kode_prov, kode_kab, kode_kec,
    ${includeGeometry ? Prisma.sql`ST_AsGeoJSON(geom) as geom_geojson,` : Prisma.sql``}
  luas
        FROM regions 
        WHERE level = 'desa' 
          AND ST_Contains(geom, ST_GeomFromText(${pointWKT}, 4326))
        LIMIT 1
    `;

    if (foundDesa.length > 0) {
      const desa = foundDesa[0];
      const kec = await prisma.regions.findFirst({ where: { level: 'kecamatan', kode_prov: desa.kode_prov, kode_kab: desa.kode_kab, kode_kec: desa.kode_kec } });
      const kab = await prisma.regions.findFirst({ where: { level: 'kab_kota', kode_prov: desa.kode_prov, kode_kab: desa.kode_kab } });
      const prov = await prisma.regions.findFirst({ where: { level: 'provinsi', kode_prov: desa.kode_prov } });

      return res.json({
        data: {
          provinsi: { nama: prov?.nama, kode: prov?.kode_prov },
          kab_kota: { nama: kab?.nama, kode: kab?.kode_kab, tipe: kab?.tipe_adm },
          kecamatan: { nama: kec?.nama, kode: kec?.kode_kec },
          desa: { nama: desa.nama, kode: null },
          kode_prov: prov?.kode_prov,
          kode_kab: kab?.kode_kab,
          kode_kec: kec?.kode_kec,
          geom_geojson: desa.geom_geojson ? JSON.parse(desa.geom_geojson) : null
        }
      });
    }

    // 2. Try Kecamatan
    const foundKecamatan = await prisma.$queryRaw`
        SELECT id, level, tipe_adm, nama, kode_prov, kode_kab, kode_kec,
    ${includeGeometry ? Prisma.sql`ST_AsGeoJSON(geom) as geom_geojson,` : Prisma.sql``}
  luas
        FROM regions 
        WHERE level = 'kecamatan' 
          AND ST_Contains(geom, ST_GeomFromText(${pointWKT}, 4326))
        LIMIT 1
    `;

    if (foundKecamatan.length > 0) {
      const kec = foundKecamatan[0];
      const kab = await prisma.regions.findFirst({ where: { level: 'kab_kota', kode_prov: kec.kode_prov, kode_kab: kec.kode_kab } });
      const prov = await prisma.regions.findFirst({ where: { level: 'provinsi', kode_prov: kec.kode_prov } });

      return res.json({
        data: {
          provinsi: { nama: prov?.nama, kode: prov?.kode_prov },
          kab_kota: { nama: kab?.nama, kode: kab?.kode_kab, tipe: kab?.tipe_adm },
          kecamatan: { nama: kec.nama, kode: kec.kode_kec },
          desa: null,
          kode_prov: prov?.kode_prov,
          kode_kab: kab?.kode_kab,
          kode_kec: kec.kode_kec,
          geom_geojson: kec.geom_geojson ? JSON.parse(kec.geom_geojson) : null
        }
      });
    }

    // 3. Try Kab/Kota
    const foundKabKota = await prisma.$queryRaw`
        SELECT id, level, tipe_adm, nama, kode_prov, kode_kab,
    ${includeGeometry ? Prisma.sql`ST_AsGeoJSON(geom) as geom_geojson,` : Prisma.sql``}
  luas
        FROM regions 
        WHERE level = 'kab_kota' 
          AND ST_Contains(geom, ST_GeomFromText(${pointWKT}, 4326))
        LIMIT 1
    `;

    if (foundKabKota.length > 0) {
      const kab = foundKabKota[0];
      const prov = await prisma.regions.findFirst({ where: { level: 'provinsi', kode_prov: kab.kode_prov } });

      return res.json({
        data: {
          provinsi: { nama: prov?.nama, kode: prov?.kode_prov },
          kab_kota: { nama: kab.nama, kode: kab.kode_kab, tipe: kab.tipe_adm },
          kecamatan: null,
          desa: null,
          kode_prov: prov?.kode_prov,
          kode_kab: kab.kode_kab,
          geom_geojson: kab.geom_geojson ? JSON.parse(kab.geom_geojson) : null
        }
      });
    }

    // 4. Try Provinsi
    const foundProvinsi = await prisma.$queryRaw`
        SELECT id, level, tipe_adm, nama, kode_prov,
    ${includeGeometry ? Prisma.sql`ST_AsGeoJSON(geom) as geom_geojson,` : Prisma.sql``}
  luas
        FROM regions 
        WHERE level = 'provinsi' 
          AND ST_Contains(geom, ST_GeomFromText(${pointWKT}, 4326))
        LIMIT 1
    `;

    if (foundProvinsi.length > 0) {
      const prov = foundProvinsi[0];
      return res.json({
        data: {
          provinsi: { nama: prov.nama, kode: prov.kode_prov },
          kab_kota: null,
          kecamatan: null,
          desa: null,
          kode_prov: prov.kode_prov,
          geom_geojson: prov.geom_geojson ? JSON.parse(prov.geom_geojson) : null
        }
      });
    }

    // Nothing found
    res.json({ data: null });

  } catch (error) {
    console.error('Error finding region by point:', error);
    res.locals.errorMessage = error.stack;
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;