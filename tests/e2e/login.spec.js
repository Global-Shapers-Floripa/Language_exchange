import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe("Login", () => {
  test.beforeEach(() => {
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      throw new Error(
        "E2E_TEST_EMAIL / E2E_TEST_PASSWORD não configurados. Copie .env.test.example para .env.test e preencha com um usuário de teste aprovado no Supabase.",
      );
    }
  });

  test("login com credenciais válidas redireciona para o dashboard", async ({
    page,
  }) => {
    const pageErrors = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    await page.goto("/login");

    await page.getByPlaceholder("seu@email.com").fill(TEST_EMAIL);
    await page.getByPlaceholder("••••••••").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: /Olá,/ }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Início" })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test("login com credenciais inválidas mostra erro e não redireciona", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByPlaceholder("seu@email.com").fill(TEST_EMAIL);
    await page.getByPlaceholder("••••••••").fill("senha-incorreta-123");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(
      page.getByText("E-mail ou senha incorretos. Verifique e tente novamente."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
