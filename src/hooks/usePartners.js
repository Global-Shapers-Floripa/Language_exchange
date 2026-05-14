import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export const usePartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        
        // Pega o usuário logado para não mostrar para ele mesmo
        const { data: { user } } = await supabase.auth.getUser();

        // Busca todos os perfis aprovados, exceto o usuário logado
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('id, full_name, email, hub, speaks, learns')
          .eq('is_approved', true)
          .neq('id', user?.id || null);

        if (fetchError) throw fetchError;

        // Formata os dados para compatibilidade com PartnerCard
        const formattedPartners = data.map((profile) => ({
          id: profile.id,
          name: profile.full_name,
          email: profile.email,
          hub: profile.hub,
          speaks: profile.speaks,
          learns: profile.learns,
        }));

        setPartners(formattedPartners);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar parceiros:', err);
        setError(err.message);
        setPartners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  return { partners, loading, error };
};
