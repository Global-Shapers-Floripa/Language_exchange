import React from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import BadgeMedallion from "./BadgeMedallion";
import "./BadgeDetailModal.css";

// Modal pequeno de detalhe de um badge — aberto ao clicar numa medalha,
// tanto na grade do próprio perfil (BadgeGrid) quanto no mural da
// Comunidade (BadgeWall). Recebe o mesmo formato de `achievement` usado
// pelo mural ({ profileId, name, photoUrl, badgeId, level }); no perfil,
// quem chama monta esse objeto a partir dos dados da própria conta.
const BadgeDetailModal = ({ achievement, onClose }) => {
  const { t } = useTranslation("constants");

  if (!achievement) return null;

  const badgeName = t(`badges.${achievement.badgeId}.name`);
  const description = t(`badges.${achievement.badgeId}.description`);

  return (
    <div className="badge-detail-modal-overlay" onClick={onClose}>
      <div
        className="badge-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="btn btn-ghost--icon badge-detail-modal-close"
          onClick={onClose}
        >
          <X size={22} />
        </button>

        <BadgeMedallion
          badgeId={achievement.badgeId}
          photoUrl={achievement.photoUrl}
          personId={achievement.profileId}
          personName={achievement.name}
          size={100}
        />

        <h3 className="badge-detail-modal-name">{badgeName}</h3>
        <p className="badge-detail-modal-person">{achievement.name}</p>
        <p className="badge-detail-modal-description">{description}</p>
      </div>
    </div>
  );
};

export default BadgeDetailModal;
