import React from "react";
import { MapPin, Globe, Mail, Phone } from "lucide-react";
import { COUNTRIES } from "../../constants/countries"; // Ajuste o caminho se necessário
import "./PartnerModal.css";

const PartnerModal = ({ partner, onClose }) => {
  if (!partner) return null;

const isPerfectMatch =
  partner.compatibility === "Match Perfeito";

  // Busca a bandeira do país
  const countryObj = COUNTRIES?.find((c) => c.code === partner.country);
  const countryName = countryObj ? countryObj.name : "";
  const flagUrl = partner.country
    ? `https://flagcdn.com/w640/${partner.country.toLowerCase()}.png`
    : "";

  // Garante que temos arrays para mapear as tags (mesmo se vier como string do banco)
  const speaksList = partner.speaksArray || (partner.speaks ? partner.speaks.split(',').map(s => s.trim()) : []);
  const learnsList = partner.learnsArray || (partner.learns ? partner.learns.split(',').map(l => l.trim()) : []);
  const interestsList = partner.interestsArray || (partner.interests ? partner.interests.split(',').map(i => i.trim()) : []);

  return (
    <div className="partner-modal-overlay" onClick={onClose}>
      <div className="partner-modal" onClick={(e) => e.stopPropagation()}>
        
        <button className="close-modal-btn" onClick={onClose}>✕</button>

        {isPerfectMatch && (
          <div className="perfect-match-modal-badge">
            ✨ Match Perfeito
          </div>
        )}

        {/* BANNER COM BANDEIRA */}
        <div
          className="modal-flag-banner"
          style={{
            backgroundImage: flagUrl
              ? `url(${flagUrl})`
              : "linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)",
          }}
        ></div>

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
          
          <div className="modal-location-info">
            <span className="hub-info"><MapPin size={14} color="#FF5A5F" /> HUB {partner.hub}</span>
            {countryName && (
              <span className="country-info"><Globe size={14} color="#4A90E2" /> {countryName}</span>
            )}
          </div>
        </div>

        <div className="modal-scrollable-content">
          
          {/* SOBRE (Aparece apenas se existir) */}
          {partner.description && partner.description.trim() !== "" && (
            <div className="partner-modal-section">
              <h3>Sobre</h3>
              <p className="description-text">{partner.description}</p>
            </div>
          )}

          <div className="modal-grid-sections">
            <div className="partner-modal-section">
              <h3>Idiomas que fala</h3>
              <div className="tags-container">
                {speaksList.length > 0 ? (
                  speaksList.map((lang) => (
                    <span key={lang} className="tag tag-orange">{lang}</span>
                  ))
                ) : (
                  <span className="empty-info">Não informado</span>
                )}
              </div>
            </div>

            <div className="partner-modal-section">
              <h3>Idiomas que aprende</h3>
              <div className="tags-container">
                {learnsList.length > 0 ? (
                  learnsList.map((lang) => (
                    <span key={lang} className="tag tag-green">{lang}</span>
                  ))
                ) : (
                  <span className="empty-info">Não informado</span>
                )}
              </div>
            </div>
          </div>

          {/* INTERESSES (Aparece apenas se tiver marcado) */}
          {interestsList.length > 0 && (
            <div className="partner-modal-section">
              <h3>Interesses</h3>
              <div className="tags-container">
                {interestsList.map((interest) => (
                  <span key={interest} className="tag tag-purple">{interest}</span>
                ))}
              </div>
            </div>
          )}

          <div className="partner-modal-section contact-section">
            <h3>Contato</h3>
            <div className="contact-info-list">
              <p>
                <Mail size={16} />
                <strong>Email:</strong> {partner.email || "Não informado"}
              </p>
              
              {/* TELEFONE (Aparece apenas se existir) */}
              {partner.phone && partner.phone.trim() !== "" && (
                <p>
                  <Phone size={16} />
                  <strong>Telefone:</strong> {partner.phone}
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PartnerModal;