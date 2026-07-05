import React, { useState } from "react";
import { X } from "lucide-react";
import "./WhatsAppBanner.css";

// Logo oficial do WhatsApp (lucide-react não tem ícones de marca)
const WhatsAppIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12.004 2C6.486 2 2 6.486 2 12.004c0 1.858.505 3.6 1.385 5.093L2 22l5.036-1.352a9.964 9.964 0 0 0 4.968 1.32h.004c5.518 0 10.004-4.486 10.004-10.004C22.012 6.486 17.522 2 12.004 2zm0 18.163h-.003a8.15 8.15 0 0 1-4.156-1.137l-.298-.177-3.09.828.826-3.012-.194-.309a8.146 8.146 0 0 1-1.253-4.35c0-4.505 3.667-8.172 8.172-8.172 2.184 0 4.236.85 5.78 2.396a8.12 8.12 0 0 1 2.39 5.78c-.002 4.506-3.669 8.153-8.174 8.153z" />
  </svg>
);

const STORAGE_KEY = "whatsappBannerClosed";
// TODO: substituir pelo link real do grupo antes de publicar
const WHATSAPP_GROUP_LINK = "COLOQUE_O_LINK_DO_GRUPO_AQUI";

const WhatsAppBanner = () => {
  const [closed, setClosed] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === "true"
  );

  if (closed) return null;

  const handleClose = () => {
    sessionStorage.setItem(STORAGE_KEY, "true");
    setClosed(true);
  };

  return (
    <div className="whatsapp-banner card--sticker">
      <button
        className="btn btn-ghost--icon whatsapp-banner-close"
        onClick={handleClose}
        aria-label="Fechar"
      >
        <X size={18} />
      </button>

      <div className="whatsapp-banner-content">
        <div className="whatsapp-banner-icon">
          <WhatsAppIcon width={28} height={28} />
        </div>

        <div className="whatsapp-banner-text">
          <h2>Toda a comunidade em um só lugar</h2>
          <p>
            Receba avisos, troque dicas e converse com quem também tá
            praticando idioma. Entra no grupo oficial do Language Exchange no
            WhatsApp.
          </p>
        </div>

        <a
          href={WHATSAPP_GROUP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="btn whatsapp-banner-cta btn--sticker"
        >
          Entrar no grupo
        </a>
      </div>
    </div>
  );
};

export default WhatsAppBanner;
