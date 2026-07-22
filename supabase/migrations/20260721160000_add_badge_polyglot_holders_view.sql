-- Migração: view de suporte ao badge "Poliglota"
--
-- Contexto: badge Poliglota reavaliado pra contar IDIOMAS DISTINTOS
-- PRATICADOS EM SESSÕES PÚBLICAS do próprio usuário (mesma fonte/critério
-- do badge Photo Memory: só sessões onde a pessoa é 'user_id' — quem
-- registrou —, não 'partner_id'), em vez de profiles.speaks/learns.
--
-- 'sessions.languages' é uma única coluna TEXT com CODES separados por
-- ", " (vírgula+espaço — ver AddSessionModal.jsx/useAddSession.js), não
-- nomes como profiles.speaks/learns. 'trim()' remove o espaço que sobra
-- nos pedaços depois do primeiro ao separar só por ",".
--
-- Sem SECURITY DEFINER: só lê linhas com status = 'publica', já públicas
-- pela policy de SELECT existente em 'sessions' (ver
-- SESSIONS_PUBLIC_VISIBILITY.sql).
--
-- Diferente de badge_photo_memory_holders (binário, só lista quem tem):
-- Poliglota tem níveis, então a view devolve a CONTAGEM de idiomas
-- distintos por pessoa — o nível (threshold) continua calculado em JS
-- (badgeService.js), não aqui.
CREATE OR REPLACE VIEW public.badge_polyglot_holders AS
  SELECT
    user_id,
    COUNT(DISTINCT trim(lang)) AS distinct_language_count
  FROM public.sessions,
       LATERAL unnest(string_to_array(languages, ',')) AS lang
  WHERE status = 'publica'
    AND languages IS NOT NULL
    AND languages <> ''
  GROUP BY user_id;
