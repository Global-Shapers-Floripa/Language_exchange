import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { supabase } from "../../services/supabaseClient";
import { getMatches } from "../../services/matchService";
import Swal from "sweetalert2";

import "./dashboard.css";
import registraSessao from "../../assets/registrar-sessao.svg";

const Dashboard = () => {
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState(null);
  
  // Novo estado para controlar se o perfil está incompleto
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  // =========================
  // REGISTRAR SESSÃO
  // =========================
  const handleRegisterSession = () => {
    navigate("/sessions");
  };

  // =========================
  // CARREGAR DADOS E MATCHES
  // =========================
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // 1. Buscar o perfil do usuário atual para checar os idiomas
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("speaks, learns")
          .eq("id", user.id)
          .single();

        if (!profileError && profile) {
          // Checa se os campos estão nulos ou vazios
          const incomplete = !profile.speaks || !profile.learns;
          setIsProfileIncomplete(incomplete);

          // Se estiver incompleto, joga o pop-up na tela
          if (incomplete) {
            Swal.fire({
              title: "Bem-vindo(a)!",
              text: "Para ver seus matches e se conectar, precisamos saber quais idiomas você fala e quais quer aprender.",
              icon: "info",
              confirmButtonText: "Configurar Perfil",
              allowOutsideClick: false, // Impede de fechar clicando fora
              allowEscapeKey: false,    // Impede de fechar com o botão ESC
            }).then((result) => {
              if (result.isConfirmed) {
                navigate("/profile"); // Redireciona para a tela de edição
              }
            });
          }
        }

        // 2. Buscar os matches
        const result = await getMatches(user.id);
        setMatches(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingMatches(false);
      }
    };

    loadDashboardData();
  }, [navigate]);

  // =========================
  // CONECTAR COM PARCEIRO (COM TRAVA)
  // =========================
  const handleConnectClick = (partner) => {
    if (isProfileIncomplete) {
      // Bloqueia a ação se o perfil estiver incompleto
      Swal.fire({
        title: "Acesso restrito",
        text: "Você precisa preencher seus idiomas no perfil antes de ver os dados de contato de outros membros.",
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
      // Fluxo normal caso esteja tudo preenchido
      setSelectedPartner(partner);
    }
  };

  // =========================
  // SCORE LABEL
  // =========================
  const getMatchLabel = (score) => {
    if (score >= 10) return "Match perfeito";
    if (score >= 6) return "Ótima compatibilidade";
    if (score >= 3) return "Boa conexão";
    return "Compatibilidade baixa";
  };

  return (
    <DashboardLayout>
      {/* BANNER */}
      <div className="welcome-banner">
        <div className="banner-content">
          <div className="banner-text">
            <h2>"From words to worlds"</h2>
            <p>
              Realizou uma sessão recentemente? Não se esqueça de registrar o impacto!
            </p>
          </div>

          <button
            className="btn-register"
            onClick={handleRegisterSession}
          >
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

      {/* HEADER */}
      <div className="section-header">
        <h3>Parceiros Sugeridos</h3>
        <a href="/partners">Ver todos &gt;</a>
      </div>

      {/* MATCHES */}
      <div className="partners-grid">
        {loadingMatches ? (
          <>
            {[1, 2, 3].map((item) => (
              <div key={item} className="match-skeleton">
                <div className="skeleton-avatar"></div>
                <div className="skeleton-line short"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-tags">
                  <span></span>
                  <span></span>
                </div>
                <div className="skeleton-button"></div>
              </div>
            ))}
          </>
        ) : matches.length === 0 ? (
          <p style={{ color: "#666" }}>
            Nenhum parceiro encontrado.
          </p>
        ) : (
          matches.slice(0, 4).map((partner) => (
            <div key={partner.id} className="partner-card">
              {/* FOTO */}
              <div className="partner-avatar">
                {partner.photo_url ? (
                  <img src={partner.photo_url} alt={partner.full_name} />
                ) : (
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.full_name}`}
                    alt={partner.full_name}
                  />
                )}
              </div>

              {/* INFO */}
              <div className="partner-info">
                <h4>{partner.full_name}</h4>
                <span className="partner-hub">
                  HUB {partner.hub || "NÃO DEFINIDO"}
                </span>

                <p className="partner-match">
                  {getMatchLabel(partner.matchScore)}
                </p>

                <div className="partner-languages">
                  <div>
                    <strong>Fala:</strong> {partner.speaks || "—"}
                  </div>
                  <div>
                    <strong>Aprende:</strong> {partner.learns || "—"}
                  </div>
                </div>

                {/* BOTÃO ATUALIZADO */}
                <button
                  className="btn-connect"
                  onClick={() => handleConnectClick(partner)}
                >
                  <MessageCircle size={18} />
                  Conectar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL CONTATO */}
      {selectedPartner && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedPartner(null)}
        >
          <div
            className="connect-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Conectar com {selectedPartner.full_name}</h3>
            <p>
              <strong>Email:</strong> {selectedPartner.email || "Não informado"}
            </p>
            <p>
              <strong>Telefone:</strong> {selectedPartner.phone || "Não informado"}
            </p>
            <button
              className="close-modal-btn"
              onClick={() => setSelectedPartner(null)}
            >
              X
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;