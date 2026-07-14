-- Adiciona profiles.preferred_language, usada pelos e-mails transacionais
-- (send-email / notify-connection-request) para escolher o idioma do
-- template a enviar para cada usuário.
--
-- Contexto: o idioma ativo do i18next hoje só existe em localStorage no
-- navegador (src/i18n/index.js) — o backend não tem acesso a isso. Sem uma
-- coluna persistida, todo e-mail transacional continua indo em português
-- fixo, independente do idioma que o usuário escolheu na UI.
--
-- Execute este script no SQL Editor do Supabase (ou via `supabase db push`)
-- somente depois de revisado.


-- =========================================================
-- PASSO 1: Adicionar a coluna
-- =========================================================
-- DEFAULT 'en' cobre tanto as linhas existentes (backfill automático, sem
-- rewrite de tabela — Postgres trata ADD COLUMN ... DEFAULT <constante> como
-- operação de metadado desde a v11) quanto novos cadastros, que começam em
-- inglês até o usuário trocar de idioma pelo menos uma vez. Inglês foi
-- escolhido como padrão (em vez de português) para quem ainda não
-- expressou preferência — decisão de produto, alinhada ao novo
-- fallbackLng do i18next (src/i18n/index.js) e ao default do parâmetro
-- `lang` da Edge Function send-email.
--
-- O CHECK restringe aos 3 idiomas hoje suportados pelo i18next
-- (SUPPORTED_LANGUAGES em src/i18n/index.js) — se um 4º idioma for
-- adicionado no futuro, os dois lugares precisam ser atualizados juntos.

ALTER TABLE public.profiles
  ADD COLUMN preferred_language text NOT NULL DEFAULT 'en'
  CONSTRAINT profiles_preferred_language_check
    CHECK (preferred_language IN ('pt', 'en', 'es'));


-- =========================================================
-- PASSO 2: Liberar UPDATE da nova coluna para o dono do perfil
-- =========================================================
-- Aditivo ao GRANT UPDATE (...) da migration
-- 20260704120000_restrict_profiles_update_permissions.sql — não substitui a
-- lista de colunas já liberada, só soma esta. A policy de RLS
-- "Users can update own profile" (auth.uid() = id) continua sendo o único
-- portão de "qual linha"; este GRANT só abre "mais uma coluna" dentro da
-- linha que o usuário já podia editar.

GRANT UPDATE (preferred_language) ON public.profiles TO authenticated;


-- =========================================================
-- PASSO 3 (opcional) — Validação manual pós-deploy
-- =========================================================
-- 1. SELECT preferred_language FROM profiles LIMIT 5;
--    Todas as linhas existentes devem mostrar 'en' (backfill do DEFAULT).
-- 2. Como usuário comum autenticado, tentar:
--      UPDATE profiles SET preferred_language = 'pt' WHERE id = auth.uid();
--    Deve funcionar (linha própria, coluna liberada).
-- 3. Como o mesmo usuário, tentar:
--      UPDATE profiles SET preferred_language = 'pt' WHERE id = '<outro-uuid>';
--    Deve falhar por RLS (linha de outra pessoa) — comportamento herdado,
--    não modificado por esta migration.
-- 4. Tentar:
--      UPDATE profiles SET preferred_language = 'de' WHERE id = auth.uid();
--    Deve falhar pela CHECK constraint (idioma fora da lista).
-- 5. SELECT preferred_language FROM profiles WHERE id = '<qualquer-uuid-aprovado>';
--    autenticado como outro usuário aprovado — deve funcionar normalmente
--    (leitura não foi restrita por esta migration).
