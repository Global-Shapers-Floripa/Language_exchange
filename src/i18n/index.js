import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ptCommon from "./locales/pt/common.json";
import ptLanding from "./locales/pt/landing.json";
import ptAuth from "./locales/pt/auth.json";
import ptDashboard from "./locales/pt/dashboard.json";
import ptProfile from "./locales/pt/profile.json";
import ptPartners from "./locales/pt/partners.json";
import ptConstants from "./locales/pt/constants.json";

import enCommon from "./locales/en/common.json";
import enLanding from "./locales/en/landing.json";
import enAuth from "./locales/en/auth.json";
import enDashboard from "./locales/en/dashboard.json";
import enProfile from "./locales/en/profile.json";
import enPartners from "./locales/en/partners.json";
import enConstants from "./locales/en/constants.json";

import esCommon from "./locales/es/common.json";
import esLanding from "./locales/es/landing.json";
import esAuth from "./locales/es/auth.json";
import esDashboard from "./locales/es/dashboard.json";
import esProfile from "./locales/es/profile.json";
import esPartners from "./locales/es/partners.json";
import esConstants from "./locales/es/constants.json";

export const SUPPORTED_LANGUAGES = ["pt", "en", "es"];
export const NAMESPACES = [
  "common",
  "landing",
  "auth",
  "dashboard",
  "profile",
  "partners",
  "constants",
];

const resources = {
  pt: {
    common: ptCommon,
    landing: ptLanding,
    auth: ptAuth,
    dashboard: ptDashboard,
    profile: ptProfile,
    partners: ptPartners,
    constants: ptConstants,
  },
  en: {
    common: enCommon,
    landing: enLanding,
    auth: enAuth,
    dashboard: enDashboard,
    profile: enProfile,
    partners: enPartners,
    constants: enConstants,
  },
  es: {
    common: esCommon,
    landing: esLanding,
    auth: esAuth,
    dashboard: esDashboard,
    profile: esProfile,
    partners: esPartners,
    constants: esConstants,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: "en",
    defaultNS: "common",
    ns: NAMESPACES,

    detection: {
      order: ["querystring", "localStorage", "navigator"],
      lookupQuerystring: "lng",
      caches: ["localStorage"],
    },

    interpolation: {
      escapeValue: false, // React já escapa por padrão
    },
  });

export default i18n;
