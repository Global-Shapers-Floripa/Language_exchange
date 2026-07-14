import { useState, useEffect } from "react";

import { supabase } from "../services/supabaseClient";

import { LANGUAGES } from "../constants/languages";

// Sessões em que o usuário logado é o PARCEIRO (não o dono) e que estão
// aguardando a decisão dele para virar pública ou voltar a ser privada.
// Diferente de useSessions.js, que só busca sessões onde user_id = auth.uid().
export const usePendingApprovals = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error: fetchError } = await supabase
        .from("sessions")
        .select(
          `
            id,
            user_id,
            date,
            duration,
            languages,
            notes,
            session_photo_url
          `,
        )
        .eq("partner_id", user.id)
        .eq("status", "pendente_aprovacao")
        .order("date", { ascending: false });

      if (fetchError) throw fetchError;

      // 'sessions.user_id' referencia auth.users, não profiles — sem FK
      // direta pro PostgREST embutir via 'profiles!user_id' (diferente de
      // 'partner_id', que referencia profiles). Busca os perfis à parte.
      const requesterIds = [...new Set(data.map((s) => s.user_id))];
      const { data: requesterProfiles, error: profilesError } = requesterIds.length
        ? await supabase
            .from("profiles")
            .select("id, full_name, hub, preferred_language")
            .in("id", requesterIds)
        : { data: [], error: null };

      if (profilesError) throw profilesError;

      const profileById = new Map(
        (requesterProfiles || []).map((p) => [p.id, p]),
      );

      const formatted = data.map((session) => {
        const languageNames = session.languages
          ?.split(",")
          .map((lang) => {
            const found = LANGUAGES.find((item) => item.code === lang.trim());

            return found ? found.name : lang;
          })
          .join(", ");

        const requesterProfile = profileById.get(session.user_id);

        return {
          id: session.id,
          user_id: session.user_id,
          requester: requesterProfile?.full_name || "Desconhecido",
          hub: requesterProfile?.hub || "N/A",
          preferred_language: requesterProfile?.preferred_language,
          date: new Date(session.date).toLocaleDateString("pt-BR"),
          duration: session.duration,
          languages: languageNames || "N/A",
          notes: session.notes || "",
          session_photo_url: session.session_photo_url,
        };
      });

      setPendingApprovals(formatted);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar pedidos de aprovação:", err);

      setError(err.message);
      setPendingApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchPendingApprovals();
    };

    init();
  }, []);

  // =========================
  // DECIDIR (APROVAR/RECUSAR)
  // =========================
  // A RPC já valida que quem chama é o partner_id e que a sessão está
  // pendente — se ela levantar exceção, vem em `error`, então basta checar
  // isso (diferente de outros fluxos do projeto que reconferem via .select()
  // por causa de bloqueios silenciosos de RLS em UPDATE/DELETE direto).
  const decide = async (sessionId, decision) => {
    try {
      const { error: rpcError } = await supabase.rpc(
        "approve_public_session",
        {
          p_session_id: sessionId,
          p_decision: decision,
        },
      );

      if (rpcError) throw rpcError;

      const decidedItem = pendingApprovals.find(
        (item) => item.id === sessionId,
      );

      // Atualiza a lista local em vez de refetchar tudo — a sessão já foi
      // decidida, então só precisa sumir da lista de pendências.
      setPendingApprovals((prev) =>
        prev.filter((item) => item.id !== sessionId),
      );

      // Avisa quem registrou por e-mail (aprovada ou rejeitada). Best-effort,
      // mesmo padrão de requestPublicApproval em useSessions.js: a decisão já
      // foi confirmada pela RPC, então uma falha aqui é só logada, sem
      // bloquear o fluxo principal.
      if (decidedItem) {
        try {
          const [
            {
              data: { user },
            },
            { data: registrantContact },
          ] = await Promise.all([
            supabase.auth.getUser(),
            supabase
              .from("profile_contacts")
              .select("email")
              .eq("user_id", decidedItem.user_id)
              .single(),
          ]);

          if (registrantContact?.email) {
            const { data: ownProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", user.id)
              .single();

            const { error: emailError } = await supabase.functions.invoke(
              "send-email",
              {
                body: {
                  template: "session_public_decision",
                  to: registrantContact.email,
                  lang: decidedItem.preferred_language,
                  data: {
                    recipientName: decidedItem.requester,
                    partnerName: ownProfile?.full_name || "",
                    decision:
                      decision === "publica" ? "aprovada" : "rejeitada",
                    appUrl: `${window.location.origin}/sessions`,
                  },
                },
              },
            );

            if (emailError) {
              console.error(
                "Erro ao enviar e-mail de decisão de sessão pública:",
                emailError,
              );
            }
          }
        } catch (notifyErr) {
          console.error(
            "Erro ao notificar decisão de sessão pública:",
            notifyErr,
          );
        }
      }

      return { success: true };
    } catch (err) {
      console.error("Erro ao decidir sobre sessão pública:", err);

      return {
        success: false,
        error: err.message,
      };
    }
  };

  const approve = (sessionId) => decide(sessionId, "publica");
  const reject = (sessionId) => decide(sessionId, "privada");

  return {
    pendingApprovals,
    loading,
    error,
    approve,
    reject,
    refetch: fetchPendingApprovals,
  };
};
