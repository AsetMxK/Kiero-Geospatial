import express from 'express';
import proxy from 'express-http-proxy';
import * as jose from 'jose';
import fs from 'fs';
import cors from 'cors';
import { isOriginAllowed } from '../utils/corsWhitelistCache.js';

const router = express.Router();
const ALGORITHM = 'RS256';

/**
 * Delegasi CORS dinamis yang memeriksa origin permintaan terhadap daftar putih yang di-cache.
 * @param {import('express').Request} req - Objek request.
 * @param {Function} callback - Callback untuk meneruskan opsi CORS.
 * @private
 */
const corsOptionsDelegate = (req, callback) => {
  const origin = req.header('Origin');
  let corsOptions = { origin: false }; // Tolak secara default

  if (isOriginAllowed(origin)) {
    corsOptions = { origin: true };
  } else {
    if (origin) {
      console.warn(`CORS: Origin '${origin}' denied.`);
    }
  }
  callback(null, corsOptions);
};

let gatewayPublicKey;

/**
 * Memuat kunci publik gateway dari file PEM. Kunci ini digunakan untuk memverifikasi
 * Access Token yang masuk. Aplikasi akan berhenti jika kunci gagal dimuat.
 * @export
 * @async
 */
export async function loadGatewayPublicKey() {
  try {
    const publicKeyPem = fs.readFileSync(process.env.GATEWAY_PUBLIC_KEY_PATH, 'utf-8');
    gatewayPublicKey = await jose.importSPKI(publicKeyPem, ALGORITHM);
    console.log("Gateway public key loaded successfully.");
  } catch (error) {
    console.error("FATAL: Failed to load gateway public key.", error);
    process.exit(1);
  }
}

/**
 * Middleware untuk memvalidasi Access Token JWT (Bearer Token).
 * Memeriksa keberadaan, format, tanda tangan, dan klaim (issuer, expiration) dari token.
 * @private
 * @async
 */
const tokenValidationMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided or malformed header' });
  }
  const token = authHeader.split(' ')[1];
  try {
    await jose.jwtVerify(token, gatewayPublicKey, {
      issuer: process.env.GATEWAY_URL,
      algorithms: [ALGORITHM],
    });
    next();
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      return res.status(401).json({ message: 'Unauthorized: Token has expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: `Unauthorized: Invalid token. ${error.message}` });
  }
};

router.use(cors(corsOptionsDelegate));
router.use(tokenValidationMiddleware);

router.use('/', proxy(process.env.RESOURCE_SERVER_URL, {
  timeout: 30000,
  proxyReqOptDecorator: (proxyReqOpts) => {
    proxyReqOpts.timeout = 30000;
    return proxyReqOpts;
  },
  proxyErrorHandler: (err, res, next) => {
    console.error('Proxy error:', err);
    res.locals.errorMessage = err.stack;
    res.status(502).json({ error: 'Bad Gateway', message: 'Could not connect to the internal service.' });
  }
}));
export default router;

