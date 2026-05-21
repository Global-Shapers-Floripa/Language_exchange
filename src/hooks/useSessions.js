import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export const useSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);

        // Pega o usuário logado
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('Usuário não autenticado');
        }

        // Busca todas as sessões do usuário
        const { data, error: fetchError } = await supabase
          .from('sessions')
          .select(`
            id,
            partner_id,
            date,
            duration,
            languages,
            status,
            profiles!partner_id(full_name)
          `)
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (fetchError) {
          if (fetchError.message.includes('Could not find the table')) {
            throw new Error('Tabela de sessões não foi criada ainda. Execute o arquivo DATABASE_SETUP.sql no Supabase.');
          }
          throw fetchError;
        }

        // Formata os dados
        const formattedSessions = data.map((session) => ({
          id: session.id,
          partner: session.profiles?.full_name || 'Desconhecido',
          date: new Date(session.date).toLocaleDateString('pt-BR'),
          duration: `${session.duration}min`,
          language: session.languages || 'N/A',
          status: session.status || 'Pendente',
        }));

        setSessions(formattedSessions);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar sessões:', err);
        setError(err.message);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return { sessions, loading, error };
};
