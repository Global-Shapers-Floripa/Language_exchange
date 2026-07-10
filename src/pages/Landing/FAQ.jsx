import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Minus } from "lucide-react";
import "./faq.css";

const FAQ_KEYS = ["0", "1", "2", "3"];

const FaqSection = () => {
  const { t } = useTranslation("landing");
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = FAQ_KEYS.map((key) => ({
    question: t(`faq.items.${key}.question`),
    answer: t(`faq.items.${key}.answer`),
  }));

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="site-faq-wrapper" id="faq">
      <div className="site-faq-container">

        {/* LADO ESQUERDO - Títulos */}
        <div className="site-faq-left">
          <span className="site-faq-tag">{t("faq.tag")}</span>
          <h2 className="site-faq-title">
            {t("faq.titleLine1")} <br />
            {t("faq.titleLine2")} <span className="site-highlight-orange">{t("faq.titleHighlight")}</span>
          </h2>
          <p className="site-faq-description">
            {t("faq.description")}
          </p>
        </div>

        {/* LADO DIREITO - Sanfona de Perguntas */}
        <div className="site-faq-right">
          <div className="site-faq-list">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`site-faq-item ${activeIndex === index ? "active" : ""}`}
                onClick={() => toggleAccordion(index)}
              >
                <div className="site-faq-question">
                  <h3>{faq.question}</h3>
                  <div className="site-faq-icon">
                    {activeIndex === index ? (
                      <Minus size={18} strokeWidth={2.5} />
                    ) : (
                      <Plus size={18} strokeWidth={2.5} />
                    )}
                  </div>
                </div>
                <div className="site-faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default FaqSection;