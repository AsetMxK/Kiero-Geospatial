import react from '@vitejs/plugin-react';

export default {
    plugins: [react()],
    base: '/mendawai-geospatial/',
    build: {
        target: 'es2020',
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    ui: ['@vis.gl/react-google-maps', '@floating-ui/react', '@tippyjs/react', 'tippy.js'],
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
    }
};
