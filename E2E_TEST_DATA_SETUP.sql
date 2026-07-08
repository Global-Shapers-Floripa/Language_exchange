-- Setup de dados de teste para a suíte E2E (Playwright, ver tests/e2e/)
-- Execute este script no SQL Editor do Supabase (https://app.supabase.com)
--
-- Contexto: os testes de Sessões e Conexões precisam de (1) a conta de login
-- de teste já existente (teste.e2e@seudominio.com, ver .env.test) com
-- speaks/learns preenchidos — senão a plataforma bloqueia o botão "Conectar"
-- com o popup "Acesso restrito" — e de (2) um segundo perfil aprovado
-- ("E2E Test Partner") pra servir de alvo fixo e previsível nos dois testes,
-- em vez de mirar em usuários reais da plataforma.
--
-- PASSO 0 (fora deste script, feito pela UI): cadastre um segundo usuário
-- pelo formulário normal em /signup, com um e-mail dedicado, ex:
--   e2e.partner@e2etest.local
-- Nome/senha não importam — serão sobrescritos/ignorados pelos comandos
-- abaixo. Sem esse cadastro prévio, o PASSO 2 não encontra o auth.users
-- correspondente e não atualiza nada.


-- =========================================================
-- PASSO 1: Completar o perfil da conta de teste de LOGIN
-- =========================================================

UPDATE public.profiles
SET speaks = 'Português',
    learns = 'Inglês'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'teste.e2e@seudominio.com'
);


-- =========================================================
-- PASSO 2: Aprovar e completar o segundo perfil ("E2E Test Partner")
-- =========================================================
-- Ajuste o e-mail abaixo se você cadastrou com um endereço diferente do
-- sugerido no PASSO 0.

UPDATE public.profiles
SET is_approved = true,
    full_name = 'E2E Test Partner',
    hub = 'E2E-TEST',
    speaks = 'Português',
    learns = 'Inglês'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'e2e.partner@e2etest.local'
);


-- =========================================================
-- PASSO 3: Validação — confira que as duas linhas foram mesmo atualizadas
-- =========================================================
-- Deve retornar exatamente 2 linhas: a conta de login (speaks/learns
-- preenchidos) e "E2E Test Partner" (is_approved = true, hub = E2E-TEST).

SELECT p.id, p.full_name, p.hub, p.is_approved, p.speaks, p.learns
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email IN ('teste.e2e@seudominio.com', 'e2e.partner@e2etest.local');
