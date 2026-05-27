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
const calculateMatchScore = (
  currentUser,
  profile
) => {
  let score = 0;

  const currentSpeaks = normalizeList(
    currentUser.speaks
  );

  const currentLearns = normalizeList(
    currentUser.learns
  );

  const profileSpeaks = normalizeList(
    profile.speaks
  );

  const profileLearns = normalizeList(
    profile.learns
  );

  // =========================
  // FALA O QUE EU QUERO APRENDER
  // =========================
  currentLearns.forEach((lang) => {
    if (profileSpeaks.includes(lang)) {
      score += 3;
    }
  });

  // =========================
  // QUER APRENDER O QUE EU FALO
  // =========================
  currentSpeaks.forEach((lang) => {
    if (profileLearns.includes(lang)) {
      score += 3;
    }
  });

  // =========================
  // MATCH PERFEITO
  // =========================
  const speaksWhatILearn =
    currentLearns.some((lang) =>
      profileSpeaks.includes(lang)
    );

  const learnsWhatISpeak =
    currentSpeaks.some((lang) =>
      profileLearns.includes(lang)
    );

  if (
    speaksWhatILearn &&
    learnsWhatISpeak
  ) {
    score += 5;
  }

  // =========================
  // MESMO HUB
  // =========================
  if (
    currentUser.hub &&
    profile.hub &&
    currentUser.hub.toLowerCase() ===
      profile.hub.toLowerCase()
  ) {
    score += 1;
  }

  return score;
};

// =========================
// PEGAR MATCHES
// =========================
export const getMatches = async (
  currentUserId
) => {
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
      .neq("id", currentUserId);

    if (profilesError) {
      throw profilesError;
    }

    // =========================
    // CALCULAR MATCHES
    // =========================
    const matches = profiles.map(
      (profile) => {
        const score = calculateMatchScore(
          currentUser,
          profile
        );

        return {
          ...profile,
          matchScore: score,
        };
      }
    );

    // =========================
    // ORDENAR
    // =========================
    matches.sort(
      (a, b) => b.matchScore - a.matchScore
    );

    return matches;
  } catch (error) {
    console.error(
      "Erro ao buscar matches:",
      error
    );

    return [];
  }
};