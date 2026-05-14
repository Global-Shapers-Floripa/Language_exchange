import { createClient } from '@supabase/supabase-js'

// Credenciais carregadas de variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente Supabase não configuradas. Verifique o arquivo .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)