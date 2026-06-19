import React, { useState } from "react";
import "./styles.css";
import "./hero.css"; // Assumindo que os estilos do banner estão aqui
import logoLanguageExchange from "../../assets/logo-LanguageExchange.svg";
import { MapPin, UserPlus, Globe } from "lucide-react";
import SobreSection from "./Sobre-projeto";
import { Link } from "react-router-dom";

const HeroSection = () => {
  // Estado para controlar o menu hambúrguer no mobile
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* Header isolado da Hero - Agora com o design Glassmorphism */}
      <header className="landing-header">
        <div className="container landing-nav">
          <Link to="/" onClick={closeMenu}>
            <img
              src={logoLanguageExchange}
              alt="Language Exchange Logo"
              className="logo-nav"
            />
          </Link>

          <nav className={`nav-links ${menuOpen ? "active" : ""}`}>
            <a href="#projeto" onClick={closeMenu}>O Projeto</a>
            <a href="#como-funciona" onClick={closeMenu}>Como funciona</a>
            <a href="#faq" onClick={closeMenu}>Perguntas Frequentes</a>
            <a href="#contato" onClick={closeMenu}>Contato</a>

            {/* Botão Faça Parte aparece dentro do menu no celular */}
            <Link to="/dashboard" className="mobile-cta" onClick={closeMenu}>
              <button className="cta-header">Faça parte</button>
            </Link>
          </nav>

          {/* Grupo da direita (Botão Desktop + Hambúrguer) */}
          <div className="navbar-right-actions">
            <Link to="/dashboard" className="desktop-cta">
              <button className="cta-header">Faça parte</button>
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

      {/* Hero Section focada apenas no Banner (Conteúdo intacto) */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="subtitle-badge">
              <Globe className="subtitle-icon" size={16} />
              <span className="subtitle-text">HUB FLORIANÓPOLIS, BRAZIL</span>
            </div>
            <h1 className="hero-title">
              Language <span className="highlight">Exchange</span>
            </h1>
            <p className="quote">"From words to worlds"</p>
            <p className="description">
              Expanda seus horizontes através da conexão cultural. Encontre
              Shapers ao redor do mundo para praticar novos idiomas e fortalecer
              nossa comunidade global.
            </p>
            <div className="hero-buttons">
              <Link to="/login">
                <button className="cta-banner-1">
                  <UserPlus size={20} strokeWidth={2.5} />
                  Começar agora
                </button>
              </Link>
              <a href="#projeto" className="cta-banner-2">
                Saiba mais
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;