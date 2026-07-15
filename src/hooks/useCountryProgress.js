import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { supabase } from "../services/supabaseClient";

// =========================
// PROGRESSO POR PAÍS (sessões do usuário agrupadas por país do parceiro)
// =========================
// Fonte única da query sessions -> profiles!partner_id usada tanto pelo
// card de stats do Dashboard (só precisa da lista de países distintos)
// quanto pelo Mapa de Bandeiras (precisa do detalhe: quantas sessões e
// com quem, por país).
export const useCountryProgress = () => {
  const { t } = useTranslation("dashboard");
  const [countries, setCountries] = useState([]); // [{ code, count, people: [{ name, hub, sessionCount }] }]
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
          .select("partner_id, duration, profiles!partner_id(country, hub, full_name)")
          .eq("user_id", user.id);

        if (sessionsError) throw sessionsError;

        // =========================
        // AGRUPAR POR PAÍS
        // =========================
        // 'people' é deduplicado por parceiro (partner_id), não por sessão —
        // várias sessões com a mesma pessoa contam para 'sessionCount' dela,
        // em vez de repetir o nome na lista. 'count' do país continua por
        // sessão (total de sessões praticadas naquele país), sem mudança.
        const grouped = {};
        let minutesSum = 0;

        (sessions || []).forEach((session) => {
          minutesSum += session.duration || 0;

          const partner = session.profiles;
          const code = partner?.country;

          if (!code) return;

          if (!grouped[code]) {
            grouped[code] = { code, count: 0, peopleByPartnerId: new Map() };
          }

          grouped[code].count += 1;

          const existingPerson = grouped[code].peopleByPartnerId.get(session.partner_id);
          if (existingPerson) {
            existingPerson.sessionCount += 1;
          } else {
            grouped[code].peopleByPartnerId.set(session.partner_id, {
              name: partner.full_name || t("partnerFallbackName"),
              hub: partner.hub || "",
              sessionCount: 1,
            });
          }
        });

        const countryProgress = Object.values(grouped).map(({ code, count, peopleByPartnerId }) => ({
          code,
          count,
          people: Array.from(peopleByPartnerId.values()),
        }));

        setCountries(countryProgress);
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
  }, [t]);

  return {
    countries,
    sessionsCount,
    totalMinutes,
    loading,
    error,
  };
};
