import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '.' },
        { src: 'background.js', dest: '.' },
        { src: 'content.js', dest: '.' },
        { src: 'icons/icon16.png', dest: 'icons' },
        { src: 'icons/icon48.png', dest: 'icons' },
        { src: 'icons/icon128.png', dest: 'icons' },
        {
          src: 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs',
          dest: '.',
          rename: 'pdf.worker.min.mjs',
        },
      ],
    }),
  ],
  base: '',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'chrome89',
    rollupOptions: {
      input: {
        sidepanel: 'sidepanel/index.html',
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        manualChunks: undefined,
      },
    },
  },
});
