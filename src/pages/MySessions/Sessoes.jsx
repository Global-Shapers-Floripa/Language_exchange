import React, { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  PlusCircle,
  X,
  Eye,
  MapPin,
  Calendar,
  Clock,
  Globe,
  Trash2,
} from "lucide-react";
import { useSessions } from "../../hooks/useSessions";
import { usePartners } from "../../hooks/usePartners";
import AddSessionModal from "../../components/common/AddSessionModal";

import "./sessoes.css";

const MySessions = () => {
  const { sessions, loading, error, refetch, deleteSession } = useSessions();
  const { partners } = usePartners();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // ADICIONE AQUI
  const [selectedSession, setSelectedSession] = useState(null);

  const handleSessionAdded = () => {
    if (refetch) {
      refetch();
    }
  };

  const handleDeleteSession = async () => {
    if (!selectedSession) return;

    const confirmed = window.confirm(
      `Deseja realmente excluir a sessão com ${selectedSession.partner}?`,
    );

    if (!confirmed) return;

    const result = await deleteSession(selectedSession.id);

    if (result.success) {
      setSelectedSession(null);
    } else {
      alert(result.error);
    }
  };

  const formatLanguages = (langs) => {
    if (!langs) return [];
    if (Array.isArray(langs)) return langs;
    return typeof langs === "string" ? langs.split(",") : [langs];
  };

  return (
    <DashboardLayout>
      <div className="sessions-header">
        <h2>Minhas Sessões</h2>

        <button
          className="btn-new-session"
          onClick={() => setIsModalOpen(true)}
        >
          <PlusCircle size={20} />
          Novo Registro
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="loading-message">
          <p>Carregando sessões...</p>
        </div>
      )}

      {/* ERRO */}
      {error && (
        <div className="error-message">
          <p>Erro ao carregar sessões: {error}</p>
        </div>
      )}

      {/* VAZIO */}
      {!loading && !error && sessions.length === 0 && (
        <div className="empty-message">
          <p>
            Nenhuma sessão registrada. Comece a registrar suas primeiras
            sessões!
          </p>
        </div>
      )}

      {/* TABELA */}
      {!loading && !error && sessions.length > 0 && (
        <div className="sessions-grid">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="session-card"
              onClick={() => setSelectedSession(session)}
            >
              <div className="session-card-image">
                {session.session_photo_url ? (
                  <img src={session.session_photo_url} alt={session.partner} />
                ) : (
                  <div className="session-placeholder">Sem foto</div>
                )}
              </div>

              <div className="session-card-body">
                <h3>{session.partner}</h3>

                <p className="session-hub">
                  <MapPin size={16} />
                  {session.hub}
                </p>

                <div className="languages-preview">
                  {formatLanguages(session.languages).map((lang, index) => (
                    <span key={index} className="lang-badge">
                      {lang.trim()}
                    </span>
                  ))}
                </div>
              </div>

              <button
                className="view-session-btn"
                onClick={() => setSelectedSession(session)}
              >
                <Eye size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL NOVA SESSÃO */}
      <AddSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        partners={partners}
        onSessionAdded={handleSessionAdded}
      />

      {/* MODAL FOTO */}
      {selectedImage && (
        <div
          className="image-modal-overlay"
          onClick={() => setSelectedImage(null)}
        >
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-image-btn"
              onClick={() => setSelectedImage(null)}
            >
              <X size={22} />
            </button>
            <img src={selectedImage} alt="Sessão ampliada" />
          </div>
        </div>
      )}

      {selectedSession && (
        <div
          className="details-overlay"
          onClick={() => setSelectedSession(null)}
        >
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-image-btn"
              onClick={() => setSelectedSession(null)}
            >
              <X size={22} />
            </button>

            {selectedSession.session_photo_url && (
              <img
                src={selectedSession.session_photo_url}
                alt={selectedSession.partner}
                className="details-image"
              />
            )}

            <div className="details-content">
              <h2>{selectedSession.partner}</h2>

              <div className="detail-row">
                <MapPin size={18} />
                <span>{selectedSession.hub}</span>
              </div>

              <div className="detail-row">
                <Calendar size={18} />
                <span>{selectedSession.date}</span>
              </div>

              <div className="detail-row">
                <Clock size={18} />
                <span>{selectedSession.duration} minutos</span>
              </div>

              <div className="detail-row">
                <Globe size={18} />
                <div className="languages-cell">
                  {formatLanguages(selectedSession.languages).map(
                    (lang, index) => (
                      <span key={index} className="lang-badge">
                        {lang.trim()}
                      </span>
                    ),
                  )}
                </div>
              </div>

              {selectedSession.notes && (
                <div className="session-description">
                  <h4>Descrição</h4>
                  <p>{selectedSession.notes}</p>
                </div>
              )}

              <div className="details-actions">
                <button
                  className="delete-session-btn"
                  onClick={handleDeleteSession}
                >
                  <Trash2 size={18} />
                  Excluir sessão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MySessions;
