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

  const tools = [
    {
      name: "Google Meet",
      icon: <Video size={22} />,
      description:
        "Ideal para realizar chamadas de vídeo com seu parceiro de idioma. Funciona diretamente no navegador e não exige instalação.",
      link: "https://meet.google.com",
    },
    {
      name: "Google Agenda",
      icon: <Calendar size={22} />,
      description:
        "Use para marcar sessões de conversação, receber lembretes automáticos e evitar esquecer seus encontros.",
      link: "https://calendar.google.com",
    },
    {
      name: "DeepL Translator",
      icon: <Languages size={22} />,
      description:
        "Excelente para traduzir frases completas mantendo contexto e naturalidade. Muito útil durante os estudos.",
      link: "https://www.deepl.com",
    },
    {
      name: "Reverso Context",
      icon: <BookOpen size={22} />,
      description:
        "Ajuda a entender como palavras e expressões são usadas em situações reais através de exemplos contextualizados.",
      link: "https://context.reverso.net",
    },
    {
      name: "YouGlish",
      icon: <Volume2 size={22} />,
      description:
        "Permite ouvir a pronúncia correta de palavras e expressões em vídeos reais de falantes nativos.",
      link: "https://youglish.com",
    },
    {
      name: "World Time Buddy",
      icon: <Clock3 size={22} />,
      description:
        "Facilita encontrar horários compatíveis quando você e seu parceiro estão em países e fusos diferentes.",
      link: "https://www.worldtimebuddy.com",
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

        {/* RECURSOS */}
        <div className="card card--help help-card">
          <div className="section-title">
            <Globe size={22} />
            <h3>Ferramentas Recomendadas</h3>
          </div>

          <div className="tools-grid">
            {tools.map((tool, index) => (
              <a
                key={index}
                href={tool.link}
                target="_blank"
                rel="noopener noreferrer"
                className="tool-card"
              >
                <div className="tool-header">
                  {tool.icon}
                  <h4>{tool.name}</h4>
                </div>

                <p>{tool.description}</p>
              </a>
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
