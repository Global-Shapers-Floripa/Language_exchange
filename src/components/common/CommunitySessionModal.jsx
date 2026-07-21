import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Calendar, Clock, Languages, Heart } from "lucide-react";
import { supabase } from "../../services/supabaseClient";
import { SessionCardPeople } from "./SessionCard";
import PersonAvatar from "./PersonAvatar";
import "./CommunitySessionModal.css";

// Modal de visualização de uma sessão pública no feed da Comunidade — a
// única ação disponível é curtir (a sessão já é pública e o usuário aqui é
// espectador, diferente do PendingApprovalModal que decide aprovar/rejeitar).
const CommunitySessionModal = ({ session, reaction, onClose }) => {
  const { t } = useTranslation("dashboard");
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  // =========================
  // QUEM CURTIU (sob demanda, só a sessão aberta)
  // =========================
  // Espelha o padrão de PartnerModal.jsx com profile_contacts: busca só
  // quando o modal abre pra uma sessão, não pro feed inteiro de uma vez.
  // 'user_id' aqui referencia 'profiles.id' diretamente (diferente de
  // 'sessions.user_id'), então o PostgREST embute o profile na mesma query,
  // sem precisar da busca em duas etapas que usePublicSessions/useSessions
  // fazem pro dono/parceiro da sessão.
  const [reactors, setReactors] = useState([]);
  const [loadingReactors, setLoadingReactors] = useState(false);

  const fetchReactors = async (sessionId) => {
    if (!sessionId) return;

    setLoadingReactors(true);
    try {
      const { data, error } = await supabase
        .from("session_reactions")
        .select(
          `
            user_id,
            profiles:user_id ( id, full_name, photo_url )
          `,
        )
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;

      setReactors(
        (data || []).map((row) => ({
          id: row.user_id,
          name: row.profiles?.full_name || t("defaultUserName"),
          photoUrl: row.profiles?.photo_url || null,
        })),
      );
    } catch (err) {
      console.error("Erro ao buscar curtidas da sessão:", err);
    } finally {
      setLoadingReactors(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchReactors(session?.id);
    };

    init();
  }, [session?.id]);

  // Curtir/descurtir pelo próprio modal precisa refletir na lista de
  // avatares na hora (sem fechar/reabrir) — só re-dispara o mesmo fetch
  // acima quando a ação realmente é confirmada pelo banco.
  const handleToggleReaction = async () => {
    const result = await reaction.onToggle();
    if (result?.success) {
      fetchReactors(session.id);
    }
  };

  if (!session) return null;

  const languageList = session.languages
    ? session.languages.split(",").map((lang) => lang.trim())
    : [];

  const reactionCount = reaction?.count || 0;
  const namesShown = reactors.slice(0, 2).map((r) => r.name);
  const remaining = Math.max(0, reactionCount - namesShown.length);

  let reactionsSummary = "";
  if (reactionCount === 0) {
    reactionsSummary = t("reactions.empty");
  } else if (remaining > 0) {
    reactionsSummary = `${namesShown.join(", ")} ${t("reactions.andMore", { count: remaining })} ${t("reactions.verbPlural")}`;
  } else if (namesShown.length === 2) {
    reactionsSummary = `${namesShown[0]} ${t("reactions.and")} ${namesShown[1]} ${t("reactions.verbPlural")}`;
  } else {
    reactionsSummary = `${namesShown[0] || ""} ${t("reactions.verbSingular")}`;
  }

  return (
    <>
      <div className="community-session-modal-overlay" onClick={onClose}>
        <div
          className="community-session-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="btn btn-ghost--icon community-session-modal-close"
            onClick={onClose}
          >
            <X size={22} />
          </button>

          {session.session_photo_url && (
            <img
              src={session.session_photo_url}
              alt={`${session.ownerName} & ${session.partnerName}`}
              className="community-session-modal-image"
              onClick={() => setIsImageExpanded(true)}
              loading="lazy"
            />
          )}

          <SessionCardPeople
            personA={session.owner}
            personB={session.partner}
            size="lg"
          />

          <div className="community-session-modal-content">
            <div className="csm-detail-row">
              <Calendar size={18} />
              <span>{session.date}</span>
            </div>

            <div className="csm-detail-row">
              <Clock size={18} />
              <span>{t("sessions.durationMinutes", { count: session.duration })}</span>
            </div>

            <div className="csm-detail-row">
              <Languages size={18} />
              <div className="csm-languages">
                {languageList.map((lang, index) => (
                  <span key={index} className="csm-lang-badge">
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            {session.notes && (
              <div className="csm-notes-box">
                <h4>{t("sessions.notes.label")}</h4>
                <p>{session.notes}</p>
              </div>
            )}

            {reaction && (
              <div className="csm-reactions-box">
                <button
                  type="button"
                  className={`csm-reaction-button${reaction.likedByMe ? " csm-reaction-button--liked" : ""}`}
                  onClick={handleToggleReaction}
                  aria-label={t(
                    reaction.likedByMe ? "reactions.unlikeAria" : "reactions.likeAria",
                  )}
                >
                  <Heart size={20} fill={reaction.likedByMe ? "currentColor" : "none"} />
                  <span>{reactionCount}</span>
                </button>

                {!loadingReactors && reactors.length > 0 && (
                  <div className="csm-reactors">
                    <div className="csm-reactors-avatars">
                      {reactors.map((reactor) => (
                        <PersonAvatar
                          key={reactor.id}
                          photoUrl={reactor.photoUrl}
                          seed={reactor.id}
                          name={reactor.name}
                          size={28}
                          className="csm-reactor-avatar"
                        />
                      ))}
                    </div>
                    <p className="csm-reactors-summary">{reactionsSummary}</p>
                  </div>
                )}

                {!loadingReactors && reactors.length === 0 && (
                  <p className="csm-reactors-summary">{reactionsSummary}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isImageExpanded && session.session_photo_url && (
        <div
          className="csm-image-modal-overlay"
          onClick={() => setIsImageExpanded(false)}
        >
          <div className="csm-image-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="btn btn-ghost--icon csm-image-modal-close"
              onClick={() => setIsImageExpanded(false)}
            >
              <X size={22} />
            </button>
            <img
              src={session.session_photo_url}
              alt={t("sessions.sessionExpandedAlt")}
              loading="lazy"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default CommunitySessionModal;
