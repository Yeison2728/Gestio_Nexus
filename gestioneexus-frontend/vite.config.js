import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Importa el plugin

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Úsalo aquí
  ],
  base: './' // <--- AÑADE ESTA LÍNEA AQUÍ
})