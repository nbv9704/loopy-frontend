import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  // The first render prepares every route and locale; cold Vite imports can exceed 5 seconds.
  expect: { timeout: 15000 },
  use: { baseURL: 'http://127.0.0.1:5180', browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: {
    command: 'yarn dev --host 127.0.0.1 --port 5180 --strictPort',
    url: 'http://127.0.0.1:5180',
    reuseExistingServer: false,
    // Deliberately points at a non-production endpoint. Tests intercept every API request.
    env: { VITE_API_URL: 'http://127.0.0.1:4319' },
  },
})
