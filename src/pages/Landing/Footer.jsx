import React from "react";
import { Instagram, Linkedin, Youtube, Mail } from "lucide-react";
import "./footer.css";
import logoLanguageExchange from "../../assets/Logo-laranja.png"; // Substitua pela logo correta

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-footer-container">
        
        {/* GRID PRINCIPAL */}
        <div className="site-footer-grid">
          
          {/* LADO ESQUERDO: Logo, Descrição e Redes Sociais */}
          <div className="site-footer-col site-col-left">
            <div className="site-footer-logo">
              <img src={logoLanguageExchange} alt="Language Exchange" />
            </div>
            <p className="site-footer-desc">
              Uma iniciativa do Global Shapers Florianópolis para conectar culturas através da conversa real.
            </p>
            
            {/* Ícones das redes substituindo as hashtags */}
            <div className="site-social-icons">
              <a href="mailto:shapersfloripa@gmail.com" aria-label="E-mail" target="_blank" rel="noopener noreferrer">
                <Mail size={22} />
              </a>
              <a href="https://instagram.com/globalshapersfloripa" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <Instagram size={22} />
              </a>
              <a href="https://linkedin.com/company/globalshapersfloripa" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <Linkedin size={22} />
              </a>
              <a href="https://youtube.com/@globalshapersfloripa" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
                <Youtube size={22} />
              </a>
            </div>
          </div>

          {/* CENTRO: Navegação */}
          <div className="site-footer-col site-col-center">
            <h3 className="site-footer-title">NAVEGAÇÃO</h3>
            <nav className="site-footer-nav">
              <a href="#sobre">Sobre</a>
              <a href="#plataforma">Plataforma</a>
              <a href="#mapa">Mapa</a>
              <a href="#hub">Hub Floripa</a>
              <a href="#faq">FAQ</a>
              <a href="#contato">Contato</a>
            </nav>
          </div>

          {/* LADO DIREITO: Fale com a gente */}
          <div className="site-footer-col site-col-right">
            <h3 className="site-footer-title">FALE COM A GENTE</h3>
            <div className="site-footer-contact-info">
              <p>shapersfloripa@gmail.com</p>
              <p>@globalshapersfloripa</p>
            </div>
          </div>

        </div>

        {/* BARRA INFERIOR: Direitos e Créditos */}
        <div className="site-footer-bottom">
          <p className="site-copyright">
            Todos os direitos reservados. Global Shapers Florianópolis 2026.
          </p>
          <p className="site-credits">
            Feito com ❤️ por <a href="#" target="_blank" rel="noopener noreferrer">Global Shapers Florianópolis</a>
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;