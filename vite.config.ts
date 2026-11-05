import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Preloads the content documents from the HTML, so they download alongside the
 * app's JS instead of only once React has started. Build only: `npm run dev`
 * serves the mocks and has no Edge Function to answer these.
 *
 * The paths must match the HTTP repositories wired in App.tsx.
 */
function preloadContent(): Plugin {
  return {
    name: 'preload-content',
    apply: 'build',
    transformIndexHtml() {
      return ['/content/sections.json', '/content/work-items.json', '/content/site.json'].map((href) => ({
        tag: 'link',
        attrs: { rel: 'preload', href, as: 'fetch', crossorigin: 'anonymous' },
        injectTo: 'head',
      }))
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), preloadContent()],
})
