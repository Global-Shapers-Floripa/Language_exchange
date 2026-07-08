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
// CALCULAR MATCH
// =========================
export const calculateMatch = (
  currentUser,
  profile,
) => {
  const currentSpeaks = normalizeList(
    currentUser.speaks,
  );

  const currentLearns = normalizeList(
    currentUser.learns,
  );

  const profileSpeaks = normalizeList(
    profile.speaks,
  );

  const profileLearns = normalizeList(
    profile.learns,
  );

  const teachesWhatILearn =
    profileSpeaks.filter((lang) =>
      currentLearns.includes(lang),
    );

  const learnsWhatISpeak =
    profileLearns.filter((lang) =>
      currentSpeaks.includes(lang),
    );

  let percentage = 0;

  // fala idioma que quero aprender
  if (teachesWhatILearn.length > 0) {
    percentage += 50;
  }

  // quer aprender idioma que falo
  if (learnsWhatISpeak.length > 0) {
    percentage += 50;
  }

  // mesmo hub
  if (
    currentUser.hub &&
    profile.hub &&
    currentUser.hub.toLowerCase() ===
      profile.hub.toLowerCase()
  ) {
    percentage += 5;
  }

  percentage = Math.min(
    percentage,
    100,
  );

  let compatibility = "Baixa";

  if (percentage >= 95) {
    compatibility = "Match Perfeito";
  } else if (percentage >= 70) {
    compatibility = "Alta";
  } else if (percentage >= 40) {
    compatibility = "Média";
  }

  return {
    matchScore: percentage,
    compatibility,
    teachesWhatILearn,
    learnsWhatISpeak,
  };
};

// =========================
// PEGAR MATCHES
// =========================
export const getMatches = async (
  currentUserId,
) => {
  try {
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

    // Contas de teste E2E (hub "E2E-TEST", ver E2E_TEST_DATA_SETUP.sql) não
    // devem aparecer para usuários reais. Só pulamos esse filtro quando quem
    // está logado é a própria conta de teste E2E.
    let profilesQuery = supabase
      .from("profiles")
      .select("*")
      .eq("is_approved", true)
      .neq("id", currentUserId)
      .not("speaks", "is", null)
      .not("learns", "is", null)
      .neq("speaks", "")
      .neq("learns", "");

    if (currentUser.hub !== "E2E-TEST") {
      profilesQuery = profilesQuery.neq("hub", "E2E-TEST");
    }

    const {
      data: profiles,
      error: profilesError,
    } = await profilesQuery;

    if (profilesError) {
      throw profilesError;
    }

    const matches = profiles.map(
      (profile) => {
        const match =
          calculateMatch(
            currentUser,
            profile,
          );

        return {
          ...profile,

          speaksArray: profile.speaks
            ? profile.speaks
                .split(",")
                .map((item) =>
                  item.trim(),
                )
            : [],

          learnsArray: profile.learns
            ? profile.learns
                .split(",")
                .map((item) =>
                  item.trim(),
                )
            : [],

          ...match,
        };
      },
    );

    matches.sort(
      (a, b) =>
        b.matchScore - a.matchScore,
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