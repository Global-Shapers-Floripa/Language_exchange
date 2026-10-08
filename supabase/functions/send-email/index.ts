/// <reference no-default-lib="true"/>
/// <reference lib="deno.ns" />

import { createClient } from "@supabase/supabase-js";

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

// =========================
// IDIOMA
// =========================
// Espelha SUPPORTED_LANGUAGES de src/i18n/index.js e o CHECK constraint de
// profiles.preferred_language (migration 20260714120000) — os três lugares
// precisam ser atualizados juntos se um novo idioma for suportado no futuro.
type Lang = "pt" | "en" | "es";
const DEFAULT_LANG: Lang = "en";
const LANG_HTML_ATTR: Record<Lang, string> = {
  pt: "pt-BR",
  en: "en",
  es: "es",
};

// Callers passam profiles.preferred_language como veio do banco — se vier
// ausente ou um valor fora dos 3 suportados (ex: chamador antigo que ainda
// não foi atualizado), cai no default 'en'.
const resolveLang = (lang: unknown): Lang =>
  lang === "pt" || lang === "en" || lang === "es" ? lang : DEFAULT_LANG;

// Layout compartilhado pelos templates: header escuro com logo, corpo claro,
// rodapé escuro. `ctaText`/`ctaUrl` são opcionais — sem eles, o botão
// simplesmente não é renderizado (caso do template 'user_deleted').
const renderEmailShell = ({
  bodyHtml,
  ctaText,
  ctaUrl,
  lang,
}: {
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  lang: Lang;
}) => `
<!DOCTYPE html>
<html lang="${LANG_HTML_ATTR[lang]}">
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
type Template =
  | "approval"
  | "connection_request"
  | "user_deleted"
  | "session_public_request"
  | "session_public_decision";

const TEMPLATES: Record<
  Template,
  (data: Record<string, string>, lang: Lang) => { subject: string; html: string }
> = {
  approval: (data, lang) => {
    const recipientName = escapeHtml(data.recipientName || "");
    const appUrl = data.appUrl || "";

    const STRINGS: Record<Lang, { subject: string; body: string; ctaText: string }> = {
      pt: {
        subject: "Seu perfil no Language Exchange foi aprovado! 🎉",
        body: `
          <p>Oi, ${recipientName}! Boas notícias: seu perfil no Language Exchange foi aprovado e você já pode começar a praticar idiomas com outros Global Shapers.</p>
          <p>Agora é só entrar na plataforma, explorar os perfis disponíveis e enviar suas primeiras solicitações de conexão.</p>
          <p>Bons papos e boas trocas! 🌍</p>
        `,
        ctaText: "Acessar plataforma",
      },
      en: {
        subject: "Your Language Exchange profile has been approved! 🎉",
        body: `
          <p>Hi, ${recipientName}! Good news: your Language Exchange profile has been approved, and you can now start practicing languages with other Global Shapers.</p>
          <p>Just log in to the platform, explore the available profiles, and send your first connection requests.</p>
          <p>Happy chats and happy exchanges! 🌍</p>
        `,
        ctaText: "Go to platform",
      },
      es: {
        subject: "¡Tu perfil en Language Exchange fue aprobado! 🎉",
        body: `
          <p>¡Hola, ${recipientName}! Buenas noticias: tu perfil en Language Exchange fue aprobado y ya puedes empezar a practicar idiomas con otros Global Shapers.</p>
          <p>Ahora solo entra a la plataforma, explora los perfiles disponibles y envía tus primeras solicitudes de conexión.</p>
          <p>¡Buenas charlas y buenos intercambios! 🌍</p>
        `,
        ctaText: "Ir a la plataforma",
      },
    };

    const t = STRINGS[lang];
    return {
      subject: t.subject,
      html: renderEmailShell({ bodyHtml: t.body, ctaText: t.ctaText, ctaUrl: appUrl, lang }),
    };
  },

  connection_request: (data, lang) => {
    const recipientName = escapeHtml(data.recipientName || "");
    const senderName = escapeHtml(data.senderName || "");
    const appUrl = data.appUrl || "";

    const STRINGS: Record<Lang, { subject: string; body: string; ctaText: string }> = {
      pt: {
        subject: "Você recebeu uma nova solicitação de conexão",
        body: `
          <p>Oi, ${recipientName}! ${senderName} quer se conectar com você no Language Exchange para praticar idiomas.</p>
          <p>Acesse a plataforma pra ver o perfil e decidir se quer aceitar.</p>
        `,
        ctaText: "Ver solicitação",
      },
      en: {
        subject: "You received a new connection request",
        body: `
          <p>Hi, ${recipientName}! ${senderName} wants to connect with you on Language Exchange to practice languages.</p>
          <p>Log in to the platform to see the profile and decide whether to accept.</p>
        `,
        ctaText: "View request",
      },
      es: {
        subject: "Recibiste una nueva solicitud de conexión",
        body: `
          <p>¡Hola, ${recipientName}! ${senderName} quiere conectarse contigo en Language Exchange para practicar idiomas.</p>
          <p>Entra a la plataforma para ver el perfil y decidir si quieres aceptar.</p>
        `,
        ctaText: "Ver solicitud",
      },
    };

    const t = STRINGS[lang];
    return {
      subject: t.subject,
      html: renderEmailShell({ bodyHtml: t.body, ctaText: t.ctaText, ctaUrl: appUrl, lang }),
    };
  },

  user_deleted: (_data, lang) => {
    const STRINGS: Record<Lang, { subject: string; body: string }> = {
      pt: {
        subject: "Sua conta no Language Exchange foi removida",
        body: `
          <p>Olá,</p>
          <p>Informamos que sua conta no Language Exchange foi removida por violar as diretrizes da nossa comunidade.</p>
          <p>O Language Exchange é um espaço para conexão e aprendizado, e esperamos que todas as interações sigam esse princípio.</p>
          <p>Atenciosamente,<br />Equipe Language Exchange — Global Shapers Florianópolis</p>
        `,
      },
      en: {
        subject: "Your Language Exchange account has been removed",
        body: `
          <p>Hello,</p>
          <p>We're letting you know that your Language Exchange account has been removed for violating our community guidelines.</p>
          <p>Language Exchange is a space for connection and learning, and we expect every interaction to follow that principle.</p>
          <p>Best regards,<br />Language Exchange Team — Global Shapers Florianópolis</p>
        `,
      },
      es: {
        subject: "Tu cuenta en Language Exchange fue eliminada",
        body: `
          <p>Hola,</p>
          <p>Te informamos que tu cuenta en Language Exchange fue eliminada por violar las pautas de nuestra comunidad.</p>
          <p>Language Exchange es un espacio para conectar y aprender, y esperamos que todas las interacciones sigan ese principio.</p>
          <p>Atentamente,<br />Equipo Language Exchange — Global Shapers Florianópolis</p>
        `,
      },
    };

    const t = STRINGS[lang];
    return {
      subject: t.subject,
      html: renderEmailShell({ bodyHtml: t.body, lang }),
    };
  },

  session_public_request: (data, lang) => {
    const recipientName = escapeHtml(data.recipientName || "");
    const senderName = escapeHtml(data.senderName || "");
    const appUrl = data.appUrl || "";

    const STRINGS: Record<Lang, { subject: string; body: string; ctaText: string }> = {
      pt: {
        subject: "Pedido para tornar uma sessão pública",
        body: `
          <p>Oi, ${recipientName}! ${senderName} quer tornar uma sessão de prática de vocês dois pública no Language Exchange, para aparecer no feed da comunidade.</p>
          <p>Acesse a plataforma para ver os detalhes e decidir se aprova ou recusa o pedido.</p>
        `,
        ctaText: "Ver pedido",
      },
      en: {
        subject: "Request to make a session public",
        body: `
          <p>Hi, ${recipientName}! ${senderName} wants to make one of your shared practice sessions public on Language Exchange, so it appears in the Community feed.</p>
          <p>Log in to the platform to see the details and decide whether to approve or decline the request.</p>
        `,
        ctaText: "View request",
      },
      es: {
        subject: "Solicitud para hacer pública una sesión",
        body: `
          <p>¡Hola, ${recipientName}! ${senderName} quiere hacer pública una sesión de práctica de ustedes dos en Language Exchange, para que aparezca en el feed de la Comunidad.</p>
          <p>Entra a la plataforma para ver los detalles y decidir si apruebas o rechazas la solicitud.</p>
        `,
        ctaText: "Ver solicitud",
      },
    };

    const t = STRINGS[lang];
    return {
      subject: t.subject,
      html: renderEmailShell({ bodyHtml: t.body, ctaText: t.ctaText, ctaUrl: appUrl, lang }),
    };
  },

  session_public_decision: (data, lang) => {
    const recipientName = escapeHtml(data.recipientName || "");
    const partnerName = escapeHtml(data.partnerName || "");
    const appUrl = data.appUrl || "";
    const approved = data.decision === "aprovada";

    const STRINGS: Record<
      Lang,
      { subjectApproved: string; subjectDeclined: string; bodyApproved: string; bodyDeclined: string; ctaText: string }
    > = {
      pt: {
        subjectApproved: "Sua sessão foi aprovada e já está pública",
        subjectDeclined: "Seu pedido de sessão pública foi recusado",
        bodyApproved: `
          <p>Oi, ${recipientName}! ${partnerName} aprovou o pedido para tornar pública a sessão de prática de vocês dois.</p>
          <p>Ela já está visível no feed da Comunidade do Language Exchange.</p>
        `,
        bodyDeclined: `
          <p>Oi, ${recipientName}! ${partnerName} optou por manter privada a sessão de prática de vocês dois.</p>
          <p>Ela continua registrada normalmente na sua lista de sessões, só não vai aparecer no feed da Comunidade.</p>
        `,
        ctaText: "Ver minhas sessões",
      },
      en: {
        subjectApproved: "Your session was approved and is now public",
        subjectDeclined: "Your public session request was declined",
        bodyApproved: `
          <p>Hi, ${recipientName}! ${partnerName} approved the request to make your shared practice session public.</p>
          <p>It's now visible in the Language Exchange Community feed.</p>
        `,
        bodyDeclined: `
          <p>Hi, ${recipientName}! ${partnerName} chose to keep your shared practice session private.</p>
          <p>It's still recorded normally in your sessions list — it just won't appear in the Community feed.</p>
        `,
        ctaText: "View my sessions",
      },
      es: {
        subjectApproved: "Tu sesión fue aprobada y ya está pública",
        subjectDeclined: "Tu solicitud de sesión pública fue rechazada",
        bodyApproved: `
          <p>¡Hola, ${recipientName}! ${partnerName} aprobó la solicitud para hacer pública la sesión de práctica de ustedes dos.</p>
          <p>Ya está visible en el feed de la Comunidad de Language Exchange.</p>
        `,
        bodyDeclined: `
          <p>¡Hola, ${recipientName}! ${partnerName} optó por mantener privada la sesión de práctica de ustedes dos.</p>
          <p>Sigue registrada normalmente en tu lista de sesiones, solo que no aparecerá en el feed de la Comunidad.</p>
        `,
        ctaText: "Ver mis sesiones",
      },
    };

    const t = STRINGS[lang];
    return {
      subject: approved ? t.subjectApproved : t.subjectDeclined,
      html: renderEmailShell({
        bodyHtml: approved ? t.bodyApproved : t.bodyDeclined,
        ctaText: t.ctaText,
        ctaUrl: appUrl,
        lang,
      }),
    };
  },
};

Deno.serve(async (req: Request) => {
  // Lida com o preflight do CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 'user_id' é opcional: quem chama ainda não foi atualizado pra
    // mandá-lo (fase futura, junto com o fechamento de acesso desta
    // function) — sem ele, o envio funciona normalmente, só a linha em
    // email_log nasce com user_id NULL (mas com recipient_email preenchido).
    const { template, to, data, lang, user_id: userId } = await req.json();

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

    const { subject, html } = TEMPLATES[template as Template](
      data || {},
      resolveLang(lang),
    );

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

    // Loga o id retornado pelo Resend (não vai na resposta pra quem chama) —
    // permite rastrear um envio específico depois via dashboard/API do
    // Resend, sem precisar criar uma function de diagnóstico ad hoc.
    const resendBody = await resendResponse.json();
    console.log(
      `E-mail enviado via Resend: template=${template} resend_id=${resendBody?.id}`,
    );

    // Registro em email_log é best-effort e roda DEPOIS da confirmação do
    // Resend: o e-mail já saiu, então uma falha em logar não deve virar erro
    // pra quem chamou (isso poderia disparar um reenvio, duplicando o
    // e-mail). Feito aqui dentro (não em quem chama) de propósito — com 6
    // pontos de chamada espalhados, bastaria esquecer de logar em um deles
    // pro cron futuro concluir "ainda não mandei" e reenviar. Client de
    // service role criado por chamada, mesmo padrão usado em
    // notify-connection-request e admin-delete-user.
    try {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY",
      );

      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error(
          "SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes — e-mail enviado mas não registrado em email_log.",
        );
      } else {
        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { error: logError } = await adminClient.from("email_log").insert({
          user_id: userId ?? null,
          recipient_email: to,
          template,
          resend_id: resendBody?.id ?? null,
        });

        if (logError) {
          console.error(
            `Falha ao registrar email_log: template=${template} resend_id=${resendBody?.id}`,
            logError,
          );
        }
      }
    } catch (logErr) {
      console.error("Erro ao registrar email_log:", logErr);
    }

    return jsonResponse({ success: true }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return jsonResponse({ error: message }, 500);
  }
});
