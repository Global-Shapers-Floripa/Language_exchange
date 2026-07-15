import React from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import "./ProficiencyTestBanner.css";
// TODO: Gabi vai fornecer a imagem final aqui — por enquanto reaproveita o
// megafone do WhatsAppBanner só como placeholder de posição/proporção.
import Lupa from "../../assets/lupa.png"


// EF (mesma marca do EF SET), com testes gratuitos em 8 idiomas — a pessoa
// escolhe o idioma que está aprendendo na própria página.
const EF_TEST_LINK = "https://www.ef.edu/test/";

// Banner permanente (sem botão de fechar) — diferente do WhatsAppBanner, que
// pode ser dispensado e lembra a escolha via sessionStorage.
const ProficiencyTestBanner = () => {
  const { t } = useTranslation("dashboard");

  return (
    <div className="proficiency-test-banner">
      <img
        src={Lupa}
        alt=""
        className="proficiency-test-banner-decor"
      />

      <div className="proficiency-test-banner-content">
        <div className="proficiency-test-banner-text">
          <h2>{t("resourcesPage.proficiencyTestBanner.title")}</h2>
          <p>{t("resourcesPage.proficiencyTestBanner.text")}</p>
        </div>

        <a
          href={EF_TEST_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="btn proficiency-test-banner-cta"
        >
          {t("resourcesPage.proficiencyTestBanner.cta")} <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
};

export default ProficiencyTestBanner;
