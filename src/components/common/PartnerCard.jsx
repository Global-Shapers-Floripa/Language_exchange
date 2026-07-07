import React from "react";
import { MessageSquare, MapPin, Globe, Clock, UserCheck, Eye } from "lucide-react";
import { COUNTRIES } from "../../constants/countries";
import PersonAvatar from "./PersonAvatar";
import "./partner-card.css";

// viewOnly: usado por "Minhas Conexões" (Parceiros.jsx), que reaproveita este
// card mas troca a ação do botão para abrir os dados da conexão já aceita
// em vez de solicitar conexão.
// exploreOnly: usado no Dashboard, onde a solicitação de conexão não deve
// acontecer — o botão só leva o usuário até a página de conexões.
const PartnerCard = ({ partner, onConnect, sentRequest, isConnected, viewOnly, exploreOnly }) => {
  const isPerfectMatch = partner.compatibility === "Match Perfeito";
  const isPending = sentRequest?.status === "pendente";

  // Conexões vêm da tabela com speaks/learns em string; parceiros da busca já
  // chegam com os arrays prontos (ver usePartners) — aceitamos os dois casos.
  const speaksArray =
    partner.speaksArray ||
    (partner.speaks ? partner.speaks.split(",").map((s) => s.trim()).filter(Boolean) : []);
  const learnsArray =
    partner.learnsArray ||
    (partner.learns ? partner.learns.split(",").map((l) => l.trim()).filter(Boolean) : []);

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
            {typeof partner.matchScore === "number" && (
              <span
                className="match-badge-pill"
                title="A compatibilidade é calculada com base nos idiomas que você fala, idiomas que deseja aprender e proximidade de hub."
              >
                {partner.matchScore}% Match
              </span>
            )}
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
            {speaksArray.length > 0 ? (
              speaksArray.map((lang) => (
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
            {learnsArray.length > 0 ? (
              learnsArray.map((lang) => (
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

      {/* Footer (Botão) — não existe no modo exploreOnly (preview do Dashboard) */}
      {!exploreOnly && (
        <div className="card-footer">
          <button
            className={`connect-btn ${!viewOnly && isConnected ? "connect-btn-connected" : !viewOnly && isPending ? "connect-btn-pending" : ""}`}
            onClick={onConnect}
          >
            {viewOnly ? (
              <>
                <Eye size={18} />
                Ver dados
              </>
            ) : isConnected ? (
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
      )}
    </div>
  );
};

export default PartnerCard;
