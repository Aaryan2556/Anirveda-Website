import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Optimize build for production
  build: {
    minify: 'esbuild', // Faster than terser
    cssMinify: true,
    chunkSizeWarningLimit: 1000,
    sourcemap: false, // Disable sourcemaps to speed up build
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'animation-vendor': ['framer-motion', '@react-spring/web'],
          'appwrite': ['appwrite'],
        },
      },
    },
  },
})
