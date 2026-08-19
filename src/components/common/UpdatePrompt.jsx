import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { useRegisterSW } from "virtual:pwa-register/react";

// Registra o service worker e, quando o Workbox detecta um build novo
// (needRefresh), avisa o usuário em vez de trocar de versão em silêncio —
// só recarrega quando ele confirmar.
const UpdatePrompt = () => {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!needRefresh) return;

    Swal.fire({
      title: t("pwaUpdate.title"),
      text: t("pwaUpdate.text"),
      icon: "info",
      confirmButtonText: t("pwaUpdate.confirmButtonText"),
      showCancelButton: true,
      cancelButtonText: t("pwaUpdate.cancelButtonText"),
      confirmButtonColor: "#0A3251",
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        updateServiceWorker(true);
      } else {
        setNeedRefresh(false);
      }
    });
  }, [needRefresh, setNeedRefresh, t, updateServiceWorker]);

  return null;
};

export default UpdatePrompt;
