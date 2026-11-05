/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to `http` to read the content store in development instead of the mocks. */
  readonly VITE_CONTENT_SOURCE?: 'http' | 'mock';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * hls.js ships its light build without a declaration of its own; it exposes the
 * same API as the full build, minus features this site does not use.
 */
declare module 'hls.js/light' {
  export { default } from 'hls.js';
}
