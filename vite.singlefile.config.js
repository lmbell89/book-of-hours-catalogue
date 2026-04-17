import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist',
    // Ensure all assets are inlined rather than emitted as separate files
    assetsInlineLimit: Infinity,
    cssCodeSplit: false,
  },
})
