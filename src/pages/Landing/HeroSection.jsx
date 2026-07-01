import React, { useState } from "react";
import "./styles.css";
import "./hero.css"; 
import logoLanguageExchange from "../../assets/logo-LanguageExchange.svg";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="landing-header">
        <div className="container landing-nav">
          <Link to="/" onClick={closeMenu} className="logo-container">
            {/* Imagem do logo (ícone) e o texto ao lado */}
            <img
              src={logoLanguageExchange}
              alt="Language Exchange Icon"
              className="logo-icon"
            />
            <span className="logo-text">
              LANGUAGE <span className="logo-highlight">EXCHANGE</span>
            </span>
          </Link>

          <nav className={`nav-links ${menuOpen ? "active" : ""}`}>
            <a href="#sobre" onClick={closeMenu}>Sobre</a>
            <a href="#como-funciona" onClick={closeMenu}>Como funciona</a>
            <a href="#recursos" onClick={closeMenu}>Recursos</a>
            <a href="#faq" onClick={closeMenu}>FAQ</a>

            <Link to="/dashboard" className="mobile-cta" onClick={closeMenu}>
              <button className="cta-header">Comece a conversa</button>
            </Link>
          </nav>

          <div className="navbar-right-actions">
            <Link to="/dashboard" className="desktop-cta">
              <button className="cta-header">Comece a conversa</button>
            </Link>

            <button
              className="hamburger"
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

      <section className="hero-section">
        <div className="container hero-grid">
          
          {/* Lado Esquerdo - Textos e Botões */}
          <div className="hero-left">
            <div className="subtitle-badge">
              <span className="badge-dot"></span>
              <span className="subtitle-text">HUB FLORIANÓPOLIS • DESDE JUL/2025</span>
            </div>
            
            <h1 className="hero-title">
              FROM <span className="highlight-orange">WORDS</span><br />
              TO WORLDS.
            </h1>
            
            <p className="description">
              Um projeto do Hub Florianópolis que conecta Global Shapers do mundo inteiro para praticar idiomas, trocar cultura e construir uma rede que atravessa fronteiras — uma conversa de cada vez.
            </p>
            
            <div className="hero-buttons">
              <Link to="/login">
                <button className="cta-banner-1">
                  Quero entrar pra próxima rodada &rarr;
                </button>
              </Link>
              <a href="#projeto" className="cta-banner-2">
                Ver como rola
              </a>
            </div>

            {/* Seção de Estatísticas */}
            <div className="hero-stats">
              <div className="stat-item">
                <h3>+40</h3>
                <p>hubs alcançados</p>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <h3>7</h3>
                <p>idiomas ativos</p>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <h3>100%</h3>
                <p>feito por Shapers</p>
              </div>
            </div>
          </div>

          {/* Lado Direito - Imagens Flutuantes */}
          <div className="hero-right">
            {/* Placeholder da foto principal grande */}
            <img src={logoLanguageExchange} alt="Main" className="img-main-circle" />
            
            {/* Placeholder da foto redonda menor sobreposta */}
            <img src={logoLanguageExchange} alt="Small" className="img-small-circle" />
            
            {/* Placeholder da tag laranja flutuante */}
            <img src={logoLanguageExchange} alt="Badge" className="img-floating-badge" />
            
            {/* Placeholder da boca flutuante no fundo */}
            <img src={logoLanguageExchange} alt="Mouth decoration" className="img-floating-mouth" />
            
            {/* Círculo decorativo azul escuro no canto inferior direito */}
            <div className="decorative-dark-circle"></div>
          </div>

        </div>
      </section>
    </>
  );
};

export default HeroSection;