import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// @ts-ignore - vite-plugin-cesium CJS/ESM interop
import cesiumPlugin from 'vite-plugin-cesium'

// Resolve CJS default export
const cesium = (cesiumPlugin as any).default || cesiumPlugin

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cesium()],
  build: {
    chunkSizeWarningLimit: 3000,
  },
})
