import React from "react";
import { Mail, Instagram, Linkedin, Youtube } from "lucide-react";
import "./duvidas-sugestoes.css";
import HubFloripa from "../../assets/hub-floripa.png"; 


const ContactSection = () => {
  return (
    <section className="site-contact-wrapper" id="contato">
      <div className="site-contact-container">

        {/* LADO ESQUERDO - Nossos Contatos e Redes */}
        <div className="site-contact-left">
          <span className="site-contact-tag">// CONTATO</span>
          <h2 className="site-contact-title">ENTRE EM CONTATO</h2>
          <p className="site-contact-description">
            Tem alguma dúvida sobre o Language Exchange ou quer saber mais sobre o Global Shapers? Mande uma mensagem!
          </p>

          <div className="site-contact-links">
            <a href="mailto:shapersfloripa@gmail.com" className="site-contact-item">
              <div className="site-contact-icon"><Mail size={22} /></div>
              <div className="site-contact-text">
                <h4>E-MAIL</h4>
                <p>globalshapersflorianopolis@gmail.com</p>
              </div>
            </a>

            <a href="https://instagram.com/globalshapersfloripa" target="_blank" rel="noopener noreferrer" className="site-contact-item">
              <div className="site-contact-icon"><Instagram size={22} /></div>
              <div className="site-contact-text">
                <h4>INSTAGRAM</h4>
                <p>@globalshapersfloripa</p>
              </div>
            </a>

            <a href="https://linkedin.com/company/globalshapersfloripa" target="_blank" rel="noopener noreferrer" className="site-contact-item">
              <div className="site-contact-icon"><Linkedin size={22} /></div>
              <div className="site-contact-text">
                <h4>LINKEDIN</h4>
                <p>Global Shapers Florianópolis</p>
              </div>
            </a>

            <a href="https://youtube.com/@globalshapersfloripa" target="_blank" rel="noopener noreferrer" className="site-contact-item">
              <div className="site-contact-icon"><Youtube size={22} /></div>
              <div className="site-contact-text">
                <h4>YOUTUBE</h4>
                <p>Global Shapers Florianópolis</p>
              </div>
            </a>
          </div>
        </div>

        {/* LADO DIREITO - Sobre o Hub Idealizador */}
        <div className="site-contact-right">
          <div className="site-hub-card">
            
            <div className="site-hub-content">
              <h3 className="site-hub-title">
                CONHEÇA O <span className="site-highlight-orange">HUB IDEALIZADOR</span> DO PROJETO
              </h3>
              
              <p className="site-hub-text">
                Mais do que uma plataforma de idiomas, somos um movimento. O Language Exchange nasceu da vontade do Global Shapers Florianópolis de conectar culturas e democratizar oportunidades. Somos uma rede de jovens líderes trabalhando voluntariamente para criar impacto real. Venha conhecer os rostos por trás dessa iniciativa e nossos outros projetos!
              </p>
              
              <a href="https://instagram.com/globalshapersfloripa" target="_blank" rel="noopener noreferrer" className="site-hub-button">
                Conheça o Hub Floripa &rarr;
              </a>
            </div>

            {/* Imagem compacta no rodapé do card (se não gostar, basta remover esta div) */}
            <div className="site-hub-image-wrapper">
              <img 
                src={HubFloripa} 
                alt="Equipe Hub Florianópolis" 
                className="site-hub-img" 
              />
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default ContactSection;