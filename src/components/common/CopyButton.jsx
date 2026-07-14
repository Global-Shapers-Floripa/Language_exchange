import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check } from "lucide-react";

// Botão de copiar reutilizável (ex: e-mail/telefone no PartnerModal). Mesmo
// padrão de feedback já usado em ReportIssueModal.jsx: troca o ícone por um
// check por 2s; se a API de clipboard falhar (sem suporte, permissão
// negada), só loga no console e não mostra a confirmação — não quebra a tela.
const CopyButton = ({ value, label = "", className = "" }) => {
  const { t } = useTranslation("dashboard");
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar para a área de transferência:", err);
    }
  };

  return (
    <button
      type="button"
      className={`contact-copy-btn ${copied ? "copied" : ""} ${className}`}
      onClick={handleCopy}
      aria-label={label ? t("copyButton.copyLabel", { label }) : t("copyButton.copy")}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
};

export default CopyButton;
