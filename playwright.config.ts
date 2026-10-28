import { defineConfig, devices } from '@playwright/test';

// Runs against `astro preview`, so `pnpm build` must have produced dist/.
// Astro 7's preview refuses to start while another preview of this project
// holds its lock file, so the tests use their own port with --ignore-lock and
// always start a fresh server from the current dist/.
const PORT = 4387;
const BASE_URL = `http://localhost:${PORT}/claude-code-security-drill/`;

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: true,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm preview --port ${PORT} --ignore-lock`,
    url: BASE_URL,
    reuseExistingServer: false,
  },
});
