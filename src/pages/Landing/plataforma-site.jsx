import React from "react";
import "./plataforma-site.css";
import imgDashboard from "../../assets/dash-plataforma.jpg";
import imgConexoes from "../../assets/conexoes-plataforma.jpg";

const PlataformaSection = () => {
  return (
    <section className="site-plataforma-wrapper" id="plataforma">
      <div className="site-plataforma-container">

        {/* COLUNA ESQUERDA: Título, Introdução e Números */}
        <div className="site-plataforma-left">
          
          {/* Cabeçalho no padrão "Como Funciona" */}
          <span className="site-tag-plataforma">// PLATAFORMA</span>
          <h2 className="site-title-plataforma">
            POR DENTRO DA COMUNIDADE.<br />
            <span className="site-highlight-orange">SEU NOVO PASSAPORTE.</span>
          </h2>
          
          <p className="site-intro-plataforma">
            Nós acreditamos que a tecnologia deve ser uma ponte, não uma barreira. Por isso, 
            desenvolvemos um ambiente limpo, intuitivo e livre de distrações, focado no que 
            realmente importa: conectar você com o mundo.
          </p>

          {/* Mini-Blobs de Estatísticas (Pequenos e discretos) */}
          <div className="site-stats-compact">
            <div className="site-mini-blob site-blob-orange">
              <span className="site-stat-val">150+</span>
              <span className="site-stat-lbl">PAÍSES</span>
              <p className="site-stat-txt">Diversidade cultural à sua disposição.</p>
            </div>
            
            <div className="site-mini-blob site-blob-purple">
              <span className="site-stat-val">500+</span>
              <span className="site-stat-lbl">HUBS</span>
              <p className="site-stat-txt">Pontos de conexão reais espalhados.</p>
            </div>
            
            <div className="site-mini-blob site-blob-navy">
              <span className="site-stat-val">1</span>
              <span className="site-stat-lbl">COMUNIDADE</span>
              <p className="site-stat-txt">O mesmo propósito de colaboração.</p>
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA: Cards com screenshots das telas */}
        <div className="site-plataforma-right">

          {/* Cards compactos com as funcionalidades */}
          <div className="site-features-compact">

            <div className="site-feature-card">
              <div className="site-feat-header">
                <div className="site-feat-num">1</div>
                <div className="site-feat-content">
                  <h4>ACOMPANHE SEU IMPACTO</h4>
                  <p>Seu dashboard é o seu diário de bordo. Visualize horas de conversação e colecione os países que já alcançou.</p>
                </div>
              </div>
              <div className="site-feat-media">
                <img
                  src={imgDashboard}
                  alt="Screenshot do Dashboard da plataforma"
                  className="site-feat-img"
                />
              </div>
            </div>

            <div className="site-feature-card">
              <div className="site-feat-header">
                <div className="site-feat-num">2</div>
                <div className="site-feat-content">
                  <h4>SUGESTÕES DE MATCH</h4>
                  <p>Nossa plataforma sugere os parceiros mais compatíveis com o seu perfil, facilitando o encontro perfeito.</p>
                </div>
              </div>
              <div className="site-feat-media">
                <img
                  src={imgConexoes}
                  alt="Screenshot da tela Explorar Rede da plataforma"
                  className="site-feat-img"
                />
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default PlataformaSection;