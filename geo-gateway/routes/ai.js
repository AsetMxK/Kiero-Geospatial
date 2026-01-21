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
 * The proxy handles URL forwarding, preserving the path and query parameters.
 */

router.use('/', proxy(process.env.AI_SERVICE_URL, {
    timeout: 300000,
    proxyReqOptDecorator: (proxyReqOpts) => {
        proxyReqOpts.timeout = 300000;
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
