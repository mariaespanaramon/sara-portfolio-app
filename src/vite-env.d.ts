/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTENT_SOURCE?: 'http' | 'mock';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// hls.js ships no declaration for its light build, which has the same API.
declare module 'hls.js/light' {
  export { default } from 'hls.js';
}
