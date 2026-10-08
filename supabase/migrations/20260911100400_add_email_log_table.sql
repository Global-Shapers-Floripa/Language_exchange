-- Cria email_log, registrando todo e-mail que o sistema envia (os 5
-- templates que já existem hoje: approval, connection_request, user_deleted,
-- session_public_request, session_public_decision — e qualquer um novo que
-- a régua vier a adicionar).
--
-- Sem isso, não existe hoje NENHUM controle de "esse e-mail já foi mandado
-- pra essa pessoa" — a régua por tempo/estado precisa consultar isso antes
-- de mandar de novo, senão manda o mesmo e-mail repetidamente a cada execução.
--
-- Execute este script no SQL Editor do Supabase (ou via `supabase db push`)
-- somente depois de revisado.
--
-- DECISÃO (tomada, ver PASSO 3): a escrita acontece DENTRO da send-email,
-- não em quem chama. supabase/functions/send-email/index.ts precisa ganhar
-- um client Supabase com service role e passar a aceitar 'user_id' no body
-- — mudança que acompanha esta migration, feita junto (ver diff da Edge
-- Function). Motivo: com 6 pontos de chamada espalhados, bastaria alguém
-- esquecer de logar ao adicionar um 7º template pro log ficar furado — e log
-- que às vezes não registra é pior que não ter log (o cron consultaria e
-- concluiria "ainda não mandei", mandando de novo).


-- =========================================================
-- PASSO 1: Criar a tabela
-- =========================================================
-- user_id com ON DELETE SET NULL (não CASCADE): se a conta for excluída
-- (admin-delete-user), o histórico de e-mails não precisa desaparecer junto
-- — mas SET NULL sozinho perderia a referência de QUEM recebeu. Por isso
-- 'recipient_email' também é guardado como um snapshot do endereço no
-- momento do envio, independente do que acontece com o profile depois.
-- Isso importa especialmente pro template 'user_deleted', que é disparado
-- bem antes do profile ser apagado (admin-delete-user/index.ts) — sem esse
-- snapshot, o log do "avisei que ia excluir" ficaria com user_id NULL e
-- nenhum e-mail associado, o que é exatamente o registro que mais faria
-- sentido preservar.
--
-- 'template' não tem CHECK restringindo aos 5 nomes atuais de propósito:
-- diferente de preferred_language (onde só o backend decide o valor), aqui
-- qualquer nome novo de template que a régua futura vier a criar precisaria
-- atualizar esse CHECK toda vez — preferimos manter a lista de templates
-- válidos só em send-email/index.ts (TEMPLATES), sem duplicar em uma
-- constraint de banco que teria que ser lembrada junto.
CREATE TABLE IF NOT EXISTS public.email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  template TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resend_id TEXT
);

-- Índice pro uso mais óbvio da régua: "já mandei o template X pro user Y
-- nos últimos N dias?" — sem isso, essa consulta faz sequential scan na
-- tabela inteira a cada execução do cron.
CREATE INDEX IF NOT EXISTS idx_email_log_user_template
  ON public.email_log (user_id, template, sent_at);


-- =========================================================
-- PASSO 2: RLS
-- =========================================================
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

-- Admin pode ler todo o log (mesmo padrão de "Admin ve todos os contatos"
-- em profile_contacts, 20260704180500_add_profile_contacts_table.sql).
DROP POLICY IF EXISTS "Admin ve todo o email_log" ON public.email_log;
CREATE POLICY "Admin ve todo o email_log"
ON public.email_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  )
);

-- Nenhuma policy de SELECT pro dono da linha (usuário comum não vê nem os
-- próprios e-mails logados, só os admins) — não foi pedido, e manter fora
-- por padrão é mais fácil de abrir depois do que fechar. Se quiser que cada
-- usuário veja o próprio histórico de e-mails recebidos, é só somar:
--
-- CREATE POLICY "Usuario ve seu proprio email_log"
-- ON public.email_log FOR SELECT
-- USING (auth.uid() = user_id);
--
-- O cron NÃO precisa de nenhuma policy aqui: ele roda com a service role
-- key, que ignora RLS por completo.
--
-- Nenhuma policy de INSERT/UPDATE/DELETE é criada para 'authenticated' ou
-- 'anon' — sem elas, o Postgres nega qualquer escrita vinda do client
-- (browser) por padrão, e a única forma de escrever é via service role.
-- Isso é o que permite a decisão do PASSO 3: só send-email (rodando com
-- service role) escreve aqui, nenhum dos 6 pontos de chamada de frontend
-- precisa (nem consegue) inserir direto.


-- =========================================================
-- PASSO 3: Onde a escrita acontece — decidido: dentro da send-email
-- =========================================================
-- send-email ganha um client Supabase com a service role key (hoje ela não
-- tem nenhum client Supabase, só faz fetch pro Resend) e, depois de
-- confirmar sucesso na resposta do Resend, insere uma linha em email_log.
-- Os callers passam a poder incluir 'user_id' no body, além do 'to' que já
-- mandam hoje — send-email aceita 'user_id' como opcional (ausência não
-- quebra o envio, só grava a linha do log com user_id NULL).
--
-- IMPORTANTE: nesta fase, só a Edge Function send-email foi ajustada (client
-- de service role + insert em email_log). Os 6 pontos de chamada
-- (Admin.jsx, useAddSession.js, useSessions.js, usePendingApprovals.js,
-- notify-connection-request, admin-delete-user) AINDA NÃO foram alterados
-- para mandar 'user_id' — isso fica pra fase futura, junto com o fechamento
-- de acesso da send-email (item 5, adiado). Até lá, toda linha nova em
-- email_log nasce com user_id NULL, só com recipient_email preenchido.
--
-- *** PRÉ-REQUISITO DA FASE DO CRON, NÃO UM "NICE TO HAVE" ***
-- Antes de ligar qualquer régua automatizada, os 6 pontos de chamada PRECISAM
-- passar a mandar 'user_id'. Sem isso, o dedup ("já mandei esse template pra
-- essa pessoa?") só pode ser feito por recipient_email — e isso quebra na
-- primeira vez que alguém trocar de e-mail em profile_contacts: o histórico
-- anterior fica associado ao endereço antigo, o novo endereço não bate com
-- nenhuma linha existente, e a pessoa recebe a régua inteira de novo do
-- zero, como se nunca tivesse recebido nada. Não é um cenário raro o
-- suficiente pra ignorar: e-mail é justamente o tipo de dado cadastral que
-- muda ao longo do tempo. A régua NÃO deve ser ligada usando dedup por
-- recipient_email como solução definitiva — é aceitável só como estado
-- transitório enquanto os 6 pontos de chamada ainda não foram atualizados,
-- nunca como decisão final.
--
-- Motivo da escolha: com a escrita só em quem chama, 4 dos 6 pontos são
-- código de frontend (sessão do usuário comum, não service role) — pra eles
-- inserirem em email_log seria necessário uma policy de INSERT liberando
-- 'authenticated' (risco de um client malicioso inserir linhas falsas no
-- log) ou outra function SECURITY DEFINER só pra isso, e mais fácil de
-- esquecer de logar ao adicionar um template novo. Com a escrita dentro de
-- send-email, todo envio fica logado sempre, não importa quem chamou.


-- =========================================================
-- PASSO 4 (opcional) — Validação manual pós-deploy
-- =========================================================
-- ATENÇÃO: o SQL Editor do Supabase roda como 'postgres' (superuser) —
-- RLS e REVOKE de coluna são checagens de privilégio, e superuser ignora as
-- duas por definição. Testar "isso deve falhar pra usuário comum" rodando
-- direto no SQL Editor sempre vai "passar" mesmo que a policy esteja
-- quebrada, porque a checagem nem é feita nesse contexto — um falso
-- positivo perigoso. Ver DÁ PRA CONFERIR vs. PRECISA SIMULAR abaixo.
--
-- DÁ PRA CONFERIR DIRETO NO SQL EDITOR (não depende de quem está "logado"):
-- 1. INSERT INTO email_log (user_id, recipient_email, template, resend_id)
--      VALUES ('<algum-uuid-de-profiles>', 'teste@exemplo.com', 'approval', 're_teste123');
--    Deve funcionar (superuser não é afetado por RLS mesmo — isso só
--    confirma que a tabela/colunas existem e aceitam os tipos certos).
--
-- PRECISA SIMULAR UMA SESSÃO DE USUÁRIO COMUM (RLS/REVOKE são checados de
-- verdade pela identidade da ROLE, não pelo superuser) — forma mais rápida,
-- sem precisar logar de verdade no app nem usar curl: dentro do próprio SQL
-- Editor, envolva o teste numa transação e troque a ROLE + o "JWT" simulado
-- antes de rodar a consulta, depois desfaça com ROLLBACK (nada é gravado de
-- verdade, mesmo nos casos que "funcionam"):
--
--   BEGIN;
--   SET LOCAL ROLE authenticated;
--   SET LOCAL request.jwt.claims = '{"sub":"<uuid-de-um-usuario-comum-nao-admin>","role":"authenticated"}';
--
--   SELECT * FROM email_log;
--   -- Esperado: lista vazia (nenhuma policy de SELECT libera não-admin —
--   -- não é erro, é "nada bateu na policy").
--
--   INSERT INTO email_log (user_id, recipient_email, template)
--     VALUES ('<uuid-de-um-usuario-comum-nao-admin>', 'qualquer@exemplo.com', 'approval');
--   -- Esperado: ERROR: new row violates row-level security policy for
--   -- table "email_log" (nenhuma policy de INSERT libera 'authenticated').
--
--   ROLLBACK;
--
-- Pra confirmar que ADMIN consegue ler (a outra ponta da policy), repita a
-- mesma transação trocando o 'sub' pelo uuid de um usuário com is_admin =
-- true — dessa vez o SELECT deve retornar as linhas normalmente.
--
-- Onde achar um <uuid-de-um-usuario-comum-nao-admin> rápido, sem precisar
-- ir atrás de credenciais: SELECT id FROM profiles WHERE is_admin = false LIMIT 1;
