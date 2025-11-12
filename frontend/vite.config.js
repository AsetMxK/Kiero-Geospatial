import react from '@vitejs/plugin-react';

export default {
    plugins: [react()],
    base: '/mendawai-geospatial/',
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
    }
};
