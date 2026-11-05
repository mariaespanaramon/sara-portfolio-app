import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Build only: `npm run dev` serves mocks and has no Edge Function.
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
