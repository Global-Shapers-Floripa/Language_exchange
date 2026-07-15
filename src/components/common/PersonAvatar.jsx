import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "./PersonAvatar.css";

// Sem foto própria, cai num avatar DiceBear (estilo "thumbs" — formas
// abstratas com "polegar", nunca parece rosto humano real) usando o id do
// usuário como seed, pra cada pessoa sempre receber o mesmo avatar.
//
// `size` define largura/altura inline (usado onde não há uma classe de CSS
// já cuidando disso); `className` deixa o chamador reaproveitar um estilo
// existente (borda, sombra, tamanho responsivo, etc.).
//
// `clickable` (default true) abre um modal com a foto ampliada ao clicar —
// só quando há `photoUrl` real, nunca no placeholder DiceBear. Único lugar
// que desliga isso é o avatar da sidebar/header (DashboardLayout), porque lá
// o clique já navega para /profile (editar foto).
const PersonAvatar = ({ photoUrl, seed, name, size, className = "", clickable = true }) => {
  const { t } = useTranslation("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasPhoto = Boolean(photoUrl);
  const isEnlargeable = hasPhoto && clickable;
  const src =
    photoUrl ||
    `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed || name || "user")}`;

  const handleAvatarClick = (e) => {
    if (!isEnlargeable) return;
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <img
        src={src}
        alt={name || t("personAvatar.defaultAlt")}
        className={`person-avatar-img${isEnlargeable ? " person-avatar-img--clickable" : ""}${className ? ` ${className}` : ""}`}
        style={size ? { width: size, height: size } : undefined}
        onClick={handleAvatarClick}
        loading="lazy"
      />

      {/* Portal pra document.body: cards com transform no hover (.card--hoverable,
          .partner-card) viram containing block de descendentes position:fixed,
          o que prendia esse modal dentro dos limites/cantos do card. */}
      {isModalOpen &&
        createPortal(
          <div className="person-avatar-modal-overlay" onClick={closeModal}>
            <div
              className="person-avatar-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="person-avatar-modal-close"
                onClick={closeModal}
                aria-label={t("personAvatar.closeModal")}
              >
                ✕
              </button>
              <img
                src={photoUrl}
                alt={name || t("personAvatar.enlargedAlt")}
                className="person-avatar-modal-img"
                loading="lazy"
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default PersonAvatar;
