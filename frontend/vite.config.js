import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  optimizeDeps: {
    include: ['remark-gfm', 'react-markdown']
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  }
});
