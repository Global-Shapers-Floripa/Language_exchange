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

        if (!user) return;

        // =========================
        // PERFIL DO USUÁRIO ATUAL
        // =========================
        const { data: currentUser, error: currentError } =
          await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (currentError) {
          throw currentError;
        }

        // =========================
        // TODOS OS PERFIS
        // =========================
        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("is_approved", true)
          .neq("id", user.id);

        if (fetchError) {
          throw fetchError;
        }

        // =========================
        // ARRAYS DO USUÁRIO LOGADO
        // =========================
        const currentSpeaks = currentUser.speaks
          ? currentUser.speaks
              .split(",")
              .map((item) =>
                item.trim().toLowerCase()
              )
          : [];

        const currentLearns = currentUser.learns
          ? currentUser.learns
              .split(",")
              .map((item) =>
                item.trim().toLowerCase()
              )
          : [];

        // =========================
        // CALCULAR MATCH
        // =========================
        const formattedPartners = data.map(
          (profile) => {
            const speaksArray = profile.speaks
              ? profile.speaks
                  .split(",")
                  .map((item) => item.trim())
              : [];

            const learnsArray = profile.learns
              ? profile.learns
                  .split(",")
                  .map((item) => item.trim())
              : [];

            const speaksLower =
              speaksArray.map((item) =>
                item.toLowerCase()
              );

            const learnsLower =
              learnsArray.map((item) =>
                item.toLowerCase()
              );

            // =========================
            // MATCHES
            // =========================

            // pessoa fala o que eu quero aprender
            const teachesWhatILearn =
              speaksLower.filter((lang) =>
                currentLearns.includes(lang)
              );

            // pessoa quer aprender o que eu falo
            const learnsWhatISpeak =
              learnsLower.filter((lang) =>
                currentSpeaks.includes(lang)
              );

            // =========================
            // SCORE
            // =========================
            let matchScore = 0;

            // match perfeito
            if (
              teachesWhatILearn.length > 0 &&
              learnsWhatISpeak.length > 0
            ) {
              matchScore += 100;
            }

            // fala idioma que quero aprender
            matchScore +=
              teachesWhatILearn.length * 40;

            // quer aprender idioma que falo
            matchScore +=
              learnsWhatISpeak.length * 40;

            // interesses em comum futuramente
            // +10 etc

            // =========================
            // LABEL DO MATCH
            // =========================
            let compatibility = "Baixa";

            if (matchScore >= 100) {
              compatibility = "Perfeito";
            } else if (matchScore >= 60) {
              compatibility = "Alta";
            } else if (matchScore >= 30) {
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

              speaks: profile.speaks,

              learns: profile.learns,

              speaksArray,

              learnsArray,

              matchScore,

              compatibility,

              teachesWhatILearn,

              learnsWhatISpeak,
            };
          },
        );

        // =========================
        // ORDENAR MELHORES MATCHES
        // =========================
        formattedPartners.sort(
          (a, b) => b.matchScore - a.matchScore,
        );

        setPartners(formattedPartners);

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