import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { compression } from 'vite-plugin-compression2';

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [
            react(),
            compression({
                algorithm: 'gzip',
                exclude: [/\.(br)$/, /\.(gz)$/],
                threshold: 1024,
                deleteOriginalAssets: false,
                skipIfLargerOrEqual: true,
            })
        ],
        base: env.VITE_APP_BASE_URL || '/',
        build: {
            target: 'es2020',
            chunkSizeWarningLimit: 1000,
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['react', 'react-dom', 'react-router-dom'],
                        ui: ['@vis.gl/react-google-maps', '@floating-ui/react'],
                        utils: ['axios', 'date-fns', 'screenfull']
                    }
                }
            }
        },
        optimizeDeps: {
            esbuildOptions: {
                target: 'es2020'
            }
        },
        server: {
            allowedHosts: true,
            host: '0.0.0.0',
        }
    };
});
