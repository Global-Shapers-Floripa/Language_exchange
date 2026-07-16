let cachedUser = null;
let cachedProfile = null;

export const getCachedUser = () => ({
  user: cachedUser,
  profile: cachedProfile,
});

export const setCachedUser = (user, profile) => {
  cachedUser = user;
  cachedProfile = profile;
};

// Cache com expiração (diferente do de cima): parceiros e sessões públicas
// mudam por ação de OUTRAS pessoas (alguém se cadastra, alguém torna uma
// sessão pública) — o client de quem está navegando não tem como saber
// disso, então um cache write-through (sem expirar) mostraria dado
// desatualizado indefinidamente. TTL de 5min é suficiente pra eliminar
// refetch ao só navegar pra fora e voltar (o caso comum), sem deixar
// novidade sumir por muito tempo.
const LIST_CACHE_TTL = 5 * 60 * 1000;

let cachedPartners = null;
let partnersFetchedAt = 0;

export const getCachedPartners = () => {
  if (!cachedPartners || Date.now() - partnersFetchedAt > LIST_CACHE_TTL) {
    return null;
  }
  return cachedPartners;
};

export const setCachedPartners = (partners) => {
  cachedPartners = partners;
  partnersFetchedAt = Date.now();
};

let cachedPublicSessions = null;
let publicSessionsFetchedAt = 0;

export const getCachedPublicSessions = () => {
  if (!cachedPublicSessions || Date.now() - publicSessionsFetchedAt > LIST_CACHE_TTL) {
    return null;
  }
  return cachedPublicSessions;
};

export const setCachedPublicSessions = (sessions) => {
  cachedPublicSessions = sessions;
  publicSessionsFetchedAt = Date.now();
};

// Chamado no logout: a grade de parceiros guarda o match já calculado, que
// depende de quem está logado (speaks/learns do usuário atual) — como o
// cache é uma variável de módulo compartilhada, sem isso a segunda conta que
// logar na mesma aba dentro dos 5min poderia herdar match calculado pro
// perfil da conta anterior.
export const clearListCaches = () => {
  cachedPartners = null;
  partnersFetchedAt = 0;
  cachedPublicSessions = null;
  publicSessionsFetchedAt = 0;
};