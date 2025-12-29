import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  root: __dirname,
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html')
    },
    outDir: '../dist',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname)
    }
  }
});

