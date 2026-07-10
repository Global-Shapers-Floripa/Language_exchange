import React from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";

import privacyPolicyPt from "./privacy-policy.pt.md?raw";
import privacyPolicyEn from "./privacy-policy.en.md?raw";
import privacyPolicyEs from "./privacy-policy.es.md?raw";

// Texto jurídico final (LGPD) — nunca editar/parafrasear estes .md por aqui.
// As versões EN/ES já trazem embutido o aviso de "tradução de conveniência"
// apontando o PT como texto juridicamente vinculante (ver Cláusula 19 de
// cada versão); a PT não tem esse aviso, de propósito.
const PRIVACY_POLICY_BY_LANGUAGE = {
  pt: privacyPolicyPt,
  en: privacyPolicyEn,
  es: privacyPolicyEs,
};

// PT é a versão vinculante e a única com existência garantida — cai pra ela
// se o idioma atual (ou algum idioma futuro adicionado ao seletor) não
// tiver uma tradução correspondente aqui.
const PrivacyPolicyContent = () => {
  const { i18n } = useTranslation();
  const content =
    PRIVACY_POLICY_BY_LANGUAGE[i18n.resolvedLanguage] ||
    PRIVACY_POLICY_BY_LANGUAGE[i18n.language] ||
    PRIVACY_POLICY_BY_LANGUAGE.pt;

  return <ReactMarkdown>{content}</ReactMarkdown>;
};

export default PrivacyPolicyContent;
