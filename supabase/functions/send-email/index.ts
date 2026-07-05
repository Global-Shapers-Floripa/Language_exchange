/// <reference no-default-lib="true"/>
/// <reference lib="deno.ns" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const FROM_ADDRESS =
  "Language Exchange <naoresponda@languageexchange.globalshapersflorianopolis.com.br>";
const LOGO_URL =
  "https://ndiadfadpicgppzvlynk.supabase.co/storage/v1/object/public/email-assets/logo.png";

// =========================
// PALETA / LAYOUT BASE
// =========================
const COLORS = {
  bgDark: "#0B0829",
  orange: "#FF8400",
  blue: "#8FA0D8",
  cream: "#F9DFC6",
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Layout compartilhado pelos 3 templates: header escuro com logo, corpo
// claro, rodapé escuro. `ctaText`/`ctaUrl` são opcionais — sem eles, o botão
// simplesmente não é renderizado (caso do template 'user_deleted').
const renderEmailShell = ({
  bodyHtml,
  ctaText,
  ctaUrl,
}: {
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
}) => `
<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0; padding:0; background-color:${COLORS.cream}; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.cream};">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden;">
            <tr>
              <td align="center" style="background-color:${COLORS.bgDark}; padding: 28px 24px;">
                <img src="${LOGO_URL}" alt="Language Exchange" width="120" style="display:block; width:120px; max-width:120px;" />
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 28px; color:${COLORS.bgDark}; font-size:15px; line-height:1.6;">
                ${bodyHtml}
                ${
                  ctaText && ctaUrl
                    ? `
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto 8px;">
                  <tr>
                    <td align="center" style="border-radius:999px; background-color:${COLORS.orange};">
                      <a href="${ctaUrl}" target="_blank" style="display:inline-block; padding: 14px 32px; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:999px;">
                        ${ctaText}
                      </a>
                    </td>
                  </tr>
                </table>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td align="center" style="background-color:${COLORS.bgDark}; padding: 20px 24px;">
                <p style="margin:0; font-size:12px; color:${COLORS.blue};">
                  Global Shapers Florianópolis
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

// =========================
// TEMPLATES
// =========================
type Template = "approval" | "connection_request" | "user_deleted";

const TEMPLATES: Record<
  Template,
  (data: Record<string, string>) => { subject: string; html: string }
> = {
  approval: (data) => {
    const recipientName = escapeHtml(data.recipientName || "");
    const appUrl = data.appUrl || "";
    return {
      subject: "Seu perfil no Language Exchange foi aprovado! 🎉",
      html: renderEmailShell({
        bodyHtml: `
          <p>Oi, ${recipientName}! Boas notícias: seu perfil no Language Exchange foi aprovado e você já pode começar a praticar idiomas com outros Global Shapers.</p>
          <p>Agora é só entrar na plataforma, explorar os perfis disponíveis e enviar suas primeiras solicitações de conexão.</p>
          <p>Bons papos e boas trocas! 🌍</p>
        `,
        ctaText: "Acessar plataforma",
        ctaUrl: appUrl,
      }),
    };
  },

  connection_request: (data) => {
    const recipientName = escapeHtml(data.recipientName || "");
    const senderName = escapeHtml(data.senderName || "");
    const appUrl = data.appUrl || "";
    return {
      subject: "Você recebeu uma nova solicitação de conexão",
      html: renderEmailShell({
        bodyHtml: `
          <p>Oi, ${recipientName}! ${senderName} quer se conectar com você no Language Exchange para praticar idiomas.</p>
          <p>Acesse a plataforma pra ver o perfil e decidir se quer aceitar.</p>
        `,
        ctaText: "Ver solicitação",
        ctaUrl: appUrl,
      }),
    };
  },

  user_deleted: () => ({
    subject: "Sua conta no Language Exchange foi removida",
    html: renderEmailShell({
      bodyHtml: `
        <p>Olá,</p>
        <p>Informamos que sua conta no Language Exchange foi removida por violar as diretrizes da nossa comunidade.</p>
        <p>O Language Exchange é um espaço para conexão e aprendizado, e esperamos que todas as interações sigam esse princípio.</p>
        <p>Atenciosamente,<br />Equipe Language Exchange — Global Shapers Florianópolis</p>
      `,
    }),
  }),
};

Deno.serve(async (req: Request) => {
  // Lida com o preflight do CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { template, to, data } = await req.json();

    if (!template || !TEMPLATES[template as Template]) {
      return jsonResponse(
        { error: `Template inválido: ${template}` },
        400,
      );
    }

    if (!to) {
      return jsonResponse({ error: "'to' é obrigatório." }, 400);
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return jsonResponse(
        { error: "RESEND_API_KEY não configurada no Supabase." },
        500,
      );
    }

    const { subject, html } = TEMPLATES[template as Template](data || {});

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      return jsonResponse(
        { error: `Falha ao enviar e-mail via Resend: ${errorText}` },
        502,
      );
    }

    return jsonResponse({ success: true }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return jsonResponse({ error: message }, 500);
  }
});
