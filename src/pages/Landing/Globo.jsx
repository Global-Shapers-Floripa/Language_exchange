import React from "react";
import "./Globo.css";

const HeroGlobe = () => {
 const connections = [
    {
      id: 1,
      themeClass: "theme-orange",
      userA: { name: "Maria", hub: "Floripa", flag: "br", avatar: "https://i.pravatar.cc/150?img=47", text: "Você tem disponibilidade para uma call amanhã?" },
      userB: { name: "James", hub: "New York", flag: "us", avatar: "https://i.pravatar.cc/150?img=11", text: "Yes! Is 6 PM a good time for you?" }
    },
    {
      id: 2,
      themeClass: "theme-blue",
      userA: { name: "Wei", hub: "Shanghai", flag: "cn", avatar: "https://i.pravatar.cc/150?img=32", text: "你们分区的文化是怎样的？" },
      userB: { name: "Camille", hub: "Paris", flag: "fr", avatar: "https://i.pravatar.cc/150?img=5", text: "Très collaborative ! Nous nous concentrons sur le climat." }
    },
    {
      id: 3,
      themeClass: "theme-white", 
      userA: { name: "Luca", hub: "Rome", flag: "it", avatar: "https://i.pravatar.cc/150?img=53", text: "Da quanto tempo sei uno Shaper?" },
      userB: { name: "Yuki", hub: "Tokyo", flag: "jp", avatar: "https://i.pravatar.cc/150?img=12", text: "2年です。あなたは？" }
    },
    {
      id: 4,
      themeClass: "theme-yellow",
      userA: { name: "Carlos", hub: "Madrid", flag: "es", avatar: "https://i.pravatar.cc/150?img=68", text: "Me encantó conocer los proyectos de tu Hub." },
      userB: { name: "Klaus", hub: "Berlin", flag: "de", avatar: "https://i.pravatar.cc/150?img=33", text: "Danke! Lass uns bald ein Meeting planen." }
    }
  ];

  return (
    <div className="hero-connections-container">
      <div className="hero-connections-grid">
        {connections.map((conn) => (
          <div key={conn.id} className={`chat-connection-card ${conn.themeClass}`}>
            
            {/* Mensagem da Pessoa A (Esquerda) */}
            <div className="chat-row left">
              <div className="chat-avatar-wrapper">
                <img src={conn.userA.avatar} alt={conn.userA.name} className="chat-avatar" />
                <img src={`https://flagcdn.com/w40/${conn.userA.flag}.png`} alt="Flag" className="chat-flag" />
              </div>
              <div className="chat-content">
                <span className="chat-hub-label">HUB {conn.userA.hub.toUpperCase()}</span>
                <div className="chat-bubble bubble-left">
                  {conn.userA.text}
                </div>
              </div>
            </div>

            

            {/* Mensagem da Pessoa B (Direita) */}
            <div className="chat-row right">
              <div className="chat-avatar-wrapper">
                <img src={conn.userB.avatar} alt={conn.userB.name} className="chat-avatar" />
                <img src={`https://flagcdn.com/w40/${conn.userB.flag}.png`} alt="Flag" className="chat-flag" />
              </div>
              <div className="chat-content">
                <span className="chat-hub-label">HUB {conn.userB.hub.toUpperCase()}</span>
                <div className="chat-bubble bubble-right">
                  {conn.userB.text}
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroGlobe;