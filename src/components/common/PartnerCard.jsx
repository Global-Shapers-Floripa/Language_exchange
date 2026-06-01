import React from "react";
import { MessageSquare, MapPin, Globe } from "lucide-react";
import { COUNTRIES } from "../../constants/countries";
import "./partner-card.css";

const PartnerCard = ({ partner, onConnect }) => {
  const isPerfectMatch =
  partner.compatibility === "Match Perfeito";

  console.log(
  partner.full_name,
  partner.matchScore,
  partner.compatibility
);

  // Busca o nome do país baseado no código (ex: "BR" -> "Brasil")
  const countryObj = COUNTRIES.find((c) => c.code === partner.country);
  const countryName = countryObj ? countryObj.name : "";

  // Define a URL da bandeira (se não tiver país, usa um fundo cinza/gradiente de fallback)
  const flagUrl = partner.country
    ? `https://flagcdn.com/w640/${partner.country.toLowerCase()}.png`
    : "";

  return (
    <div
      className={`partner-card ${isPerfectMatch ? "perfect-match-card" : ""}`}
    >
      {isPerfectMatch && (
        <div className="perfect-match-badge">Match Perfeito</div>
      )}

      {/* Banner da Bandeira */}
      <div
        className="flag-banner"
        style={{
          backgroundImage: flagUrl
            ? `url(${flagUrl})`
            : "linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)",
        }}
      ></div>

      {/* Avatar sobreposto */}
      <div className="avatar-container">
        <img
          src={
            partner.photo_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.full_name}`
          }
          alt={partner.full_name}
          className="partner-avatar"
        />
      </div>

      {/* Informações Principais */}
      <div className="partner-main-info">
  <h3 className="partner-name">{partner.full_name}</h3>

  <p className="partner-location">
    <MapPin size={16} color="#FF5A5F" />
    Hub {partner.hub || "Não definido"}
  </p>

  {countryName && (
    <p className="partner-country">
      <Globe size={15} color="#4A90E2" />
      {countryName}
    </p>
  )}
</div>

      <div className="divider"></div>

      {/* Idiomas */}
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
      style={{
        width: `${partner.matchScore}%`,
      }}
    />
  </div>
</div>

        {/* Botão Conectar */}
        <div className="card-footer">
          <button className="connect-btn" onClick={onConnect}>
            <MessageSquare size={18} />
            Conectar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerCard;
