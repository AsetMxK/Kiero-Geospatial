import express from 'express';
import proxy from 'express-http-proxy';
import cors from 'cors';
import { corsOptionsDelegate } from '../middleware/corsMiddleware.js';
import { tokenValidationMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(cors(corsOptionsDelegate));
router.use(tokenValidationMiddleware);

/**
 * @route ALL /ai/*
 * @description Serves as a gateway proxy for the AI Service.
 * Forwards all requests (GET, POST, PUT, DELETE, etc.) to the upstream AI Service configured in the environment.
 * Replaces the client's internal JWT Authorization header with the upstream AI service API token.
 */

router.use('/', proxy(process.env.AI_SERVICE_URL, {
    timeout: 300000,
    proxyReqPathResolver: (req) => {
        // Explicitly build the path from the AI_SERVICE_URL + incoming request path
        const serviceUrl = new URL(process.env.AI_SERVICE_URL);
        return serviceUrl.pathname.replace(/\/$/, '') + req.url;
    },
    proxyReqOptDecorator: (proxyReqOpts) => {
        proxyReqOpts.timeout = 300000;
        // Replace client's internal Bearer JWT with the upstream AI service API token.
        proxyReqOpts.headers['Authorization'] = `token ${process.env.AI_SERVICE_TOKEN}`;
        
        // Strip browser-specific origin/referer headers to bypass JupyterHub CORS/CSRF protection
        delete proxyReqOpts.headers['origin'];
        delete proxyReqOpts.headers['Origin'];
        delete proxyReqOpts.headers['referer'];
        delete proxyReqOpts.headers['Referer'];
        
        // Set Host header to upstream target to prevent Tornado host mismatch check
        const serviceUrl = new URL(process.env.AI_SERVICE_URL);
        proxyReqOpts.headers['host'] = serviceUrl.host;
        
        return proxyReqOpts;
    },
    proxyErrorHandler: (err, res, next) => {
        console.error('AI Proxy error:', err);
        res.locals.errorMessage = err.stack;
        res.status(502).json({
            error: 'Bad Gateway',
            message: 'Failed to communicate with AI service',
            details: err.message
        });
    }
}));

export default router;
