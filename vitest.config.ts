import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DB_NAME: 'api_starter_db_test',
      DB_USER: 'postgres',
      DB_PASSWORD: 'postgres',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
