import React from "react";
import { useTranslation } from "react-i18next";
import "./plataforma-site.css";
import imgDashboard from "../../assets/dash-plataforma.jpg";
import imgConexoes from "../../assets/conexoes-plataforma.jpg";

const PlataformaSection = () => {
  const { t } = useTranslation("landing");

  return (
    <section className="site-plataforma-wrapper" id="plataforma">
      <div className="site-plataforma-container">

        {/* COLUNA ESQUERDA: Título, Introdução e Números */}
        <div className="site-plataforma-left">

          {/* Cabeçalho no padrão "Como Funciona" */}
          <span className="site-tag-plataforma">{t("platform.tag")}</span>
          <h2 className="site-title-plataforma">
            {t("platform.titleLine1")}<br />
            <span className="site-highlight-orange">{t("platform.titleHighlight")}</span>
          </h2>

          <p className="site-intro-plataforma">
            {t("platform.intro")}
          </p>

          {/* Mini-Blobs de Estatísticas (Pequenos e discretos) */}
          <div className="site-stats-compact">
            <div className="site-mini-blob site-blob-orange">
              <span className="site-stat-val">150+</span>
              <span className="site-stat-lbl">{t("platform.stats.countries.label")}</span>
              <p className="site-stat-txt">{t("platform.stats.countries.text")}</p>
            </div>

            <div className="site-mini-blob site-blob-purple">
              <span className="site-stat-val">500+</span>
              <span className="site-stat-lbl">{t("platform.stats.hubs.label")}</span>
              <p className="site-stat-txt">{t("platform.stats.hubs.text")}</p>
            </div>

            <div className="site-mini-blob site-blob-navy">
              <span className="site-stat-val">1</span>
              <span className="site-stat-lbl">{t("platform.stats.community.label")}</span>
              <p className="site-stat-txt">{t("platform.stats.community.text")}</p>
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA: Cards com screenshots das telas */}
        <div className="site-plataforma-right">

          {/* Cards compactos com as funcionalidades */}
          <div className="site-features-compact">

            <div className="site-feature-card">
              <div className="site-feat-header">
                <div className="site-feat-num">1</div>
                <div className="site-feat-content">
                  <h4>{t("platform.features.impact.title")}</h4>
                  <p>{t("platform.features.impact.text")}</p>
                </div>
              </div>
              <div className="site-feat-media">
                <img
                  src={imgDashboard}
                  alt={t("platform.features.impact.imgAlt")}
                  className="site-feat-img"
                />
              </div>
            </div>

            <div className="site-feature-card">
              <div className="site-feat-header">
                <div className="site-feat-num">2</div>
                <div className="site-feat-content">
                  <h4>{t("platform.features.match.title")}</h4>
                  <p>{t("platform.features.match.text")}</p>
                </div>
              </div>
              <div className="site-feat-media">
                <img
                  src={imgConexoes}
                  alt={t("platform.features.match.imgAlt")}
                  className="site-feat-img"
                />
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default PlataformaSection;