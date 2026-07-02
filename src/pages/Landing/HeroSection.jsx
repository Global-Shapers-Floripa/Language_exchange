import React, { useState, useEffect, useRef } from "react";
import "./hero.css";
import BackIdiomas from "../../assets/BackIdiomas.png";
import Boca from "../../assets/mouth-halftone-1.png";
import Call from "../../assets/photo-call.jpg";
import logoLanguageExchange from "../../assets/Logo-laranja.png";
import { Link } from "react-router-dom";
import HeroGlobe from "./Globo";

const HeroSection = () => {
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
              alt="Language Exchange Icon"
              className="logo-icon"
            />
            <span className="logo-text-header">
              LANGUAGE <br /> <span className="logo-highlight">EXCHANGE</span>
            </span>
          </Link>

          <nav className={`site-nav-links ${menuOpen ? "active" : ""}`}>
            <a href="#sobre" onClick={closeMenu}>
              Sobre
            </a>
            <a href="#como-funciona" onClick={closeMenu}>
              Como funciona
            </a>
            <a href="#plataforma" onClick={closeMenu}>
              Plataforma
            </a>
            <a href="#recursos" onClick={closeMenu}>
              Recursos
            </a>
            <a href="#faq" onClick={closeMenu}>
              FAQ
            </a>
            <a href="#contato" onClick={closeMenu}>
              Contato
            </a>

            <Link
              to="/dashboard"
              className="site-mobile-cta"
              onClick={closeMenu}
            >
              <button className="site-cta-header">Faça Parte</button>
            </Link>
          </nav>

          <div className="site-navbar-right-actions">
            <Link to="/dashboard" className="site-desktop-cta">
              <button className="site-cta-header">Faça Parte</button>
            </Link>

            <button
              className="site-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Abrir menu"
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
                HUB FLORIANÓPOLIS • DESDE JUL/2025
              </span>
            </div>

            <h1 className="site-hero-title">
              FROM <span className="site-highlight-orange">WORDS</span>
              <br />
              TO WORLDS.
            </h1>

            <p className="site-description">
              Um projeto do Hub Florianópolis que conecta Global Shapers do
              mundo inteiro para praticar idiomas, trocar cultura e construir
              uma rede que atravessa fronteiras — uma conversa de cada vez.
            </p>

            <div className="site-hero-buttons">
              <Link to="/login">
                <button className="site-cta-banner-1">
                  Comece a conversar
                </button>
              </Link>
              <a href="#como-funciona" className="site-cta-banner-2">
                Como funciona?
              </a>
            </div>

            <div className="site-hero-stats">
              <div className="site-stat-item">
                <h3>+40</h3>
                <p>hubs alcançados</p>
              </div>
              <div className="site-stat-divider"></div>
              <div className="site-stat-item">
                <h3>7</h3>
                <p>idiomas ativos</p>
              </div>
              <div className="site-stat-divider last-divider"></div>
              <div className="site-stat-item">
                <h3>100%</h3>
                <p>feito por Shapers</p>
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
