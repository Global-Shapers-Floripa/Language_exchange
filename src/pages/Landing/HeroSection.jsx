import React from "react";
import "./styles.css";
import "./hero.css";
//import logoGlobalShapers from "../../assets/logo-azul-GSF.svg";
import logoLanguageExchange from "../../assets/logo-LanguageExchange.svg";
import { MapPin } from "lucide-react";
import { UserPlus } from "lucide-react";
import { Globe } from "lucide-react";

import SobreSection from "./Sobre-projeto";

import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <>
      {/* Header isolado da Hero */}
      <header className="landing-header">
        <div className="container">
          <nav className="landing-nav">
            <img
              src={logoLanguageExchange}
              alt="Global Shapers Logo"
              className="logo-nav"
            />
            <div className="nav-links">
              <a href="#projeto">O Projeto</a>
              <a href="#como-funciona">Como funciona</a>
              <a href="#nosso-hub">Hub Florianópolis</a>
              <a href="#contato">Contato</a>
            </div>
            <Link to="/dashboard">
              <button className="cta-header">Faça parte</button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section focada apenas no Banner */}
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
