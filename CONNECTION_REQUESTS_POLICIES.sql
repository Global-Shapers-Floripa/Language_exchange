-- Policies de RLS faltando na tabela 'connection_requests'
-- Execute este script no SQL Editor do Supabase (https://app.supabase.com)
--
-- Contexto: a tabela permite SELECT/INSERT/UPDATE hoje (a policy de UPDATE
-- "Permitir atualização por quem enviou ou recebeu" já cobre sender_id e
-- receiver_id), mas não tinha nenhuma policy de DELETE. Sem ela, o
-- Postgres/PostgREST simplesmente não encontra nenhuma linha "visível" para
-- a operação e retorna sucesso com 0 linhas afetadas — sem lançar erro. Isso
-- fazia o cancelamento de solicitação (DELETE) parecer funcionar no app, mas
-- sem alterar o banco: a linha continuava existindo e reaparecia pros dois
-- usuários envolvidos.

-- Garante que RLS está ativo (idempotente — não falha se já estiver habilitado)
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

-- Permite que o remetente cancele (delete) uma solicitação que ele mesmo enviou
DROP POLICY IF EXISTS "Sender pode cancelar sua propria solicitacao" ON public.connection_requests;
CREATE POLICY "Sender pode cancelar sua propria solicitacao"
ON public.connection_requests FOR DELETE
USING (auth.uid() = sender_id);

-- Permite que o destinatário rejeite (delete) uma solicitação que recebeu
-- (necessário para o botão "Rejeitar" no modal de "Ver solicitação")
DROP POLICY IF EXISTS "Receiver pode rejeitar solicitacao recebida" ON public.connection_requests;
CREATE POLICY "Receiver pode rejeitar solicitacao recebida"
ON public.connection_requests FOR DELETE
USING (auth.uid() = receiver_id);
