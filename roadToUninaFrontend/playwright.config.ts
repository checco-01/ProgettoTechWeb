import { defineConfig, devices } from '@playwright/test';

/**
 * Configurazione degli E2E per "Road to Unina".
 *
 * Il backend (localhost:8080) e l'API di Wikipedia vengono mockati a livello
 * di rete nei singoli test (vedi test/mocks.ts), quindi non serve alcun
 * servizio esterno in esecuzione: basta `npm run test:e2e`.
 */
export default defineConfig({
  testDir: './test',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    locale: 'it-IT',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start -- --port 4200',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
