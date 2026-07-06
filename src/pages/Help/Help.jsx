import React, { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  HelpCircle,
  Mail,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Globe,
  Calendar,
  Video,
  Languages,
  BookOpen,
  Volume2,
  Clock3,
} from "lucide-react";

import "./help.css";

const Help = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: "Como encontrar um parceiro compatível?",
      answer:
        "O sistema utiliza os idiomas que você fala, os idiomas que deseja aprender e seus interesses para sugerir pessoas com maior compatibilidade.",
    },
    {
      question: "Preciso registrar todas as sessões?",
      answer:
        "Não é obrigatório, mas recomendamos registrar suas sessões para acompanhar sua evolução e histórico de prática.",
    },
    {
      question: "Posso praticar mais de um idioma?",
      answer:
        "Sim. Você pode adicionar múltiplos idiomas ao seu perfil e encontrar parceiros para cada um deles.",
    },
    {
      question: "Como alterar minhas informações?",
      answer:
        "Acesse Meu Perfil e clique no botão de edição para atualizar foto, descrição, idiomas e interesses.",
    },
    {
      question: "Como denunciar um comportamento inadequado?",
      answer:
        "Entre em contato com nossa equipe através dos canais de suporte informando o ocorrido e os detalhes necessários.",
    },
    {
      question: "Posso excluir uma sessão registrada?",
      answer:
        "Sim. Na página Minhas Sessões basta abrir os detalhes da sessão e utilizar a opção de exclusão.",
    },
  ];


  const toggleFaq = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <DashboardLayout>
      <div className="help-container">
        <div className="help-header">
          <h2>Central de Ajuda</h2>
          <p>
            Encontre respostas rápidas, ferramentas úteis para suas conversas e
            canais para entrar em contato com nossa equipe.
          </p>
        </div>

        {/* FAQ */}
        <div className="card card--help help-card">
          <div className="section-title">
            <HelpCircle size={22} />
            <h3>Perguntas Frequentes</h3>
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-item ${activeIndex === index ? "active" : ""}`}
              >
                <button
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.question}</span>

                  {activeIndex === index ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>

                {activeIndex === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>


        {/* CONTATO */}
        <section className="contact-section">
          <h3>Precisa de mais ajuda?</h3>

          <p>
            Caso não encontre sua resposta acima, entre em contato com nossa
            equipe.
          </p>

          <div className="contact-info-card">
            <Mail size={20} />
            <div>
              <span>E-mail de suporte</span>
              <strong>globalshapers@languageexchange.com.br</strong>
            </div>
          </div>

          <a
            href="https://wa.me/5548999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp-contact"
          >
            <MessageCircle size={18} />
            Falar pelo WhatsApp
          </a>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Help;
