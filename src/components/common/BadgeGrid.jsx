import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import BadgeMedallion from "./BadgeMedallion";
import BadgeDetailModal from "./BadgeDetailModal";
import { getBadgeDefinition } from "../../constants/badges";
import "./BadgeGrid.css";

// Grade de badges da página de Perfil (própria conta). Cada badge chega já
// AVALIADO (achieved/level/progresso) de quem chama — este componente só
// cuida da apresentação: colorido quando conquistado (com pontinhos de
// nível, se o badge tiver níveis) ou cinza/opaco quando não. Descrição/
// progresso não aparecem soltos no card — só dentro do BadgeDetailModal,
// aberto ao clicar. `showPhoto={false}` no medalhão: é sempre a foto do
// próprio dono do perfil, então a sobreposição foto+badge (útil no mural da
// Comunidade, onde cada medalha é de uma pessoa diferente) seria redundante
// aqui — mostra só o círculo do badge.
const BadgeGrid = ({ badges, person }) => {
  const { t } = useTranslation("constants");
  const { t: tp } = useTranslation("profile");
  const [selectedBadge, setSelectedBadge] = useState(null);

  return (
    <div className="badge-grid">
      {badges.map((badge) => {
        const name = t(`badges.${badge.id}.name`);
        const description = t(`badges.${badge.id}.description`);

        const ariaLabel = !badge.achieved
          ? tp("badges.lockedAria", { name })
          : badge.levelsTotal
            ? `${tp("badges.unlockedAria", { name })} — ${tp("badges.levelLabel", {
                level: badge.level,
                total: badge.levelsTotal,
              })}`
            : tp("badges.unlockedAria", { name });

        // .badge-card-dot--filled usa var(--badge-base) — precisa ficar
        // disponível num ancestral, já que BadgeMedallion só seta essa
        // custom property no próprio círculo do ícone dela, não aqui fora.
        const { colors } = getBadgeDefinition(badge.id);

        return (
          <div
            key={badge.id}
            role="button"
            tabIndex={0}
            className={`badge-card${badge.achieved ? " badge-card--achieved" : " badge-card--locked"}`}
            title={description}
            aria-label={ariaLabel}
            style={{ "--badge-base": colors.base }}
            onClick={() => setSelectedBadge(badge)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedBadge(badge);
              }
            }}
          >
            <BadgeMedallion badgeId={badge.id} showPhoto={false} size={80} />
            <p className="badge-card-name">{name}</p>

            {badge.achieved && badge.levelsTotal && (
              <div className="badge-card-dots" aria-hidden="true">
                {Array.from({ length: badge.levelsTotal }).map((_, index) => (
                  <span
                    key={index}
                    className={`badge-card-dot${index < badge.level ? " badge-card-dot--filled" : ""}`}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      <BadgeDetailModal
        achievement={
          selectedBadge && {
            profileId: person.id,
            name: person.name,
            photoUrl: person.photoUrl,
            badgeId: selectedBadge.id,
            level: selectedBadge.achieved ? selectedBadge.level : null,
          }
        }
        onClose={() => setSelectedBadge(null)}
      />
    </div>
  );
};

export default BadgeGrid;
