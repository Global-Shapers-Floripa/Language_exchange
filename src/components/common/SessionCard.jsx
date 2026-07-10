import React from "react";
import { ArrowLeftRight, Calendar, Clock, Languages, Globe2, Lock } from "lucide-react";
import PersonAvatar from "./PersonAvatar";
import { getFlagUrl } from "../../utils/countryFlag";
import "./SessionCard.css";

// Card de sessão compartilhado entre Comunidade.jsx (feed público) e
// Sessoes.jsx (Minhas Sessões) — mesmo layout nos dois lugares: foto em
// cima, os dois participantes no meio (com ícone de troca no centro) e
// data/duração/idiomas no rodapé. Extraído pra não duplicar esse layout,
// mesmo cuidado já tomado com matchService.js/usePartners.js.
const AVATAR_SIZE = {
  md: 60,
  lg: 88,
};

const SessionCardPerson = ({ person, size = "md" }) => {
  const flagUrl = getFlagUrl(person.countryCode);
  const sizeModifier = size === "lg" ? " session-card-person--lg" : "";

  return (
    <div className={`session-card-person${sizeModifier}`}>
      <PersonAvatar
        photoUrl={person.photoUrl}
        seed={person.id}
        name={person.name}
        size={AVATAR_SIZE[size]}
        className="session-card-person-avatar"
      />
      <p className="session-card-person-name">{person.name}</p>
      {person.hub && <p className="session-card-person-hub">{person.hub}</p>}
      {flagUrl && (
        <img
          src={flagUrl}
          alt={person.countryCode}
          className="session-card-person-flag"
        />
      )}
    </div>
  );
};

// Bloco "os dois participantes + ícone de troca no meio", reaproveitado
// também pelos modais de detalhe (Sessoes.jsx e CommunitySessionModal) pra
// não duplicar esse layout fora do card. `size="lg"` dá mais destaque a esse
// bloco dentro dos modais de detalhe, sem afetar o card da lista/grade, que
// continua usando o tamanho padrão ("md").
export const SessionCardPeople = ({ personA, personB, size = "md" }) => (
  <div
    className={`session-card-v2-people${size === "lg" ? " session-card-v2-people--lg" : ""}`}
  >
    <SessionCardPerson person={personA} size={size} />
    <span
      className={`session-card-v2-swap-icon${size === "lg" ? " session-card-v2-swap-icon--lg" : ""}`}
    >
      <ArrowLeftRight size={size === "lg" ? 24 : 18} />
    </span>
    <SessionCardPerson person={personB} size={size} />
  </div>
);

const STATUS_BADGES = {
  pending: {
    label: "Aguardando aprovação",
    className: "session-card-badge--pending",
  },
  public: {
    label: "Pública",
    className: "session-card-badge--public",
    icon: Globe2,
  },
  private: {
    label: "Privada",
    className: "session-card-badge--private",
    icon: Lock,
  },
};

const SessionCard = ({
  photoUrl,
  personA,
  personB,
  date,
  duration,
  languages,
  statusBadge,
  onClick,
}) => {
  const languageList = (languages || "")
    .split(",")
    .map((lang) => lang.trim())
    .filter(Boolean);

  const badge = statusBadge ? STATUS_BADGES[statusBadge] : null;
  const BadgeIcon = badge?.icon;

  return (
    <div
      className="card card--session card--hoverable session-card-v2"
      onClick={onClick}
    >
      <div className="session-card-v2-photo">
        {photoUrl ? (
          <img src={photoUrl} alt="Foto da sessão" />
        ) : (
          <div className="session-card-v2-photo-placeholder">Sem foto</div>
        )}

        {badge && (
          <span className={`session-card-badge ${badge.className}`}>
            {BadgeIcon && <BadgeIcon size={14} />}
            {badge.label}
          </span>
        )}
      </div>

      <SessionCardPeople personA={personA} personB={personB} />

      <div className="session-card-v2-info">
        <span>
          <Calendar size={14} />
          {date}
        </span>
        <span>
          <Clock size={14} />
          {duration} min
        </span>
        {languageList.length > 0 && (
          <span className="session-card-v2-languages">
            <Languages size={14} />
            {languageList.map((lang, index) => (
              <span key={index} className="lang-badge">
                {lang}
              </span>
            ))}
          </span>
        )}
      </div>
    </div>
  );
};

export default SessionCard;
