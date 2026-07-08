import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Credenciais de teste (usuário dedicado no Supabase) ficam em .env.test,
// que não é commitado — ver .env.test.example para o formato esperado.
dotenv.config({ path: ".env.test" });

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",

  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30 * 1000,
  },
});
