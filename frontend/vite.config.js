import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:4000',
                changeOrigin: true,
                secure: false,
                ws: true
            }
        },
        hmr: { overlay: false },
        watch: {
            ignored: [
                '**/backend/db/**'
            ]
        }
    },
    appType: 'mpa'
});
