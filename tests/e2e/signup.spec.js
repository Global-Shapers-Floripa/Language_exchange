import { test, expect } from "@playwright/test";

// Prefixo/hub identificáveis para permitir localizar e limpar essas contas
// depois pelo painel Admin (busca por "e2e" já encontra pelo hub ou e-mail).
const uniqueEmail = () => `e2e.signup.${Date.now()}@e2etest.local`;
const TEST_HUB = "E2E-TEST";
const TEST_PASSWORD = "TesteE2E123";

const fillSignupForm = async (page, { email, password, confirmPassword }) => {
  await page.locator('input[name="name"]').fill("E2E Teste");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="hub"]').fill(TEST_HUB);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(confirmPassword);
};

test.describe("Signup", () => {
  test("cadastro com dados válidos mostra modal de sucesso", async ({
    page,
  }) => {
    await page.goto("/signup");

    await fillSignupForm(page, {
      email: uniqueEmail(),
      password: TEST_PASSWORD,
      confirmPassword: TEST_PASSWORD,
    });

    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Solicitar Acesso" }).click();

    await expect(
      page.getByText(/Conta criada com sucesso/),
    ).toBeVisible();
  });

  test("submeter sem aceitar os termos mantém o botão bloqueado", async ({
    page,
  }) => {
    await page.goto("/signup");

    await fillSignupForm(page, {
      email: uniqueEmail(),
      password: TEST_PASSWORD,
      confirmPassword: TEST_PASSWORD,
    });

    // Checkbox de termos não é marcado neste cenário.
    await expect(
      page.getByText("Aceite os termos e condições para continuar."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Solicitar Acesso" }),
    ).toBeDisabled();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("senha e confirmação diferentes mostram erro e não prosseguem", async ({
    page,
  }) => {
    await page.goto("/signup");

    await fillSignupForm(page, {
      email: uniqueEmail(),
      password: TEST_PASSWORD,
      confirmPassword: TEST_PASSWORD + "x",
    });

    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Solicitar Acesso" }).click();

    await expect(page.getByText("As senhas não coincidem!")).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
  });
});
