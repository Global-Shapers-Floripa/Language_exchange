import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";
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
    <section className="site-faq-wrapper" id="faq">
      <div className="site-faq-container">
        
        {/* LADO ESQUERDO - Títulos */}
        <div className="site-faq-left">
          <span className="site-faq-tag">// FAQ</span>
          <h2 className="site-faq-title">
            PERGUNTAS <br />
            QUE <span className="site-highlight-orange">A GENTE OUVE.</span>
          </h2>
          <p className="site-faq-description">
            Não achou a sua? Mande uma mensagem nos nossos contatos. 
            Respondemos pessoalmente.
          </p>
        </div>

        {/* LADO DIREITO - Sanfona de Perguntas */}
        <div className="site-faq-right">
          <div className="site-faq-list">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`site-faq-item ${activeIndex === index ? "active" : ""}`}
                onClick={() => toggleAccordion(index)}
              >
                <div className="site-faq-question">
                  <h3>{faq.question}</h3>
                  <div className="site-faq-icon">
                    {activeIndex === index ? (
                      <Minus size={18} strokeWidth={2.5} />
                    ) : (
                      <Plus size={18} strokeWidth={2.5} />
                    )}
                  </div>
                </div>
                <div className="site-faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default FaqSection;