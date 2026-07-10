import { useState, useEffect } from "react";

import { supabase } from "../services/supabaseClient";

// =========================
// PROGRESSO POR PAÍS (sessões do usuário agrupadas por país do parceiro)
// =========================
// Fonte única da query sessions -> profiles!partner_id usada tanto pelo
// card de stats do Dashboard (só precisa da lista de países distintos)
// quanto pelo Mapa de Bandeiras (precisa do detalhe: quantas sessões e
// com quem, por país).
export const useCountryProgress = () => {
  const [countries, setCountries] = useState([]); // [{ code, count, people: [{ name, hub }] }]
  const [sessionsCount, setSessionsCount] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCountryProgress = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Usuário não autenticado");
        }

        const { data: sessions, error: sessionsError } = await supabase
          .from("sessions")
          .select("duration, profiles!partner_id(country, hub, full_name)")
          .eq("user_id", user.id);

        if (sessionsError) throw sessionsError;

        // =========================
        // AGRUPAR POR PAÍS
        // =========================
        const grouped = {};
        let minutesSum = 0;

        (sessions || []).forEach((session) => {
          minutesSum += session.duration || 0;

          const partner = session.profiles;
          const code = partner?.country;

          if (!code) return;

          if (!grouped[code]) {
            grouped[code] = { code, count: 0, people: [] };
          }

          grouped[code].count += 1;
          grouped[code].people.push({
            name: partner.full_name || "Parceiro",
            hub: partner.hub || "",
          });
        });

        setCountries(Object.values(grouped));
        setSessionsCount(sessions?.length || 0);
        setTotalMinutes(minutesSum);

        setError(null);
      } catch (err) {
        console.error("Erro ao buscar progresso de países:", err);

        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCountryProgress();
  }, []);

  return {
    countries,
    sessionsCount,
    totalMinutes,
    loading,
    error,
  };
};
