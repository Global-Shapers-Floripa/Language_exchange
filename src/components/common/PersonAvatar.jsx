import React from "react";
import { useTranslation } from "react-i18next";
import "./PersonAvatar.css";

// Sem foto própria, cai num avatar DiceBear (estilo "thumbs" — formas
// abstratas com "polegar", nunca parece rosto humano real) usando o id do
// usuário como seed, pra cada pessoa sempre receber o mesmo avatar.
//
// `size` define largura/altura inline (usado onde não há uma classe de CSS
// já cuidando disso); `className` deixa o chamador reaproveitar um estilo
// existente (borda, sombra, tamanho responsivo, etc.).
const PersonAvatar = ({ photoUrl, seed, name, size, className = "" }) => {
  const { t } = useTranslation("dashboard");
  const src =
    photoUrl ||
    `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed || name || "user")}`;

  return (
    <img
      src={src}
      alt={name || t("personAvatar.defaultAlt")}
      className={`person-avatar-img${className ? ` ${className}` : ""}`}
      style={size ? { width: size, height: size } : undefined}
    />
  );
};

export default PersonAvatar;
