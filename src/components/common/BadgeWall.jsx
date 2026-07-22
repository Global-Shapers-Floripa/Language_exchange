import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import BadgeMedallion from "./BadgeMedallion";
import BadgeDetailModal from "./BadgeDetailModal";
import "./BadgeWall.css";

// Um medalhão por combinação (pessoa, badge) — ver useCommunityBadges.js.
// Clicável: abre o mesmo BadgeDetailModal usado na grade do perfil
// (BadgeGrid.jsx), passando o próprio `achievement` recebido.
const BadgeMedal = ({ achievement, onSelect }) => {
  const { t } = useTranslation("constants");
  const { t: td } = useTranslation("dashboard");

  const badgeName = t(`badges.${achievement.badgeId}.name`);

  return (
    <div
      className="badge-medal"
      role="button"
      tabIndex={0}
      aria-label={td("badgeWall.medalAria", {
        name: achievement.name,
        badge: badgeName,
      })}
      onClick={() => onSelect(achievement)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(achievement);
        }
      }}
    >
      <BadgeMedallion
        badgeId={achievement.badgeId}
        photoUrl={achievement.photoUrl}
        personId={achievement.profileId}
        personName={achievement.name}
        size={80}
      />

      <p className="badge-medal-name">{badgeName}</p>
      <p className="badge-medal-person">{achievement.name}</p>
    </div>
  );
};

const BadgeWall = ({ achievements, hasMore, loading, onLoadMore }) => {
  const { t } = useTranslation("dashboard");
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  if (loading) {
    return (
      <div className="badge-wall-section">
        <h2 className="badge-wall-title">{t("badgeWall.sectionTitle")}</h2>
        {/* .loading-message é a classe do CONTAINER (flex, min-height:300px
            — ver comunidade.css/parceiros.css/sessoes.css), não do <p> em
            si; sem o wrapper, o texto ficava com uma altura mínima enorme
            e vazia embutida nele. */}
        <div className="loading-message">
          <p>{t("badgeWall.loading")}</p>
        </div>
      </div>
    );
  }

  if (achievements.length === 0) {
    return null;
  }

  return (
    <div className="badge-wall-section">
      <h2 className="badge-wall-title">{t("badgeWall.sectionTitle")}</h2>
      <p className="badge-wall-subtitle">{t("badgeWall.subtitle")}</p>

      <div className="badge-wall-grid">
        {achievements.map((achievement) => (
          <BadgeMedal
            key={`${achievement.profileId}-${achievement.badgeId}`}
            achievement={achievement}
            onSelect={setSelectedAchievement}
          />
        ))}
      </div>

      {hasMore && (
        <button type="button" className="btn btn-secondary badge-wall-load-more" onClick={onLoadMore}>
          {t("badgeWall.loadMore")}
        </button>
      )}

      <BadgeDetailModal
        achievement={selectedAchievement}
        onClose={() => setSelectedAchievement(null)}
      />
    </div>
  );
};

export default BadgeWall;
