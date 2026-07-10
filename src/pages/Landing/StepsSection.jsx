import React from "react";
import { useTranslation, Trans } from "react-i18next";
import "./steps-section.css";
import BocaTopo from "../../assets/mouth-halftone-1.png";

const STEP_KEYS = [
  { number: "01", key: "0", colorClass: "blob-step-orange" },
  { number: "02", key: "1", colorClass: "blob-step-cream" },
  { number: "03", key: "2", colorClass: "blob-step-purple" },
  { number: "04", key: "3", colorClass: "blob-step-orange-alt" },
];

const ComoFunciona = () => {
  const { t } = useTranslation("landing");

  return (
    <section className="como-section-wrapper" id="como-funciona">
      {/* Imagem decorativa (Boquinha no canto) */}
      <img
        src={BocaTopo}
        alt={t("steps.decorationAlt")}
        className="mouth-decoration"
      />

      <div className="como-inner-content">
        {/* Header da Seção */}
        <div className="como-header">
          <span className="como-tag">{t("steps.tag")}</span>
          <h2 className="como-title">
            {t("steps.titleLine1")}<br />
            <span className="highlight-orange">{t("steps.titleHighlight")}</span>
          </h2>
        </div>

        {/* Grid dos Passos */}
        <div className="como-steps-container">
          {/* Linha pontilhada de fundo */}
          <div className="dotted-line"></div>

          <div className="como-steps">
            {STEP_KEYS.map((step) => (
              <div key={step.key} className="step-column">

                {/* Balão com o Número */}
                <div className={`step-blob ${step.colorClass}`}>
                  <span className="step-label">{t("steps.stepLabel")}</span>
                  <span className="step-number-card">{step.number}</span>
                </div>

                {/* Textos do Passo */}
                <h3 className="step-title">{t(`steps.items.${step.key}.title`)}</h3>
                <p className="step-description">
                  <Trans
                    i18nKey={`steps.items.${step.key}.description`}
                    t={t}
                    components={[<strong key="0" />, <strong key="1" />]}
                  />
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComoFunciona;