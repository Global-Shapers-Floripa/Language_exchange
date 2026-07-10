import React from "react";
import { useTranslation } from "react-i18next";
import "./sobre-projeto.css";
import BocaFoto from "../../assets/mouth-halftone-2.png";

const ConhecaProjeto = () => {
  const { t } = useTranslation("landing");

  return (
    <section id="sobre" className="sobre-container">
      <div className="sobre-content">

        {/* COLUNA ESQUERDA - TEXTOS */}
        <div className="sobre-left">
          <div className="sobre-tag">{t("about.tag")}</div>

          <h2 className="sobre-title">
            {t("about.titleLine1")} <br />
            <span className="highlight-orange">{t("about.titleHighlight")}</span> <br />
            {t("about.titleLine2")}
          </h2>

          <p className="sobre-text">
            {t("about.paragraph1")}
          </p>

          <p className="sobre-text">
            {t("about.paragraph2Text")} <strong>{t("about.paragraph2Highlight")}</strong>
          </p>

          {/* Imagem decorativa (Placeholder) */}
          <div className="sobre-decoration">
            <img
              src={BocaFoto}
              alt={t("about.decorationAlt")}
              className="decor-img"
            />
          </div>
        </div>

        {/* COLUNA DIREITA - BALÕES (BLOBS) */}
        <div className="sobre-right-grid">

          {/* Balão Laranja */}
          <div className="blob-card blob-orange">
            <h3 className="blob-title">{t("about.blobs.hubs.title")}</h3>
            <p className="blob-text">
              {t("about.blobs.hubs.text")}
            </p>
          </div>

          {/* Balão Azul Escuro */}
          <div className="blob-card blob-navy">
            <h3 className="blob-title blob-title-light">{t("about.blobs.safe.title")}</h3>
            <p className="blob-text blob-text-light">
              {t("about.blobs.safe.text")}
            </p>
          </div>

          {/* Balão Roxo */}
          <div className="blob-card blob-purple">
            <h3 className="blob-title">{t("about.blobs.competence.title")}</h3>
            <p className="blob-text">
              {t("about.blobs.competence.text")}
            </p>
          </div>

          {/* Balão Creme Claro */}
          <div className="blob-card blob-peach">
            <h3 className="blob-title">{t("about.blobs.network.title")}</h3>
            <p className="blob-text">
              {t("about.blobs.network.text")}
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};

export default ConhecaProjeto;