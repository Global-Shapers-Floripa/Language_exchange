import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Book, MessageCircle, Globe, Calendar, UserCheck, ExternalLink } from 'lucide-react';
import './recursos.css';

const Resources = () => {
  const resourceList = [
    {
      title: "Guia de Boas Práticas",
      desc: "Como se comportar na primeira sessão e garantir um match saudável.",
      icon: <Book size={24} className="icon-blue" />,
      link: "#"
    },
    {
      title: "Quebra-gelos (Ice Breakers)",
      desc: "Mais de 50 perguntas para nunca deixar o assunto morrer.",
      icon: <MessageCircle size={24} className="icon-purple" />,
      link: "#"
    },
    {
      title: "Toolkit de Tradução",
      desc: "Ferramentas recomendadas para usar durante a conversa.",
      icon: <Globe size={24} className="icon-green" />,
      link: "#"
    },
    {
      title: "Agendamento Eficaz",
      desc: "Como lidar com diferentes fusos horários globalmente.",
      icon: <Calendar size={24} className="icon-orange" />,
      link: "#"
    },
    {
      title: "Feedback e Evolução",
      desc: "Como dar feedback construtivo ao seu parceiro.",
      icon: <UserCheck size={24} className="icon-pink" />,
      link: "#"
    }
  ];

  return (
    <DashboardLayout>
      <div className="resources-header">
        <h2>Recursos & Guia</h2>
      </div>

      <div className="resources-grid">
        {resourceList.map((item, index) => (
          <div className="resource-card" key={index}>
            <div className="resource-icon-wrapper">
              {item.icon}
            </div>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
            <a href={item.link} className="resource-link">
              Acessar agora <ExternalLink size={14} />
            </a>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Resources;