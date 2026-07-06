import React, { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
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
  const [selectedResource, setSelectedResource] = useState(null);

  // Exatamente 4 recursos mapeando para os 4 PDFs da sua pasta
  const resourceList = [
    {
      title: "Feedback e Práticas",
      desc: "Como se comportar na primeira sessão e garantir um match saudável.",
      icon: <Book size={24} className="icon-blue" />,
      pdfUrl: "/Recursos-PDF/guia-feedback.pdf",
    },
    {
      title: "Quebra-gelos",
      desc: "Mais de 50 perguntas para nunca deixar o assunto morrer.",
      icon: <MessageCircle size={24} className="icon-purple" />,
      pdfUrl: "/Recursos-PDF/quebragelos.pdf",
    },
    {
      title: "Toolkit de Tradução",
      desc: "Ferramentas recomendadas para usar durante a conversa.",
      icon: <Globe size={24} className="icon-green" />,
      pdfUrl: "/Recursos-PDF/traducoes.pdf",
    },
    {
      title: "Agendamento Eficaz",
      desc: "Como lidar com diferentes fusos horários globalmente.",
      icon: <Calendar size={24} className="icon-orange" />,
      pdfUrl: "/Recursos-PDF/guia-agendamento.pdf",
    },
  ];

  const tools = [
    {
      name: "Google Meet",
      icon: <Video size={22} />,
      description:
        "Ideal para realizar chamadas de vídeo com seu parceiro de idioma. Funciona diretamente no navegador e não exige instalação.",
      link: "https://meet.google.com",
    },
    {
      name: "Google Agenda",
      icon: <Calendar size={22} />,
      description:
        "Use para marcar sessões de conversação, receber lembretes automáticos e evitar esquecer seus encontros.",
      link: "https://calendar.google.com",
    },
    {
      name: "DeepL Translator",
      icon: <Languages size={22} />,
      description:
        "Excelente para traduzir frases completas mantendo contexto e naturalidade. Muito útil durante os estudos.",
      link: "https://www.deepl.com",
    },
    {
      name: "Reverso Context",
      icon: <BookOpen size={22} />,
      description:
        "Ajuda a entender como palavras e expressões são usadas em situações reais através de exemplos contextualizados.",
      link: "https://context.reverso.net",
    },
    {
      name: "YouGlish",
      icon: <Volume2 size={22} />,
      description:
        "Permite ouvir a pronúncia correta de palavras e expressões em vídeos reais de falantes nativos.",
      link: "https://youglish.com",
    },
    {
      name: "World Time Buddy",
      icon: <Clock3 size={22} />,
      description:
        "Facilita encontrar horários compatíveis quando você e seu parceiro estão em países e fusos diferentes.",
      link: "https://www.worldtimebuddy.com",
    },
  ];

  return (
    <DashboardLayout>
      <div className="resources-header">
        <h2>Recursos & Guia</h2>
      </div>

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
                  Acessar agora <ExternalLink size={14} />
                </button>

               
              </div>
            </div>
          );
        })}
      </div>

      {/* RECURSOS */}
      <div className="resource-help-card">
          <h2>Ferramentas Recomendadas</h2>

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
                <Download size={18} /> Baixar PDF
              </a>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Resources;
