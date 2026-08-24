import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Capacitor copies this directory into the APK as the app's web assets.
    outDir: 'dist',
    // Inline nothing as base64 so bundled assets (the font) stay auditable files.
    assetsInlineLimit: 0,
  },
});
