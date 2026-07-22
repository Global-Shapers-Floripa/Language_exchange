import { supabase } from "./supabaseClient";
import { getBadgeDefinition } from "../constants/badges";

// Compartilhado por todo badge com níveis (array de thresholds numéricos):
// acha em qual nível o total atual se encaixa, e qual o próximo alvo pra
// exibir progresso quando ainda não conquistou nenhum nível.
const evaluateLevels = (total, levels) => {
  const level = levels.filter((threshold) => total >= threshold).length;

  return {
    achieved: level > 0,
    level,
    progressCurrent: total,
    progressTarget: levels[level] ?? levels[levels.length - 1],
  };
};

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
  return evaluateLevels(countsMap.get(userId) || 0, levels);
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

// =========================
// PRATICANTE (sessionsCount)
// =========================
// Sessões públicas PRÓPRIAS (user_id) — mesmo critério de Poliglota/Photo
// Memory, não conta participação como parceiro.
export const getSessionsCounts = async (userIds) => {
  if (!userIds.length) return new Map();

  const { data, error } = await supabase
    .from("badge_sessions_count_holders")
    .select("user_id, session_count")
    .in("user_id", userIds);

  if (error) throw error;

  return new Map((data || []).map((row) => [row.user_id, row.session_count]));
};

export const evaluateSessionsCount = (userId, countsMap) => {
  const { levels } = getBadgeDefinition("sessionsCount");
  return evaluateLevels(countsMap.get(userId) || 0, levels);
};

// =========================
// DEDICAÇÃO (hoursPracticed)
// =========================
// Soma da duração das sessões públicas PRÓPRIAS (user_id) — mesmo critério
// acima. A view devolve minutos (sessions.duration é em minutos); os
// thresholds em constants/badges.js estão em HORAS, daí a conversão aqui.
export const getHoursPracticed = async (userIds) => {
  if (!userIds.length) return new Map();

  const { data, error } = await supabase
    .from("badge_hours_practiced_holders")
    .select("user_id, total_minutes")
    .in("user_id", userIds);

  if (error) throw error;

  return new Map((data || []).map((row) => [row.user_id, row.total_minutes]));
};

export const evaluateHoursPracticed = (userId, minutesMap) => {
  const { levels } = getBadgeDefinition("hoursPracticed");
  const totalHours = Math.floor((minutesMap.get(userId) || 0) / 60);
  return evaluateLevels(totalHours, levels);
};

// =========================
// PARCEIRO FIEL (loyalPartner) + QUEBRA-GELO (icebreaker)
// =========================
// Os dois dependem da mesma agregação por "par de pessoas" (ver
// badge_partner_stats) — sessões públicas contando a pessoa como DONO OU
// PARCEIRO, diferente dos badges acima. Uma única busca alimenta os dois
// evaluate*, em vez de duas queries pra dado que vem da mesma origem.
export const getPartnerStats = async (userIds) => {
  if (!userIds.length) return new Map();

  const { data, error } = await supabase
    .from("badge_partner_stats")
    .select("user_id, max_partner_sessions, distinct_partners_count")
    .in("user_id", userIds);

  if (error) throw error;

  return new Map(
    (data || []).map((row) => [
      row.user_id,
      {
        maxPartnerSessions: row.max_partner_sessions,
        distinctPartnersCount: row.distinct_partners_count,
      },
    ]),
  );
};

// Binário (sem níveis), mas com progresso numérico — diferente de Photo
// Memory, que não tem uma fração fazer sentido.
export const evaluateLoyalPartner = (userId, statsMap) => {
  const { threshold } = getBadgeDefinition("loyalPartner");
  const current = statsMap.get(userId)?.maxPartnerSessions || 0;

  return {
    achieved: current >= threshold,
    level: null,
    progressCurrent: current,
    progressTarget: threshold,
  };
};

export const evaluateIcebreaker = (userId, statsMap) => {
  const { threshold } = getBadgeDefinition("icebreaker");
  const current = statsMap.get(userId)?.distinctPartnersCount || 0;

  return {
    achieved: current >= threshold,
    level: null,
    progressCurrent: current,
    progressTarget: threshold,
  };
};
