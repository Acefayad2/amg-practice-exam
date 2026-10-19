import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Keep the practice app's Vite bundle separate from the landing site's
    // existing /assets directory when both are served on one domain.
    assetsDir: 'practice-assets',
  },
})
