import React from "react";
import { BookOpen, HelpCircle, Info, MoveRight, Library } from "lucide-react";
import "./resources-section.css";

const ResourcesSection = () => {
  const resources = [
    {
      id: 1,
      icon: <BookOpen size={20} color="#0056b3" />,
      title: "Guia de Boas Práticas",
      description:
        "Dicas de etiqueta e como preparar sua primeira sessão com um parceiro desconhecido.",
      linkText: "Ler guia",
      linkUrl: "#",
    },
    {
      id: 2,
      icon: <HelpCircle size={20} color="#0056b3" />,
      title: "Ice Breakers",
      description:
        'Uma lista de perguntas e tópicos para "quebrar o gelo" e manter o papo fluindo.',
      linkText: "Ver tópicos",
      linkUrl: "#",
    },
    {
      id: 3,
      icon: <Info size={20} color="#0056b3" />,
      title: "Informações Úteis",
      description:
        "Links úteis para ferramentas de videoconferência e tradução recomendadas.",
      linkText: "Saiba mais",
      linkUrl: "#",
    },
  ];

  return (
    <section className="resources-section-wrapper">
      {/* O Divider precisa estar fora do container centralizado para ocupar a tela toda */}
      <div className="custom-shape-divider-top">
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
        </svg>
      </div>

      <div className="resources-inner-container">
        <div className="section-header-centered">
          <div className="header-icon">
            <Library size={32} color="#0056b3" />
          </div>
          <h2 className="section-title">Recursos e Dicas</h2>
          <p className="section-subtitle">
            Tudo o que você precisa para aproveitar ao máximo suas conversas.
          </p>
        </div>

        <div className="resources-grid">
          {resources.map((item) => (
            <div key={item.id} className="resource-card">
              <div className="icon-wrapper">{item.icon}</div>
              <h3 className="card-title-resources">{item.title}</h3>
              <p>{item.description}</p>
              <a href={item.linkUrl} className="card-link">
                {item.linkText}
                <MoveRight size={14} style={{ marginLeft: "4px" }} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResourcesSection;