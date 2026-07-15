import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ProficiencyTestBanner from "../../components/common/ProficiencyTestBanner";
import {
  Book,
  MessageCircle,
  Globe,
  Calendar,
  ExternalLink,
  Download,
  X,
} from "lucide-react";
import "./recursos.css";
import {
  HelpCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  Video,
  Languages,
  BookOpen,
  Volume2,
  Clock3,
} from "lucide-react";

const Resources = () => {
  const { t } = useTranslation("dashboard");
  const [selectedResource, setSelectedResource] = useState(null);

  // Exatamente 4 recursos mapeando para os 4 PDFs da sua pasta — mesmo
  // conteúdo (título/descrição) da prévia em Dashboard.jsx, então reaproveita
  // as chaves de dashboardPage.resourcesPreview.items em vez de duplicar.
  const resourceList = [
    {
      title: t("dashboardPage.resourcesPreview.items.feedback.title"),
      desc: t("dashboardPage.resourcesPreview.items.feedback.desc"),
      icon: <Book size={24} className="icon-blue" />,
      pdfUrl: "/Recursos-PDF/guia-feedback.pdf",
    },
    {
      title: t("dashboardPage.resourcesPreview.items.icebreakers.title"),
      desc: t("dashboardPage.resourcesPreview.items.icebreakers.desc"),
      icon: <MessageCircle size={24} className="icon-purple" />,
      pdfUrl: "/Recursos-PDF/quebragelos.pdf",
    },
    {
      title: t("dashboardPage.resourcesPreview.items.translationToolkit.title"),
      desc: t("dashboardPage.resourcesPreview.items.translationToolkit.desc"),
      icon: <Globe size={24} className="icon-green" />,
      pdfUrl: "/Recursos-PDF/traducoes.pdf",
    },
    {
      title: t("dashboardPage.resourcesPreview.items.scheduling.title"),
      desc: t("dashboardPage.resourcesPreview.items.scheduling.desc"),
      icon: <Calendar size={24} className="icon-orange" />,
      pdfUrl: "/Recursos-PDF/guia-agendamento.pdf",
    },
  ];

  // Nomes de ferramentas são marcas/nomes próprios — não traduzidos, só a descrição.
  const tools = [
    {
      name: "Google Meet",
      icon: <Video size={22} />,
      description: t("resourcesPage.tools.googleMeet"),
      link: "https://meet.google.com",
    },
    {
      name: "Google Agenda",
      icon: <Calendar size={22} />,
      description: t("resourcesPage.tools.googleAgenda"),
      link: "https://calendar.google.com",
    },
    {
      name: "DeepL Translator",
      icon: <Languages size={22} />,
      description: t("resourcesPage.tools.deepl"),
      link: "https://www.deepl.com",
    },
    {
      name: "Reverso Context",
      icon: <BookOpen size={22} />,
      description: t("resourcesPage.tools.reverso"),
      link: "https://context.reverso.net",
    },
    {
      name: "YouGlish",
      icon: <Volume2 size={22} />,
      description: t("resourcesPage.tools.youglish"),
      link: "https://youglish.com",
    },
    {
      name: "World Time Buddy",
      icon: <Clock3 size={22} />,
      description: t("resourcesPage.tools.worldTimeBuddy"),
      link: "https://www.worldtimebuddy.com",
    },
  ];

  return (
    <DashboardLayout>
      <div className="resources-header">
        <h2>{t("resourcesPage.title")}</h2>
      </div>

      <ProficiencyTestBanner />

      <div className="resources-grid">
        {resourceList.map((item, index) => {
          // As variáveis ficam dentro das chaves, ANTES do return
          const colorClasses = [
            "card-orange",
            "card-navy",
            "card-blue",
            "card-yellow",
          ];
          // Alterna a cor baseada no index do loop
          const themeClass = colorClasses[index % colorClasses.length];

          // Agora retornamos o JSX
          return (
            <div
              className={` resource-card ${themeClass}`}
              key={index}
            >
              <div className="resource-icon-wrapper">
                {item.icon}
                <h3>{item.title}</h3>
              </div>
              <p>{item.desc}</p>

              <div className="resource-actions">
                <button
                  className="btn btn-ghost resource-link"
                  onClick={() => setSelectedResource(item)}
                >
                  {t("resourcesPage.accessNow")} <ExternalLink size={14} />
                </button>

               
              </div>
            </div>
          );
        })}
      </div>

      {/* RECURSOS */}
      <div className="resource-help-card">
          <h2>{t("resourcesPage.recommendedToolsTitle")}</h2>

        <div className="tools-grid">
          {tools.map((tool, index) => (
            <a
              key={index}
              href={tool.link}
              target="_blank"
              rel="noopener noreferrer"
              className="tool-card"
            >
              <div className="tool-header">
                {tool.icon}
                <h4>{tool.name}</h4>
              </div>

              <p>{tool.description}</p>
            </a>
          ))}
        </div>
      </div>

      {/* MODAL OVERLAY */}
      {selectedResource && (
        <div
          className="resources-modal-overlay"
          onClick={() => setSelectedResource(null)}
        >
          <div
            className="resources-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="resources-modal-close"
              onClick={() => setSelectedResource(null)}
            >
              <X size={24} color="#64748b" />
            </button>

            {/* Header limpo, só com o título */}
            <div className="modal-header-container">
              <div className="modal-header-resource">
                <div className="modal-icon-wrapper">
                  {selectedResource.icon}
                </div>
                <h3>{selectedResource.title}</h3>
              </div>
            </div>

            {/* Container do PDF */}
            <div className="modal-body-pdf">
              <iframe
                src={`${selectedResource.pdfUrl}#toolbar=0&view=FitH`}
                title={selectedResource.title}
                className="pdf-viewer"
              />
            </div>

            {/* Novo rodapé com o botão de download centralizado */}
            <div className="resources-modal-footer">
              <a
                href={selectedResource.pdfUrl}
                download
                className="modal-download-action"
              >
                <Download size={18} /> {t("resourcesPage.downloadPdf")}
              </a>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Resources;
