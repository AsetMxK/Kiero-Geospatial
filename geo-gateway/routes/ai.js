import express from 'express';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import cors from 'cors';
import { corsOptionsDelegate } from '../middleware/corsMiddleware.js';
import { tokenValidationMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(cors(corsOptionsDelegate));
router.use(tokenValidationMiddleware);

/**
 * @route ALL /ai/*
 * @description Manual proxy to the upstream AI (JupyterHub) Service.
 *
 * Why manual instead of express-http-proxy?
 * The server runs behind an Nginx reverse proxy that injects X-Forwarded-* headers.
 * Jupyter/Tornado uses these headers for host verification and blocks requests
 * with mismatched host info (403 Forbidden). express-http-proxy forwards ALL
 * incoming headers (including Nginx-injected ones) to upstream.
 *
 * This manual proxy builds a completely CLEAN request with only the
 * headers that Jupyter expects: Authorization, Content-Type, Accept, Host.
 */

router.use('/', (req, res) => {
    const serviceUrl = new URL(process.env.AI_SERVICE_URL);
    const upstreamPath = serviceUrl.pathname.replace(/\/$/, '') + req.url;

    // Serialize body if it was already parsed by express.json() middleware
    let bodyData = null;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
            bodyData = req.body;
        } else if (typeof req.body === 'object' && Object.keys(req.body).length > 0) {
            bodyData = JSON.stringify(req.body);
        }
    }

    // Build a clean, minimal set of headers — no Nginx/proxy headers leak through
    const upstreamHeaders = {
        'authorization': `token ${process.env.AI_SERVICE_TOKEN}`,
        'content-type':  req.headers['content-type'] || 'application/json',
        'accept':        'application/json',
        'host':          serviceUrl.host,
    };

    if (bodyData) {
        upstreamHeaders['content-length'] = Buffer.byteLength(bodyData);
    }

    const options = {
        hostname: serviceUrl.hostname,
        port:     serviceUrl.port || (serviceUrl.protocol === 'https:' ? 443 : 80),
        path:     upstreamPath,
        method:   req.method,
        headers:  upstreamHeaders,
        timeout:  300000,
    };

    const transport = serviceUrl.protocol === 'https:' ? https : http;

    const proxyReq = transport.request(options, (proxyRes) => {
        res.status(proxyRes.statusCode);

        // Forward safe response headers only
        const allowedResponseHeaders = [
            'content-type', 'content-length', 'content-encoding',
            'cache-control', 'etag', 'last-modified',
        ];
        allowedResponseHeaders.forEach(h => {
            if (proxyRes.headers[h]) res.setHeader(h, proxyRes.headers[h]);
        });

        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('timeout', () => {
        proxyReq.destroy();
        if (!res.headersSent) {
            res.status(504).json({ error: 'Gateway Timeout', message: 'AI service did not respond in time' });
        }
    });

    proxyReq.on('error', (err) => {
        console.error('AI Proxy error:', err);
        if (!res.headersSent) {
            res.status(502).json({
                error:   'Bad Gateway',
                message: 'Failed to communicate with AI service',
                details: err.message,
            });
        }
    });

    // Write body and end request
    if (bodyData) {
        proxyReq.write(bodyData);
    }
    proxyReq.end();
});

export default router;
