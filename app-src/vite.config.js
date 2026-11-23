import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// TwinClimb assessment app. Builds to six static entry points sharing one
// i18n string table (src/i18n.js) and the canonical TTCMM data/logic: the
// self-assessment (src/App.jsx), the live workshop mode
// (src/workshop/WorkshopApp.jsx), and the AI report check
// (src/reportcheck/ReportCheckApp.jsx), each EN/DE. `base: './'` keeps asset
// URLs relative so the build can be copied straight into the repo root,
// which GitHub Pages serves from a subpath (fimplank.github.io/TWINCLIMB/).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        assessment: resolve(__dirname, 'assessment.html'),
        'assessment.de': resolve(__dirname, 'assessment.de.html'),
        workshop: resolve(__dirname, 'workshop.html'),
        'workshop.de': resolve(__dirname, 'workshop.de.html'),
        reportcheck: resolve(__dirname, 'reportcheck.html'),
        'reportcheck.de': resolve(__dirname, 'reportcheck.de.html'),
      },
    },
  },
  server: {
    fs: {
      // src/ imports the canonical TTCMM data/logic from the repo root
      // (../ttcmm.json, ../scripts/ttcmm.logic.mjs) so there is exactly one
      // copy of the model shared by the app and its Node test suite.
      allow: ['..'],
    },
  },
})
