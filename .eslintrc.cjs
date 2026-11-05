/**
 * ESLint configuration. The app runs in the browser; the content scripts run on
 * Node and the media Edge Function on Netlify's Deno runtime, both with
 * standard Web APIs.
 */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules', '.netlify', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
  overrides: [
    {
      files: ['scripts/**/*.ts', 'netlify/**/*.ts', 'vite.config.ts'],
      env: { browser: false, node: true },
    },
  ],
};
