import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import './dashboard.css'; 

const Dashboard = () => {
  const navigate = useNavigate();

  const handleRegisterSession = () => {
    navigate('/sessions');
  };

  return (
    
    <DashboardLayout>
      <div className="welcome-banner">
        <div className="banner-text">
          <h2>"From words to worlds"</h2>
          <p>Realizou uma sessão recentemente? Não se esqueça de registrar o impacto!</p>
        </div>
        <button className="btn-register" onClick={handleRegisterSession}>
          <span>+</span> Registrar Sessão
        </button>
      </div>
      
      <div className="section-header">
        <h3>Parceiros Sugeridos</h3>
        <a href="/partners">Ver todos &gt;</a>
      </div>

      <div className="partners-grid">
         {/* Vamos criar os cards em breve */}
         <p style={{color: '#666'}}>Buscando matches para você...</p>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;