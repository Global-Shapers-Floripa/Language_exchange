import React from "react";
import { useTranslation } from "react-i18next";
import { Mail, Instagram, Linkedin, Youtube } from "lucide-react";
import "./duvidas-sugestoes.css";
import HubFloripa from "../../assets/hub-floripa.png";


const ContactSection = () => {
  const { t } = useTranslation("landing");

  return (
    <section className="site-contact-wrapper" id="contato">
      <div className="site-contact-container">

        {/* LADO ESQUERDO - Nossos Contatos e Redes */}
        <div className="site-contact-left">
          <span className="site-contact-tag">{t("contact.tag")}</span>
          <h2 className="site-contact-title">{t("contact.title")}</h2>
          <p className="site-contact-description">
            {t("contact.description")}
          </p>

          <div className="site-contact-links">
            <a href="mailto:shapersfloripa@gmail.com" className="site-contact-item">
              <div className="site-contact-icon"><Mail size={22} /></div>
              <div className="site-contact-text">
                <h4>{t("contact.email.label")}</h4>
                <p>globalshapersflorianopolis@gmail.com</p>
              </div>
            </a>

            <a href="https://instagram.com/globalshapersfloripa" target="_blank" rel="noopener noreferrer" className="site-contact-item">
              <div className="site-contact-icon"><Instagram size={22} /></div>
              <div className="site-contact-text">
                <h4>{t("contact.instagram.label")}</h4>
                <p>@globalshapersfloripa</p>
              </div>
            </a>

            <a href="https://linkedin.com/company/globalshapersfloripa" target="_blank" rel="noopener noreferrer" className="site-contact-item">
              <div className="site-contact-icon"><Linkedin size={22} /></div>
              <div className="site-contact-text">
                <h4>{t("contact.linkedin.label")}</h4>
                <p>Global Shapers Florianópolis</p>
              </div>
            </a>

            <a href="https://youtube.com/@globalshapersfloripa" target="_blank" rel="noopener noreferrer" className="site-contact-item">
              <div className="site-contact-icon"><Youtube size={22} /></div>
              <div className="site-contact-text">
                <h4>{t("contact.youtube.label")}</h4>
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
                {t("contact.hubCard.titlePrefix")} <span className="site-highlight-orange">{t("contact.hubCard.titleHighlight")}</span> {t("contact.hubCard.titleSuffix")}
              </h3>

              <p className="site-hub-text">
                {t("contact.hubCard.text")}
              </p>

              <a href="https://instagram.com/globalshapersfloripa" target="_blank" rel="noopener noreferrer" className="site-hub-button">
                {t("contact.hubCard.cta")} &rarr;
              </a>
            </div>

            {/* Imagem compacta no rodapé do card (se não gostar, basta remover esta div) */}
            <div className="site-hub-image-wrapper">
              <img
                src={HubFloripa}
                alt={t("contact.hubCard.imgAlt")}
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