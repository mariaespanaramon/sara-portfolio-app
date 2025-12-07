/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Netlify environment variables
  // These are automatically available in Netlify builds
  readonly NETLIFY_BLOB_ACCESS?: string;
  readonly NETLIFY_SITE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
