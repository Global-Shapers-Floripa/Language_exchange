-- Adiciona profiles.last_seen_at, atualizado quando o usuário carrega uma
-- página autenticada. Base para a régua saber "quem sumiu há X dias" —
-- hoje não existe nenhum registro de atividade além de created_at.
--
-- Execute este script no SQL Editor do Supabase (ou via `supabase db push`)
-- somente depois de revisado.
--
-- DECISÃO DE THROTTLE (tomada): opções B + C combinadas — RPC com guard no
-- SQL (função touch_last_seen, arquivo seguinte) chamada só quando um gate
-- no localStorage do navegador indicar que já passou o threshold. O gate no
-- localStorage reduz o número de requisições (não só de escritas); o guard
-- no SQL é defesa em profundidade caso o localStorage seja limpo ou o
-- usuário troque de navegador/dispositivo. A parte de localStorage é código
-- de frontend (DashboardLayout.jsx) de uma fase futura — esta migration só
-- prepara o lado do banco.


-- =========================================================
-- PASSO 1: Adicionar a coluna
-- =========================================================
ALTER TABLE public.profiles
  ADD COLUMN last_seen_at timestamptz;


-- =========================================================
-- PASSO 2: Garantir que last_seen_at não é editável por 'authenticated'
-- =========================================================
-- Mesma lógica do REVOKE em approved_at (ver 20260911100000_...sql, PASSO 4):
-- coluna nova depois do REVOKE de tabela + GRANT de lista específica em
-- 20260704120000 já nasce não-editável via UPDATE direto. Este REVOKE é só
-- documentação explícita, não uma mudança de comportamento real.
--
-- Mantido de propósito, não é só formalidade: last_seen_at vai virar insumo
-- de decisão automatizada (a régua de e-mails comportamentais, e no futuro
-- possivelmente decisões mais sérias, como sinalizar contas pra remoção por
-- inatividade). Coluna que alimenta decisão automática não deve ser
-- gravável por quem é afetado pela decisão — mesmo que "forjar a própria
-- atividade" pareça inofensivo hoje, deixa de ser inofensivo no momento em
-- que passar a decidir algo sobre a conta da própria pessoa. Por isso a
-- escrita só acontece via a function touch_last_seen()
-- (arquivo 20260911100200_add_touch_last_seen_function.sql), nunca via
-- '.update({ last_seen_at: ... })' direto do supabase-js.
REVOKE UPDATE (last_seen_at) ON public.profiles FROM authenticated;


-- =========================================================
-- PASSO 3 (opcional) — Validação manual pós-deploy
-- =========================================================
-- 1. SELECT last_seen_at FROM profiles LIMIT 5;
--    Deve estar tudo NULL (coluna nova, ninguém escreveu ainda). Este passo
--    dá pra rodar direto no SQL Editor, é só leitura.
--
-- 2. O passo abaixo PRECISA simular uma sessão de usuário comum — o SQL
--    Editor roda como 'postgres' (superuser), que ignora REVOKE de coluna
--    por definição; rodar o UPDATE direto, sem trocar de role, "passaria"
--    mesmo que o REVOKE estivesse quebrado (falso positivo). Uso o mesmo
--    truque do arquivo 20260911100000_...sql: trocar a ROLE + simular um
--    JWT dentro de uma transação descartável.
--
--      BEGIN;
--      SET LOCAL ROLE authenticated;
--      SET LOCAL request.jwt.claims = '{"sub":"<uuid-de-um-usuario-comum>","role":"authenticated"}';
--      UPDATE profiles SET last_seen_at = now() WHERE id = '<uuid-de-um-usuario-comum>';
--      ROLLBACK;
--
--    Deve falhar com "permission denied for table profiles" — confirma que
--    a única forma de escrever é via a function SECURITY DEFINER (próximo
--    arquivo), não um update direto do client. O ROLLBACK garante que nada
--    é gravado de verdade, mesmo que o teste "passe" por engano.
--    Achar um uuid rápido: SELECT id FROM profiles WHERE is_admin = false LIMIT 1;
