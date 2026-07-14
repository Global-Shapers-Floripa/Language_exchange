import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, ShieldAlert } from "lucide-react";
import "./ReportBanner.css";

const STORAGE_KEY = "reportBannerClosed";

// Mesmo design/estrutura do WhatsAppBanner (layout, cores, espaçamento) —
// só muda texto, ícone e ação (abre o ReportIssueModal em vez de um link externo).
const ReportBanner = ({ onReportClick }) => {
  const { t } = useTranslation("dashboard");
  const [closed, setClosed] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === "true",
  );

  if (closed) return null;

  const handleClose = () => {
    sessionStorage.setItem(STORAGE_KEY, "true");
    setClosed(true);
  };

  return (
    <div className="report-banner">
      <ShieldAlert className="report-banner-decor" />

      <button
        className="report-banner-close"
        onClick={handleClose}
        aria-label={t("whatsAppBanner.close")}
      >
        <X size={12} />
      </button>

      <div className="report-banner-content">
        <div className="report-banner-text">
          <h2>{t("reportBanner.title")}</h2>
          <p>
            {t("reportBanner.text")}
          </p>
        </div>

        <button
          type="button"
          className="btn report-banner-cta"
          onClick={onReportClick}
        >
          <ShieldAlert width={28} height={28} />
          {t("reportBanner.cta")}
        </button>
      </div>
    </div>
  );
};

export default ReportBanner;
