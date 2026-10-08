-- Adiciona profiles.approved_at, marcando o instante em que um admin aprova
-- um cadastro. Base para a futura régua de e-mails comportamentais (ex:
-- "5 dias após aprovação, se o perfil continuar incompleto").
--
-- Contexto: hoje 'is_approved' vira true via approve_profile() (function
-- SECURITY DEFINER criada em 20260704120000_restrict_profiles_update_permissions.sql),
-- mas nada registra QUANDO isso aconteceu. Sem isso, qualquer régua "X dias
-- depois da aprovação" não tem como saber a idade da aprovação de ninguém.
--
-- Execute este script no SQL Editor do Supabase (ou via `supabase db push`)
-- somente depois de revisado.
--
-- DECISÃO DE BACKFILL (tomada, ver PASSO 3): Opção C — corte fixo na data em
-- que esta migration roda. Motivo: com created_at (proxy da data de
-- cadastro) ou com NULL tratado como elegível, no dia em que a régua ligar
-- uma leva de usuários aprovados há meses dispararia tudo de uma vez — mais
-- de cem e-mails saindo no mesmo dia de um domínio que nunca mandou volume
-- é exatamente o padrão que provedor de e-mail lê como spam. Com o corte
-- fixo a fila escoa naturalmente a partir de alguns dias depois da migration
-- (dependendo do prazo que a régua usar). Perda aceita conscientemente: não
-- dá mais pra saber quem está aprovado há meses/anos por esta coluna — se um
-- dia for preciso atingir esse grupo específico, é um envio manual em lotes,
-- não a régua automática.


-- =========================================================
-- PASSO 1: Adicionar a coluna
-- =========================================================
-- Nullable e sem DEFAULT: diferente de preferred_language (que tinha um
-- default óbvio, 'en'), aqui não existe um valor "neutro" razoável para
-- quem já está aprovado — por isso o backfill fica separado (PASSO 3),
-- como uma escolha explícita, em vez de embutido nesta migration.
ALTER TABLE public.profiles
  ADD COLUMN approved_at timestamptz;


-- =========================================================
-- PASSO 2: approve_profile() passa a preencher approved_at
-- =========================================================
-- Mesmo corpo/checagem de admin da function original — só soma
-- 'approved_at = now()' ao UPDATE. O guard 'AND is_approved = false' evita
-- que um duplo clique no botão "Aprovar" (ou qualquer nova chamada futura)
-- reescreva approved_at com um "now()" mais recente para quem já estava
-- aprovado — hoje não existe fluxo de "reprovar" no código (sweep em
-- src/pages/Admin/Admin.jsx confirma: is_approved só vira false no INSERT do
-- cadastro), então esse guard não bloqueia nenhum caso de uso legítimo atual.
--
-- SECURITY DEFINER continua sendo o único portão: como a function roda com
-- os privilégios do dono, ela ignora o GRANT de coluna abaixo (PASSO 4) e a
-- RLS de 'profiles' — a checagem de is_admin dentro dela é o que protege.
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
  SET is_approved = true,
      approved_at = now()
  WHERE id = target_id
    AND is_approved = false;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_profile(uuid) TO authenticated;


-- =========================================================
-- PASSO 3: Backfill dos já aprovados — Opção C (decidido)
-- =========================================================
-- Todo mundo com is_approved = true HOJE vai ficar com approved_at NULL
-- depois do PASSO 1 — a coluna só passa a ser preenchida dali pra frente,
-- então este UPDATE dá um valor inicial pra quem já estava aprovado antes
-- desta migration existir.
--
-- *** AVISO PRA QUEM LER ISSO NO FUTURO ***
-- Todo approved_at com valor igual (ou muito próximo) ao timestamp em que
-- esta migration rodou NÃO é a data real em que aquela pessoa foi aprovada
-- — é a data do BACKFILL. A data de aprovação verdadeira desses usuários
-- (todo mundo já aprovado antes desta migration) se perdeu; não existia
-- nenhum registro dela antes de approved_at existir. Não interprete esse
-- agrupamento de datas idênticas como coincidência ou como "todo mundo foi
-- aprovado no mesmo dia" — foi só quando a coluna passou a existir. Dali em
-- diante (quem for aprovado depois desta migration, via approve_profile),
-- approved_at passa a ser a data real de aprovação.
--
-- Alternativas descartadas (contexto, não rodar):
--  - Copiar de created_at: contaminaria a régua com falsos positivos, já
--    que created_at é a data de CADASTRO, não de aprovação — o tempo real
--    entre as duas costuma variar (aprovação é manual).
--  - Deixar NULL (tratado como elegível na régua): tanto essa quanto a
--    anterior fariam toda a base já aprovada virar elegível no mesmo
--    instante em que a régua for ligada — uma rajada de e-mails de um
--    domínio sem histórico de volume, que é o padrão que provedores de
--    e-mail associam a spam. O corte fixo abaixo faz a fila escoar aos
--    poucos, a partir de alguns dias depois desta migration.
-- Perda aceita conscientemente: não dá mais pra saber, por esta coluna,
-- quem está aprovado há meses/anos. Atingir esse grupo específico no futuro
-- exige um envio manual em lotes, não a régua automática.
UPDATE public.profiles
  SET approved_at = now()
  WHERE is_approved = true AND approved_at IS NULL;

-- Mesmo aviso, gravado no catálogo do banco (sobrevive mesmo que ninguém
-- releia esta migration) — visível via '\d+ profiles' no psql ou na aba de
-- colunas do Table Editor do Supabase.
COMMENT ON COLUMN public.profiles.approved_at IS
  'Momento em que approve_profile() aprovou o perfil. EXCEÇÃO: linhas com '
  'approved_at próximo de 2026-09-11 (migration 20260911100000) não têm '
  'data de aprovação real conhecida — foi um backfill de corte fixo no '
  'momento em que a coluna foi criada, não a data histórica de aprovação.';


-- =========================================================
-- PASSO 4: Garantir que approved_at não é editável por 'authenticated'
-- =========================================================
-- Redundante na prática: a migration 20260704120000 já fez
-- REVOKE UPDATE ON public.profiles FROM authenticated (revoga em nível de
-- TABELA) e depois GRANT UPDATE (lista específica) — uma coluna nova
-- adicionada depois disso não herda privilégio nenhum automaticamente no
-- Postgres, então approved_at já nasce não-editável por 'authenticated' sem
-- precisar deste REVOKE. Ele fica aqui só pra deixar a intenção explícita no
-- código, sem depender de quem lê entender essa sutileza de ACL do Postgres.
REVOKE UPDATE (approved_at) ON public.profiles FROM authenticated;


-- =========================================================
-- PASSO 5 (opcional) — Validação manual pós-deploy
-- =========================================================
-- 1. SELECT id, is_approved, approved_at FROM profiles WHERE is_approved = true LIMIT 5;
--    approved_at deve estar preenchido em todas (backfill do PASSO 3) e com
--    o mesmo timestamp (ou muito próximo) entre si — é o carimbo do
--    backfill, não datas de aprovação reais distintas.
-- 2. Como admin, aprovar um usuário pendente pela UI (Admin.jsx).
--    approved_at da linha deve virar o timestamp do clique.
--
-- ATENÇÃO pros passos 3 e 4: o SQL Editor do Supabase roda como 'postgres'
-- (superuser) — tanto a checagem de admin dentro de approve_profile()
-- (que depende de auth.uid(), NULL por padrão no SQL Editor) quanto o
-- REVOKE de coluna do PASSO 4 dependem da identidade real da ROLE, e
-- superuser ignora as duas. Rodar direto sem simular a role dá falso
-- resultado nos dois: o passo 3 falharia achando que "não é admin" mesmo
-- sendo, e o passo 4 "passaria" mesmo que o REVOKE estivesse quebrado.
--
-- 3. Simulando um ADMIN de verdade (troque pelo uuid de alguém com
--    is_admin = true — SELECT id FROM profiles WHERE is_admin = true LIMIT 1;):
--      BEGIN;
--      SET LOCAL ROLE authenticated;
--      SET LOCAL request.jwt.claims = '{"sub":"<uuid-do-admin>","role":"authenticated"}';
--      SELECT approve_profile('<uuid-ja-aprovado>');
--      ROLLBACK;
--    Não deve dar erro, mas approved_at NÃO deveria mudar (guard is_approved
--    = false) — como está tudo dentro de uma transação com ROLLBACK, dá pra
--    repetir esse teste quantas vezes quiser sem sujar o banco de verdade.
-- 4. Simulando um USUÁRIO COMUM (uuid de alguém com is_admin = false):
--      BEGIN;
--      SET LOCAL ROLE authenticated;
--      SET LOCAL request.jwt.claims = '{"sub":"<uuid-comum>","role":"authenticated"}';
--      UPDATE profiles SET approved_at = now() WHERE id = '<uuid-comum>';
--      ROLLBACK;
--    Deve falhar com "permission denied for table profiles" (coluna fora do GRANT).
