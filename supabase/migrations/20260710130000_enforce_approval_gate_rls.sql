-- Fecha a brecha de usuários não aprovados lendo perfis de terceiros e
-- enviando pedidos de conexão, via RLS (camada de banco).
--
-- Contexto: nem o código do site nem o RLS existente checavam is_approved
-- fora da tela de Login.jsx. A policy de SELECT em 'profiles' ("Enable read
-- access for all users") era `USING (true)` — leitura irrestrita — e a
-- policy de INSERT em 'connection_requests' ("Permitir envio de solicitação
-- pelo remetente") só exigia `auth.uid() = sender_id`, sem checar aprovação
-- de nenhum dos dois lados. Um usuário com is_approved = false conseguia
-- assim enxergar a grade de parceiros e mandar pedido de conexão para
-- usuários aprovados.
--
-- Execute este script no SQL Editor do Supabase (ou via `supabase db push`)
-- somente depois de revisado.


-- =========================================================
-- PASSO 1: Function auxiliar para checar admin sem recursão de RLS
-- =========================================================
-- A nova policy de SELECT em 'profiles' precisa saber se quem está lendo é
-- admin. Uma subquery direta em 'profiles' dentro da própria policy de
-- 'profiles' arrisca recursão de RLS. Por isso, assim como 'approve_profile'
-- já faz para UPDATE, usamos uma function SECURITY DEFINER: ela roda com os
-- privilégios do dono da function, então a subquery interna não é afetada
-- pela RLS de 'profiles' (mesmo raciocínio do Passo 3 da migration
-- 20260704120000_restrict_profiles_update_permissions.sql).

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND is_admin = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- =========================================================
-- PASSO 2: Restringir SELECT em 'profiles'
-- =========================================================
-- Antes: "Enable read access for all users" com USING (true) — qualquer
-- authenticated (ou anon, dependendo de como a policy foi criada) lia
-- qualquer perfil, aprovado ou não.
--
-- Depois: só enxerga um perfil quem é o próprio dono, quem é admin, ou
-- quando o perfil já está aprovado. Perfis pendentes ficam invisíveis para
-- qualquer pessoa que não seja o dono ou um admin — inclusive para a grade
-- de parceiros (usePartners.js já filtra is_approved = true no client, mas
-- agora o banco também barra, então não depende só do filtro client-side).

DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

CREATE POLICY "Leitura de perfis proprios aprovados ou por admin"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id
  OR is_approved = true
  OR public.is_admin()
);


-- =========================================================
-- PASSO 3: Restringir INSERT em 'connection_requests'
-- =========================================================
-- Antes: "Permitir envio de solicitação pelo remetente" só exigia
-- auth.uid() = sender_id — bastava ter uma sessão válida, aprovada ou não,
-- para inserir um pedido de conexão para qualquer receiver_id.
--
-- Depois: além do sender ser quem diz ser, tanto o sender quanto o receiver
-- precisam ter is_approved = true em 'profiles'. As subqueries abaixo rodam
-- como o usuário autenticado (não são SECURITY DEFINER), mas isso é seguro
-- porque a nova policy de SELECT do Passo 2 já libera leitura de: a própria
-- linha (sender lendo a si mesmo) e qualquer linha com is_approved = true
-- (checagem do receiver) — não há dependência de nenhuma policy antiga.

DROP POLICY IF EXISTS "Permitir envio de solicitação pelo remetente" ON public.connection_requests;

CREATE POLICY "Permitir envio de solicitacao por remetente e destinatario aprovados"
ON public.connection_requests FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = sender_id
      AND is_approved = true
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = receiver_id
      AND is_approved = true
  )
);


-- =========================================================
-- PASSO 4 (opcional) — Validação manual pós-deploy
-- =========================================================
-- 1. Criar/usar um usuário de teste com is_approved = false. Autenticado
--    como ele, tentar:
--      SELECT * FROM profiles WHERE id <> auth.uid();
--    Só deve retornar perfis com is_approved = true (nenhum pendente,
--    inclusive o dele mesmo não deve ver outros pendentes).
-- 2. Ainda como esse usuário não aprovado, tentar:
--      INSERT INTO connection_requests (sender_id, receiver_id, status)
--      VALUES (auth.uid(), '<id de um perfil aprovado>', 'pendente');
--    Deve falhar com "new row violates row-level security policy".
-- 3. Como um usuário aprovado (is_approved = true), repetir o INSERT acima
--    para outro usuário também aprovado — deve funcionar normalmente.
-- 4. Como admin (is_admin = true), confirmar que ainda consegue:
--      SELECT * FROM profiles WHERE is_approved = false;
--    (necessário para a tela /admin listar pendentes de aprovação).
