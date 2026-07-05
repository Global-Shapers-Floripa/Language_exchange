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

  // Define a URL da bandeira otimizada para o tamanho menor (w80)
  const flagUrl = partner.country
    ? `https://flagcdn.com/w80/${partner.country.toLowerCase()}.png`
    : "";

  return (
    <div className={`card card--partner card--hoverable partner-card ${isPerfectMatch ? "perfect-match-card" : ""}`}>
      {isPerfectMatch && (
        <div className="perfect-match-badge">Match Perfeito</div>
      )}

      {/* Topo do Card */}
      <div className="card-header">
        <div className="avatar-container">
          <PersonAvatar
            photoUrl={partner.photo_url}
            seed={partner.id}
            name={partner.full_name}
            className="partner-avatar"
          />
          {/* Bandeira posicionada no canto do avatar */}
          {flagUrl && (
            <img 
              src={flagUrl} 
              alt={`Bandeira ${countryName}`} 
              className="avatar-flag" 
            />
          )}
        </div>

        {/* Informações Principais */}
        <div className="partner-main-info">
          <h2 className="partner-name">{partner.full_name}</h2>
          <p className="partner-location">
            <MapPin size={12} color="#FF5A5F" />
            Hub {partner.hub || "Não definido"}
          </p>
          {countryName && (
            <p className="partner-country">
              <Globe size={12} color="#2B50A5" />
              {countryName}
            </p>
          )}
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
                <span key={lang} className="tag-card green">
                  {lang}
                </span>
              ))
            ) : (
              <span className="tag-card-empty">Não informado</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer (Compatibilidade e Botão) agrupados */}
      <div className="card-footer">
        <div className="match-container">
          <div
            className="match-percentage"
            title="A compatibilidade é calculada com base nos idiomas que você fala, idiomas que deseja aprender e proximidade de hub."
          >
            {partner.matchScore}% compatível
          </div>
          <div className="match-bar">
            <div
              className="match-fill"
              style={{ width: `${partner.matchScore}%` }}
            />
          </div>
        </div>

        <button
          className={`btn btn-secondary connect-btn ${isConnected ? "connect-btn-connected" : isPending ? "connect-btn-pending" : ""}`}
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