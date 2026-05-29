import React from "react";
import "./PartnerModal.css";

const PartnerModal = ({ partner, onClose }) => {
  if (!partner) return null;

  const isPerfectMatch =
    partner.matchScore >= 10;

  return (
    <div
      className="partner-modal-overlay"
      onClick={onClose}
    >
      <div
        className="partner-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="close-modal-btn"
          onClick={onClose}
        >
          ✕
        </button>

        {isPerfectMatch && (
          <div className="perfect-match-modal-badge">
            ✨ Match Perfeito
          </div>
        )}

        <div className="partner-modal-header">
          <img
            src={
              partner.photo_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.full_name}`
            }
            alt={partner.full_name}
            className="partner-modal-avatar"
          />

          <h2>{partner.full_name}</h2>

          <span>HUB {partner.hub}</span>

          <p className="match-level">
            Compatibilidade:
            <strong>
              {" "}
              {partner.compatibility}
            </strong>
          </p>
        </div>

        <div className="partner-modal-section">
          <h3>Idiomas que fala</h3>

          <div className="tags-container">
            {partner.speaksArray?.map((lang) => (
              <span key={lang} className="tag green">
                {lang}
              </span>
            ))}
          </div>
        </div>

        <div className="partner-modal-section">
          <h3>Idiomas que aprende</h3>

          <div className="tags-container">
            {partner.learnsArray?.map((lang) => (
              <span key={lang} className="tag blue">
                {lang}
              </span>
            ))}
          </div>
        </div>

        <div className="partner-modal-section">
          <h3>Contato</h3>

          <p>
            <strong>Email:</strong>{" "}
            {partner.email || "Não informado"}
          </p>

          <p>
            <strong>Telefone:</strong>{" "}
            {partner.phone || "Não informado"}
          </p>
        </div>

        {partner.description && (
          <div className="partner-modal-section">
            <h3>Sobre</h3>

            <p>{partner.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerModal;