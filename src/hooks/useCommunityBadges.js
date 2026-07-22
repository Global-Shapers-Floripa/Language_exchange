import { useState, useEffect } from "react";

import { supabase } from "../services/supabaseClient";
import {
  getPolyglotCounts,
  evaluatePolyglot,
  evaluatePhotoMemory,
  getPhotoMemoryHolders,
  getSessionsCounts,
  evaluateSessionsCount,
  getHoursPracticed,
  evaluateHoursPracticed,
  getPartnerStats,
  evaluateLoyalPartner,
  evaluateIcebreaker,
} from "../services/badgeService";

// Quantas medalhas mostrar de início / a cada "carregar mais". A lista
// inteira já vem pro cliente numa única leva (ver fetchBadges abaixo) —
// comunidade pequena o suficiente pra não precisar de paginação de servidor
// — então "carregar mais" só revela mais itens do array já em memória.
const PAGE_SIZE = 12;

// Mural de conquistas da Comunidade: uma entrada por combinação (pessoa,
// badge conquistado) — se 8 pessoas têm Photo Memory, são 8 entradas, uma
// por pessoa, não uma seção agrupada. Só usa dado PÚBLICO (profiles
// aprovados + as views de badges), nunca sessão privada.
export const useCommunityBadges = () => {
  const [allAchievements, setAllAchievements] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBadges = async () => {
    try {
      setLoading(true);

      // Contas de teste E2E (hub "E2E-TEST", ver E2E_TEST_DATA_SETUP.sql) não
      // devem aparecer no mural público da comunidade.
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, photo_url")
        .eq("is_approved", true)
        .neq("hub", "E2E-TEST");

      if (profilesError) throw profilesError;

      const profileIds = (profiles || []).map((p) => p.id);
      const [
        polyglotCounts,
        photoMemoryHolders,
        sessionsCounts,
        hoursPracticed,
        partnerStats,
      ] = await Promise.all([
        getPolyglotCounts(profileIds),
        getPhotoMemoryHolders(profileIds),
        getSessionsCounts(profileIds),
        getHoursPracticed(profileIds),
        getPartnerStats(profileIds),
      ]);

      // Uma entrada por badge — cada um resolvido a partir do Map/Set já
      // buscado acima (nenhuma query por pessoa/por badge, ver
      // badgeService.js). Lista declarativa em vez de repetir o mesmo
      // "avalia + empilha se achieved" 6 vezes; badges futuros só somam
      // mais uma linha aqui.
      const badgeEvaluators = [
        { badgeId: "polyglot", evaluate: (id) => evaluatePolyglot(id, polyglotCounts) },
        { badgeId: "photoMemory", evaluate: (id) => evaluatePhotoMemory(id, photoMemoryHolders) },
        { badgeId: "sessionsCount", evaluate: (id) => evaluateSessionsCount(id, sessionsCounts) },
        { badgeId: "hoursPracticed", evaluate: (id) => evaluateHoursPracticed(id, hoursPracticed) },
        { badgeId: "loyalPartner", evaluate: (id) => evaluateLoyalPartner(id, partnerStats) },
        { badgeId: "icebreaker", evaluate: (id) => evaluateIcebreaker(id, partnerStats) },
      ];

      const achievements = [];

      (profiles || []).forEach((profile) => {
        badgeEvaluators.forEach(({ badgeId, evaluate }) => {
          const result = evaluate(profile.id);
          if (result.achieved) {
            achievements.push({
              profileId: profile.id,
              name: profile.full_name,
              photoUrl: profile.photo_url,
              badgeId,
              level: result.level,
            });
          }
        });
      });

      // Embaralhada, sem critério fixo (ver decisão de produto) — Fisher-Yates.
      for (let i = achievements.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [achievements[i], achievements[j]] = [achievements[j], achievements[i]];
      }

      setAllAchievements(achievements);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar mural de conquistas:", err);

      setError(err.message);
      setAllAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchBadges();
    };

    init();
  }, []);

  const loadMore = () => setVisibleCount((prev) => prev + PAGE_SIZE);

  return {
    achievements: allAchievements.slice(0, visibleCount),
    hasMore: visibleCount < allAchievements.length,
    loading,
    error,
    loadMore,
  };
};
