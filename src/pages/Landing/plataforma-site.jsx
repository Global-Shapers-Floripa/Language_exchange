import React from "react";
import "./plataforma-site.css";
import imgMockup from "../../assets/logo-LanguageExchange.svg"; // Placeholder da foto

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
            
            <div className="site-mini-blob site-blob-peach">
              <span className="site-stat-val">1</span>
              <span className="site-stat-lbl">COMUNIDADE</span>
              <p className="site-stat-txt">O mesmo propósito de colaboração.</p>
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA: Foto estática e os 3 Cards menores */}
        <div className="site-plataforma-right">
          
          {/* Foto estática sem hover */}
          <img 
            src={imgMockup} 
            alt="Preview da Plataforma" 
            className="site-mockup-single" 
          />

          {/* Cards compactos com as 3 funcionalidades */}
          <div className="site-features-compact">
            
            <div className="site-feature-card">
              <div className="site-feat-num">1</div>
              <div className="site-feat-content">
                <h4>ACOMPANHE SEU IMPACTO</h4>
                <p>Seu dashboard é o seu diário de bordo. Visualize horas de conversação e colecione os países que já alcançou.</p>
              </div>
            </div>

            <div className="site-feature-card">
              <div className="site-feat-num">2</div>
              <div className="site-feat-content">
                <h4>SUGESTÕES DE MATCH</h4>
                <p>Nossa plataforma sugere os parceiros mais compatíveis com o seu perfil, facilitando o encontro perfeito.</p>
              </div>
            </div>

            <div className="site-feature-card">
              <div className="site-feat-num">3</div>
              <div className="site-feat-content">
                <h4>CONTROLE TOTAL</h4>
                <p>Gerencie convites de forma simples. Aceite solicitações com um clique e acesse materiais de apoio sempre que precisar.</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default PlataformaSection;