import { useState } from 'react';
import { supabase } from '../services/supabaseClient';

export const useAddSession = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addSession = async (sessionData) => {
    try {
      setLoading(true);
      setError(null);

      // Pega o usuário logado
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Insere a nova sessão
      const { data, error: insertError } = await supabase
        .from('sessions')
        .insert([
          {
            user_id: user.id,
            partner_id: sessionData.partner_id,
            date: sessionData.date,
            duration: sessionData.duration,
            languages: sessionData.languages,
            status: sessionData.status || 'pendente',
            notes: sessionData.notes,
          },
        ])
        .select();

      if (insertError) throw insertError;

      setLoading(false);
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao adicionar sessão:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  return { addSession, loading, error };
};
