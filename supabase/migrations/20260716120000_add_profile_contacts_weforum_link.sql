-- Adiciona coluna opcional 'weforum_link' à tabela 'profile_contacts'.
-- Execute este script no SQL Editor do Supabase (https://app.supabase.com)
--
-- Contexto: novo campo de cadastro/perfil para o link do perfil do usuário
-- na rede WeForum (rede social exclusiva da comunidade Global Shapers,
-- formato tipo https://my.weforum.org/network/people/{id}/{nome}). Ajuda o
-- admin a confirmar que quem está se cadastrando é de fato membro da
-- comunidade, agilizando a aprovação.
--
-- Vive em 'profile_contacts' (não em 'profiles'), reaproveitando a mesma
-- policy de leitura já existente ali (dono, admin, ou conexão aceita) —
-- mesmo raciocínio de 'email'/'phone': 'profiles' tem SELECT liberado para
-- leitura geral (necessário para a busca de parceiros), então um dado que
-- não deveria ser público por padrão não pode morar lá.
--
-- Sem GRANT adicional necessário: diferente de 'profiles' (que restringe
-- UPDATE por coluna desde 20260704120000_restrict_profiles_update_permissions.sql),
-- 'profile_contacts' nunca teve REVOKE/GRANT por coluna — o controle de quem
-- pode escrever em qual linha é feito só pela RLS ("Usuario insere seu
-- proprio contato" / "Usuario atualiza seu proprio contato", ambas
-- auth.uid() = user_id), que já cobre a tabela inteira. Uma coluna nova
-- nullable não muda isso.

ALTER TABLE public.profile_contacts
  ADD COLUMN weforum_link TEXT;
