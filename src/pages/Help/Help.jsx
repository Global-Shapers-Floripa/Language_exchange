import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  HelpCircle,
  Mail,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Globe,
  Calendar,
  Video,
  Languages,
  BookOpen,
  Volume2,
  Clock3,
} from "lucide-react";

import "./help.css";

const Help = () => {
  const { t } = useTranslation("dashboard");
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: t("helpPage.faqs.match.question"),
      answer: t("helpPage.faqs.match.answer"),
    },
    {
      question: t("helpPage.faqs.logSessions.question"),
      answer: t("helpPage.faqs.logSessions.answer"),
    },
    {
      question: t("helpPage.faqs.multipleLanguages.question"),
      answer: t("helpPage.faqs.multipleLanguages.answer"),
    },
    {
      question: t("helpPage.faqs.editInfo.question"),
      answer: t("helpPage.faqs.editInfo.answer"),
    },
    {
      question: t("helpPage.faqs.report.question"),
      answer: t("helpPage.faqs.report.answer"),
    },
    {
      question: t("helpPage.faqs.deleteSession.question"),
      answer: t("helpPage.faqs.deleteSession.answer"),
    },
  ];


  const toggleFaq = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <DashboardLayout>
      <div className="help-container">
        <div className="help-header">
          <h2>{t("helpPage.title")}</h2>
          <p>
            {t("helpPage.subtitle")}
          </p>
        </div>

        {/* FAQ */}
        <div className="card card--help help-card">
          <div className="section-title">
            <HelpCircle size={22} />
            <h3>{t("helpPage.faqTitle")}</h3>
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-item ${activeIndex === index ? "active" : ""}`}
              >
                <button
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.question}</span>

                  {activeIndex === index ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>

                {activeIndex === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>


        {/* CONTATO */}
        <section className="help-contact-section">
          <h3>{t("helpPage.moreHelpTitle")}</h3>

          <p>
            {t("helpPage.moreHelpText")}
          </p>

          <div className="contact-info-card">
            <div className="contact-icon-circle">
              <Mail size={20} />
            </div>
            <div>
              <span>{t("helpPage.supportEmailLabel")}</span>
              <strong>Globalshapersflorianopolis@gmail.com</strong>
            </div>
          </div>

         
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Help;
