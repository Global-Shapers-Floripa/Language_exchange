import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import "./ReportIssueModal.css";

const SUPPORT_EMAIL = "globalshapersflorianopolis@gmail.com";

const ReportIssueModal = ({ onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar e-mail:", err);
    }
  };

  return (
    <div className="report-issue-modal-overlay" onClick={onClose}>
      <div className="report-issue-modal" onClick={(e) => e.stopPropagation()}>
        <button className="btn btn-ghost--icon close-modal-btn" onClick={onClose}>
          ✕
        </button>

        <h2>Estamos aqui pra te ouvir</h2>

        <p>
          Se algo numa conversa ou sessão te deixou desconfortável —
          desrespeito, comportamento inadequado ou qualquer coisa que não
          condiz com o que a nossa comunidade espera — queremos saber.
        </p>
        <p>
          Todo relato é tratado com cuidado e sigilo. Nossa equipe analisa a
          situação com calma e, se for preciso, entra em contato pra entender
          melhor o que aconteceu. Não existe relato pequeno demais — se algo
          te incomodou, vale a pena nos contar.
        </p>
        <p>Manda um e-mail pra gente:</p>

        <div className="report-issue-email-box">
          <span className="report-issue-email">{SUPPORT_EMAIL}</span>
          <button className="btn btn-primary" onClick={handleCopyEmail}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copiado!" : "Copiar e-mail"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportIssueModal;
