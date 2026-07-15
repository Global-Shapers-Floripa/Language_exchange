import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Calendar, Clock, Languages, Check } from "lucide-react";
import "./PendingApprovalModal.css";

// Modal de revisão de um pedido de sessão pública (usuário logado é o
// parceiro, não quem registrou). Aberto a partir da prévia compacta em
// Sessoes.jsx; chama a mesma RPC approve_public_session usada antes, só que
// agora com foto/nota completas e um único ponto de decisão.
const PendingApprovalModal = ({ approval, onClose, onApprove, onReject }) => {
  const { t } = useTranslation("dashboard");
  const [deciding, setDeciding] = useState(false);

  if (!approval) return null;

  const handleDecision = async (decision) => {
    setDeciding(true);

    const action = decision === "publica" ? onApprove : onReject;
    const result = await action(approval.id);

    setDeciding(false);

    if (result?.success) {
      onClose();
    }
  };

  const languageList = approval.languages
    ? approval.languages.split(",").map((lang) => lang.trim())
    : [];

  return (
    <div className="pending-approval-modal-overlay" onClick={onClose}>
      <div
        className="pending-approval-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="btn btn-ghost--icon pending-approval-modal-close"
          onClick={onClose}
        >
          <X size={22} />
        </button>

        {approval.session_photo_url && (
          <img
            src={approval.session_photo_url}
            alt={approval.requester}
            className="pending-approval-modal-image"
            loading="lazy"
          />
        )}

        <div className="pending-approval-modal-content">
          <h2>{approval.requester}</h2>
          <p className="pending-approval-modal-subtitle">
            {t("sessions.pendingApprovals.subtitle", { hub: approval.hub })}
          </p>

          <div className="pam-detail-row">
            <Calendar size={18} />
            <span>{approval.date}</span>
          </div>

          <div className="pam-detail-row">
            <Clock size={18} />
            <span>{t("sessions.durationMinutes", { count: approval.duration })}</span>
          </div>

          <div className="pam-detail-row">
            <Languages size={18} />
            <div className="pam-languages">
              {languageList.map((lang, index) => (
                <span key={index} className="pam-lang-badge">
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {approval.notes && (
            <div className="pam-notes-box">
              <h4>{t("sessions.notes.label")}</h4>
              <p>{approval.notes}</p>
            </div>
          )}

          <div className="pending-approval-modal-actions">
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => handleDecision("privada")}
              disabled={deciding}
            >
              {t("sessions.pendingApprovals.reject")}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleDecision("publica")}
              disabled={deciding}
            >
              <Check size={18} />
              {deciding ? t("sessions.pendingApprovals.processing") : t("sessions.pendingApprovals.accept")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalModal;
