import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import laravel from 'laravel-vite-plugin'
import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [laravel({ input: ['resources/js/tungsten.jsx'] }), react(), tailwindcss()],
    resolve: {
        alias: { '@tungsten': path.resolve(__dirname, '../../resources/js') },
        dedupe: ['react', 'react-dom', '@inertiajs/react', 'lucide-react'],
    },
    server: { fs: { allow: ['../..'] } },
})
