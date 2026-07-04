-- Restringe UPDATE em 'profiles' por RLS + GRANT de coluna, e move a aprovação
-- de usuário para uma function SECURITY DEFINER.
--
-- Contexto: a policy "Permitir atualizacao de status" dava
-- `USING (true) WITH CHECK (true)` para o role authenticated, ou seja,
-- qualquer usuário autenticado podia, em tese, atualizar qualquer coluna de
-- qualquer linha de 'profiles' via chamada direta à API — incluindo
-- is_admin/is_approved na própria linha (escalonamento de privilégio) ou nas
-- de terceiros. A policy "Users can update own profile" (auth.uid() = id)
-- já resolve "quem pode mexer em qual linha", mas sozinha não impede que o
-- dono da linha altere is_admin/is_approved nela mesma. Este script fecha
-- essa lacuna com uma segunda camada: GRANT de UPDATE só nas colunas de
-- perfil "normais" para o role authenticated. is_approved passa a só ser
-- alterável via function SECURITY DEFINER com checagem de admin embutida.

-- Execute este script no SQL Editor do Supabase (ou via `supabase db push`)
-- somente depois de revisado.


-- =========================================================
-- PASSO 1: Remover a policy permissiva de UPDATE
-- =========================================================

DROP POLICY IF EXISTS "Permitir atualizacao de status" ON public.profiles;

-- A policy "Users can update own profile" (auth.uid() = id) permanece como
-- está — ela continua sendo a única policy de RLS cobrindo UPDATE em
-- 'profiles'. A partir daqui, o controle de "quais colunas" fica a cargo do
-- GRANT abaixo, não da RLS.


-- =========================================================
-- PASSO 2: Restringir UPDATE a nível de coluna para 'authenticated'
-- =========================================================

-- Remove o privilégio de UPDATE em todas as colunas da tabela para
-- authenticated (o REVOKE de tabela cancela o GRANT de tabela concedido por
-- padrão pelo Supabase em todas as tabelas do schema public).
REVOKE UPDATE ON public.profiles FROM authenticated;

-- Concede UPDATE apenas nas colunas de perfil que o próprio usuário deve
-- poder editar. Note que 'hub', 'is_admin', 'is_approved', 'id',
-- 'created_at' ficam de fora — mesmo que a RLS permita `auth.uid() = id`,
-- o Postgres agora rejeita qualquer UPDATE que inclua essas colunas no SET,
-- não importa o valor.
GRANT UPDATE (
  full_name,
  country,
  description,
  speaks,
  learns,
  interests,
  photo_url,
  updated_at
) ON public.profiles TO authenticated;


-- =========================================================
-- PASSO 3: Function de aprovação (SECURITY DEFINER)
-- =========================================================

CREATE OR REPLACE FUNCTION public.approve_profile(target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Apenas admins podem aprovar usuários';
  END IF;

  UPDATE public.profiles
  SET is_approved = true
  WHERE id = target_id;
END;
$$;

-- Bloqueia execução por qualquer role e libera só para authenticated.
-- (SECURITY DEFINER roda com os privilégios do dono da function, então ela
-- não é afetada pelo REVOKE/GRANT de coluna do Passo 2 nem barrada pela RLS
-- de 'profiles' — a checagem de admin dentro da function é o único portão.)
REVOKE ALL ON FUNCTION public.approve_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_profile(uuid) TO authenticated;


-- =========================================================
-- PASSO 4 (opcional) — Validação manual pós-deploy
-- =========================================================
-- 1. Como usuário comum autenticado, tentar:
--      UPDATE profiles SET is_admin = true WHERE id = auth.uid();
--    Deve falhar com "permission denied for table profiles" (coluna
--    is_admin não está no GRANT).
-- 2. Como usuário comum, chamar select approve_profile('<algum-uuid>')
--    Deve falhar com "Apenas admins podem aprovar usuários".
-- 3. Como admin (is_admin = true), chamar select approve_profile('<uuid>')
--    de um usuário pendente. Deve retornar sucesso e is_approved virar true.
