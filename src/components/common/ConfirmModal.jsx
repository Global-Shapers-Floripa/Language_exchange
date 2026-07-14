import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./ConfirmModal.css";

// Modal de confirmação genérico para ações destrutivas/importantes —
// substitui o confirm() nativo do navegador em qualquer fluxo do projeto.
const ConfirmModal = ({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onClose,
}) => {
  const { t } = useTranslation("dashboard");
  const [isConfirming, setIsConfirming] = useState(false);

  const effectiveConfirmText = confirmText || t("confirmModal.confirm");
  const effectiveCancelText = cancelText || t("confirmModal.cancel");

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div
        className="card confirm-modal dotted-texture"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="confirm-modal-actions">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isConfirming}
          >
            {effectiveCancelText}
          </button>
          <button
            className="btn btn-danger"
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? t("confirmModal.confirming") : effectiveConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
