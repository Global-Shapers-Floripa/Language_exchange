import { useState, useEffect } from "react";
import { calculateMatch } from "../services/matchService";
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
        // FORMATAR + CALCULAR MATCH
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

          const match = calculateMatch(
            currentUser,
            profile,
          );

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