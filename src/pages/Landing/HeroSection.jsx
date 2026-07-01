import React, { useState } from "react";
import "./hero.css"; 
import BackIdiomas from "../../assets/BackIdiomas.png";
import Boca from "../../assets/mouth-halftone-1.png";
import Call from "../../assets/photo-call.jpg";
import logoLanguageExchange from "../../assets/logo-LanguageExchange.svg";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* HEADER */}
      <header className="site-landing-header">
        <div className="site-container site-landing-nav">
          
          {/* Logo limpa, apenas a imagem */}
          <Link to="/" onClick={closeMenu} className="logo-container">
            {/* Imagem do logo (ícone) e o texto ao lado */}
            <img
              src={logoLanguageExchange}
              alt="Language Exchange Icon"
              className="logo-icon"
            />
            <span className="logo-text-header">
              LANGUAGE <br /> <span className="logo-highlight">EXCHANGE</span>
            </span>
          </Link>

          {/* Navegação atualizada com todas as sessões */}
          <nav className={`site-nav-links ${menuOpen ? "active" : ""}`}>
            <a href="#sobre" onClick={closeMenu}>Sobre</a>
            <a href="#como-funciona" onClick={closeMenu}>Como funciona</a>
            <a href="#plataforma" onClick={closeMenu}>Plataforma</a>
            <a href="#recursos" onClick={closeMenu}>Recursos</a>
            <a href="#faq" onClick={closeMenu}>FAQ</a>
            <a href="#contato" onClick={closeMenu}>Contato</a>

            {/* CTA Mobile */}
            <Link to="/dashboard" className="site-mobile-cta" onClick={closeMenu}>
              <button className="site-cta-header">Faça Parte</button>
            </Link>
          </nav>

          <div className="site-navbar-right-actions">
            {/* CTA Desktop com efeito de pressionar */}
            <Link to="/dashboard" className="site-desktop-cta">
              <button className="site-cta-header">Faça Parte</button>
            </Link>

            {/* Menu Hamburger */}
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
          
          {/* Lado Esquerdo - Textos e Botões */}
          <div className="site-hero-left">
            <div className="site-subtitle-badge">
              <span className="site-badge-dot"></span>
              <span className="site-subtitle-text">HUB FLORIANÓPOLIS • DESDE JUL/2025</span>
            </div>
            
            <h1 className="site-hero-title">
              FROM <span className="site-highlight-orange">WORDS</span><br />
              TO WORLDS.
            </h1>
            
            <p className="site-description">
              Um projeto do Hub Florianópolis que conecta Global Shapers do mundo inteiro para praticar idiomas, trocar cultura e construir uma rede que atravessa fronteiras — uma conversa de cada vez.
            </p>
            
            <div className="site-hero-buttons">
              {/* Botão Principal com o mesmo efeito Neo-brutalista */}
              <Link to="/login">
                <button className="site-cta-banner-1">
                  Comece a conversar
                </button>
              </Link>
              <a href="#como-funciona" className="site-cta-banner-2">
                Como funciona?
              </a>
            </div>

            {/* Seção de Estatísticas */}
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
              <div className="site-stat-divider"></div>
              <div className="site-stat-item">
                <h3>100%</h3>
                <p>feito por Shapers</p>
              </div>
            </div>
          </div>

          {/* Lado Direito - Imagens Flutuantes (Mantidas intactas) */}
          <div className="site-hero-right">
            <img src={BackIdiomas} alt="Main" className="site-img-main-circle" />
            <img src={Call} alt="Small" className="site-img-small-circle" />
            <img src={Boca} alt="Badge" className="site-img-floating-badge" />
            <img src={Boca} alt="Mouth decoration" className="site-img-floating-mouth" />
           {/* <div className="site-decorative-dark-circle"></div> */}
          </div>

        </div>
      </section>
    </>
  );
};

export default HeroSection;