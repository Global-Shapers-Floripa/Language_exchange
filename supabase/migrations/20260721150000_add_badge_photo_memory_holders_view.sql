-- Migração: view de suporte ao badge "Photo Memory"
--
-- Contexto: sistema de insígnias (badges) calculadas em cima do estado
-- atual do banco — sem tabela de "conquista permanente", sem timestamp de
-- quando foi ganho. Se a condição deixar de ser verdade, o badge some. Esta
-- view cobre o badge "Photo Memory": usuário tem pelo menos uma sessão
-- própria (user_id, não parceiro) com status='publica' e session_photo_url
-- preenchido.
--
-- Sem SECURITY DEFINER: só lê linhas com status = 'publica', que já são
-- públicas pela policy de SELECT existente em 'sessions' (ver
-- SESSIONS_PUBLIC_VISIBILITY.sql) — qualquer usuário aprovado já pode ler
-- isso hoje, a view só agrega/filtra.
--
-- Convenção de nome pra badges futuros que também precisarem de view
-- própria: badge_<id>_holders.
CREATE OR REPLACE VIEW public.badge_photo_memory_holders AS
  SELECT DISTINCT user_id
  FROM public.sessions
  WHERE status = 'publica'
    AND session_photo_url IS NOT NULL
    AND session_photo_url <> '';
