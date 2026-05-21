import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PlusCircle } from 'lucide-react';
import { useSessions } from '../../hooks/useSessions';
import { usePartners } from '../../hooks/usePartners';
import AddSessionModal from '../../components/common/AddSessionModal';
import './sessoes.css';

const MySessions = () => {
  const { sessions, loading, error, refetch } = useSessions();
  const { partners } = usePartners();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSessionAdded = () => {
    // Atualizar lista de sessões
    if (refetch) {
      refetch();
    }
  };

  return (
    <DashboardLayout>
      <div className="sessions-header">
        <h2>Minhas Sessões</h2>
        <button className="btn-new-session" onClick={() => setIsModalOpen(true)}>
          <PlusCircle size={20} /> Novo Registro
        </button>
      </div>

      {loading && (
        <div className="loading-message">
          <p>Carregando sessões...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>Erro ao carregar sessões: {error}</p>
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div className="empty-message">
          <p>Nenhuma sessão registrada. Comece a registrar suas primeiras sessões!</p>
        </div>
      )}

      {!loading && !error && sessions.length > 0 && (
        <div className="table-container">
          <table className="sessions-table">
            <thead>
              <tr>
                <th>PARCEIRO</th>
                <th>HUB</th>
                <th>DATA</th>
                <th>DURAÇÃO</th>
                <th>IDIOMA</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td className="partner-name">{session.partner}</td>
                  <td>{session.hub}</td>
                  <td>{session.date}</td>
                  <td>{session.duration}</td>
                  <td>{session.language}</td>
                  <td>
                    <span className={`status-badge ${session.status.toLowerCase()}`}>
                      {session.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para adicionar sessão */}
      <AddSessionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        partners={partners}
        onSessionAdded={handleSessionAdded}
      />
    </DashboardLayout>
  );
};

export default MySessions;