import React, { useState } from "react";

import DashboardLayout from "../../components/layout/DashboardLayout";

import { Globe, ArrowUpRight, ExternalLink, X } from "lucide-react";

import "./ProjectsPartners.css";

// Grid de projetos parceiros — hoje só temos a Escola de Idiomas, mas a ideia
// é ir adicionando novos projetos aqui conforme surgirem novas parcerias.
const projects = [
  {
    title: "Escola de Idiomas Shapers",
    description:
      "Aprenda idiomas através de experiências reais e conexões humanas, de forma 100% gratuita e colaborativa.",
    longDescription:
      "Programa colaborativo e gratuito de troca de idiomas: sessões semanais de conversação, dinâmicas práticas e integração intercultural. Cada participante ensina e aprende ao mesmo tempo.",
    icon: <Globe size={26} />,
    link: "https://docs.google.com/forms/d/e/1FAIpQLSdAXZ1FhX2bD9epsttu40BGp_D_Ao7rEWLw6lw4XaTj-CsuPA/viewform?usp=publish-editor",
    linkLabel: "Preencher formulário",
    themeClass: "card-orange",
  },
];

const ProjectPartners = () => {
  const [selectedProject, setSelectedProject] = useState(null);

  return (
    <DashboardLayout>
      <div className="projects-page">
        <div className="projects-header">
          <h2>Parceiros</h2>
          <p>
            Conheça os projetos que fazem parte da nossa rede. Em breve, novas
            parcerias por aqui.
          </p>
        </div>

        <div className="projects-grid">
          {projects.map((project, index) => (
            <div className={`project-card ${project.themeClass}`} key={index}>
              <div className="project-card-icon">{project.icon}</div>
              <h3>{project.title}</h3>
              <p>{project.description}</p>

              <button
                className="project-card-link"
                onClick={() => setSelectedProject(project)}
              >
                Ver mais <ArrowUpRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {selectedProject && (
        <div
          className="project-modal-overlay"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="project-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="project-modal-close"
              onClick={() => setSelectedProject(null)}
            >
              <X size={20} />
            </button>

            <div className="project-modal-icon">{selectedProject.icon}</div>
            <h3>{selectedProject.title}</h3>
            <p>{selectedProject.longDescription}</p>

            <a
              href={selectedProject.link}
              target="_blank"
              rel="noopener noreferrer"
              className="project-modal-link"
            >
              {selectedProject.linkLabel} <ExternalLink size={16} />
            </a>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ProjectPartners;
