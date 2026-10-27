import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    env: {
      NODE_ENV: 'test',
      GEMINI_API_KEY: 'test-api-key',
      GEMINI_MODEL: 'gemini-2.5-flash',
      CORS_ORIGIN: 'http://localhost:3000',
    },
  },
});
