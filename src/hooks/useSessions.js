import { useState, useEffect } from "react";

import { supabase } from "../services/supabaseClient";

import { LANGUAGES } from "../constants/languages";

export const useSessions = () => {
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
      const { data, error: fetchError } = await supabase
        .from("sessions")
        .select(
          `
            id,
            partner_id,
            date,
            duration,
            languages,
            session_photo_url,
            profiles!partner_id (
              full_name,
              hub
            )
          `,
        )
        .eq("user_id", user.id)
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

      // =========================
      // FORMATAR DADOS
      // =========================
      const formattedSessions = data.map((session) => {
        // converter EN/PT/etc em nome bonito
        const languageNames = session.languages
          ?.split(",")
          .map((lang) => {
            const found = LANGUAGES.find((item) => item.code === lang.trim());

            return found ? found.name : lang;
          })
          .join(", ");

        return {
          id: session.id,

          partner: session.profiles?.full_name || "Desconhecido",

          hub: session.profiles?.hub || "N/A",

          date: new Date(session.date).toLocaleDateString("pt-BR"),

          duration: session.duration,

          languages: languageNames || "N/A",

          session_photo_url: session.session_photo_url,
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

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
  };
};
