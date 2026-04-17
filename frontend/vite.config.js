import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:4000',
                changeOrigin: true,
                secure: false,
                ws: true, // Erlaubt WebSocket/Streaming
                // Falls dein Backend das /api im Pfad hat (wie du sagtest), 
                // darf hier KEIN rewrite stehen!
            }
        },
        hmr: { overlay: false }
    },
    appType: 'mpa'
});