import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { supabase } from "../services/supabaseClient";

import { LANGUAGES } from "../constants/languages";
import { COUNTRIES } from "../constants/countries";

export const useSessions = () => {
  const { t } = useTranslation("constants");
  const [sessions, setSessions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);

      // =========================
      // USUÁRIO LOGADO
      // =========================
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // =========================
      // BUSCAR SESSÕES
      // =========================
      // Inclui tanto as sessões registradas pelo usuário (user_id) quanto as
      // sessões em que ele foi só o parceiro e que já foram aprovadas como
      // públicas — privadas/pendentes "por participação" continuam de fora
      // (essas aparecem só no bloco de pendências, usePendingApprovals.js).
      const { data, error: fetchError } = await supabase
        .from("sessions")
        .select(
          `
            id,
            user_id,
            partner_id,
            date,
            duration,
            languages,
            notes,
            session_photo_url,
            status,
            profiles!partner_id (
              id,
              full_name,
              hub,
              country,
              photo_url
            )
          `,
        )
        .or(
          `user_id.eq.${user.id},and(partner_id.eq.${user.id},status.eq.publica)`,
        )
        .order("date", {
          ascending: false,
        });

      if (fetchError) {
        if (fetchError.message.includes("Could not find the table")) {
          throw new Error(
            "Tabela de sessões não foi criada ainda. Execute o DATABASE_SETUP.sql no Supabase.",
          );
        }

        throw fetchError;
      }

      // 'sessions.user_id' referencia auth.users, não profiles — sem FK
      // direta pro PostgREST embutir via 'profiles!user_id'. Só precisamos
      // disso para as sessões "por participação" (usuário logado é o
      // partner_id, não quem registrou), então busca à parte só esses perfis.
      const registrantIds = [
        ...new Set(
          data
            .filter((session) => session.user_id !== user.id)
            .map((session) => session.user_id),
        ),
      ];

      const { data: registrantProfiles, error: registrantError } =
        registrantIds.length
          ? await supabase
              .from("profiles")
              .select("id, full_name, hub, country, photo_url")
              .in("id", registrantIds)
          : { data: [], error: null };

      if (registrantError) throw registrantError;

      const registrantById = new Map(
        (registrantProfiles || []).map((p) => [p.id, p]),
      );

      // Perfil do próprio usuário logado — usado pro card mostrar "os dois
      // participantes" (SessionCard), já que a query acima só embute o
      // perfil da outra pessoa.
      const { data: ownProfile, error: ownProfileError } = await supabase
        .from("profiles")
        .select("full_name, hub, country, photo_url")
        .eq("id", user.id)
        .single();

      if (ownProfileError) throw ownProfileError;

      // =========================
      // FORMATAR DADOS
      // =========================
      const formattedSessions = data.map((session) => {
        // converter EN/PT/etc em nome bonito
        const languageNames = session.languages
          ?.split(",")
          .map((lang) => {
            const found = LANGUAGES.find((item) => item.code === lang.trim());

            return found ? t(`languages.${found.code}`) : lang;
          })
          .join(", ");

        const isOwner = session.user_id === user.id;

        // Dono vê o perfil do parceiro (profiles!partner_id); quem só
        // participou vê o perfil de quem registrou a sessão.
        const displayProfile = isOwner
          ? session.profiles
          : registrantById.get(session.user_id);

        const countryCode = displayProfile?.country?.trim().toUpperCase();
        const countryInfo = COUNTRIES.find((c) => c.code === countryCode);

        const otherId = isOwner ? session.partner_id : session.user_id;

        return {
          id: session.id,

          partner_id: session.partner_id,

          isOwner,

          partner: displayProfile?.full_name || "Desconhecido",

          hub: displayProfile?.hub || "N/A",

          country: countryInfo
            ? t(`countries.${countryInfo.code}`)
            : displayProfile?.country || "",

          date: new Date(session.date).toLocaleDateString("pt-BR"),

          duration: session.duration,

          languages: languageNames || "N/A",

          notes: session.notes || "",

          session_photo_url: session.session_photo_url,

          status: session.status,

          // Usados pelo SessionCard, que mostra os dois participantes lado a
          // lado em vez de assumir que o usuário logado é sempre o dono.
          selfPerson: {
            id: user.id,
            name: ownProfile?.full_name || "Você",
            hub: ownProfile?.hub || "N/A",
            countryCode: ownProfile?.country || "",
            photoUrl: ownProfile?.photo_url || null,
          },

          otherPerson: {
            id: otherId,
            name: displayProfile?.full_name || "Desconhecido",
            hub: displayProfile?.hub || "N/A",
            countryCode: displayProfile?.country || "",
            photoUrl: displayProfile?.photo_url || null,
          },
        };
      });

      setSessions(formattedSessions);

      setError(null);
    } catch (err) {
      console.error("Erro ao buscar sessões:", err);

      setError(err.message);

      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchSessions();
    };

    init();
  }, []);

  const deleteSession = async (sessionId) => {
  try {
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", sessionId);

    if (error) throw error;

    await fetchSessions();

    return { success: true };
  } catch (err) {
    console.error("Erro ao deletar sessão:", err);

    return {
      success: false,
      error: err.message,
    };
  }
};

  // =========================
  // PEDIR APROVAÇÃO PARA TORNAR PÚBLICA
  // =========================
  // O dono tem permissão de UPDATE na própria sessão (policy existente), então
  // a mudança de status é um UPDATE direto. O e-mail pro parceiro segue o
  // mesmo padrão de Admin.jsx (approveUser): falha no envio é só logada,
  // não desfaz a mudança de status já confirmada.
  const requestPublicApproval = async (session) => {
    try {
      const { error: updateError } = await supabase
        .from("sessions")
        .update({ status: "pendente_aprovacao" })
        .eq("id", session.id);

      if (updateError) throw updateError;

      await fetchSessions();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const [{ data: ownProfile }, { data: partnerProfile }, { data: partnerContact }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single(),
          supabase
            .from("profiles")
            .select("preferred_language")
            .eq("id", session.partner_id)
            .single(),
          supabase
            .from("profile_contacts")
            .select("email")
            .eq("user_id", session.partner_id)
            .single(),
        ]);

      if (partnerContact?.email) {
        const { error: emailError } = await supabase.functions.invoke(
          "send-email",
          {
            body: {
              template: "session_public_request",
              to: partnerContact.email,
              lang: partnerProfile?.preferred_language,
              data: {
                recipientName: session.partner,
                senderName: ownProfile?.full_name || "",
                appUrl: `${window.location.origin}/sessions`,
              },
            },
          },
        );

        if (emailError) {
          console.error(
            "Erro ao enviar e-mail de pedido de sessão pública:",
            emailError,
          );
        }
      }

      return { success: true };
    } catch (err) {
      console.error("Erro ao pedir aprovação de sessão pública:", err);

      return {
        success: false,
        error: err.message,
      };
    }
  };

  return {
    sessions,
    loading,
    error,
    deleteSession,
    requestPublicApproval,
    refetch: fetchSessions,
  };
};
