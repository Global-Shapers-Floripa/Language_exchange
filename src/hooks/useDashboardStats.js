import { useState, useEffect } from "react";

import { supabase } from "../services/supabaseClient";

// =========================
// FORMATAR TEMPO PRATICADO
// =========================
const formatPracticedTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}:${String(minutes).padStart(2, "0")}m`;
};

export const useDashboardStats = () => {
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [practicedTimeLabel, setPracticedTimeLabel] = useState("0:00m");
  const [countries, setCountries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
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
        // CONEXÕES ACEITAS (enviadas + recebidas)
        // =========================
        const { data: sentAccepted, error: sentError } = await supabase
          .from("connection_requests")
          .select("id")
          .eq("sender_id", user.id)
          .eq("status", "aceito");

        if (sentError) throw sentError;

        const { data: receivedAccepted, error: receivedError } = await supabase
          .from("connection_requests")
          .select("id")
          .eq("receiver_id", user.id)
          .eq("status", "aceito");

        if (receivedError) throw receivedError;

        // =========================
        // SESSÕES E PAÍSES DOS PARCEIROS
        // =========================
        const { data: sessions, error: sessionsError } = await supabase
          .from("sessions")
          .select("duration, profiles!partner_id(country)")
          .eq("user_id", user.id);

        if (sessionsError) throw sessionsError;

        const totalMinutes = (sessions || []).reduce(
          (sum, session) => sum + (session.duration || 0),
          0,
        );

        const distinctCountries = [
          ...new Set(
            (sessions || [])
              .map((session) => session.profiles?.country)
              .filter(Boolean),
          ),
        ];

        setConnectionsCount(
          (sentAccepted?.length || 0) + (receivedAccepted?.length || 0),
        );
        setSessionsCount(sessions?.length || 0);
        setPracticedTimeLabel(formatPracticedTime(totalMinutes));
        setCountries(distinctCountries);

        setError(null);
      } catch (err) {
        console.error("Erro ao buscar estatísticas do dashboard:", err);

        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return {
    connectionsCount,
    sessionsCount,
    practicedTimeLabel,
    countries,
    loading,
    error,
  };
};
