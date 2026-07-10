import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import "./Cta.css";

const CtaSection = () => {
  const { t } = useTranslation("landing");

  return (
    <section className="site-cta-wrapper">
      <div className="site-cta-container">
        {/* Textos Centralizados */}
        <div className="site-cta-text-content">
          <h2 className="site-cta-title">{t("cta.title")}</h2>
          <p className="site-cta-subtitle">
            {t("cta.subtitle")}
          </p>
        </div>

        {/* Container que permite a linha vazar a tela */}
        <div className="site-cta-overflow-container">
          <div className="site-cta-buttons-row">
         <div className="site-cta-btn-ghost">Join us</div> {/* Inglês */}
            <div className="site-cta-btn-ghost">Rejoignez-nous</div>{" "}
            {/* Francês */}
            <div className="site-cta-btn-ghost">함께 하세요</div>{" "}
            {/* Coreano - NOVO */}
            <div className="site-cta-btn-ghost">Bize katılın</div> {/* Turco */}
            <div className="site-cta-btn-ghost">انضم إلينا</div>{" "}
            {/* Árabe - NOVO */}
            <div className="site-cta-btn-ghost">Unisciti a noi</div>{" "}
            {/* Italiano */}
            <div className="site-cta-btn-ghost">Únete a nosotros</div>{" "}
            {/* Espanhol (Duplicado no snippet para layout) */}
            <div className="site-cta-btn-ghost">Mach mit</div> {/* Alemão */}
            <div className="site-cta-btn-ghost">加入我们</div>{" "}
            {/* Chinês - NOVO */}
            {/* Botão Principal */}
            <Link to="/dashboard" className="site-cta-btn-main">
              {t("cta.button")}
            </Link>
            <div className="site-cta-btn-ghost">Join us</div> {/* Inglês */}
            <div className="site-cta-btn-ghost">Rejoignez-nous</div>{" "}
            {/* Francês */}
            <div className="site-cta-btn-ghost">함께 하세요</div>{" "}
            {/* Coreano - NOVO */}
            <div className="site-cta-btn-ghost">Bize katılın</div> {/* Turco */}
            <div className="site-cta-btn-ghost">انضم إلينا</div>{" "}
            {/* Árabe - NOVO */}
             <div className="site-cta-btn-ghost">Unisciti a noi</div>{" "}
            {/* Italiano */}
            <div className="site-cta-btn-ghost">Únete a nosotros</div>{" "}
            {/* Espanhol (Duplicado no snippet para layout) */}
            <div className="site-cta-btn-ghost">Mach mit</div> {/* Alemão */}
            <div className="site-cta-btn-ghost">加入我们</div>{" "}
            {/* Chinês - NOVO */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
