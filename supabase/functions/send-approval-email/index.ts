/// <reference no-default-lib="true"/>
/// <reference lib="deno.ns" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // Lida com o preflight do CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Coleta os dados enviados pelo seu painel React
    const { email, name } = await req.json();

    // 🛑 ENVIO DE E-MAIL DESATIVADO TEMPORARIAMENTE
    /*
    // Recupera a API Key configurada nos secrets do Supabase
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("A variável RESEND_API_KEY não foi configurada no Supabase.");
    }

    // Faz a requisição HTTP para a API do Resend para disparar o e-mail
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Language Exchange <onboarding@resend.dev>", // E-mail padrão de teste do Resend (ou seu domínio configurado)
        to: [email],
        subject: "Sua solicitação de acesso foi aprovada! 🎉",
        html: `
          <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
            <h2>Olá, ${name}!</h2>
            <p>Temos uma excelente notícia para você.</p>
            <p>A sua solicitação de acesso à plataforma foi avaliada e <strong>aprovada</strong> por um administrador!</p>
            <p>Agora você já pode realizar o login no sistema e começar a explorar todas as ferramentas disponíveis.</p>
            <br />
            <p>Seja muito bem-vindo(a)!</p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Falha ao enviar e-mail via Resend: ${errorText}`);
    }
    */

    // Retorna sucesso mesmo sem enviar o e-mail por enquanto
    return new Response(
      JSON.stringify({ success: true, message: "Aprovação registrada (e-mail desativado)." }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});