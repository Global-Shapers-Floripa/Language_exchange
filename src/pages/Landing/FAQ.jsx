import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import "./faq.css";

const FaqSection = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: "Quem pode participar do Language Exchange?",
      answer:
        "O programa é exclusivo para membros Shapers da rede Global Shapers Community. Se você faz parte de um Hub, está convidado a se registrar.",
    },
    {
      question: "Como funciona o sistema de Match?",
      answer:
        "Nosso sistema analisa os idiomas que você domina e os que deseja aprender, cruzando com a base de dados para encontrar parceiros com interesses complementares aos seus.",
    },
    {
      question: "Qual a duração recomendada das sessões?",
      answer:
        "Sugerimos sessões de 45 a 60 minutos, dividindo o tempo igualmente entre os dois idiomas para que ambos os parceiros pratiquem.",
    },
    {
      question: "As sessões são presenciais ou online?",
      answer:
        "A maioria das sessões ocorre de forma online via Google Meet ou Zoom, permitindo a conexão entre Shapers de diferentes Hubs ao redor do mundo.",
    },
  ];

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="faq-section-wrapper" id="faq">
      {/* O DIVIDER */}
      <div className="custom-shape-divider-top-faq">
        <svg
          data-name="Layer 1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="shape-fill"
          ></path>
        </svg>
      </div>

      {/* CONTEÚDO */}
      <div className="faq-container">
        <div className="section-header-centered">
          <div className="header-icon">
            <HelpCircle size={30} color="#ff7b00" />
          </div>
          <h2 className="section-title title-FAQ">Perguntas Frequentes</h2>
          <p className="section-subtitle subtitle-FAQ">
            Tire suas principais dúvidas sobre como funciona o Language
            Exchange.
          </p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${activeIndex === index ? "active" : ""}`}
              onClick={() => toggleAccordion(index)}
            >
              <div className="faq-question">
                <span>{faq.question}</span>
                {activeIndex === index ? (
                  <ChevronUp size={20} color="#34baf8" />
                ) : (
                  <ChevronDown size={20} color="#64748b" />
                )}
              </div>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
