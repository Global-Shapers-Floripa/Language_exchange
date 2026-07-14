import React from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, MapPin, Globe, Clock, UserCheck, Eye, CalendarPlus, Star } from "lucide-react";
import { COUNTRIES } from "../../constants/countries";
import { getLanguageCodeByName } from "../../constants/languages";
import PersonAvatar from "./PersonAvatar";
import { parseLanguageString, formatLanguageLabel } from "../../utils/languageLevel";
import "./partner-card.css";

// viewOnly: usado por "Minhas Conexões" (Parceiros.jsx), que reaproveita este
// card mas troca a ação do botão para abrir os dados da conexão já aceita
// em vez de solicitar conexão.
// exploreOnly: usado no Dashboard, onde a solicitação de conexão não deve
// acontecer — o botão só leva o usuário até a página de conexões.
// onToggleFavorite/isFavorited: só usados em "Minhas Conexões" — quando
// presente, exibe a estrela de favoritar no canto do card.
const PartnerCard = ({ partner, onConnect, onRegisterSession, sentRequest, isConnected, viewOnly, exploreOnly, isFavorited, onToggleFavorite }) => {
  const { t } = useTranslation("constants");
  const { t: tp } = useTranslation("partners");
  // Comparação com o valor bruto calculado por matchService.js — não é
  // texto de UI, não traduzir (só o badge exibido abaixo é traduzido).
  const isPerfectMatch = partner.compatibility === "Match Perfeito";
  const isPending = sentRequest?.status === "pendente";

  // Conexões vêm da tabela com speaks/learns em string; parceiros da busca já
  // chegam com os arrays prontos (ver usePartners) — aceitamos os dois casos.
  const speaksArray = partner.speaksArray || parseLanguageString(partner.speaks);
  const learnsArray = partner.learnsArray || parseLanguageString(partner.learns);

  // profiles.speaks/learns armazenam o NOME em português (não o code) — ver
  // CLAUDE.md. Acha o code a partir do nome já salvo, pra traduzir só a
  // exibição sem tocar no valor armazenado.
  const translatedLanguageLabel = (item) => {
    const code = getLanguageCodeByName(item.name);
    return formatLanguageLabel(
      code ? { ...item, name: t(`languages.${code}`) } : item,
    );
  };

  // Busca o nome do país baseado no código (ex: "BR" -> "Brasil")
  const countryObj = COUNTRIES.find((c) => c.code === partner.country);
  const countryName = countryObj ? t(`countries.${countryObj.code}`) : "";

  // Usa formato SVG para garantir máxima qualidade independente do tamanho
  const flagUrl = partner.country
    ? `https://flagcdn.com/${partner.country.toLowerCase()}.svg`
    : "";

  return (
    <div
      className={`card--partner partner-card ${isPerfectMatch ? "perfect-match-card" : ""}`}
    >
      {isPerfectMatch && (
        <div className="perfect-match-badge">{tp("card.perfectMatch")}</div>
      )}

      {onToggleFavorite && (
        <button
          type="button"
          className="favorite-star-btn"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          title={isFavorited ? tp("card.removeFavorite") : tp("card.addFavorite")}
        >
          <Star size={18} color="#F97316" fill={isFavorited ? "#F97316" : "none"} />
        </button>
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
                alt={tp("card.flagAlt", { country: countryName })}
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
                title={tp("card.matchScoreTooltip")}
              >
                {tp("card.matchScore", { score: partner.matchScore })}
              </span>
            )}
          </div>

          <div className="partner-location-row">
            <p
              className="partner-location"
              title={`${tp("card.hub")} ${partner.hub || tp("card.notDefined")}${countryName ? `, ${countryName}` : ""}`}
            >
              <MapPin size={14} color="#FF5A5F" />

              <span className="partner-location-text">
                {tp("card.hub")} {partner.hub || tp("card.notDefined")}
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
          <span className="section-title-card">{tp("card.speaks")}</span>
          <div className="tags-card">
            {speaksArray.length > 0 ? (
              speaksArray.map((lang) => (
                <span key={lang.name} className="tag-card orange">
                  {translatedLanguageLabel(lang)}
                </span>
              ))
            ) : (
              <span className="tag-card-empty">{tp("card.notInformed")}</span>
            )}
          </div>
        </div>

        <div className="partner-section-card">
          <span className="section-title-card">{tp("card.learns")}</span>
          <div className="tags-card">
            {learnsArray.length > 0 ? (
              learnsArray.map((lang) => (
                <span key={lang.name} className="tag-card blue">
                  {translatedLanguageLabel(lang)}
                </span>
              ))
            ) : (
              <span className="tag-card-empty">{tp("card.notInformed")}</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer (Botão) — não existe no modo exploreOnly (preview do Dashboard) */}
      {!exploreOnly && (
        <div className={`card-footer ${viewOnly && onRegisterSession ? "card-footer--split" : ""}`}>
          <button
            className={`connect-btn ${viewOnly && onRegisterSession ? "connect-btn--half" : ""} ${!viewOnly && isConnected ? "connect-btn-connected" : !viewOnly && isPending ? "connect-btn-pending" : ""}`}
            onClick={onConnect}
          >
            {viewOnly ? (
              <>
                <Eye size={18} />
                {tp("card.actions.data")}
              </>
            ) : isConnected ? (
              <>
                <UserCheck size={18} />
                {tp("card.actions.connected")}
              </>
            ) : isPending ? (
              <>
                <Clock size={18} />
                {tp("card.actions.pending")}
              </>
            ) : (
              <>
                <MessageSquare size={18} />
                {tp("card.actions.connect")}
              </>
            )}
          </button>

          {viewOnly && onRegisterSession && (
            <button className="connect-btn connect-btn--half" onClick={onRegisterSession}>
              <CalendarPlus size={18} />
              {tp("card.actions.session")}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PartnerCard;
