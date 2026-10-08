-- Adiciona profiles.profile_complete, coluna GERADA que define "perfil
-- completo" em um único lugar no banco, em vez de só no client
-- (src/pages/FindPartners/Parceiros.jsx:56-58 hoje só olha speaks/learns).
--
-- Critério: speaks, learns, photo_url, country e description precisam estar
-- todos preenchidos e não-vazios. "Não-vazio" trata NULL e string em branco
-- (ou só espaços) como a mesma coisa de "não preenchido" — necessário porque
-- os dois estados acontecem hoje: no cadastro (SignUp.jsx) esses 5 campos
-- nascem NULL (não são setados no INSERT), mas depois que o usuário salva o
-- formulário em EditProfile.jsx pelo menos uma vez, description e photo_url
-- passam a poder ser string vazia '' (o form salva
-- 'description: formData.description' e 'photo_url: formData.photo_url'
-- direto, sem transformar '' em NULL). speaks/learns/country não ficam
-- vazios depois de salvos porque o próprio formulário bloqueia o submit
-- nesses 3 campos — mas antes do primeiro save, valem como NULL.
--
-- Execute este script no SQL Editor do Supabase (ou via `supabase db push`)
-- somente depois de revisado.


-- =========================================================
-- PASSO 1: Adicionar a coluna gerada
-- =========================================================
-- Formato escolhido: coluna GERADA (GENERATED ALWAYS ... STORED), não view
-- nem function. Motivo: o app já consulta 'profiles' direto em ~10 lugares
-- (usePartners.js, Parceiros.jsx, Dashboard.jsx, Admin.jsx, etc.) sem
-- nenhuma camada de serviço/view no meio — trocar isso por uma view exigiria
-- migrar todos esses .from("profiles") pra .from("profiles_view") ou
-- similar, mudança bem maior que o pedido desta fase. Uma function
-- (ex: is_profile_complete(profiles)) evitaria alterar a tabela, mas não é
-- filtrável com WHERE de forma tão direta/indexável quanto uma coluna, e
-- ainda seria uma sintaxe nova (computed column via RPC) que o front nunca
-- usou até hoje. A coluna gerada é a que menos muda: o front só passa a
-- pedir mais um campo no .select(), do jeito que já pede full_name/hub/etc.
--
-- Não precisa de GRANT/REVOKE de UPDATE: colunas GERADAS são somente-leitura
-- para qualquer UPDATE/INSERT explícito, inclusive para o dono do superuser
-- — o Postgres rejeita a escrita direto, independente de GRANT.
--
-- Não precisa de mudança de RLS pra leitura: 'profiles' já tem policy de
-- SELECT pública (necessária pra busca de parceiros) cobrindo todas as
-- colunas normais, então profile_complete já nasce visível pra quem já
-- consegue ler speaks/learns/etc. hoje.
ALTER TABLE public.profiles
  ADD COLUMN profile_complete boolean
  GENERATED ALWAYS AS (
    speaks IS NOT NULL AND btrim(speaks) <> ''
    AND learns IS NOT NULL AND btrim(learns) <> ''
    AND photo_url IS NOT NULL AND btrim(photo_url) <> ''
    AND country IS NOT NULL AND btrim(country) <> ''
    AND description IS NOT NULL AND btrim(description) <> ''
  ) STORED;


-- =========================================================
-- PASSO 2 (opcional) — Validação manual pós-deploy
-- =========================================================
-- 1. SELECT id, speaks, learns, photo_url, country, description, profile_complete
--    FROM profiles LIMIT 20;
--    Conferir visualmente que profile_complete só é true quando os 5 campos
--    estão de fato preenchidos (nem NULL, nem string vazia/só espaço).
-- 2. Tentar escrever direto na coluna:
--      UPDATE profiles SET profile_complete = true WHERE id = auth.uid();
--    Deve falhar com "column ... can only be updated to DEFAULT" — confirma
--    que é somente-leitura mesmo pro dono da linha.
-- 3. SELECT count(*) FROM profiles WHERE is_approved = true AND profile_complete = false;
--    Serve como sanity check rápido antes de rodar a query de diagnóstico
--    completa (ver conversa) — os dois números devem bater.


-- =========================================================
-- NOTA: nada muda no frontend com esta migration
-- =========================================================
-- Parceiros.jsx continua calculando "perfil incompleto" só com
-- speaks/learns, do jeito que está hoje — esta migration só disponibiliza a
-- coluna no banco. Trocar Parceiros.jsx pra ler profiles.profile_complete
-- (e decidir se o critério de 5 campos deve valer ali também, ou só na
-- régua de e-mails) é uma mudança de código separada, de uma fase futura.
