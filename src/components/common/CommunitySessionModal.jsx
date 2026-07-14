import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Calendar, Clock, Languages } from "lucide-react";
import { SessionCardPeople } from "./SessionCard";
import "./CommunitySessionModal.css";

// Modal de visualização de uma sessão pública no feed da Comunidade — só
// leitura, sem ações (a sessão já é pública e o usuário aqui é espectador,
// diferente do PendingApprovalModal que decide aprovar/rejeitar).
const CommunitySessionModal = ({ session, onClose }) => {
  const { t } = useTranslation("dashboard");
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  if (!session) return null;

  const languageList = session.languages
    ? session.languages.split(",").map((lang) => lang.trim())
    : [];

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
            <img src={session.session_photo_url} alt={t("sessions.sessionExpandedAlt")} />
          </div>
        </div>
      )}
    </>
  );
};

export default CommunitySessionModal;
