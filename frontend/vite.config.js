import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        federation({
            name: 'myhealthprices_frontend',
            filename: 'remoteEntry.js',
            // Expose components for other apps to consume
            exposes: {
                './App': './src/App.jsx',
                // In the future, we can expose specific widgets like './DrugDashboard'
            },
            shared: ['react', 'react-dom']
        })
    ],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            }
        }
    },
    build: {
        target: 'esnext' // Required for top-level await and other features used by MF
    }
})
