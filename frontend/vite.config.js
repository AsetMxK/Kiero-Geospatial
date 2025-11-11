import react from '@vitejs/plugin-react';

export default {
    plugins: [react()],
    build: {
        target: 'es2020'
    },
    optimizeDeps: {
        esbuildOptions: {
            target: 'es2020'
        }
    },
    server: {
        allowedHosts: true,
        proxy: {
            // Proxy all API requests to the geo-gateway
            '/api': {
                target: 'http://localhost:4000',
                changeOrigin: true,
            },
            // Proxy all authentication requests to the geo-gateway
            '/auth-proxy': {
                target: 'http://localhost:4000',
                changeOrigin: true,
            },
        },
    }
};
