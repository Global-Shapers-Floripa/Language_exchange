import { useState, useEffect } from "react";

import { supabase } from "../services/supabaseClient";

export const usePartners = () => {
  const [partners, setPartners] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  useEffect(() => {
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
        const { data: currentUser, error: currentError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (currentError) {
          throw currentError;
        }

        // =========================
        // TODOS OS PERFIS VÁLIDOS
        // =========================
        // Regras:
        // - aprovado
        // - não sou eu mesmo
        // - possui speaks
        // - possui learns
        // =========================
        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("is_approved", true)
          .neq("id", user.id)
          .not("speaks", "is", null)
          .not("learns", "is", null)
          .neq("speaks", "")
          .neq("learns", "");

        if (fetchError) {
          throw fetchError;
        }

        // =========================
        // ARRAYS DO USUÁRIO LOGADO
        // =========================
        const currentSpeaks = currentUser.speaks
          ? currentUser.speaks
              .split(",")
              .map((item) => item.trim().toLowerCase())
              .filter(Boolean)
          : [];

        const currentLearns = currentUser.learns
          ? currentUser.learns
              .split(",")
              .map((item) => item.trim().toLowerCase())
              .filter(Boolean)
          : [];

        // =========================
        // CALCULAR MATCH
        // =========================
        const formattedPartners = data.map((profile) => {
          const speaksArray = profile.speaks
            ? profile.speaks
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [];

          const learnsArray = profile.learns
            ? profile.learns
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [];

          const speaksLower = speaksArray.map((item) => item.toLowerCase());

          const learnsLower = learnsArray.map((item) => item.toLowerCase());

          // =========================
          // MATCHES
          // =========================

          // pessoa fala o que eu quero aprender
          const teachesWhatILearn = speaksLower.filter((lang) =>
            currentLearns.includes(lang),
          );

          // pessoa quer aprender o que eu falo
          const learnsWhatISpeak = learnsLower.filter((lang) =>
            currentSpeaks.includes(lang),
          );

          // =========================
          // SCORE
          // =========================
          let matchScore = 0;

          // MATCH PERFEITO
          if (teachesWhatILearn.length > 0 && learnsWhatISpeak.length > 0) {
            matchScore += 100;
          }

          // fala idioma que quero aprender
          matchScore += teachesWhatILearn.length * 40;

          // quer aprender idioma que falo
          matchScore += learnsWhatISpeak.length * 40;

          // mesmo hub
          if (
            currentUser.hub &&
            profile.hub &&
            currentUser.hub.toLowerCase() === profile.hub.toLowerCase()
          ) {
            matchScore += 10;
          }

          // =========================
          // LABEL DO MATCH
          // =========================
          let compatibility = "Baixa";

          if (matchScore >= 10) {
            compatibility = "Match Perfeito";
          } else if (matchScore >= 6) {
            compatibility = "Alta";
          } else if (matchScore >= 3) {
            compatibility = "Média";
          }

          return {
            id: profile.id,

            full_name: profile.full_name,

            email: profile.email,

            phone: profile.phone,

            description: profile.description,

            hub: profile.hub,

            photo_url: profile.photo_url,

            country: profile.country,

            speaks: profile.speaks,

            learns: profile.learns,

            speaksArray,

            learnsArray,

            matchScore,

            compatibility,

            teachesWhatILearn,

            learnsWhatISpeak,
          };
        });

        // =========================
        // ORDENAR MELHORES MATCHES
        // =========================
        formattedPartners.sort((a, b) => b.matchScore - a.matchScore);

        setPartners(formattedPartners);

        setError(null);
      } catch (err) {
        console.error("Erro ao buscar parceiros:", err);

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
