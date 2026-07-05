import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import PartnerCard from "../../components/common/PartnerCard";
import PartnerModal from "../../components/common/PartnerModal";
import PersonAvatar from "../../components/common/PersonAvatar";
import { Search } from "lucide-react";

import { usePartners } from "../../hooks/usePartners";
import { supabase } from "../../services/supabaseClient";
import { getFlagUrl } from "../../utils/countryFlag";
import Swal from "sweetalert2";

import "./parceiros.css";

const FindPartners = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [reviewingRequest, setReviewingRequest] = useState(null);

  // Novos estados para a lógica de conexões
  const [currentUser, setCurrentUser] = useState(null);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [connections, setConnections] = useState([]);

  // Controle de perfil incompleto
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  const { partners, loading, error } = usePartners();

  // =========================
  // CARREGAR DADOS DO USUÁRIO E SOLICITAÇÕES
  // =========================
  useEffect(() => {
    const fetchUserDataAndRequests = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUser(user);

        // 1. Checar se o perfil está completo
        const { data: profile } = await supabase
          .from("profiles")
          .select("speaks, learns")
          .eq("id", user.id)
          .single();

        if (profile) {
          setIsProfileIncomplete(!profile.speaks || !profile.learns);
        }

        // 2. Buscar solicitações enviadas
        // Nota: O Supabase entende as foreign keys, então pedimos os dados do 'receiver'.
        // Mesmo shape do join de "recebidas" — usado também para montar "Minhas Conexões".
        const { data: sent } = await supabase
          .from("connection_requests")
          .select('*, receiver:profiles!receiver_id(id, full_name, hub, country, speaks, learns, photo_url)')
          .eq("sender_id", user.id);

        // 3. Buscar solicitações recebidas
        // Inclui os campos necessários para exibir o perfil no modal de revisão (Ver solicitação)
        const { data: received } = await supabase
          .from("connection_requests")
          .select('*, sender:profiles!sender_id(id, full_name, hub, country, speaks, learns, photo_url)')
          .eq("receiver_id", user.id);

        // 4. Separar aceitas (viram "Minhas Conexões") das pendências —
        // conexão aceita não deve aparecer duplicada em Enviadas/Recebidas
        const acceptedFromSent = (sent || [])
          .filter((r) => r.status === "aceito")
          .map((r) => ({ ...r, otherProfile: r.receiver }));

        const acceptedFromReceived = (received || [])
          .filter((r) => r.status === "aceito")
          .map((r) => ({ ...r, otherProfile: r.sender }));

        setConnections([...acceptedFromSent, ...acceptedFromReceived]);
        setSentRequests((sent || []).filter((r) => r.status !== "aceito"));
        setReceivedRequests(
          (received || []).filter((r) => r.status !== "aceito"),
        );
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      }
    };

    fetchUserDataAndRequests();
  }, []);

  // =========================
  // FILTRO
  // =========================
  const filteredPartners = useMemo(() => {
    if (!searchTerm.trim()) return partners;

    const term = searchTerm.toLowerCase();

    return partners.filter((partner) => {
      return (
        partner.full_name?.toLowerCase().includes(term) ||
        partner.hub?.toLowerCase().includes(term) ||
        partner.speaks?.toLowerCase().includes(term) ||
        partner.learns?.toLowerCase().includes(term)
      );
    });
  }, [partners, searchTerm]);

  // =========================
  // CANCELAR SOLICITAÇÃO ENVIADA
  // =========================
  const handleCancelSentRequest = async (requestId) => {
    try {
      // .select() devolve as linhas realmente apagadas — se vier vazio, o RLS
      // bloqueou o delete e não devemos tratar isso como sucesso.
      const { data: deleted, error } = await supabase
        .from("connection_requests")
        .delete()
        .eq("id", requestId)
        .select();

      if (error) throw error;

      if (!deleted || deleted.length === 0) {
        throw new Error("Não foi possível cancelar (permissão negada).");
      }

      setSentRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      console.error("Erro ao cancelar solicitação:", err);
      Swal.fire("Erro", "Não foi possível cancelar a solicitação.", "error");
    }
  };

  // =========================
  // SINCRONIZAR MUDANÇAS VINDAS DO MODAL
  // =========================
  const handleConnectionChange = (row) => {
    if (!row || !currentUser) return;

    // Cancelamento ou rejeição: remove a linha de onde quer que ela esteja
    if (row._removed) {
      setSentRequests((prev) => prev.filter((r) => r.id !== row.id));
      setReceivedRequests((prev) => prev.filter((r) => r.id !== row.id));
      setConnections((prev) => prev.filter((c) => c.id !== row.id));
      return;
    }

    // Aceita (match mútuo ou revisão manual): sai das pendências e passa a
    // existir só em "Minhas Conexões" — não duplica a mesma conexão nas duas telas
    if (row.status === "aceito") {
      setSentRequests((prev) => prev.filter((r) => r.id !== row.id));
      setReceivedRequests((prev) => prev.filter((r) => r.id !== row.id));

      // Quem aceita é sempre o receiver_id da linha (aceite manual ou match
      // mútuo funcionam assim) — a outra pessoa é o sender, cujo perfil já
      // temos em memória vindo do modal que disparou essa mudança.
      const otherProfile =
        [selectedPartner, reviewingRequest?.sender].find(
          (p) => p && p.id === row.sender_id,
        ) || null;

      setConnections((prev) => {
        const exists = prev.some((c) => c.id === row.id);
        if (exists) {
          return prev.map((c) => (c.id === row.id ? { ...c, ...row } : c));
        }
        if (!otherProfile) return prev;
        return [...prev, { ...row, otherProfile }];
      });

      return;
    }

    // Nova solicitação pendente enviada por mim
    if (row.sender_id === currentUser.id) {
      setSentRequests((prev) => {
        const exists = prev.some((r) => r.id === row.id);
        if (exists) {
          return prev.map((r) => (r.id === row.id ? { ...r, ...row } : r));
        }
        return [
          ...prev,
          {
            ...row,
            receiver: selectedPartner
              ? {
                  id: selectedPartner.id,
                  full_name: selectedPartner.full_name,
                  hub: selectedPartner.hub,
                  country: selectedPartner.country,
                  speaks: selectedPartner.speaks,
                  learns: selectedPartner.learns,
                  photo_url: selectedPartner.photo_url,
                }
              : undefined,
          },
        ];
      });
    }

    // Nova solicitação pendente recebida por mim
    if (row.receiver_id === currentUser.id) {
      setReceivedRequests((prev) => {
        const exists = prev.some((r) => r.id === row.id);
        if (exists) {
          return prev.map((r) => (r.id === row.id ? { ...r, ...row } : r));
        }
        return [
          ...prev,
          {
            ...row,
            sender: selectedPartner
              ? {
                  id: selectedPartner.id,
                  full_name: selectedPartner.full_name,
                  hub: selectedPartner.hub,
                  country: selectedPartner.country,
                  speaks: selectedPartner.speaks,
                  learns: selectedPartner.learns,
                  photo_url: selectedPartner.photo_url,
                }
              : undefined,
          },
        ];
      });
    }
  };

  // =========================
  // CONECTAR (ABRIR MODAL)
  // =========================
  const handleConnectClick = (partner) => {
    if (isProfileIncomplete) {
      Swal.fire({
        title: "Acesso restrito",
        text: "Você precisa preencher seus idiomas no perfil antes de interagir com outros membros.",
        icon: "warning",
        confirmButtonText: "Completar Perfil",
        showCancelButton: true,
        cancelButtonText: "Agora não",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/profile");
        }
      });
    } else {
      setSelectedPartner(partner);
    }
  };

  return (
    <DashboardLayout>
      
      {/* SEÇÃO PRINCIPAL: MINHAS CONEXÕES */}
      <div className="connections-panel">
        <h2 className="section-title">Minhas Conexões</h2>

        {connections.length === 0 ? (
          <p className="empty-requests">
            Você ainda não tem conexões. Solicite uma conexão em "Explorar Rede" para começar.
          </p>
        ) : (
          <ul className="connections-grid">
            {connections.map((conn) => {
              const other = conn.otherProfile;
              const flagUrl = getFlagUrl(other?.country);

              return (
                <li key={conn.id} className="connection-card">
                  <PersonAvatar
                    photoUrl={other?.photo_url}
                    seed={other?.id}
                    name={other?.full_name}
                    size={64}
                  />
                  <div className="connection-name-row">
                    {flagUrl && <img src={flagUrl} alt="" className="connection-flag" />}
                    <strong className="connection-name" title={other?.full_name || "Usuário"}>
                      {other?.full_name || "Usuário"}
                    </strong>
                  </div>
                  <span className="connection-hub">{other?.hub || "Hub"}</span>
                  <button
                    className="btn-view-contact"
                    onClick={() => setSelectedPartner(other)}
                  >
                    Ver contato
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* SEÇÃO SECUNDÁRIA: SOLICITAÇÕES PENDENTES */}
        <div className="requests-secondary">
          <h3 className="secondary-title">Solicitações</h3>

          <div className="requests-container">
            {/* Coluna 1: Enviadas */}
            <div className="requests-column">
              <h4>Enviadas</h4>
              {sentRequests.length === 0 ? (
                <p className="empty-requests">Nenhuma solicitação enviada.</p>
              ) : (
                <ul className="request-list">
                  {sentRequests.map((req) => {
                    const flagUrl = getFlagUrl(req.receiver?.country);

                    return (
                      <li key={req.id} className="request-item">
                        <div className="request-info">
                          <PersonAvatar
                            photoUrl={req.receiver?.photo_url}
                            seed={req.receiver?.id}
                            name={req.receiver?.full_name}
                            size={40}
                          />
                          <div className="request-name-block">
                            <div className="request-name-row">
                              {flagUrl && <img src={flagUrl} alt="" className="request-flag" />}
                              <strong title={req.receiver?.full_name || "Usuário"}>
                                {req.receiver?.full_name || "Usuário"}
                              </strong>
                            </div>
                            <span>{req.receiver?.hub || "Hub"}</span>
                          </div>
                        </div>
                        <div className="request-actions">
                          <span className={`partners-status-badge status-${req.status}`}>
                            {req.status === "pendente" ? "Pendente" : "Rejeitado"}
                          </span>
                          {req.status === "pendente" && (
                            <button
                              className="btn-cancel-sent"
                              onClick={() => handleCancelSentRequest(req.id)}
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Coluna 2: Recebidas */}
            <div className="requests-column">
              <h4>Recebidas</h4>
              {receivedRequests.length === 0 ? (
                <p className="empty-requests">Nenhuma solicitação recebida.</p>
              ) : (
                <ul className="request-list">
                  {receivedRequests.map((req) => {
                    const flagUrl = getFlagUrl(req.sender?.country);

                    return (
                      <li key={req.id} className="request-item">
                        <div className="request-info">
                          <PersonAvatar
                            photoUrl={req.sender?.photo_url}
                            seed={req.sender?.id}
                            name={req.sender?.full_name}
                            size={40}
                          />
                          <div className="request-name-block">
                            <div className="request-name-row">
                              {flagUrl && <img src={flagUrl} alt="" className="request-flag" />}
                              <strong title={req.sender?.full_name || "Usuário"}>
                                {req.sender?.full_name || "Usuário"}
                              </strong>
                            </div>
                            <span>{req.sender?.hub || "Hub"}</span>
                          </div>
                        </div>
                        <div className="request-actions">
                          {req.status === "pendente" ? (
                            <button
                              className="btn-view-request"
                              onClick={() => setReviewingRequest(req)}
                            >
                              Ver solicitação
                            </button>
                          ) : (
                            <span className={`partners-status-badge status-${req.status}`}>
                              Rejeitado
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO DE BUSCA E GRID (Já existia, só ajustei os títulos) */}
      <div className="partners-page-header">
        <h2 className="section-title">Explorar Rede</h2>

        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nome, idioma ou hub..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="partners-grid">
        {loading && (
          <div className="loading-message">
            <p>Carregando parceiros...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>Erro ao carregar parceiros: {error}</p>
          </div>
        )}

        {!loading && !error && filteredPartners.length === 0 && (
          <div className="empty-message">
            <p>
              {searchTerm.trim()
                ? "Nenhum parceiro encontrado."
                : "Nenhum parceiro disponível."}
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          filteredPartners.map((partner) => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              onConnect={() => handleConnectClick(partner)}
              // Passando as requisições para o card saber o status atual:
              sentRequest={sentRequests.find(r => r.receiver_id === partner.id)}
              isConnected={connections.some((c) => c.otherProfile?.id === partner.id)}
            />
          ))}
      </div>

      <PartnerModal
        partner={selectedPartner}
        currentUser={currentUser}
        onClose={() => setSelectedPartner(null)}
        onConnectionChange={handleConnectionChange}
      />

      <PartnerModal
        mode="review"
        partner={reviewingRequest?.sender}
        request={reviewingRequest}
        currentUser={currentUser}
        onClose={() => setReviewingRequest(null)}
        onConnectionChange={handleConnectionChange}
      />
    </DashboardLayout>
  );
};

export default FindPartners;