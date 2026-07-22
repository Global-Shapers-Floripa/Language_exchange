import React from "react";
import PersonAvatar from "./PersonAvatar";
import { getBadgeDefinition } from "../../constants/badges";
import "./BadgeMedallion.css";

// Visual do "medalhão" de badge, compartilhado entre BadgeGrid (perfil),
// BadgeWall (mural da Comunidade) e BadgeDetailModal — por padrão, dois
// círculos do mesmo tamanho levemente sobrepostos: foto da pessoa por
// baixo, círculo colorido do badge (gradiente + textura pontilhada, cor
// própria por tipo de badge) por cima. `clickable={false}` no avatar: o
// círculo do ícone sobrepõe parte da foto, então abrir o modal de ampliar
// foto aqui seria um alvo de clique confuso/pequeno — quem usa este
// componente já cuida do próprio clique (abrir o BadgeDetailModal).
//
// `showPhoto={false}` (usado por BadgeGrid, no próprio perfil): omite o
// círculo da foto — lá é sempre a foto do dono do perfil olhando pro
// próprio perfil, então a sobreposição foto+badge seria redundante; mostra
// só o círculo do badge, centralizado (sem a sobreposição negativa, que só
// faz sentido quando há uma foto por baixo pra sobrepor).
const BadgeMedallion = ({
  badgeId,
  photoUrl,
  personId,
  personName,
  size = 80,
  showPhoto = true,
}) => {
  const { icon: Icon, colors } = getBadgeDefinition(badgeId);

  // Proporções herdadas do desenho original (ícone ~34px num círculo de
  // 80px, sobreposição de ~25px num círculo de 80px) — mantidas como razão
  // pra continuar consistente se o tamanho variar (ex.: modal maior).
  const iconSize = Math.round(size * 0.425);
  const overlap = showPhoto ? Math.round(size * 0.3125) : 0;

  return (
    <div className="badge-medallion">
      {showPhoto && (
        <PersonAvatar
          photoUrl={photoUrl}
          seed={personId}
          name={personName}
          size={size}
          clickable={false}
          className="badge-medallion-photo"
        />
      )}
      <div
        className="badge-medallion-icon"
        style={{
          width: size,
          height: size,
          marginLeft: -overlap,
          "--badge-light": colors.light,
          "--badge-base": colors.base,
          "--badge-dark": colors.dark,
        }}
      >
        <Icon size={iconSize} />
      </div>
    </div>
  );
};

export default BadgeMedallion;
