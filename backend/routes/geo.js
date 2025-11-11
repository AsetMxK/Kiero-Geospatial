import express from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/prismaClient.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { findBestMatch } from '../utils/search.js';

const router = express.Router();

router.use(authMiddleware);

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

    const properties = {
      level: item.level,
      tipe_adm: item.tipe_adm,
      nama: item.nama,
      kode_prov: item.kode_prov,
      kode_kab: item.kode_kab,
      kode_kec: item.kode_kec,
      luas: item.luas,
    };

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
 * dan mengirimkan respons. Fungsi bantuan ini memusatkan blok try-catch,
 * format hasil, dan logika pengiriman respons untuk semua endpoint API GeoJSON.
 *
 * @async
 * @param {import('express').Response} res - Objek response Express.
 * @param {Prisma.Sql} queryTemplate - Template query SQL mentah untuk dieksekusi.
 * @returns {Promise<void>} Sebuah promise yang me-resolve ketika respons telah dikirim.
 */
const executeAndFormatGeoQuery = async (res, queryTemplate) => {
  try {
    const results = await prisma.$queryRaw(queryTemplate);
    const features = formatResultsToGeoJSON(results);
    res.json({
      message: "Data retrieved successfully",
      data: features
    });
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
  // ✅ PERBAIKAN: Menggunakan SELECT DISTINCT dan menyebutkan kolom
  const query = Prisma.sql`
    SELECT DISTINCT id, level, tipe_adm, nama, kode_prov, kode_kab, kode_kec, luas, ST_AsGeoJSON(geom) as geom_geojson 
    FROM regions 
    WHERE level = 'provinsi'`;
  await executeAndFormatGeoQuery(res, query);
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
  await executeAndFormatGeoQuery(res, query);
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
 * @description Mencari wilayah berdasarkan nama dalam tingkat administratif tertentu dan wilayah induk opsional.
 * Endpoint ini melakukan pencarian fuzzy dan kemudian menggunakan algoritma pencocokan kustom (`findBestMatch`)
 * untuk mengembalikan wilayah yang paling relevan.
 * @access Private
 * @param {import('express').Request} req - Objek request Express.
 * @param {string} req.query.level - Tingkat administratif untuk pencarian (misalnya, 'provinsi', 'kab_kota').
 * @param {string} req.query.name - Nama wilayah yang dicari.
 * @param {string} [req.query.provinceCode] - Kode provinsi opsional untuk mempersempit pencarian.
 * @param {string} [req.query.kabkotaCode] - Kode kabupaten/kota opsional untuk mempersempit pencarian.
 * @param {string} [req.query.kecamatanCode] - Kode kecamatan opsional untuk mempersempit pencarian.
 * @param {import('express').Response} res - Objek response Express.
 * @returns {Promise<void>}
 */
router.get('/search', async (req, res) => {
  const { level, name, provinceCode, kabkotaCode, kecamatanCode } = req.query;

  if (!level || !name) {
    return res.status(400).json({ message: 'Query parameters "level" and "name" are required.' });
  }

  try {
    const whereClauses = [Prisma.sql`level = ${level}`];
    if (provinceCode) whereClauses.push(Prisma.sql`kode_prov = ${provinceCode}`);
    if (kabkotaCode) whereClauses.push(Prisma.sql`kode_kab = ${kabkotaCode}`);
    if (kecamatanCode) whereClauses.push(Prisma.sql`kode_kec = ${kecamatanCode}`);

    whereClauses.push(Prisma.sql`similarity(nama::text, ${name}) > 0.25`);

    const query = Prisma.sql`
            SELECT id, level, tipe_adm, nama, kode_prov, kode_kab, kode_kec, luas, ST_AsGeoJSON(geom) as geom_geojson 
            FROM regions 
            WHERE ${Prisma.join(whereClauses, ' AND ')}
            LIMIT 100; -- Batasi jumlah kandidat untuk efisiensi
        `;

    const candidateRegions = await prisma.$queryRaw(query);

    if (candidateRegions.length === 0) {
      return res.json({ message: "No regions found", data: [] });
    }

    const bestMatch = findBestMatch(name, candidateRegions);

    if (bestMatch) {
      const features = formatResultsToGeoJSON([bestMatch]);
      return res.json({ message: "Best match found", data: features });
    }
    res.json({ message: "No suitable match found", data: [] });

  } catch (error) {
    console.error('Search query error:', error);
    res.locals.errorMessage = error.stack;
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @route POST /v1/geo/find-by-point
 * @description Menemukan hierarki wilayah administratif untuk titik geografis tertentu (latitude dan longitude).
 * Endpoint ini melakukan query spasial untuk menemukan semua wilayah yang mencakup titik tersebut dan kemudian menyusun
 * hasilnya untuk menyediakan jalur administratif lengkap (provinsi, kabupaten, kecamatan, desa).
 * @access Private
 * @param {import('express').Request} req - Objek request Express.
 * @param {number} req.body.lat - Latitude dari titik.
 * @param {number} req.body.lng - Longitude dari titik.
 * @param {import('express').Response} res - Objek response Express.
 * @returns {Promise<void>}
 */
router.post('/find-by-point', async (req, res) => {
  const { lat, lng } = req.body;
  if (lat === undefined || lng === undefined) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }
  try {
    const results = await prisma.$queryRaw`
      SELECT id, level, nama, tipe_adm, kode_prov, kode_kab, kode_kec 
      FROM regions 
      WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
      ORDER BY level DESC
    `;

    const adminInfo = {};

    if (results.length > 0) {
      const mostSpecificRegion = results.find(r => r.level === 'desa') ||
        results.find(r => r.level === 'kecamatan') ||
        results.find(r => r.level === 'kab_kota') ||
        results[0];

      adminInfo.kode_prov = mostSpecificRegion.kode_prov;
      adminInfo.kode_kab = mostSpecificRegion.kode_kab;
      adminInfo.kode_kec = mostSpecificRegion.kode_kec;

      results.forEach(region => {
        if (region.level && !adminInfo[region.level]) {
          adminInfo[region.level] = {
            id: region.id,
            nama: region.nama,
            tipe: region.tipe_adm
          };
        }
      });
    }

    res.json({ message: "Location data retrieved successfully", data: adminInfo });
  } catch (error) {
    console.error('Find by point error:', error);
    res.locals.errorMessage = error.stack;
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;