import { useState, useEffect } from "react";

import { supabase } from "../services/supabaseClient";
import { useCountryProgress } from "./useCountryProgress";

// =========================
// FORMATAR TEMPO PRATICADO
// =========================
const formatPracticedTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}:${String(minutes).padStart(2, "0")}h`;
};

export const useDashboardStats = () => {
  const [connectionsCount, setConnectionsCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sessões/duração/países vêm do hook compartilhado — evita duplicar a
  // mesma query "sessions -> profiles!partner_id" usada pelo Mapa de Bandeiras
  const {
    countries: countryProgress,
    sessionsCount,
    totalMinutes,
    loading: loadingCountryProgress,
    error: countryProgressError,
  } = useCountryProgress();

  useEffect(() => {
    const fetchConnectionsCount = async () => {
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

        setConnectionsCount(
          (sentAccepted?.length || 0) + (receivedAccepted?.length || 0),
        );

        setError(null);
      } catch (err) {
        console.error("Erro ao buscar estatísticas do dashboard:", err);

        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConnectionsCount();
  }, []);

  return {
    connectionsCount,
    sessionsCount,
    practicedTimeLabel: formatPracticedTime(totalMinutes),
    countries: countryProgress.map((country) => country.code),
    // Detalhe completo (code, count, people) — reaproveitado pela prévia do
    // Mapa de Bandeiras no Dashboard, sem repetir a query de sessions
    countryProgress,
    loading: loading || loadingCountryProgress,
    error: error || countryProgressError,
  };
};
