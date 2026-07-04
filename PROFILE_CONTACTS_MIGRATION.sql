-- Migração: separar email/telefone de 'profiles' para uma tabela protegida
-- Execute este script no SQL Editor do Supabase (https://app.supabase.com)
--
-- Contexto: 'profiles' tem uma policy de SELECT liberada para leitura geral
-- (necessária para nome/foto/idiomas/hub aparecerem na busca de parceiros),
-- mas isso também expõe email e telefone de qualquer usuário via API direta,
-- sem passar pela regra de "só depois de conexão aceita" que hoje só existe
-- na UI. Este script cria uma tabela separada com RLS de verdade para esses
-- dois campos.
--
-- IMPORTANTE: este script cobre só os Passos 1-3 (criar tabela, políticas,
-- migrar dados, validar). Ele NÃO remove as colunas email/phone de
-- 'profiles' — isso é o Passo 5, que só deve rodar depois que o código novo
-- estiver validado em produção. Enquanto isso não acontecer, as colunas
-- antigas continuam existindo em 'profiles' como rede de segurança (não são
-- mais lidas pelo código, mas também não atrapalham nada permanecendo lá).


-- =========================================================
-- PASSO 1: Criar tabela + RLS + policies
-- =========================================================

CREATE TABLE IF NOT EXISTS public.profile_contacts (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativa RLS imediatamente (deny-all até as policies abaixo existirem)
ALTER TABLE public.profile_contacts ENABLE ROW LEVEL SECURITY;

-- Dono sempre pode ver/criar/editar o próprio contato (necessário pro EditProfile)
DROP POLICY IF EXISTS "Usuario ve seu proprio contato" ON public.profile_contacts;
CREATE POLICY "Usuario ve seu proprio contato"
ON public.profile_contacts FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuario insere seu proprio contato" ON public.profile_contacts;
CREATE POLICY "Usuario insere seu proprio contato"
ON public.profile_contacts FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuario atualiza seu proprio contato" ON public.profile_contacts;
CREATE POLICY "Usuario atualiza seu proprio contato"
ON public.profile_contacts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Regra principal: ver contato de quem tem conexão aceita, nas duas direções
DROP POLICY IF EXISTS "Conexao aceita libera contato" ON public.profile_contacts;
CREATE POLICY "Conexao aceita libera contato"
ON public.profile_contacts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.connection_requests cr
    WHERE cr.status = 'aceito'
      AND (
        (cr.sender_id = auth.uid() AND cr.receiver_id = profile_contacts.user_id)
        OR
        (cr.receiver_id = auth.uid() AND cr.sender_id = profile_contacts.user_id)
      )
  )
);

-- Admin enxerga o contato de qualquer usuário (necessário pro painel /admin)
DROP POLICY IF EXISTS "Admin ve todos os contatos" ON public.profile_contacts;
CREATE POLICY "Admin ve todos os contatos"
ON public.profile_contacts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  )
);


-- =========================================================
-- PASSO 2: Migrar os dados existentes (idempotente)
-- =========================================================

INSERT INTO public.profile_contacts (user_id, email, phone)
SELECT id, email, phone FROM public.profiles
ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email,
      phone = EXCLUDED.phone;


-- =========================================================
-- PASSO 3: Validação — rode as duas queries abaixo e confira o resultado
-- =========================================================

-- A contagem das duas tabelas deve bater
SELECT
  (SELECT count(*) FROM public.profiles) AS total_profiles,
  (SELECT count(*) FROM public.profile_contacts) AS total_contacts;

-- Não pode haver nenhuma linha aqui (email perdido na migração)
SELECT p.id, p.full_name, p.email
FROM public.profiles p
LEFT JOIN public.profile_contacts pc ON pc.user_id = p.id
WHERE pc.user_id IS NULL AND p.email IS NOT NULL;


-- =========================================================
-- PASSO 5 — Liberado para execução
-- =========================================================
-- Sweep de código concluído (2026-07-04): nenhuma leitura de .email/.phone
-- restante aponta para 'profiles' — todas já vêm de 'profile_contacts'.
-- Teste manual em produção confirmado (cadastro, edição de perfil, aprovação
-- pelo admin, solicitação de conexão, liberação de contato após aceite).
-- Rode os dois comandos abaixo no SQL Editor do Supabase quando estiver pronto.

ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;
