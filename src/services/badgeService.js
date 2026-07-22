import { supabase } from "./supabaseClient";
import { getBadgeDefinition } from "../constants/badges";

// =========================
// POLIGLOTA
// =========================
// Idiomas distintos praticados em sessões públicas PRÓPRIAS (user_id, não
// parceiro — mesmo critério de Photo Memory) — não profiles.speaks/learns.
// Precisa da view 'badge_polyglot_holders' (ver migration), que já devolve
// a contagem agregada por pessoa; o nível (threshold) é calculado aqui.
// Recebe o Map já buscado em vez de fazer uma query por pessoa, mesmo motivo
// de getPhotoMemoryHolders (evitar N+1 no perfil próprio e no mural).
export const getPolyglotCounts = async (userIds) => {
  if (!userIds.length) return new Map();

  const { data, error } = await supabase
    .from("badge_polyglot_holders")
    .select("user_id, distinct_language_count")
    .in("user_id", userIds);

  if (error) throw error;

  return new Map(
    (data || []).map((row) => [row.user_id, row.distinct_language_count]),
  );
};

export const evaluatePolyglot = (userId, countsMap) => {
  const { levels } = getBadgeDefinition("polyglot");

  const total = countsMap.get(userId) || 0;
  const level = levels.filter((threshold) => total >= threshold).length;

  return {
    achieved: level > 0,
    level,
    progressCurrent: total,
    progressTarget: levels[level] ?? levels[levels.length - 1],
  };
};

// =========================
// PHOTO MEMORY
// =========================
// Binário, calculado a partir de dado que não está no profile — precisa da
// view 'badge_photo_memory_holders' (ver migration). Recebe o Set já
// buscado em vez de fazer uma query por pessoa, pra evitar N+1 tanto no
// perfil próprio (1 pessoa) quanto no mural da Comunidade (todo mundo).
export const getPhotoMemoryHolders = async (userIds) => {
  if (!userIds.length) return new Set();

  const { data, error } = await supabase
    .from("badge_photo_memory_holders")
    .select("user_id")
    .in("user_id", userIds);

  if (error) throw error;

  return new Set((data || []).map((row) => row.user_id));
};

export const evaluatePhotoMemory = (userId, holdersSet) => ({
  achieved: holdersSet.has(userId),
  level: null,
  progressCurrent: null,
  progressTarget: null,
});
