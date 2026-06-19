import React from "react";
import {
  UserPlus,
  Users,
  CalendarDays,
  MessageCircle,
  Workflow,
} from "lucide-react";
import "./steps-section.css";

const steps = [
  {
    number: "1",
    icon: <UserPlus size={28} />,
    title: "Registre-se",
    description:
      "Crie seu perfil, aguarde aprovação e indique os idiomas que domina e os que quer aprender.",
  },
  {
    number: "2",
    icon: <Users size={28} />,
    title: "Encontre Match",
    description:
      "Busque parceiros com interesses compatíveis na nossa base de dados.",
  },
  {
    number: "3",
    icon: <CalendarDays size={28} />,
    title: "Agende",
    description:
      "Combine um horário que funcione para ambos via chat ou e-mail.",
  },
  {
    number: "4",
    icon: <MessageCircle size={28} />,
    title: "Pratique",
    description: "Realize sua sessão de conversação e divirta-se aprendendo.",
  },
];

const ComoFunciona = () => {
  return (
    <section className="como-section-wrapper" id="como-funciona">
      {/* Divider Orgânico no Topo */}
      <div className="custom-shape-divider-top-steps">
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
        </svg>
      </div>

      <div className="como-inner-content">
        <div className="section-header-centered">
          <div className="header-icon">
            <Workflow size={30} color="#ff6702" />
          </div>
          <h2 className="section-title">Como funciona</h2>
          <p className="section-subtitle">
            Siga o passo a passo para iniciar sua jornada cultural
          </p>
        </div>

        <div className="como-steps">
          {steps.map((step, index) => (
            <div key={index} className="step-card">
              <div className="step-number">{step.number}</div>
              <div className="step-icon">{step.icon}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ComoFunciona;