import React from "react";
import { useTranslation } from "react-i18next";
import { getFlagUrl } from "../../utils/countryFlag";
import "./LanguageSwitcher.css";

// Bandeirinhas em vez de emoji de bandeira (Windows não renderiza esses
// emojis, ver countryFlag.js) — cada idioma suportado mapeado pro código de
// país cuja bandeira representa esse idioma na UI.
const LANGUAGE_OPTIONS = [
  { lng: "pt", flagCode: "br", label: "Português" },
  { lng: "en", flagCode: "us", label: "English" },
  { lng: "es", flagCode: "es", label: "Español" },
];

const LanguageSwitcher = ({ className = "", onLanguageChange }) => {
  const { i18n } = useTranslation();
  const currentLng = i18n.resolvedLanguage || i18n.language;

  const handleClick = (lng) => {
    i18n.changeLanguage(lng);
    onLanguageChange?.(lng);
  };

  return (
    <div className={`language-switcher ${className}`}>
      {LANGUAGE_OPTIONS.map((option) => (
        <button
          key={option.lng}
          type="button"
          className={`language-switcher-btn ${currentLng === option.lng ? "active" : ""}`}
          onClick={() => handleClick(option.lng)}
          aria-label={option.label}
          aria-pressed={currentLng === option.lng}
          title={option.label}
        >
          <img src={getFlagUrl(option.flagCode)} alt={option.label} />
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
