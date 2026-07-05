import React from "react";
import { MessageSquare, MapPin, Globe, Clock, UserCheck } from "lucide-react";
import { COUNTRIES } from "../../constants/countries";
import PersonAvatar from "./PersonAvatar";
import "./partner-card.css";

const PartnerCard = ({ partner, onConnect, sentRequest, isConnected }) => {
  const isPerfectMatch = partner.compatibility === "Match Perfeito";
  const isPending = sentRequest?.status === "pendente";

  // Busca o nome do país baseado no código (ex: "BR" -> "Brasil")
  const countryObj = COUNTRIES.find((c) => c.code === partner.country);
  const countryName = countryObj ? countryObj.name : "";

  // Usa formato SVG para garantir máxima qualidade independente do tamanho
  const flagUrl = partner.country
    ? `https://flagcdn.com/${partner.country.toLowerCase()}.svg`
    : "";

  return (
    <div
      className={`card--partner partner-card ${isPerfectMatch ? "perfect-match-card" : ""}`}
    >
      {isPerfectMatch && (
        <div className="perfect-match-badge">Match Perfeito</div>
      )}

      {/* Topo do Card */}
      <div className="card-header">
        <div className="card-header-top">
          <div className="avatar-container">
            <PersonAvatar
              photoUrl={partner.photo_url}
              seed={partner.id}
              name={partner.full_name}
              className="partner-avatar"
            />
          </div>

          {/* Container da Bandeira com novo formato de bandeirola */}
          {flagUrl && (
            <div className="flag-banner-container">
              <img
                src={flagUrl}
                alt={`Bandeira ${countryName}`}
                className="flag-banner-img"
              />
            </div>
          )}
        </div>

        {/* Informações Principais */}
        <div className="partner-main-info">
          <div className="partner-name-row">
            <h2 className="partner-name">{partner.full_name}</h2>
            <span
              className="match-badge-pill"
              title="A compatibilidade é calculada com base nos idiomas que você fala, idiomas que deseja aprender e proximidade de hub."
            >
              {partner.matchScore}% Match
            </span>
          </div>

          <div className="partner-location-row">
            <p
              className="partner-location"
              title={`Hub ${partner.hub || "Não definido"}${countryName ? `, ${countryName}` : ""}`}
            >
              <MapPin size={14} color="#FF5A5F" />

              <span className="partner-location-text">
                Hub {partner.hub || "Não definido"}
                {countryName && `, ${countryName}`}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="divider"></div>

      {/* Detalhes de Idiomas */}
      <div className="partner-details-card">
        <div className="partner-section-card">
          <span className="section-title-card">Fala</span>
          <div className="tags-card">
            {partner.speaksArray?.length > 0 ? (
              partner.speaksArray.map((lang) => (
                <span key={lang} className="tag-card orange">
                  {lang}
                </span>
              ))
            ) : (
              <span className="tag-card-empty">Não informado</span>
            )}
          </div>
        </div>

        <div className="partner-section-card">
          <span className="section-title-card">Aprende</span>
          <div className="tags-card">
            {partner.learnsArray?.length > 0 ? (
              partner.learnsArray.map((lang) => (
                <span key={lang} className="tag-card blue">
                  {lang}
                </span>
              ))
            ) : (
              <span className="tag-card-empty">Não informado</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer (Botão) */}
      <div className="card-footer">
        <button
          className={`connect-btn ${isConnected ? "connect-btn-connected" : isPending ? "connect-btn-pending" : ""}`}
          onClick={onConnect}
        >
          {isConnected ? (
            <>
              <UserCheck size={18} />
              Conectado
            </>
          ) : isPending ? (
            <>
              <Clock size={18} />
              Pendente
            </>
          ) : (
            <>
              <MessageSquare size={18} />
              Conectar
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PartnerCard;
