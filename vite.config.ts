import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'morphicons/react': path.resolve(import.meta.dirname, 'src/lib/morphicons/react/index.tsx'),
      'morphicons': path.resolve(import.meta.dirname, 'src/lib/morphicons/index.ts'),
    },
  },
  base: './',
})


