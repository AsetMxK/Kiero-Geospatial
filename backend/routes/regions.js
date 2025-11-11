import express from 'express';
import prisma from '../config/prismaClient.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { getDateRangeFilter, getRegionFilter } from '../utils/queryUtils.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * @route GET /v1/regions/:regionCode/stats
 * @description Mengambil statistik tiket (open, pending, closed, total) untuk wilayah tertentu.
 * Wilayah ditentukan oleh `regionCode`, yang dapat merepresentasikan provinsi, kabupaten, kecamatan, atau desa.
 * Hasilnya dapat difilter berdasarkan rentang tanggal menggunakan parameter query `startDate` dan `endDate`.
 * @access Private
 * @param {import('express').Request} req - Objek request Express.
 * @param {string} req.params.regionCode - Kode hierarkis untuk wilayah target.
 * @param {string} [req.query.startDate] - Tanggal mulai untuk filter (YYYY-MM-DD).
 * @param {string} [req.query.endDate] - Tanggal akhir untuk filter (YYYY-MM-DD).
 * @param {import('express').Response} res - Objek response Express.
 * @returns {Promise<void>}
 */
router.get('/:regionCode/stats', async (req, res) => {
  const { regionCode } = req.params;
  const { startDate, endDate } = req.query;

  if (!regionCode) {
    return res.status(400).json({ message: 'regionCode parameter is required' });
  }

  try {
    const dateFilter = getDateRangeFilter(startDate, endDate);
    const regionFilter = getRegionFilter(regionCode, 'ORM');

    const stats = await prisma.tickets.groupBy({
      by: ['status'],
      where: {
        regions: regionFilter,
        date_create: dateFilter,
      },
      _count: {
        _all: true,
      },
    });

    const formattedStats = {
      open: 0,
      pending: 0,
      closed: 0,
      total: 0,
    };

    let total = 0;
    stats.forEach(stat => {
      const status = stat.status.toLowerCase();
      const count = Number(stat._count._all);
      if (formattedStats.hasOwnProperty(status)) {
        formattedStats[status] = count;
      }
      total += count;
    });
    formattedStats.total = total;

    res.json({
      message: 'Region ticket stats retrieved successfully',
      data: formattedStats,
    });
  } catch (error) {
    if (error.message.includes('Invalid regionCode format')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error fetching region stats:', error);
    res.locals.errorMessage = error.stack;
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @route GET /v1/regions/:regionCode/stats/details
 * @description Mengambil rincian jumlah tiket berdasarkan kategori untuk status dan wilayah tertentu.
 * Endpoint ini menyediakan tampilan yang lebih granular daripada endpoint statistik utama.
 * Endpoint ini memerlukan parameter query `status` dan dapat difilter berdasarkan rentang tanggal.
 * @access Private
 * @param {import('express').Request} req - Objek request Express.
 * @param {string} req.params.regionCode - Kode hierarkis untuk wilayah target.
 * @param {string} req.query.status - Status tiket untuk difilter (misalnya, 'open', 'pending', 'closed').
 * @param {string} [req.query.startDate] - Tanggal mulai untuk filter (YYYY-MM-DD).
 * @param {string} [req.query.endDate] - Tanggal akhir untuk filter (YYYY-MM-DD).
 * @param {import('express').Response} res - Objek response Express.
 * @returns {Promise<void>}
 */
router.get('/:regionCode/stats/details', async (req, res) => {
  const { regionCode } = req.params;
  const { startDate, endDate, status } = req.query;

  if (!regionCode) {
    return res.status(400).json({ message: 'regionCode parameter is required' });
  }
  if (!status) {
    return res.status(400).json({ message: 'status parameter is required' });
  }

  try {
    const dateFilter = getDateRangeFilter(startDate, endDate);
    const regionFilter = getRegionFilter(regionCode, 'ORM');

    const stats = await prisma.tickets.groupBy({
      by: ['scaid'],
      where: {
        status: {
          equals: status,
          mode: 'insensitive',
        },
        regions: regionFilter,
        date_create: dateFilter,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          scaid: 'desc',
        },
      },
    });

    if (stats.length === 0) {
      return res.json({
        message: 'Region ticket category stats retrieved successfully',
        data: [],
      });
    }

    const scaids = stats.map(s => s.scaid);

    const categories = await prisma.category_systemcode.findMany({
      where: {
        scaid: { in: scaids }
      },
      select: {
        scaid: true,
        description_eng: true
      }
    });

    const categoryMap = new Map(categories.map(c => [c.scaid, c.description_eng]));

    const formattedResults = stats.map(stat => ({
      category: categoryMap.get(stat.scaid) || 'Unknown Category',
      count: Number(stat._count._all)
    }));

    res.json({
      message: 'Region ticket category stats retrieved successfully',
      data: formattedResults,
    });

  } catch (error) {
    if (error.message.includes('Invalid regionCode format')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error fetching region category stats:', error);
    res.locals.errorMessage = error.stack;
    res.status(500).json({ message: 'Internal server error' });
  }
});


export default router;
