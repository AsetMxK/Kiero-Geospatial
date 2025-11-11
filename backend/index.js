import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import geoRouter from './routes/geo.js';
import categoryRouter from './routes/categories.js';
import ticketsRouter from './routes/tickets.js';
import regionsRouter from './routes/regions.js';
import prefixesRouter from './routes/prefixes.js';
import loggingMiddleware from './middleware/logging.js';
import { loadBackendDependencies } from './middleware/authMiddleware.js';
import { startArchiveScheduler } from './services/archiveService.js';

/**
 * Menginisialisasi dan memulai server Express.
 * Fungsi ini mengatur middleware, rute, dan memulai server pada port yang telah dikonfigurasi.
 * Fungsi ini juga memastikan semua dependensi yang diperlukan, seperti kunci kriptografi, dimuat
 * sebelum server mulai menerima permintaan. Selain itu, fungsi ini juga menjadwalkan tugas cron untuk pengarsipan tiket.
 * @returns {Promise<import('express').Express>} Sebuah promise yang me-resolve ke instance aplikasi Express.
 */
const startServer = async () => {
  dotenv.config();

  // Pastikan semua dependensi (seperti kunci) dimuat sebelum server mulai menerima permintaan
  await loadBackendDependencies();

  const app = express();
  const port = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function (body) {
      res.body = body;
      originalSend.call(this, body);
    };
    next();
  });

  app.use(loggingMiddleware);

  // Routes
  app.use('/v1/geo', geoRouter);
  app.use('/v1/categories', categoryRouter);
  app.use('/v1/tickets', ticketsRouter);
  app.use('/v1/regions', regionsRouter);
  app.use('/v1/prefixes', prefixesRouter);

  app.use((req, res) => {
    res.status(404).json({ error: "Not Found", message: `The requested URL ${req.originalUrl} was not found on this server.` });
  });

  app.listen(port, () => {
    console.log(`🛡️ Resource Server is running internally on http://localhost:${port}`);
    startArchiveScheduler();
  });

  return app;
};

startServer();