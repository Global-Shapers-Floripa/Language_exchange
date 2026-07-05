import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Book, MessageCircle, Globe, Calendar, ExternalLink, X, Download } from 'lucide-react';
import './recursos.css';

const Resources = () => {
  const [selectedResource, setSelectedResource] = useState(null);

  // Exatamente 4 recursos mapeando para os 4 PDFs da sua pasta
  const resourceList = [
    {
      title: "Guia de Feedback e Práticas",
      desc: "Como se comportar na primeira sessão e garantir um match saudável.",
      icon: <Book size={24} className="icon-blue" />,
      pdfUrl: "/Recursos-PDF/guia-feedback.pdf", 
    },
    {
      title: "Quebra-gelos (Ice Breakers)",
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
    }
  ];

  return (
    <DashboardLayout>
      <div className="resources-header">
        <h2>Recursos & Guia</h2>
      </div>

      <div className="resources-grid">
        {resourceList.map((item, index) => (
          <div className="card card--resource card--hoverable resource-card" key={index}>
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
              
              <a 
                href={item.pdfUrl} 
                download 
                className="resource-download-btn"
                title="Baixar PDF diretamente"
              >
                <Download size={15} /> PDF
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL OVERLAY */}
      {selectedResource && (
        <div className="resources-modal-overlay" onClick={() => setSelectedResource(null)}>
          <div className="resources-modal-content" onClick={(e) => e.stopPropagation()}>

            <button className="resources-modal-close" onClick={() => setSelectedResource(null)}>
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