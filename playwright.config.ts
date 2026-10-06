import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'test/e2e',
  workers: 1,
  // CI runners occasionally fail a page load during setup; a retry tells that apart from a real failure.
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  reporter: 'list',
});
