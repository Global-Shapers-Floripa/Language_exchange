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

Deno.serve(async (req: Request) => {
  // Lida com o preflight do CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Token de autenticação ausente." }, 401);
    }

    const { request_id: requestId, app_url: appUrl } = await req.json();
    if (!requestId) {
      return jsonResponse({ error: "request_id é obrigatório." }, 400);
    }

    // Client "no contexto do chamador": usa a anon key + repassa o JWT do
    // request, pra identificar quem está chamando e ler dados respeitando RLS.
    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();

    if (callerError || !caller) {
      return jsonResponse(
        { error: "Não foi possível identificar o usuário chamador." },
        401,
      );
    }

    // A RLS de connection_requests ("Permitir leitura para os usuários
    // envolvidos") só deixa o caller enxergar esta linha se ele for
    // sender_id ou receiver_id — isso já serve como checagem de posse.
    const { data: request, error: requestError } = await callerClient
      .from("connection_requests")
      .select("id, sender_id, receiver_id, status")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      return jsonResponse(
        { error: "Solicitação de conexão não encontrada." },
        404,
      );
    }

    if (request.sender_id !== caller.id || request.status !== "pendente") {
      return jsonResponse(
        {
          error:
            "Você só pode notificar sobre uma solicitação pendente enviada por você mesmo.",
        },
        403,
      );
    }

    // Nomes vêm de 'profiles', que tem leitura pública — não precisa de
    // service role aqui.
    const [{ data: senderProfile }, { data: receiverProfile }] =
      await Promise.all([
        callerClient
          .from("profiles")
          .select("full_name")
          .eq("id", request.sender_id)
          .single(),
        callerClient
          .from("profiles")
          .select("full_name")
          .eq("id", request.receiver_id)
          .single(),
      ]);

    // 'profile_contacts' tem RLS restrita: o remetente não pode ler o
    // contato do destinatário antes da conexão ser aceita. Só a partir daqui
    // usamos a service role, e só para essa leitura pontual.
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: receiverContact } = await adminClient
      .from("profile_contacts")
      .select("email")
      .eq("user_id", request.receiver_id)
      .single();

    if (!receiverContact?.email) {
      return jsonResponse(
        { error: "Destinatário não tem e-mail cadastrado." },
        404,
      );
    }

    const emailResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          template: "connection_request",
          to: receiverContact.email,
          data: {
            recipientName: receiverProfile?.full_name || "",
            senderName: senderProfile?.full_name || "",
            appUrl: appUrl || "",
          },
        }),
      },
    );

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      return jsonResponse(
        { error: `Falha ao enviar e-mail: ${errorText}` },
        502,
      );
    }

    return jsonResponse({ success: true }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return jsonResponse({ error: message }, 500);
  }
});
