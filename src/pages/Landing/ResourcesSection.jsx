import React from "react";
import { useTranslation } from "react-i18next";
import "./resources-section.css";

const RESOURCE_KEYS = [
  { id: 1, key: "guide", colorClass: "site-blob-peach" },
  { id: 2, key: "icebreakers", colorClass: "site-blob-purple" },
  { id: 3, key: "useful", colorClass: "site-blob-orange" },
];

const ResourcesSection = () => {
  const { t } = useTranslation("landing");

  return (
    <section className="site-resources-wrapper" id="recursos">
      <div className="site-resources-container">

        {/* Header isolado */}
        <div className="site-resources-header">
          <div className="site-header-left">
            <span className="site-section-tag">{t("resourcesSection.tag")}</span>
            <h2 className="site-section-title">
              {t("resourcesSection.titleLine1")} <br />
              {t("resourcesSection.titleLine2")}
            </h2>
          </div>
          <div className="site-header-right">
            <p className="site-section-description">
              {t("resourcesSection.description")}
            </p>
          </div>
        </div>

        {/* Grid dos Recursos isolado */}
        <div className="site-resources-grid">
          {RESOURCE_KEYS.map((item) => (
            <div key={item.id} className={`site-resource-blob ${item.colorClass}`}>
              <div className="site-blob-content">
                <span className="site-card-tag">{t(`resourcesSection.items.${item.key}.tag`)}</span>
                <h3 className="site-card-title">{t(`resourcesSection.items.${item.key}.title`)}</h3>
                <p className="site-card-description">{t(`resourcesSection.items.${item.key}.description`)}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default ResourcesSection;