import { test, expect } from "@playwright/test";

// E-mail descartável e identificável: o Supabase responde com sucesso ao
// pedido de reset independente do e-mail existir (proteção anti-enumeração),
// então nenhum e-mail real chega a ser enviado para este endereço fictício.
const uniqueEmail = () => `e2e.recovery.${Date.now()}@e2etest.local`;

test.describe("Recuperação de senha", () => {
  test("solicitar link de recuperação com e-mail preenchido mostra confirmação", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByPlaceholder("seu@email.com").fill(uniqueEmail());
    await page.getByRole("button", { name: "Esqueceu sua senha?" }).click();

    await expect(page.getByText(/E-mail enviado/)).toBeVisible();
    await expect(
      page.getByText(/Link de recuperação enviado para seu e-mail/),
    ).toBeVisible();
  });

  test("solicitar link sem preencher e-mail mostra erro", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: "Esqueceu sua senha?" }).click();

    await expect(page.getByText("Por favor, digite seu e-mail")).toBeVisible();
    await expect(page.getByText(/E-mail enviado/)).not.toBeVisible();
  });

  test("nova senha e confirmação diferentes mostram erro na página de reset", async ({
    page,
  }) => {
    // Acesso direto sem token de recuperação: só a validação client-side
    // (senhas não coincidem) roda antes de qualquer chamada ao Supabase,
    // então esse cenário não depende de uma sessão de recovery real.
    await page.goto("/reset-password");

    const passwordFields = page.getByPlaceholder("••••••••");
    await passwordFields.nth(0).fill("NovaSenha123");
    await passwordFields.nth(1).fill("NovaSenhaDiferente123");

    await page.getByRole("button", { name: "Salvar nova senha" }).click();

    await expect(page.getByText("As senhas não coincidem")).toBeVisible();
    await expect(page).toHaveURL(/\/reset-password$/);
  });
});
