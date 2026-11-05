/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to `http` to read the content store in development instead of the mocks. */
  readonly VITE_CONTENT_SOURCE?: 'http' | 'mock';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
