import React from "react";
import "./resources-section.css";

const ResourcesSection = () => {
  const resources = [
    {
      id: 1,
      tag: "// GUIA",
      title: "GUIA DE BOAS PRÁTICAS",
      description: "Dicas de etiqueta e como preparar sua primeira sessão com um parceiro desconhecido.",
      colorClass: "site-blob-peach",
    },
    {
      id: 2,
      tag: "// ICE BREAKERS",
      title: "ICE BREAKERS",
      description: 'Uma lista de perguntas e tópicos para "quebrar o gelo" e manter o papo fluindo.',
      colorClass: "site-blob-purple",
    },
    {
      id: 3,
      tag: "// ÚTIL",
      title: "INFORMAÇÕES ÚTEIS",
      description: "Links úteis para ferramentas de videoconferência e tradução recomendadas.",
      colorClass: "site-blob-orange",
    },
  ];

  return (
    <section className="site-resources-wrapper" id="recursos">
      <div className="site-resources-container">
        
        {/* Header isolado */}
        <div className="site-resources-header">
          <div className="site-header-left">
            <span className="site-section-tag">// RECURSOS</span>
            <h2 className="site-section-title">
              PRA VOCÊ NÃO <br />
              COMEÇAR DO ZERO.
            </h2>
          </div>
          <div className="site-header-right">
            <p className="site-section-description">
              Tudo o que aprendemos rodando o programa virou material aberto pra
              comunidade. Pegue, use, melhore.
            </p>
          </div>
        </div>

        {/* Grid dos Recursos isolado */}
        <div className="site-resources-grid">
          {resources.map((item) => (
            <div key={item.id} className={`site-resource-blob ${item.colorClass}`}>
              <div className="site-blob-content">
                <span className="site-card-tag">{item.tag}</span>
                <h3 className="site-card-title">{item.title}</h3>
                <p className="site-card-description">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default ResourcesSection;