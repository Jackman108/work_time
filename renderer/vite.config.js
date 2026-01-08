import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react({
    // Включаем обработку JSX в .jsx файлах
    include: '**/*.{jsx,tsx}',
  })],
  root: __dirname,
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    minify: 'esbuild', // Используем встроенный esbuild вместо terser
    chunkSizeWarningLimit: 1000,
    target: 'es2015', // Минимальная версия ES для лучшей совместимости
    cssCodeSplit: true, // Разделение CSS для лучшей загрузки
    sourcemap: false, // Отключаем source maps в production для ускорения
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['recharts'],
          'pdf-vendor': ['jspdf', 'jspdf-autotable']
        },
        // Оптимизация имен файлов для кэширования
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
  },
  esbuild: {
    // Удаляем console.log в production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname)
    }
  }
});
