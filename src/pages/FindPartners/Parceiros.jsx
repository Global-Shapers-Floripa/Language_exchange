import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import PartnerCard from "../../components/common/PartnerCard";
import PartnerModal from "../../components/common/PartnerModal";
import { Search } from "lucide-react";

import { usePartners } from "../../hooks/usePartners";
import { supabase } from "../../services/supabaseClient";
import Swal from "sweetalert2";

import "./parceiros.css";

const FindPartners = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);

  // Novos estados para a lógica de conexões
  const [currentUser, setCurrentUser] = useState(null);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);

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
        // Nota: O Supabase entende as foreign keys, então pedimos os dados do 'receiver'
        const { data: sent } = await supabase
          .from("connection_requests")
          .select('*, receiver:profiles!receiver_id(id, full_name, hub)')
          .eq("sender_id", user.id);
        
        if (sent) setSentRequests(sent);

        // 3. Buscar solicitações recebidas
        const { data: received } = await supabase
          .from("connection_requests")
          .select('*, sender:profiles!sender_id(id, full_name, hub)')
          .eq("receiver_id", user.id);
        
        if (received) setReceivedRequests(received);

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
      
      {/* SEÇÃO DE SOLICITAÇÕES (Nova UI baseada no seu design) */}
      <div className="connections-panel">
        <h2 className="section-title">Conexões</h2>
        
        <div className="requests-container">
          {/* Coluna 1: Enviadas */}
          <div className="requests-column">
            <h3>Solicitações enviadas</h3>
            {sentRequests.length === 0 ? (
              <p className="empty-requests">Nenhuma solicitação enviada.</p>
            ) : (
              <ul className="request-list">
                {sentRequests.map(req => (
                  <li key={req.id} className="request-item">
                    <div className="request-info">
                      <div className="request-avatar"></div> {/* Substituir por <img> se tiver avatar */}
                      <div>
                        <strong>{req.receiver?.full_name || 'Usuário'}</strong>
                        <span>• {req.receiver?.hub || 'Hub'}</span>
                      </div>
                    </div>
                    <span className={`status-badge status-${req.status}`}>
                      {req.status === 'pendente' ? 'Pendente' : 
                       req.status === 'aceito' ? 'Aceito' : 'Rejeitado'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Coluna 2: Recebidas */}
          <div className="requests-column">
            <h3>Solicitações Recebidas</h3>
            {receivedRequests.length === 0 ? (
              <p className="empty-requests">Nenhuma solicitação recebida.</p>
            ) : (
              <ul className="request-list">
                {receivedRequests.map(req => (
                  <li key={req.id} className="request-item">
                    <div className="request-info">
                      <div className="request-avatar"></div>
                      <div>
                        <strong>{req.sender?.full_name || 'Usuário'}</strong>
                        <span>• {req.sender?.hub || 'Hub'}</span>
                      </div>
                    </div>
                    <div className="request-actions">
                       {/* O botão abaixo pode abrir um modal no futuro ou já aceitar direto */}
                      <button className="btn-view-request">Ver solicitação</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
            />
          ))}
      </div>

      <PartnerModal
        partner={selectedPartner}
        currentUser={currentUser}
        onClose={() => setSelectedPartner(null)}
        // Podemos passar uma função aqui depois para atualizar a lista após enviar o pedido!
      />
    </DashboardLayout>
  );
};

export default FindPartners;