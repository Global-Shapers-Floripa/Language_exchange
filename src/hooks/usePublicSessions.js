import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { supabase } from "../services/supabaseClient";

import { LANGUAGES } from "../constants/languages";

// Feed público: sessões com status = 'publica', visíveis para qualquer
// usuário aprovado — não filtra por user_id/partner_id como useSessions.js.
export const usePublicSessions = () => {
  const { t } = useTranslation("constants");
  const [publicSessions, setPublicSessions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const fetchPublicSessions = async () => {
    try {
      setLoading(true);

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
            session_photo_url,
            partner:profiles!partner_id (
              id,
              full_name,
              hub,
              country,
              photo_url
            )
          `,
        )
        .eq("status", "publica")
        .order("date", { ascending: false });

      if (fetchError) throw fetchError;

      // 'sessions.user_id' referencia auth.users, não profiles — sem FK
      // direta pro PostgREST embutir via 'profiles!user_id' (diferente de
      // 'partner_id', que referencia profiles). Busca os perfis à parte.
      const ownerIds = [...new Set(data.map((s) => s.user_id))];
      const { data: ownerProfiles, error: profilesError } = ownerIds.length
        ? await supabase
            .from("profiles")
            .select("id, full_name, hub, country, photo_url")
            .in("id", ownerIds)
        : { data: [], error: null };

      if (profilesError) throw profilesError;

      const ownerById = new Map((ownerProfiles || []).map((p) => [p.id, p]));

      const formatted = data.map((session) => {
        const languageNames = session.languages
          ?.split(",")
          .map((lang) => {
            const found = LANGUAGES.find((item) => item.code === lang.trim());

            return found ? t(`languages.${found.code}`) : lang;
          })
          .join(", ");

        const ownerProfile = ownerById.get(session.user_id);

        return {
          id: session.id,
          ownerName: ownerProfile?.full_name || "Desconhecido",
          partnerName: session.partner?.full_name || "Desconhecido",
          hub: ownerProfile?.hub || session.partner?.hub || "N/A",
          date: new Date(session.date).toLocaleDateString("pt-BR"),
          duration: session.duration,
          languages: languageNames || "N/A",
          notes: session.notes || "",
          session_photo_url: session.session_photo_url,

          // Usados pelo SessionCard, que mostra os dois participantes lado a
          // lado (ver useSessions.js, mesmo formato de selfPerson/otherPerson
          // — aqui sem "self" porque quem vê o feed é só espectador).
          owner: {
            id: session.user_id,
            name: ownerProfile?.full_name || "Desconhecido",
            hub: ownerProfile?.hub || "N/A",
            countryCode: ownerProfile?.country || "",
            photoUrl: ownerProfile?.photo_url || null,
          },

          partner: {
            id: session.partner?.id,
            name: session.partner?.full_name || "Desconhecido",
            hub: session.partner?.hub || "N/A",
            countryCode: session.partner?.country || "",
            photoUrl: session.partner?.photo_url || null,
          },
        };
      });

      setPublicSessions(formatted);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar feed de sessões públicas:", err);

      setError(err.message);
      setPublicSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchPublicSessions();
    };

    init();
  }, []);

  return {
    publicSessions,
    loading,
    error,
    refetch: fetchPublicSessions,
  };
};
