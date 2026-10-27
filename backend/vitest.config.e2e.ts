import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    env: {
      NODE_ENV: 'test',
      GEMINI_API_KEY: 'test-api-key',
      GEMINI_MODEL: 'gemini-2.5-flash',
      CORS_ORIGIN: 'http://localhost:3000',
    },
  },
});
