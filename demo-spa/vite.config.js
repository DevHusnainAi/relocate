import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Built into demo-app/spa so the existing test server serves it at /spa/.
export default defineConfig({
  base: '/spa/',
  plugins: [react()],
  build: { outDir: '../demo-app/spa', emptyOutDir: true },
  css: { modules: { generateScopedName: '_[local]_[hash:base64:5]' } },
});
