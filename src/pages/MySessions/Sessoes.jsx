import React, { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { PlusCircle, X } from "lucide-react";
import { useSessions } from "../../hooks/useSessions";
import { usePartners } from "../../hooks/usePartners";
import AddSessionModal from "../../components/common/AddSessionModal";

import "./sessoes.css";

const MySessions = () => {
  const { sessions, loading, error, refetch } =
    useSessions();

  const { partners } = usePartners();

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [selectedImage, setSelectedImage] =
    useState(null);

  const handleSessionAdded = () => {
    if (refetch) {
      refetch();
    }
  };

  return (
    <DashboardLayout>
      <div className="sessions-header">
        <h2>Minhas Sessões</h2>

        <button
          className="btn-new-session"
          onClick={() =>
            setIsModalOpen(true)
          }
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
          <p>
            Erro ao carregar sessões:{" "}
            {error}
          </p>
        </div>
      )}

      {/* VAZIO */}
      {!loading &&
        !error &&
        sessions.length === 0 && (
          <div className="empty-message">
            <p>
              Nenhuma sessão registrada.
              Comece a registrar suas
              primeiras sessões!
            </p>
          </div>
        )}

      {/* TABELA */}
      {!loading &&
        !error &&
        sessions.length > 0 && (
          <div className="table-container">
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>PARCEIRO</th>
                  <th>HUB</th>
                  <th>DATA</th>
                  <th>DURAÇÃO</th>
                  <th>IDIOMAS</th>
                  <th>PROVA</th>
                </tr>
              </thead>

              <tbody>
                {sessions.map(
                  (session) => (
                    <tr key={session.id}>
                      <td className="partner-name">
                        {session.partner}
                      </td>

                      <td>
                        {session.hub}
                      </td>

                      <td>
                        {session.date}
                      </td>

                      <td>
                        {
                          session.duration
                        }{" "}
                        min
                      </td>

                      <td>
                        {
                          session.languages
                        }
                      </td>

                      <td>
                        {session.session_photo_url ? (
                          <img
                            src={
                              session.session_photo_url
                            }
                            alt="Sessão"
                            className="session-thumbnail"
                            onClick={() =>
                              setSelectedImage(
                                session.session_photo_url,
                              )
                            }
                          />
                        ) : (
                          <span className="no-proof">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}

      {/* MODAL NOVA SESSÃO */}
      <AddSessionModal
        isOpen={isModalOpen}
        onClose={() =>
          setIsModalOpen(false)
        }
        partners={partners}
        onSessionAdded={
          handleSessionAdded
        }
      />

      {/* MODAL FOTO */}
      {selectedImage && (
        <div
          className="image-modal-overlay"
          onClick={() =>
            setSelectedImage(null)
          }
        >
          <div className="image-modal">
            <button
              className="close-image-btn"
              onClick={() =>
                setSelectedImage(null)
              }
            >
              <X size={22} />
            </button>

            <img
              src={selectedImage}
              alt="Sessão ampliada"
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MySessions;