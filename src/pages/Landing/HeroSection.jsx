import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./hero.css";
import BackIdiomas from "../../assets/BackIdiomas.png";
import Boca from "../../assets/mouth-halftone-1.png";
import logoLanguageExchange from "../../assets/Logo-laranja.png";
import { Link } from "react-router-dom";
import HeroGlobe from "./Globo";
import LanguageSwitcher from "../../components/common/LanguageSwitcher";

const HeroSection = () => {
  const { t } = useTranslation("landing");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null); // Ref para o menu

  const closeMenu = () => setMenuOpen(false);

  // Fecha o menu ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <>
      {/* HEADER com a Ref adicionada */}
      <header className="site-landing-header" ref={menuRef}>
        <div className="site-container site-landing-nav">
          <Link
            to="/"
            onClick={() => {
              closeMenu();
              window.scrollTo({ top: 0, behavior: "smooth" }); // Faz a rolagem suave para o topo
            }}
            className="logo-container"
          >
            <img
              src={logoLanguageExchange}
              alt={t("hero.logoAlt")}
              className="logo-icon"
            />
            <span className="logo-text-header">
              LANGUAGE <br /> <span className="logo-highlight">EXCHANGE</span>
            </span>
          </Link>

          <nav className={`site-nav-links ${menuOpen ? "active" : ""}`}>
            <a href="#sobre" onClick={closeMenu}>
              {t("nav.about")}
            </a>
            <a href="#como-funciona" onClick={closeMenu}>
              {t("nav.howItWorks")}
            </a>
            <a href="#plataforma" onClick={closeMenu}>
              {t("nav.platform")}
            </a>
            <a href="#recursos" onClick={closeMenu}>
              {t("nav.resources")}
            </a>
            <a href="#faq" onClick={closeMenu}>
              {t("nav.faq")}
            </a>
            <a href="#contato" onClick={closeMenu}>
              {t("nav.contact")}
            </a>

            <Link
              to="/dashboard"
              className="site-mobile-cta"
              onClick={closeMenu}
            >
              <button className="site-cta-header">{t("nav.cta")}</button>
            </Link>
          </nav>

          <div className="site-navbar-right-actions">
            <LanguageSwitcher />

            <Link to="/dashboard" className="site-desktop-cta">
              <button className="site-cta-header">{t("nav.cta")}</button>
            </Link>

            <button
              className="site-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={t("nav.openMenu")}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="site-hero-section">
        <div className="site-container site-hero-grid">
          {/* Lado Esquerdo */}
          <div className="site-hero-left">
            <div className="site-subtitle-badge">
              <span className="site-badge-dot"></span>
              <span className="site-subtitle-text">
                {t("hero.badge")}
              </span>
            </div>

            <h1 className="site-hero-title">
              {t("hero.titlePrefix")}{" "}
              <span className="site-highlight-orange">{t("hero.titleHighlight")}</span>
              <br />
              {t("hero.titleSuffix")}
            </h1>

            <p className="site-description">
              {t("hero.description")}
            </p>

            <div className="site-hero-buttons">
              <Link to="/login">
                <button className="site-cta-banner-1">
                  {t("hero.primaryCta")}
                </button>
              </Link>
              <a href="#como-funciona" className="site-cta-banner-2">
                {t("hero.secondaryCta")}
              </a>
            </div>

            <div className="site-hero-stats">
              <div className="site-stat-item">
                <h3>+50</h3>
                <p>{t("hero.stats.hubs")}</p>
              </div>
              <div className="site-stat-divider"></div>
              <div className="site-stat-item">
                <h3>+20</h3>
                <p>{t("hero.stats.languages")}</p>
              </div>
              <div className="site-stat-divider last-divider"></div>
              <div className="site-stat-item">
                <h3>100%</h3>
                <p>{t("hero.stats.shapers")}</p>
              </div>
            </div>
          </div>

          {/* Lado Direito - Agora com o Globo Interativo! */}
          <div className="site-hero-right">
            <HeroGlobe />
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;
