import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check } from "lucide-react";
import "./ReportIssueModal.css";

const SUPPORT_EMAIL = "globalshapersflorianopolis@gmail.com";

const ReportIssueModal = ({ onClose }) => {
  const { t } = useTranslation("dashboard");
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

        <h2>{t("reportIssueModal.title")}</h2>

        <p>
          {t("reportIssueModal.paragraph1")}
        </p>
        <p>
          {t("reportIssueModal.paragraph2")}
        </p>
        <p>{t("reportIssueModal.emailPrompt")}</p>

        <div className="report-issue-email-box">
          <span className="report-issue-email">{SUPPORT_EMAIL}</span>
          <button className="btn btn-primary" onClick={handleCopyEmail}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? t("copyButton.copied") : t("copyButton.copyLabel", { label: t("reportIssueModal.emailWord") })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportIssueModal;
