const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

export const login = async (page) => {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error(
      "E2E_TEST_EMAIL / E2E_TEST_PASSWORD não configurados. Copie .env.test.example para .env.test e preencha com um usuário de teste aprovado no Supabase.",
    );
  }

  await page.goto("/login");
  await page.getByPlaceholder("seu@email.com").fill(TEST_EMAIL);
  await page.getByPlaceholder("••••••••").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/dashboard$/);
};
