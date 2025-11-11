import express from 'express';
import prisma from '../config/prismaClient.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * @route GET /v1/categories
 * @description Mengambil daftar semua kategori tiket yang tersedia.
 * Endpoint ini dilindungi dan memerlukan token otentikasi yang valid.
 * Endpoint ini mengambil ID kode sistem (`scaid`) dan deskripsi bahasa Inggris (`description_eng`)
 * untuk setiap kategori dari database, diurutkan berdasarkan ID-nya.
 * @access Private
 * @param {import('express').Request} req - Objek request Express.
 * @param {import('express').Response} res - Objek response Express.
 * @returns {void}
 */
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category_systemcode.findMany({
      select: {
        scaid: true,
        description_eng: true,
      },
      orderBy: {
        scaid: 'asc',
      }
    });

    res.json({
      message: "Categories retrieved successfully",
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.locals.errorMessage = error.stack;
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
