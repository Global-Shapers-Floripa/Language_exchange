import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Instagram, Linkedin, Youtube, Mail } from "lucide-react";
import "./footer.css";
import logoLanguageExchange from "../../assets/logo-azul-claro.png"; // Substitua pela logo correta

const Footer = () => {
  const { t } = useTranslation("landing");

  return (
    <footer className="site-footer">
      <div className="site-footer-container">

        {/* GRID PRINCIPAL */}
        <div className="site-footer-grid">

          {/* LADO ESQUERDO: Logo, Descrição e Redes Sociais */}
          <div className="site-footer-col site-col-left">
            <div className="site-footer-logo">
              <img src={logoLanguageExchange} alt={t("footer.logoAlt")} />
            </div>
            <p className="site-footer-desc">
              {t("footer.description")}
            </p>

            {/* Ícones das redes substituindo as hashtags */}
            <div className="site-social-icons">
              <a href="mailto:shapersfloripa@gmail.com" aria-label={t("footer.social.emailAria")} target="_blank" rel="noopener noreferrer">
                <Mail size={22} />
              </a>
              <a href="https://instagram.com/globalshapersfloripa" aria-label={t("footer.social.instagramAria")} target="_blank" rel="noopener noreferrer">
                <Instagram size={22} />
              </a>
              <a href="https://linkedin.com/company/globalshapersfloripa" aria-label={t("footer.social.linkedinAria")} target="_blank" rel="noopener noreferrer">
                <Linkedin size={22} />
              </a>
              <a href="https://youtube.com/@globalshapersfloripa" aria-label={t("footer.social.youtubeAria")} target="_blank" rel="noopener noreferrer">
                <Youtube size={22} />
              </a>
            </div>
          </div>

          {/* CENTRO: Navegação */}
          <div className="site-footer-col site-col-center">
            <h3 className="site-footer-title">{t("footer.navTitle")}</h3>
            <nav className="site-footer-nav">
              <a href="#sobre">{t("nav.about")}</a>
              <a href="#plataforma">{t("nav.platform")}</a>
              <a href="#como-funciona">{t("nav.howItWorks")}</a>
              <a
                href="https://www.globalshapersflorianopolis.com.br/"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("nav.hub")}
              </a>
              <a href="#faq">{t("nav.faq")}</a>
              <a href="#contato">{t("nav.contact")}</a>
            </nav>
          </div>

          {/* LADO DIREITO: Fale com a gente */}
          <div className="site-footer-col site-col-right">
            <h3 className="site-footer-title">{t("footer.contactTitle")}</h3>
            <div className="site-footer-contact-info">
              <p>Globalshapersflorianopolis@gmail.com</p>
            </div>
          </div>

        </div>

        {/* BARRA INFERIOR: Direitos e Créditos */}
        <div className="site-footer-bottom">
          <p className="site-copyright">
            {t("footer.copyright")}
          </p>
          <p className="site-credits">
            <Trans
              i18nKey="footer.credits"
              t={t}
              components={[
                <a
                  key="0"
                  href="https://www.globalshapersflorianopolis.com.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                />,
              ]}
            />
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;