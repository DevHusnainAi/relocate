import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  // ponytail: short action timeout so a stale locator fails in 3s, not 30s (demo budget is 110s)
  use: { baseURL: 'http://127.0.0.1:4173', actionTimeout: 3_000 },
  webServer: {
    command: 'python3 -m http.server 4173 -d demo-app',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
});
