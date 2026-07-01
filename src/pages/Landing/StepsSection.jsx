import React from "react";
import "./steps-section.css";
import BocaTopo from "../../assets/mouth-halftone-1.png";

const steps = [
  {
    number: "01",
    title: "CRIE SEU PERFIL (COM SEGURANÇA)",
    description: "Faça seu cadastro e aguarde nossa rápida aprovação manual. Isso garante um ambiente exclusivo e seguro para a rede Global Shapers. Depois, é só preencher seus interesses e os idiomas que quer praticar.",
    colorClass: "blob-step-orange"
  },
  {
    number: "02",
    title: "ENCONTRE O SEU MATCH",
    description: "Explore a plataforma e envie uma solicitação de conexão para quem tem os mesmos objetivos que você. Assim que a pessoa aceitar, os dados de contato (como WhatsApp ou e-mail) são liberados para ambos.",
    colorClass: "blob-step-cream"
  },
  {
    number: "03",
    title: "AGENDE E PRATIQUE",
    description: "Com os contatos destravados, chame seu parceiro de idioma no canal escolhido. Combinem o melhor dia e horário que funcione para os dois e aproveitem a imersão cultural na prática.",
    colorClass: "blob-step-purple"
  },
  {
    number: "04",
    title: "REGISTRE SUA JORNADA",
    description: "A conversa foi incrível? Volte à plataforma para registrar a sessão! Adicione uma foto, conte como foi a experiência e construa um histórico visual de todos os países com os quais você já se conectou.",
    colorClass: "blob-step-orange-alt"
  },
];

const ComoFunciona = () => {
  return (
    <section className="como-section-wrapper" id="como-funciona">
      {/* Imagem decorativa (Boquinha no canto) */}
      <img 
        src={BocaTopo} 
        alt="Decoração" 
        className="mouth-decoration" 
      />

      <div className="como-inner-content">
        {/* Header da Seção */}
        <div className="como-header">
          <span className="como-tag">// COMO FUNCIONA</span>
          <h2 className="como-title">
            QUATRO PASSOS.<br />
            <span className="highlight-orange">ZERO BUROCRACIA.</span>
          </h2>
        </div>

        {/* Grid dos Passos */}
        <div className="como-steps-container">
          {/* Linha pontilhada de fundo */}
          <div className="dotted-line"></div>

          <div className="como-steps">
            {steps.map((step, index) => (
              <div key={index} className="step-column">
                
                {/* Balão com o Número */}
                <div className={`step-blob ${step.colorClass}`}>
                  <span className="step-label">PASSO</span>
                  <span className="step-number">{step.number}</span>
                </div>

                {/* Textos do Passo */}
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComoFunciona;