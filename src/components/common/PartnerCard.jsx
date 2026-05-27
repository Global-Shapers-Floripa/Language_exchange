import React from "react";

import { MessageSquare } from "lucide-react";

import "./partner-card.css";

const PartnerCard = ({ partner, onConnect }) => {
  return (
    <div className="partner-card">
      <div className="partner-header">
        <img
          src={
            partner.photo_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.full_name}`
          }
          alt={partner.full_name}
          className="partner-avatar"
        />

        <div>
          <h3>{partner.full_name}</h3>

          <p>📍 HUB {partner.hub}</p>
        </div>
      </div>

      <div className="partner-section">
        <span className="section-label">FALA</span>

        <div className="tags">
          {partner.speaksArray?.map((lang) => (
            <span key={lang} className="tag green">
              {lang}
            </span>
          ))}
        </div>
      </div>

      <div className="partner-section">
        <span className="section-label">
          APRENDE
        </span>

        <div className="tags">
          {partner.learnsArray?.map((lang) => (
            <span key={lang} className="tag blue">
              {lang}
            </span>
          ))}
        </div>
      </div>

      <button
        className="connect-btn"
        onClick={onConnect}
      >
        <MessageSquare size={18} />
        Conectar
      </button>
    </div>
  );
};

export default PartnerCard;