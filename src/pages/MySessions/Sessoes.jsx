import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  PlusCircle,
  X,
  Calendar,
  Clock,
  Trash2,
  Search,
  Globe2,
  Languages,
  Lock,
} from "lucide-react";
import Swal from "sweetalert2";
import { useSessions } from "../../hooks/useSessions";
import { usePendingApprovals } from "../../hooks/usePendingApprovals";
import { useAcceptedConnections } from "../../hooks/useAcceptedConnections";
import AddSessionModal from "../../components/common/AddSessionModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import PendingApprovalModal from "../../components/common/PendingApprovalModal";
import SessionCard, { SessionCardPeople } from "../../components/common/SessionCard";

import "./sessoes.css";

const MySessions = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { sessions, loading, error, refetch, deleteSession, requestPublicApproval } =
    useSessions();
  const { partners } = useAcceptedConnections();
  const {
    pendingApprovals,
    loading: pendingLoading,
    approve,
    reject,
  } = usePendingApprovals();

  // Rota /sessions é montada do zero a cada navegação (troca de rota do
  // react-router), então ler location.state direto no estado inicial já
  // basta — sem precisar de efeito pra sincronizar.
  const [isModalOpen, setIsModalOpen] = useState(
    () => Boolean(location.state?.preselectedPartnerId),
  );
  const [selectedImage, setSelectedImage] = useState(null);
  const [sessionSearch, setSessionSearch] = useState("");
  const [preselectedPartnerId, setPreselectedPartnerId] = useState(
    () => location.state?.preselectedPartnerId || null,
  );

  // ADICIONE AQUI
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState(null);

  // Limpa o state da navegação pra um refresh/voltar não reabrir o modal
  useEffect(() => {
    if (location.state?.preselectedPartnerId) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleSessionAdded = () => {
    if (refetch) {
      refetch();
    }
  };

  const confirmDeleteSession = async () => {
    if (!selectedSession) return;

    const result = await deleteSession(selectedSession.id);

    if (result.success) {
      setSelectedSession(null);
    } else {
      setDeleteErrorMessage(result.error);
    }
  };

  const handleMakePublic = async (session) => {
    const confirmResult = await Swal.fire({
      title: "Tornar sessão pública?",
      html: `${session.partner} vai receber um e-mail avisando do pedido e poderá aprovar ou recusar. A nota e a foto desta sessão ficarão visíveis para ele revisar antes de decidir.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Pedir aprovação",
      cancelButtonText: "Cancelar",
    });

    if (!confirmResult.isConfirmed) return;

    const result = await requestPublicApproval(session);

    if (result.success) {
      setSelectedSession(null);
      Swal.fire({
        title: "Pedido enviado!",
        text: `${session.partner} foi avisado por e-mail e precisa aprovar antes da sessão aparecer no feed da comunidade.`,
        icon: "success",
      });
    } else {
      Swal.fire("Erro", result.error || "Não foi possível pedir aprovação.", "error");
    }
  };

  const handleApprove = async (sessionId) => {
    const result = await approve(sessionId);
    if (result.success) {
      // Sessão virou pública: passa a aparecer também na lista de "Minhas
      // Sessões" de quem só participou como parceiro.
      refetch();
    } else {
      Swal.fire("Erro", result.error || "Não foi possível aprovar.", "error");
    }
    return result;
  };

  const handleReject = async (sessionId) => {
    const result = await reject(sessionId);
    if (!result.success) {
      Swal.fire("Erro", result.error || "Não foi possível recusar.", "error");
    }
    return result;
  };

  const formatLanguages = (langs) => {
    if (!langs) return [];
    if (Array.isArray(langs)) return langs;
    return typeof langs === "string" ? langs.split(",") : [langs];
  };

  const renderVisibilityBadge = (status) => {
    if (status === "pendente_aprovacao") {
      return (
        <span className="session-visibility-badge session-visibility-badge--pending">
          Aguardando aprovação do parceiro
        </span>
      );
    }

    if (status === "publica") {
      return (
        <span className="session-visibility-badge session-visibility-badge--public">
          <Globe2 size={14} />
          Pública
        </span>
      );
    }

    if (status === "privada") {
      return (
        <span className="session-visibility-badge session-visibility-badge--private">
          <Lock size={14} />
          Privada
        </span>
      );
    }

    return null;
  };

  // =========================
  // FILTRO DE BUSCA
  // =========================
  // Busca em tempo real, case-insensitive e por correspondência parcial em
  // parceiro, idioma, hub e país.
  const filteredSessions = sessions.filter((session) => {
    const searchStr = sessionSearch.trim().toLowerCase();
    if (!searchStr) return true;

    return (
      (session.partner || "").toLowerCase().includes(searchStr) ||
      (session.languages || "").toLowerCase().includes(searchStr) ||
      (session.hub || "").toLowerCase().includes(searchStr) ||
      (session.country || "").toLowerCase().includes(searchStr)
    );
  });

  return (
    <DashboardLayout>
      <div className="sessions-header">
        <h2>Minhas Sessões</h2>

        <div className="sessions-header-actions">
          {!loading && !error && sessions.length > 0 && (
            <div className="sessions-search-wrapper">
              <Search size={16} className="sessions-search-icon" />
              <input
                type="text"
                className="input sessions-search-input"
                placeholder="Buscar por nome, idioma, hub ou país..."
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
              />
            </div>
          )}

          <div className="container-new-session-btn">
            <button
              className="btn btn-primary btn-new-session"
              onClick={() => setIsModalOpen(true)}
            >
              <PlusCircle size={20} />
              Nova Sessão
            </button>
          </div>
        </div>
      </div>

      {/* PEDIDOS DE SESSÃO PÚBLICA (eu como parceiro) */}
      {!pendingLoading && pendingApprovals.length > 0 && (
        <div className="pending-approvals-section">
          <h3>Pedidos de sessão pública</h3>

          <div className="pending-approvals-list">
            {pendingApprovals.map((item) => (
              <div key={item.id} className="pending-approval-card">
                <div className="pending-approval-thumb">
                  {item.session_photo_url ? (
                    <img src={item.session_photo_url} alt={item.requester} />
                  ) : (
                    <div className="pending-approval-thumb-placeholder">
                      Sem foto
                    </div>
                  )}
                </div>

                <div className="pending-approval-body">
                  <p className="pending-approval-title">
                    <strong>{item.requester}</strong> ({item.hub}) quer
                    tornar esta sessão pública
                  </p>

                  <div className="pending-approval-meta">
                    <span>
                      <Calendar size={16} />
                      {item.date}
                    </span>
                    <span>
                      <Languages size={16} />
                      {item.languages}
                    </span>
                  </div>
                </div>

                <button
                  className="btn btn-secondary pending-approval-review-btn"
                  onClick={() => setSelectedApproval(item)}
                >
                  Revisar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* SEM RESULTADOS NA BUSCA */}
      {!loading && !error && sessions.length > 0 && filteredSessions.length === 0 && (
        <div className="empty-message">
          <p>Nenhuma sessão encontrada para essa busca.</p>
        </div>
      )}

      {/* TABELA */}
      {!loading && !error && filteredSessions.length > 0 && (
        <div className="sessions-grid">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              photoUrl={session.session_photo_url}
              personA={session.selfPerson}
              personB={session.otherPerson}
              date={session.date}
              duration={session.duration}
              languages={session.languages}
              statusBadge={
                session.status === "pendente_aprovacao"
                  ? "pending"
                  : session.status === "publica"
                    ? "public"
                    : "private"
              }
              onClick={() => setSelectedSession(session)}
            />
          ))}
        </div>
      )}

      {/* MODAL NOVA SESSÃO */}
      <AddSessionModal
        key={preselectedPartnerId || "new-session"}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPreselectedPartnerId(null);
        }}
        partners={partners}
        initialPartnerId={preselectedPartnerId}
        onSessionAdded={handleSessionAdded}
      />

      {/* MODAL FOTO */}
      {selectedImage && (
        <div
          className="sessions-image-modal-overlay"
          onClick={() => setSelectedImage(null)}
        >
          <div className="sessions-image-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="btn btn-ghost--icon sessions-close-image-btn"
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
              className="btn btn-ghost--icon sessions-close-image-btn"
              onClick={() => setSelectedSession(null)}
            >
              <X size={22} />
            </button>

            {selectedSession.session_photo_url && (
              <div className="details-image-wrapper">
                <img
                  src={selectedSession.session_photo_url}
                  alt={selectedSession.partner}
                  className="details-image"
                  onClick={() =>
                    setSelectedImage(selectedSession.session_photo_url)
                  }
                />
                <div className="details-image-badge">
                  {renderVisibilityBadge(selectedSession.status)}
                </div>
              </div>
            )}

            <SessionCardPeople
              personA={selectedSession.selfPerson}
              personB={selectedSession.otherPerson}
              size="lg"
            />

            <div className="details-content">
              {!selectedSession.session_photo_url &&
                renderVisibilityBadge(selectedSession.status)}

              <div className="detail-row">
                <Calendar size={18} />
                <span>{selectedSession.date}</span>
              </div>

              <div className="detail-row">
                <Clock size={18} />
                <span>{selectedSession.duration} minutos</span>
              </div>

              <div className="detail-row">
                <Languages size={18} />
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

              {selectedSession.isOwner && (
                <div className="details-actions">
                  {selectedSession.status === "privada" && (
                    <button
                      className="btn btn-primary make-public-btn"
                      onClick={() => handleMakePublic(selectedSession)}
                    >
                      <Globe2 size={18} />
                      Tornar pública
                    </button>
                  )}

                  <button
                    className="btn btn-danger delete-session-btn"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                  >
                    <Trash2 size={18} />
                    Excluir sessão
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <ConfirmModal
          title="Excluir sessão?"
          message={`Essa ação não pode ser desfeita. A sessão com ${selectedSession?.partner} será excluída permanentemente.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          onConfirm={confirmDeleteSession}
          onClose={() => setIsDeleteConfirmOpen(false)}
        />
      )}

      {deleteErrorMessage && (
        <div className="info-modal-overlay">
          <div className="info-modal-box dotted-texture">
            <h3>Não foi possível excluir</h3>
            <p>{deleteErrorMessage}</p>
            <button onClick={() => setDeleteErrorMessage(null)}>
              Entendi
            </button>
          </div>
        </div>
      )}

      <PendingApprovalModal
        approval={selectedApproval}
        onClose={() => setSelectedApproval(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </DashboardLayout>
  );
};

export default MySessions;
