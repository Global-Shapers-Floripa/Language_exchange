import { test, expect } from "@playwright/test";
import { login } from "./helpers";

// Alvo fixo criado em E2E_TEST_DATA_SETUP.sql — evita enviar solicitações de
// conexão (e disparar a notificação por e-mail) para usuários reais.
const TEST_PARTNER_NAME = "E2E Test Partner";

test.describe("Conexões", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/partners");
  });

  test("lista de parceiros sugeridos carrega com pelo menos um card", async ({
    page,
  }) => {
    await expect(page.locator(".card--partner").first()).toBeVisible();
    await expect(
      page.locator(".partner-name", { hasText: TEST_PARTNER_NAME }),
    ).toBeVisible();
  });

  test("enviar solicitação de conexão para o parceiro de teste muda o status para Pendente", async ({
    page,
  }) => {
    const testPartnerCard = page
      .locator(".card--partner")
      .filter({ hasText: TEST_PARTNER_NAME });
    await expect(testPartnerCard).toBeVisible();

    // O card sempre abre o modal ao clicar, independente do status atual —
    // o rótulo do botão do card pode não ter terminado de carregar ainda,
    // então o estado real é confirmado dentro do modal (que faz sua própria
    // busca de conexão) em vez de confiar no texto do card nesse momento.
    await testPartnerCard.locator(".connect-btn").click();

    const modal = page.locator(".partner-modal");
    await expect(modal).toBeVisible();

    const requestBtn = modal.getByRole("button", { name: "Solicitar Conexão" });
    const pendingText = modal.getByText("Solicitação Pendente");
    const acceptedText = modal.getByText("Contato");

    // Idempotente: se uma execução anterior já deixou a solicitação pendente
    // (ou aceita), não tentamos enviar de novo — só confirmamos o estado.
    await expect(requestBtn.or(pendingText).or(acceptedText)).toBeVisible({
      timeout: 10000,
    });

    if (await requestBtn.isVisible()) {
      await requestBtn.click();
      await expect(pendingText).toBeVisible();
      await page.getByRole("button", { name: "OK" }).click().catch(() => {});
    }

    await modal.locator(".close-modal-btn").click();
    await expect(testPartnerCard.locator(".connect-btn")).toContainText(
      /Pendente|Conectado/,
    );
  });
});
