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

    const { target_id: targetId } = await req.json();
    if (!targetId) {
      return jsonResponse({ error: "target_id é obrigatório." }, 400);
    }

    // Client "no contexto do chamador": usa a anon key + repassa o JWT do
    // request, para identificar quem está chamando via auth.getUser() e
    // ler o próprio perfil respeitando RLS (não usamos service role aqui).
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

    const { data: callerProfile, error: callerProfileError } =
      await callerClient
        .from("profiles")
        .select("is_admin")
        .eq("id", caller.id)
        .single();

    if (callerProfileError || !callerProfile?.is_admin) {
      return jsonResponse(
        { error: "Apenas admins podem excluir usuários." },
        403,
      );
    }

    if (caller.id === targetId) {
      return jsonResponse(
        { error: "Você não pode excluir a própria conta por aqui." },
        400,
      );
    }

    // A partir daqui, ações privilegiadas: client com a service role key
    // (nunca hardcoded — vem das variáveis de ambiente injetadas pelo
    // Supabase em toda Edge Function). Ela ignora RLS e tem acesso à Admin
    // API de auth, necessária para excluir a conta de autenticação.
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // E-mail de aviso é best-effort e PRECISA ser buscado/disparado antes do
    // delete: depois que o profile (e, em cascata, o profile_contacts) for
    // apagado, nem o e-mail nem o preferred_language existem mais no banco.
    // Falha aqui só é logada — nunca bloqueia a exclusão em si, que é a ação
    // prioritária.
    const [{ data: contactToNotify }, { data: profileToNotify }] =
      await Promise.all([
        adminClient
          .from("profile_contacts")
          .select("email")
          .eq("user_id", targetId)
          .single(),
        adminClient
          .from("profiles")
          .select("preferred_language")
          .eq("id", targetId)
          .single(),
      ]);

    if (contactToNotify?.email) {
      try {
        const emailResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              template: "user_deleted",
              to: contactToNotify.email,
              lang: profileToNotify?.preferred_language,
              data: {},
            }),
          },
        );

        if (!emailResponse.ok) {
          console.error(
            "Falha ao enviar e-mail de exclusão:",
            await emailResponse.text(),
          );
        }
      } catch (emailErr) {
        console.error("Erro ao chamar send-email:", emailErr);
      }
    }

    // PASSO 1: apagar o profile primeiro. 'profiles.id' referencia
    // auth.users.id SEM ON DELETE CASCADE — excluir o auth.users antes
    // deixaria a linha em profiles quebrando a FK. connection_requests,
    // profile_contacts e sessions.partner_id cascateiam a partir daqui.
    const { data: deletedProfile, error: deleteProfileError } =
      await adminClient
        .from("profiles")
        .delete()
        .eq("id", targetId)
        .select();

    if (deleteProfileError) {
      return jsonResponse(
        { error: `Falha ao excluir o perfil: ${deleteProfileError.message}` },
        500,
      );
    }

    if (!deletedProfile || deletedProfile.length === 0) {
      return jsonResponse(
        { error: "Nenhum perfil encontrado com esse id." },
        404,
      );
    }

    // PASSO 2: apagar a conta de autenticação. sessions.user_id referencia
    // auth.users.id com CASCADE, o que limpa as sessões restantes do usuário.
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(
      targetId,
    );

    if (deleteAuthError) {
      // Caso mais delicado: o perfil já foi removido (passo 1 concluído),
      // mas a conta de auth não. Não dá para "desfazer" o passo 1 aqui, e é
      // importante o admin saber que precisa investigar manualmente
      // (Authentication > Users no painel do Supabase) antes de tentar de
      // novo — uma nova tentativa vai cair no "Nenhum perfil encontrado".
      return jsonResponse(
        {
          error:
            `O perfil foi removido, mas a conta de autenticação NÃO pôde ` +
            `ser excluída (${deleteAuthError.message}). Investigue ` +
            `manualmente no painel do Supabase (Authentication > Users) ` +
            `antes de tentar novamente.`,
        },
        500,
      );
    }

    return jsonResponse({ success: true }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return jsonResponse({ error: message }, 500);
  }
});
