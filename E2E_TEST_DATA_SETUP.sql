-- Setup de dados de teste para a suíte E2E (Playwright, ver tests/e2e/)
-- Execute este script no SQL Editor do Supabase (https://app.supabase.com)
--
-- Contexto: os testes de Sessões e Conexões precisam de (1) a conta de login
-- de teste já existente (teste.e2e@seudominio.com, ver .env.test) com
-- speaks/learns preenchidos — senão a plataforma bloqueia o botão "Conectar"
-- com o popup "Acesso restrito" —, (2) um segundo perfil aprovado
-- ("E2E Test Partner") pra servir de alvo fixo e previsível nos dois testes,
-- em vez de mirar em usuários reais da plataforma, e (3) uma conexão já
-- aceita entre as duas contas — sessions.spec.js depende do dropdown de
-- parceiros do AddSessionModal (só lista conexões aceitas) já vir populado,
-- sem depender de connections.spec.js ter rodado antes na mesma sessão.
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
-- PASSO 3: Garantir conexão já aceita entre as duas contas de teste
-- =========================================================
-- sessions.spec.js registra uma sessão contra uma conexão já aceita — o
-- dropdown de parceiros do AddSessionModal só lista conexões com
-- status = 'aceito' (ver useAcceptedConnections). Sem essa linha, rodar
-- sessions.spec.js isolado (sem connections.spec.js ter rodado antes na
-- mesma sessão e deixado a solicitação aceita) deixa o dropdown vazio.
--
-- Remove qualquer solicitação prévia entre as duas contas (em qualquer
-- direção/status) antes de inserir, pra esse script poder ser reexecutado
-- sem duplicar linhas.

DELETE FROM public.connection_requests
WHERE (
  sender_id = (SELECT id FROM auth.users WHERE email = 'teste.e2e@seudominio.com')
  AND receiver_id = (SELECT id FROM auth.users WHERE email = 'e2e.partner@e2etest.local')
) OR (
  sender_id = (SELECT id FROM auth.users WHERE email = 'e2e.partner@e2etest.local')
  AND receiver_id = (SELECT id FROM auth.users WHERE email = 'teste.e2e@seudominio.com')
);

INSERT INTO public.connection_requests (sender_id, receiver_id, status)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'teste.e2e@seudominio.com'),
  (SELECT id FROM auth.users WHERE email = 'e2e.partner@e2etest.local'),
  'aceito'
);


-- =========================================================
-- PASSO 4: Validação — confira que tudo foi mesmo atualizado
-- =========================================================
-- Deve retornar exatamente 2 linhas: a conta de login (speaks/learns
-- preenchidos) e "E2E Test Partner" (is_approved = true, hub = E2E-TEST).

SELECT p.id, p.full_name, p.hub, p.is_approved, p.speaks, p.learns
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email IN ('teste.e2e@seudominio.com', 'e2e.partner@e2etest.local');

-- Deve retornar exatamente 1 linha, com status = 'aceito'.
SELECT cr.id, cr.sender_id, cr.receiver_id, cr.status
FROM public.connection_requests cr
WHERE cr.sender_id = (SELECT id FROM auth.users WHERE email = 'teste.e2e@seudominio.com')
  AND cr.receiver_id = (SELECT id FROM auth.users WHERE email = 'e2e.partner@e2etest.local');
