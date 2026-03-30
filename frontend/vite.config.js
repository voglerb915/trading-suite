export default {
    root: '.',
    server: {
        proxy: {
            '/api': 'http://localhost:4000'
        },
        hmr: { overlay: false }
    },
    appType: 'mpa'
}