import { test, expect } from "@playwright/test";
import { login } from "./helpers";

// Alvo fixo criado em E2E_TEST_DATA_SETUP.sql — evita depender de usuários
// reais aparecerem no dropdown de parceiros.
const TEST_PARTNER_LABEL = "E2E Test Partner (E2E-TEST)";
const TEST_NOTES = "[TESTE AUTOMATIZADO E2E — pode excluir]";

test.describe("Sessões", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/sessions");
  });

  test("registrar uma nova sessão válida aparece na lista", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Novo Registro" }).click();

    const modal = page.locator(".session-modal-content");
    await expect(modal).toBeVisible();

    // Parceiro (SearchableSelect)
    await modal.getByText("Buscar parceiro por nome ou hub...").click();
    await page.getByRole("button", { name: TEST_PARTNER_LABEL }).click();

    // Data: mantém o valor padrão (hoje) já preenchido pelo form.

    // Duração
    await modal.locator("#duration").fill("45");

    // Idiomas (SearchableSelect multi)
    await modal.getByText("Selecione os idiomas...").click();
    await page.getByRole("button", { name: "Português", exact: true }).click();
    // Fecha o dropdown de idiomas clicando fora, antes de mexer nas notas.
    await modal.locator("h2", { hasText: "Registrar Nova Sessão" }).click();

    // Notas (identificável para limpeza manual futura)
    await modal.locator("#notes").fill(TEST_NOTES);

    await page.getByRole("button", { name: "Registrar Sessão" }).click();

    await expect(modal).not.toBeVisible();
    await expect(
      page.locator(".session-card", { hasText: "E2E Test Partner" }).first(),
    ).toBeVisible();
  });

  test("submeter sem selecionar parceiro mostra erro e não salva", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Novo Registro" }).click();

    const modal = page.locator(".session-modal-content");
    await expect(modal).toBeVisible();

    // Deixa o parceiro sem selecionar; preenche o resto normalmente.
    await modal.locator("#duration").fill("30");

    await modal.getByText("Selecione os idiomas...").click();
    await page.getByRole("button", { name: "Português", exact: true }).click();
    await modal.locator("h2", { hasText: "Registrar Nova Sessão" }).click();

    await page.getByRole("button", { name: "Registrar Sessão" }).click();

    await expect(
      modal.getByText("Por favor, selecione um parceiro"),
    ).toBeVisible();
    await expect(modal).toBeVisible();
  });
});
