import { useState, useEffect, useRef } from "react";

import { supabase } from "../services/supabaseClient";

// Curtidas do feed de Comunidade: contador e "curtido por mim" para cada
// sessão da lista recebida. Fica fora do cache de 5min do usePublicSessions
// (ver useCache.js) de propósito — "curtido por mim" depende de quem está
// logado, e meter isso no cache compartilhado repetiria o mesmo problema já
// resolvido pro match score dos parceiros (ver clearListCaches).
export const useSessionReactions = (sessionIds) => {
  const [counts, setCounts] = useState({});
  const [likedByMe, setLikedByMe] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const idsKey = sessionIds.join(",");

  const fetchReactions = async () => {
    if (sessionIds.length === 0) {
      setCounts({});
      setLikedByMe(new Set());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const [{ data: countRows, error: countError }, { data: ownRows, error: ownError }] =
        await Promise.all([
          supabase
            .from("session_reaction_counts")
            .select("session_id, like_count")
            .in("session_id", sessionIds),
          user
            ? supabase
                .from("session_reactions")
                .select("session_id")
                .eq("user_id", user.id)
                .in("session_id", sessionIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

      if (countError) throw countError;
      if (ownError) throw ownError;

      const countsMap = {};
      (countRows || []).forEach((row) => {
        countsMap[row.session_id] = row.like_count;
      });

      setCounts(countsMap);
      setLikedByMe(new Set((ownRows || []).map((row) => row.session_id)));
    } catch (err) {
      console.error("Erro ao buscar curtidas das sessões:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // idsKey representa o conteúdo de sessionIds — usar o array direto
    // refaria o fetch a cada render, já que usePublicSessions devolve uma
    // referência nova de array toda vez. Init encapsulado no efeito segue o
    // mesmo padrão de usePublicSessions.js/useSessions.js.
    const init = async () => {
      await fetchReactions();
    };

    init();
  }, [idsKey]);

  // =========================
  // CURTIR / DESCURTIR
  // =========================
  // Sessões com uma escrita em andamento — bloqueia cliques repetidos na
  // mesma sessão enquanto a chamada anterior não voltou. Sem isso, dois
  // cliques rápidos calculam o otimista em cima do mesmo estado "antigo" e,
  // pior, as duas requisições (insert/delete) podem responder fora de ordem,
  // deixando o contador local dessincronizado do banco sem nenhum erro
  // aparecer (diferente da colisão de UNIQUE constraint, essa sim reportada
  // como erro 23505 abaixo).
  const pendingSessionIds = useRef(new Set());

  // Busca o estado real dessa sessão no banco e substitui o valor local —
  // roda sempre no final do toggle (sucesso ou falha) em vez de só reverter
  // matematicamente o delta otimista, porque o delta local pode não refletir
  // mais a realidade (ex.: outra pessoa curtiu/descurtiu a mesma sessão
  // enquanto essa chamada estava em andamento).
  const reconcileSession = async (sessionId) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const [{ data: countRow, error: countError }, { data: ownRow, error: ownError }] =
        await Promise.all([
          supabase
            .from("session_reaction_counts")
            .select("like_count")
            .eq("session_id", sessionId)
            .maybeSingle(),
          user
            ? supabase
                .from("session_reactions")
                .select("session_id")
                .eq("user_id", user.id)
                .eq("session_id", sessionId)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

      if (countError) throw countError;
      if (ownError) throw ownError;

      setCounts((prev) => ({ ...prev, [sessionId]: countRow?.like_count || 0 }));
      setLikedByMe((prev) => {
        const next = new Set(prev);
        if (ownRow) next.add(sessionId);
        else next.delete(sessionId);
        return next;
      });
    } catch (err) {
      console.error("Erro ao reconciliar curtidas da sessão:", err);
    }
  };

  const toggleReaction = async (sessionId) => {
    if (pendingSessionIds.current.has(sessionId)) {
      return { success: false, ignored: true };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false };

    pendingSessionIds.current.add(sessionId);

    const alreadyLiked = likedByMe.has(sessionId);

    // Otimista: atualiza a UI antes da resposta do servidor — reconciliado
    // com o valor real do banco no finally, abaixo.
    setLikedByMe((prev) => {
      const next = new Set(prev);
      if (alreadyLiked) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
    setCounts((prev) => ({
      ...prev,
      [sessionId]: Math.max(0, (prev[sessionId] || 0) + (alreadyLiked ? -1 : 1)),
    }));

    try {
      if (alreadyLiked) {
        // .select() devolve as linhas realmente apagadas — se vier vazio, o
        // RLS bloqueou o delete e não devemos tratar isso como sucesso (mesmo
        // padrão de connection_requests/useAddSession.js).
        const { data, error } = await supabase
          .from("session_reactions")
          .delete()
          .eq("session_id", sessionId)
          .eq("user_id", user.id)
          .select();

        if (error) throw error;
        if (!data?.length) throw new Error("Não foi possível remover a curtida.");
      } else {
        const { data, error } = await supabase
          .from("session_reactions")
          .insert([{ session_id: sessionId, user_id: user.id }])
          .select();

        // Colisão com a constraint UNIQUE(session_id, user_id): trata como
        // "já estava curtido", não como erro.
        if (error && error.code !== "23505") throw error;
        if (!error && !data?.length) throw new Error("Não foi possível curtir.");
      }

      return { success: true };
    } catch (err) {
      console.error("Erro ao curtir/descurtir sessão:", err);

      return { success: false, error: err.message };
    } finally {
      await reconcileSession(sessionId);
      pendingSessionIds.current.delete(sessionId);
    }
  };

  return { counts, likedByMe, loading, toggleReaction };
};
