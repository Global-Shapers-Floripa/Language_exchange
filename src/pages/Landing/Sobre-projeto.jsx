import React from "react";
import "./sobre-projeto.css";
import logoLanguageExchange from "../../assets/logo-LanguageExchange.svg"; // Seu placeholder

const ConhecaProjeto = () => {
  return (
    <section id="sobre" className="sobre-container">
      <div className="sobre-content">
        
        {/* COLUNA ESQUERDA - TEXTOS */}
        <div className="sobre-left">
          <div className="sobre-tag">// SOBRE</div>
          
          <h2 className="sobre-title">
            A GENTE ACREDITA QUE <br />
            <span className="highlight-orange">CONVERSA</span> <br />
            MUDA O MUNDO.
          </h2>
          
          <p className="sobre-text">
            O Language Exchange nasceu em julho de 2025 no Hub Global Shapers
            Florianópolis como uma resposta simples: e se a gente usasse a
            própria rede pra praticar idiomas com quem entende o nosso jeito de
            mudar o mundo?
          </p>
          
          <p className="sobre-text">
            Não é app, não é EdTech. É Shaper falando com Shaper — sobre
            projeto, cidade, comida ruim, política, riso. <strong>Expanda seus horizontes
            através da conexão cultural.</strong>
          </p>

          {/* Imagem decorativa (Placeholder) */}
          <div className="sobre-decoration">
            <img 
              src={logoLanguageExchange} 
              alt="Decoração" 
              className="decor-img"
            />
          </div>
        </div>

        {/* COLUNA DIREITA - BALÕES (BLOBS) */}
        <div className="sobre-right-grid">
          
          {/* Balão Laranja */}
          <div className="blob-card blob-orange">
            <h3 className="blob-title">HUBS QUE SE FALAM</h3>
            <p className="blob-text">
              Conexão direta com Shapers de mais de 40 hubs em outros continentes — 
              sem intermediário, sem agência.
            </p>
          </div>

          {/* Balão Azul Escuro */}
          <div className="blob-card blob-navy">
            <h3 className="blob-title blob-title-light">AMBIENTE SEGURO</h3>
            <p className="blob-text blob-text-light">
              Comunidade vetada pela rede Global Shapers, com guia de boas práticas e 
              moderação dos organizadores.
            </p>
          </div>

          {/* Balão Roxo */}
          <div className="blob-card blob-purple">
            <h3 className="blob-title">COMPETÊNCIA GLOBAL</h3>
            <p className="blob-text">
              Desenvolva fluência, repertório cultural e soft skills que não cabem 
              em um curso de idioma.
            </p>
          </div>

          {/* Balão Creme Claro */}
          <div className="blob-card blob-peach">
            <h3 className="blob-title">REDE QUE FORTALECE</h3>
            <p className="blob-text">
              Quanto mais Shapers conversam, mais forte fica a rede global — e os 
              projetos que a gente faz acontecer.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};

export default ConhecaProjeto;