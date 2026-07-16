import { useState, useEffect } from "react";
import { calculateMatch } from "../services/matchService";
import { supabase } from "../services/supabaseClient";
import { parseLanguageString } from "../utils/languageLevel";
import { getCachedPartners, setCachedPartners } from "./useCache";

export const usePartners = () => {
  const cachedPartners = getCachedPartners();
  const [partners, setPartners] = useState(cachedPartners || []);
  const [loading, setLoading] = useState(!cachedPartners);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Cache ainda válido (ver useCache.js) — usa os dados já em mãos, sem
    // rebuscar tudo (perfis + fotos) só porque a página remontou.
    if (cachedPartners) {
      return;
    }

    const fetchPartners = async () => {
      try {
        setLoading(true);

        // =========================
        // USUÁRIO LOGADO
        // =========================
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setPartners([]);
          return;
        }

        // =========================
        // PERFIL DO USUÁRIO ATUAL
        // =========================
        // Seleção explícita (sem email/phone — contato não deve trafegar em
        // massa pra montar a grade; só é buscado sob demanda, quando liberado)
        const { data: currentUser, error: currentError } = await supabase
          .from("profiles")
          .select("speaks, learns, hub")
          .eq("id", user.id)
          .single();

        if (currentError) {
          throw currentError;
        }

        // =========================
        // TODOS OS PERFIS VÁLIDOS
        // =========================
        // Contas de teste E2E (hub "E2E-TEST", ver E2E_TEST_DATA_SETUP.sql)
        // não devem aparecer para usuários reais. Só pulamos esse filtro
        // quando quem está logado é a própria conta de teste E2E — senão a
        // suíte automatizada (connections.spec.js) deixaria de encontrar o
        // "E2E Test Partner" na grade.
        let query = supabase
          .from("profiles")
          .select("id, full_name, description, hub, photo_url, country, speaks, learns")
          .eq("is_approved", true)
          .neq("id", user.id)
          .not("speaks", "is", null)
          .not("learns", "is", null)
          .neq("speaks", "")
          .neq("learns", "");

        if (currentUser.hub !== "E2E-TEST") {
          query = query.neq("hub", "E2E-TEST");
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        // =========================
        // FORMATAR + CALCULAR MATCH
        // =========================
        const formattedPartners = data.map((profile) => {
          const speaksArray = parseLanguageString(profile.speaks);

          const learnsArray = parseLanguageString(profile.learns);

          const match = calculateMatch(
            currentUser,
            profile,
          );

          return {
            id: profile.id,

            full_name: profile.full_name,

            description: profile.description,

            hub: profile.hub,

            photo_url: profile.photo_url,

            country: profile.country,

            speaks: profile.speaks,

            learns: profile.learns,

            speaksArray,

            learnsArray,

            ...match,
          };
        });

        // =========================
        // ORDENAR MELHORES MATCHES
        // =========================
        formattedPartners.sort(
          (a, b) => b.matchScore - a.matchScore,
        );

        setPartners(formattedPartners);
        setCachedPartners(formattedPartners);
        setError(null);
      } catch (err) {
        console.error(
          "Erro ao buscar parceiros:",
          err,
        );

        setError(err.message);
        setPartners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  return {
    partners,
    loading,
    error,
  };
};