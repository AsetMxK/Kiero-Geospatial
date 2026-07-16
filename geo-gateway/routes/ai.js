import express from 'express';
import cors from 'cors';
import { corsOptionsDelegate } from '../middleware/corsMiddleware.js';
import { tokenValidationMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(cors(corsOptionsDelegate));
router.use(tokenValidationMiddleware);

/**
 * @route POST /ai/ask
 * @description Forwards the AI question to the upstream AI Service (JupyterHub proxy).
 * Uses native fetch with AbortController for timeout control.
 * Replaces the client's internal Bearer JWT with the upstream AI service API token.
 *
 * Body: { question: string, session_id?: string }
 */
router.post('/ask', async (req, res) => {
    const aiServiceUrl = process.env.AI_SERVICE_URL?.replace(/\/$/, '') + '/ask';
    const aiToken = process.env.AI_SERVICE_TOKEN;
    const timeoutMs = 300000; // 5 menit — sama dengan konfigurasi proxy sebelumnya

    const { question, session_id = '' } = req.body;

    if (!question) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Field "question" wajib diisi.'
        });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(aiServiceUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `token ${aiToken}`
            },
            body: JSON.stringify({ question, session_id }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`AI Service error [${response.status}]:`, errorText);
            return res.status(response.status).json({
                error: 'Upstream Error',
                message: `AI service responded with status ${response.status}`,
                details: errorText
            });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (err) {
        clearTimeout(timeout);

        if (err.name === 'AbortError') {
            console.error('AI Service timeout — tidak merespon dalam batas waktu.');
            return res.status(504).json({
                error: 'Gateway Timeout',
                message: 'AI service tidak merespon dalam batas waktu yang ditentukan.'
            });
        }

        if (err.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' || err.cause?.code === 'ECONNREFUSED') {
            console.error('AI Service tidak bisa dihubungi:', err.cause?.code);
            return res.status(502).json({
                error: 'Bad Gateway',
                message: 'Tidak dapat terhubung ke AI service. Periksa VPN/jaringan atau status server.',
                details: err.cause?.code
            });
        }

        console.error('AI route error:', err);
        return res.status(502).json({
            error: 'Bad Gateway',
            message: 'Gagal berkomunikasi dengan AI service.',
            details: err.message
        });
    }
});

export default router;
