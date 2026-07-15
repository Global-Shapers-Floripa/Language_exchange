-- Documentação do que já foi aplicado manualmente no banco para a feature
-- de "sessões públicas com aprovação do parceiro". Execute este script no
-- SQL Editor do Supabase (https://app.supabase.com) apenas se estiver
-- recriando o ambiente do zero — em produção ele já foi aplicado e este
-- arquivo serve só de registro/captura, no mesmo espírito de
-- CONNECTION_REQUESTS_POLICIES.sql e PROFILE_CONTACTS_MIGRATION.sql (schema
-- change feito direto no SQL Editor, sem migration tracked).
--
-- Contexto: 'sessions' tinha uma coluna 'status' (default 'pendente') criada
-- em DATABASE_SETUP.sql que nunca foi lida por nenhum código — ela foi
-- reaproveitada para representar visibilidade da sessão, com um significado
-- novo: 'privada' (só o dono e o parceiro veem) | 'pendente_aprovacao'
-- (dono pediu pra tornar pública, aguardando decisão do parceiro) |
-- 'publica' (aparece no feed da Comunidade para qualquer usuário logado).
--
-- NOTA: as policies de INSERT/UPDATE/DELETE de DATABASE_SETUP.sql (dono
-- pode criar/atualizar/deletar a própria sessão) e a policy de admin
-- "Admin ve todas as sessoes" (dá SELECT irrestrito pra quem tem
-- profiles.is_admin = true — usada pelo painel /admin) já existiam e
-- continuam em vigor; não são recriadas aqui.


-- =========================================================
-- PASSO 1: Coluna 'status' já existente reaproveitada como visibilidade
-- =========================================================
-- Coluna já existe desde DATABASE_SETUP.sql (TEXT, default 'pendente').
-- Ajusta o default para o novo vocabulário — não força reescrita de linhas
-- antigas, então sessões já existentes continuam com o valor antigo
-- ('pendente') até serem tocadas; o código atual só compara com
-- 'privada'/'pendente_aprovacao'/'publica', então uma linha ainda em
-- 'pendente' se comporta como não-pública (mesmo efeito prático de
-- 'privada', só que sem cair em nenhum dos três badges da UI).

ALTER TABLE public.sessions
  ALTER COLUMN status SET DEFAULT 'privada';


-- =========================================================
-- PASSO 2: Policy de SELECT — dono, parceiro ou pública
-- =========================================================
-- Substitui a policy original "Usuários podem ver suas próprias sessões"
-- (só auth.uid() = user_id), que não deixava nem o parceiro nem o público
-- em geral enxergar a sessão nos novos estados 'pendente_aprovacao'/
-- 'publica'.

DROP POLICY IF EXISTS "Usuários podem ver suas próprias sessões" ON public.sessions;
DROP POLICY IF EXISTS "Ver sessoes proprias, como parceiro, ou publicas" ON public.sessions;

CREATE POLICY "Ver sessoes proprias, como parceiro, ou publicas"
ON public.sessions FOR SELECT
USING (
  auth.uid() = user_id
  OR auth.uid() = partner_id
  OR status = 'publica'
);


-- =========================================================
-- PASSO 3: RPC approve_public_session — decisão do parceiro
-- =========================================================
-- O parceiro não tem (e não deve ter) UPDATE direto liberado por RLS na
-- linha inteira de 'sessions' — isso abriria todas as colunas (notes, date,
-- duration etc.) pra edição por quem não é o dono. Em vez disso, a decisão
-- passa por uma function SECURITY DEFINER que só mexe em 'status', e só
-- quando quem chama é de fato o partner_id da sessão e ela está
-- 'pendente_aprovacao' — mesmo padrão de 'approve_profile' já usado no
-- fluxo de aprovação de usuários pelo Admin.
--
-- Recusar (p_decision = 'privada') não dispara e-mail nenhum pro dono —
-- isso é responsabilidade do código client-side (usePendingApprovals.js),
-- não desta function.

CREATE OR REPLACE FUNCTION public.approve_public_session(
  p_session_id UUID,
  p_decision TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_decision NOT IN ('publica', 'privada') THEN
    RAISE EXCEPTION 'Decisão inválida';
  END IF;

  UPDATE public.sessions
  SET status = p_decision
  WHERE id = p_session_id
    AND partner_id = auth.uid()
    AND status = 'pendente_aprovacao';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sessão não encontrada ou você não tem permissão para decidir sobre ela';
  END IF;
END;
$$;


-- =========================================================
-- PASSO 4: Validação — rode as queries abaixo e confira o resultado
-- =========================================================

-- Deve listar as 5 policies de 'sessions': a de admin, INSERT, UPDATE,
-- DELETE (essas 4 inalteradas desde DATABASE_SETUP.sql) e a nova de SELECT
-- deste arquivo.
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'sessions'
ORDER BY cmd, policyname;

-- Deve retornar 'privada' como default da coluna.
SELECT column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'status';

-- Deve retornar 1 linha (confirma que a function existe).
SELECT proname
FROM pg_proc
WHERE proname = 'approve_public_session';
