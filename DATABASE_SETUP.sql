-- Script SQL para criar a tabela 'sessions' no Supabase
-- Execute este script no SQL Editor do Supabase (https://app.supabase.com)

-- Criar tabela sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  duration INTEGER NOT NULL DEFAULT 60,
  languages TEXT,
  status TEXT DEFAULT 'pendente',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_partner_id ON public.sessions(partner_id);
CREATE INDEX idx_sessions_date ON public.sessions(date DESC);

-- Configurar RLS (Row Level Security) para que usuários vejam apenas suas próprias sessões
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver suas próprias sessões
CREATE POLICY "Usuários podem ver suas próprias sessões"
ON public.sessions FOR SELECT
USING (auth.uid() = user_id);

-- Política: Usuários podem criar suas próprias sessões
CREATE POLICY "Usuários podem criar suas próprias sessões"
ON public.sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar suas próprias sessões
CREATE POLICY "Usuários podem atualizar suas próprias sessões"
ON public.sessions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar suas próprias sessões
CREATE POLICY "Usuários podem deletar suas próprias sessões"
ON public.sessions FOR DELETE
USING (auth.uid() = user_id);
