-- Function SECURITY DEFINER para atualizar profiles.last_seen_at com
-- throttle embutido no próprio SQL — evita um UPDATE (e a réplica/WAL que
-- ele gera) a cada carregamento de página, o que seria uma escrita a cada
-- navegação para cada usuário logado.
--
-- Decisão tomada: throttle combina esta function (guard no WHERE, abaixo)
-- com um gate no localStorage do lado do client, que evita chamar até essa
-- RPC quando não passou o threshold — o guard no SQL fica como defesa em
-- profundidade (cobre o caso de localStorage limpo, navegador diferente,
-- etc.), não como a única camada.
--
-- Execute este script no SQL Editor do Supabase (ou via `supabase db push`)
-- somente depois de revisado. Esta migration só cria a function — NINGUÉM a
-- chama ainda (ligar isso em DashboardLayout.jsx, junto com o gate de
-- localStorage, é código de frontend de uma fase futura).


-- =========================================================
-- PASSO 1: Function com guard de throttle
-- =========================================================
-- Só escreve se last_seen_at estiver NULL ou mais velho que p_threshold_hours
-- — na prática, a cláusula WHERE faz o UPDATE virar um no-op (0 linhas
-- afetadas) na esmagadora maioria das chamadas, já que a maior parte das
-- visitas de um usuário cai dentro da mesma janela de X horas da anterior.
-- Isso reduz o volume de ESCRITA, mas não o número de requisições —
-- se o objetivo for reduzir requisições também, combine com um gate de
-- localStorage no client antes de chamar este RPC (Opção C da conversa).
--
-- SECURITY DEFINER + 'WHERE id = auth.uid()' embutido (não recebe target_id
-- como parâmetro): diferente de approve_profile, aqui não existe "admin
-- atualizando o last_seen de outra pessoa" — só faz sentido cada um marcar a
-- própria presença. Isso também significa que não dá pra chamar esta
-- function sem estar autenticado (auth.uid() viria NULL, e o WHERE nunca
-- bate em nenhuma linha).
CREATE OR REPLACE FUNCTION public.touch_last_seen(p_threshold_hours integer DEFAULT 12)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET last_seen_at = now()
  WHERE id = auth.uid()
    AND (last_seen_at IS NULL OR last_seen_at < now() - make_interval(hours => p_threshold_hours));
END;
$$;

REVOKE ALL ON FUNCTION public.touch_last_seen(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.touch_last_seen(integer) TO authenticated;


-- =========================================================
-- PASSO 2 (opcional) — Validação manual pós-deploy
-- =========================================================
-- ATENÇÃO: chamar 'SELECT touch_last_seen();' direto no SQL Editor sem
-- simular sessão não testa nada de útil — auth.uid() é NULL nesse contexto
-- (não existe JWT nenhum), então o WHERE da function nunca bate em ninguém
-- e a chamada sempre "funciona" sem atualizar linha alguma, disfarçando o
-- comportamento real de throttle. Precisa simular um usuário de verdade:
--
--   BEGIN;
--   SET LOCAL ROLE authenticated;
--   SET LOCAL request.jwt.claims = '{"sub":"<uuid-de-um-usuario-comum>","role":"authenticated"}';
--
--   SELECT touch_last_seen();
--   SELECT last_seen_at FROM profiles WHERE id = '<uuid-de-um-usuario-comum>';
--   -- 1. Deve ter virado o timestamp atual.
--
--   SELECT touch_last_seen();
--   SELECT last_seen_at FROM profiles WHERE id = '<uuid-de-um-usuario-comum>';
--   -- 2. NÃO deve ter mudado (dentro da janela de 12h por padrão) — confirma o throttle.
--
--   SELECT touch_last_seen(0);
--   SELECT last_seen_at FROM profiles WHERE id = '<uuid-de-um-usuario-comum>';
--   -- 3. Deve atualizar de novo, já que o threshold virou 0h.
--
--   COMMIT; -- ou ROLLBACK se preferir não gravar nada de verdade neste teste
--
-- 4. Sem simular nada (equivalente a "deslogado"), chamar direto:
--      SELECT touch_last_seen();
--    Não deve dar erro, mas também não deve atualizar linha nenhuma —
--    válido rodar direto no SQL Editor, já que o próprio comportamento
--    esperado aqui É auth.uid() vir NULL.
