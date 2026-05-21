import React from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import registraSessao from "../../assets/registrar-sessao.svg";
import "./dashboard.css";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="welcome-banner">
        <div className="banner-content">
          <div className="banner-text">
            <h2>"From words to worlds"</h2>
            <p>
              Realizou uma sessão recentemente? Não se esqueça de registrar o
              impacto!
            </p>
          </div>
          <button className="btn-register">
            Registrar sessão
            <span className="icon-circle">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
                className="plus-icon"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </span>
          </button>
        </div>
        <div className="banner-image-container">
          <img
            src={registraSessao}
            alt="Ilustração de registro de sessão"
            className="banner-image"
          />
        </div>
      </div>

      <div className="section-header">
        <h3>Parceiros Sugeridos</h3>
        <a href="/partners">Ver todos &gt;</a>
      </div>

      <div className="partners-grid">
        {/* Vamos criar os cards em breve */}
        <p style={{ color: "#666" }}>Buscando matches para você...</p>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
