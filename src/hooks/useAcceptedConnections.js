import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

// Parceiros disponíveis para registrar sessão: só conexões já aceitas
// (connection_requests com status "aceito"), em qualquer direção — não usa
// o matching geral de usePartners.js, que traz todo mundo aprovado.
export const useAcceptedConnections = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAcceptedConnections = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setPartners([]);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("connection_requests")
          .select(
            "sender_id, receiver_id, sender:profiles!sender_id(id, full_name, hub, country, photo_url), receiver:profiles!receiver_id(id, full_name, hub, country, photo_url)",
          )
          .eq("status", "aceito")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        if (fetchError) {
          throw fetchError;
        }

        const formattedPartners = (data || [])
          .map((row) => (row.sender_id === user.id ? row.receiver : row.sender))
          .filter(Boolean);

        setPartners(formattedPartners);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar conexões aceitas:", err);
        setError(err.message);
        setPartners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAcceptedConnections();
  }, []);

  return { partners, loading, error };
};
