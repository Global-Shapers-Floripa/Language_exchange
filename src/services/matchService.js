import { supabase } from "./supabaseClient";

// =========================
// NORMALIZAR STRING
// =========================
const normalizeList = (text) => {
  if (!text) return [];

  return text
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

// =========================
// CALCULAR SCORE
// =========================
const calculateMatchScore = (currentUser, profile) => {
  let score = 0;

  const currentSpeaks = normalizeList(currentUser.speaks);

  const currentLearns = normalizeList(currentUser.learns);

  const profileSpeaks = normalizeList(profile.speaks);

  const profileLearns = normalizeList(profile.learns);

  // =========================
  // MATCHES
  // =========================

  // pessoa fala o que eu quero aprender
  const teachesWhatILearn = profileSpeaks.filter((lang) =>
    currentLearns.includes(lang),
  );

  // pessoa quer aprender o que eu falo
  const learnsWhatISpeak = profileLearns.filter((lang) =>
    currentSpeaks.includes(lang),
  );

  // =========================
  // MATCH PERFEITO
  // =========================
  if (
    teachesWhatILearn.length > 0 &&
    learnsWhatISpeak.length > 0
  ) {
    score += 100;
  }

  // =========================
  // SCORE INDIVIDUAL
  // =========================
  score += teachesWhatILearn.length * 40;

  score += learnsWhatISpeak.length * 40;

  // =========================
  // MESMO HUB
  // =========================
  if (
    currentUser.hub &&
    profile.hub &&
    currentUser.hub.toLowerCase() ===
      profile.hub.toLowerCase()
  ) {
    score += 10;
  }

  return score;
};

// =========================
// PEGAR MATCHES
// =========================
export const getMatches = async (currentUserId) => {
  try {
    // =========================
    // USUÁRIO ATUAL
    // =========================
    const {
      data: currentUser,
      error: currentUserError,
    } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUserId)
      .single();

    if (currentUserError) {
      throw currentUserError;
    }

    // =========================
    // OUTROS PERFIS
    // =========================
    const {
      data: profiles,
      error: profilesError,
    } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_approved", true)
      .neq("id", currentUserId)
      .not("speaks", "is", null)
      .not("learns", "is", null)
      .neq("speaks", "")
      .neq("learns", "");

    if (profilesError) {
      throw profilesError;
    }

    // =========================
    // CALCULAR MATCHES
    // =========================
    const matches = profiles.map((profile) => {
      const score = calculateMatchScore(
        currentUser,
        profile,
      );

      // =========================
      // COMPATIBILIDADE
      // =========================
      let compatibility = "Baixa";

      if (score >= 100) {
        compatibility = "Perfeito";
      } else if (score >= 60) {
        compatibility = "Alta";
      } else if (score >= 30) {
        compatibility = "Média";
      }

      return {
        ...profile,

        speaksArray: profile.speaks
          ? profile.speaks
              .split(",")
              .map((item) => item.trim())
          : [],

        learnsArray: profile.learns
          ? profile.learns
              .split(",")
              .map((item) => item.trim())
          : [],

        matchScore: score,

        compatibility,
      };
    });

    // =========================
    // ORDENAR
    // =========================
    matches.sort(
      (a, b) => b.matchScore - a.matchScore,
    );

    return matches;
  } catch (error) {
    console.error(
      "Erro ao buscar matches:",
      error,
    );

    return [];
  }
};