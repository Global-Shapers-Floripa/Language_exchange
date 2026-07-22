-- Migração: curtidas ("coração") em sessões públicas da Comunidade
--
-- Contexto: feature nova — usuários aprovados podem curtir uma sessão que
-- apareça no feed público (status = 'publica'). Curtida é binária (curtiu
-- ou não), sem tipos de reação, uma por pessoa por sessão.
--
-- 'user_id' referencia 'profiles.id' diretamente (não 'auth.users' como em
-- 'sessions.user_id') — isso permite o PostgREST embutir o profile do
-- curtidor na mesma query (ver useSessionReactions.js / CommunitySessionModal.jsx),
-- sem precisar da busca em duas etapas que 'usePublicSessions'/'useSessions'
-- fazem hoje.

CREATE TABLE IF NOT EXISTS public.session_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (session_id, user_id)
);

ALTER TABLE public.session_reactions ENABLE ROW LEVEL SECURITY;

-- Leitura pública (decisão consciente: mostrar quem curtiu é desejável pra
-- comunidade, não um risco a mitigar — mesmo nível de exposição que já
-- existe hoje em 'profiles'/'sessions' via policy pública de SELECT).
DROP POLICY IF EXISTS "Leitura publica de curtidas" ON public.session_reactions;
CREATE POLICY "Leitura publica de curtidas"
ON public.session_reactions FOR SELECT
USING (true);

-- So pode curtir em nome de si mesmo
DROP POLICY IF EXISTS "Usuario curte com seu proprio id" ON public.session_reactions;
CREATE POLICY "Usuario curte com seu proprio id"
ON public.session_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- So pode remover a propria curtida
DROP POLICY IF EXISTS "Usuario remove sua propria curtida" ON public.session_reactions;
CREATE POLICY "Usuario remove sua propria curtida"
ON public.session_reactions FOR DELETE
USING (auth.uid() = user_id);

-- View agregada: devolve 1 linha por sessão com a contagem já pronta, em vez
-- do client ter que trazer todas as linhas cruas de session_reactions só pra
-- contar (uma sessão popular poderia ter dezenas de linhas). Postgres >= 15
-- cria views com security_invoker por padrão, então a RLS acima continua
-- valendo aqui — mas como a leitura já é pública, não muda o resultado.
CREATE OR REPLACE VIEW public.session_reaction_counts AS
  SELECT session_id, count(*)::int AS like_count
  FROM public.session_reactions
  GROUP BY session_id;
