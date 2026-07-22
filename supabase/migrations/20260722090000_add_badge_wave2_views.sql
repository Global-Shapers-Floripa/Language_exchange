-- Migração: views de suporte à Leva 2 de badges (Praticante, Dedicação,
-- Parceiro Fiel, Quebra-Gelo)
--
-- PROPOSTA — NÃO APLICAR sem revisão. Segue o mesmo padrão das views
-- anteriores (badge_photo_memory_holders, badge_polyglot_holders): sem
-- SECURITY DEFINER, só lê linhas com status = 'publica', já públicas pela
-- policy de SELECT existente em 'sessions' (ver SESSIONS_PUBLIC_VISIBILITY.sql).
--
-- 'sessions.duration' é INTEGER em MINUTOS (confirmado em AddSessionModal.jsx
-- e no rótulo do campo, "Duração (minutos)") — a view devolve o total em
-- minutos; a conversão pra horas (Dedicação: 10h/25h/50h) acontece em
-- badgeService.js, não aqui.


-- =========================================================
-- PRATICANTE (sessionsCount) — níveis 1/5/10/25 sessões públicas
-- =========================================================
-- Só sessões que a pessoa REGISTROU (user_id) — mesmo critério de
-- Photo Memory/Poliglota, não conta quando ela foi só parceira.
CREATE OR REPLACE VIEW public.badge_sessions_count_holders AS
  SELECT user_id, COUNT(*)::int AS session_count
  FROM public.sessions
  WHERE status = 'publica'
  GROUP BY user_id;


-- =========================================================
-- DEDICAÇÃO (hoursPracticed) — níveis 10h/25h/50h
-- =========================================================
-- Mesmo critério acima: soma só a duração das sessões que a pessoa
-- REGISTROU (user_id), não as que ela participou como parceira.
CREATE OR REPLACE VIEW public.badge_hours_practiced_holders AS
  SELECT user_id, SUM(duration)::int AS total_minutes
  FROM public.sessions
  WHERE status = 'publica'
  GROUP BY user_id;


-- =========================================================
-- PARCEIRO FIEL (loyalPartner) + QUEBRA-GELO (icebreaker)
-- =========================================================
-- Os dois badges usam o MESMO critério de direção — diferente dos dois
-- acima: contam sessões públicas onde a pessoa apareceu como DONO OU
-- PARCEIRO. Como os dois dependem da mesma agregação por "par de pessoas",
-- ficam numa única view (evita escanear/auto-unir 'sessions' duas vezes
-- pra badges que precisam do mesmo dado base) em vez de seguir o padrão
-- "uma view por badge" à risca.
--
-- 'pairs' contribui duas linhas por sessão pública: a perspectiva do dono
-- (pessoa = user_id, outro = partner_id) e a do parceiro (pessoa =
-- partner_id, outro = user_id) — assim uma sessão registrada por A com B
-- conta tanto pro agrupamento de A quanto pro de B.
CREATE OR REPLACE VIEW public.badge_partner_stats AS
  WITH pairs AS (
    SELECT user_id AS person_id, partner_id AS other_id
    FROM public.sessions
    WHERE status = 'publica'
    UNION ALL
    SELECT partner_id AS person_id, user_id AS other_id
    FROM public.sessions
    WHERE status = 'publica'
  ),
  grouped AS (
    SELECT person_id, other_id, COUNT(*)::int AS pair_count
    FROM pairs
    GROUP BY person_id, other_id
  )
  SELECT
    person_id AS user_id,
    MAX(pair_count) AS max_partner_sessions,
    COUNT(DISTINCT other_id)::int AS distinct_partners_count
  FROM grouped
  GROUP BY person_id;
