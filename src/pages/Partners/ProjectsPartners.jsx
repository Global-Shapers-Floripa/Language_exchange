import React from "react";

import DashboardLayout from "../../components/layout/DashboardLayout";

import { Globe, Users, GraduationCap, ArrowUpRight } from "lucide-react";

import "./ProjectsPartners.css";

const ProjetoIdiomas = () => {
  const handleOpenForm = () => {
    window.open(
      "https://docs.google.com/forms/d/e/1FAIpQLSdAXZ1FhX2bD9epsttu40BGp_D_Ao7rEWLw6lw4XaTj-CsuPA/viewform?usp=publish-editor",
      "_blank",
    );
  };

  return (
    <DashboardLayout>
      <div className="project-page">
        {/* SOBRE */}
        <section className="project-section">
          <div>
            <h2 className="section-title-project">Escola de Idiomas Shapers</h2>
            <p>
              Aprender idiomas através de experiências reais e conexões humanas.
            </p>
          </div>

          <div className="about-grid">
            <div className="about-card">
              <div className="about-card-header">
                <Globe size={30} />
                <h3>100% Gratuito</h3>
              </div>

              <p>
                Acesso livre e remoto para participantes de diferentes países e
                contextos sociais.
              </p>
            </div>

            <div className="about-card">
              <div className="about-card-header">
                <Users size={30} />

                <h3>Troca Colaborativa</h3>
              </div>

              <p>
                Cada participante aprende e também ajuda outras pessoas no
                processo.
              </p>
            </div>

            <div className="about-card">
              <div className="about-card-header">
                <GraduationCap size={30} />

                <h3>Prática Real</h3>
              </div>

              <p>
                Conversação, dinâmicas e atividades práticas ao invés de apenas
                teoria.
              </p>
            </div>
          </div>
        </section>

        {/* METODOLOGIA */}
        <section className="project-section">
          <div className="section-title">
            <h2>Como funciona</h2>
          </div>

          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-number">1</div>

              <div className="timeline-content">
                <h3>Alinhamento e Diagnóstico</h3>

                <p>
                  Formação dos grupos, definição das metas e preparação das
                  sessões.
                </p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-number">2</div>

              <div className="timeline-content">
                <h3>Prática Imersiva</h3>

                <p>
                  Sessões semanais de conversação e dinâmicas colaborativas
                  entre os participantes.
                </p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-number">3</div>

              <div className="timeline-content">
                <h3>Integração e Projeto Final</h3>

                <p>
                  Apresentações, networking intercultural e desenvolvimento de
                  iniciativas colaborativas.
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* CTA */}
        <section className="final-cta">
          <h2>Faça parte da próxima turma</h2>

          <p>
            Conecte-se com pessoas de diferentes países e pratique idiomas de
            forma colaborativa.
          </p>

          <button className="hero-button" onClick={handleOpenForm}>
            Preencher formulário
            <ArrowUpRight size={18} />
          </button>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default ProjetoIdiomas;
