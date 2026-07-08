import React, { useState } from "react";
import "./ConfirmModal.css";

// Modal de confirmação genérico para ações destrutivas/importantes —
// substitui o confirm() nativo do navegador em qualquer fluxo do projeto.
const ConfirmModal = ({
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onClose,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

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
            {cancelText}
          </button>
          <button
            className="btn btn-danger"
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? "Aguarde..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
