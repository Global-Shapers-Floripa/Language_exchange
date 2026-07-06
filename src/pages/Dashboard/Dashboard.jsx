import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { supabase } from "../../services/supabaseClient";
import { getMatches } from "../../services/matchService";
import Swal from "sweetalert2";
import PartnerCard from "../../components/common/PartnerCard";
import PartnerModal from "../../components/common/PartnerModal";
import WhatsAppBanner from "../../components/common/WhatsAppBanner";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { getFlagUrl } from "../../utils/countryFlag";
import { Share2, ImageUp, Clock, Globe } from "lucide-react";
import Camera from "../../assets/camera.png";

import "./dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  // NOVO loading geral
  const [loadingData, setLoadingData] = useState(true);

  const [selectedPartner, setSelectedPartner] = useState(null);

  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  const {
    connectionsCount,
    sessionsCount,
    practicedTimeLabel,
    countries,
    loading: loadingStats,
  } = useDashboardStats();

  // =========================
  // REGISTRAR SESSÃO
  // =========================
  const handleRegisterSession = () => {
    navigate("/sessions");
  };

  // =========================
  // CARREGAR DADOS
  // =========================
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user = session?.user;

        if (!user) {
          setLoadingData(false);
          return;
        }

        // =========================
        // VERIFICAR PERFIL
        // =========================
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("speaks, learns")
          .eq("id", user.id)
          .single();

        let incomplete = false;

        if (!profileError && profile) {
          incomplete = !profile.speaks || !profile.learns;

          setIsProfileIncomplete(incomplete);
        }

        // =========================
        // BUSCAR MATCHES
        // =========================
        const result = await getMatches(user.id);
        setMatches(result);

        // FINALIZA loading ANTES do modal
        setLoadingData(false);

        // =========================
        // MOSTRAR MODAL
        // =========================
        if (incomplete) {
          Swal.fire({
            title: "Bem-vindo(a)!",
            text: "Para ver seus matches e se conectar, precisamos saber quais idiomas você fala e quais quer aprender.",
            icon: "info",
            confirmButtonText: "Configurar Perfil",
            allowOutsideClick: false,
            allowEscapeKey: false,
          }).then((result) => {
            if (result.isConfirmed) {
              navigate("/profile");
            }
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingMatches(false);
      }
    };

    loadDashboardData();
  }, [navigate]);

  // =========================
  // BLOQUEAR RENDERIZAÇÃO
  // =========================
  if (loadingData) {
    return (
      <DashboardLayout>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
            color: "#666",
            fontSize: "16px",
          }}
        >
          Carregando dashboard...
        </div>
      </DashboardLayout>
    );
  }

  // =========================
  // CONECTAR COM PARCEIRO
  // =========================
  const handleConnectClick = (partner) => {
    if (isProfileIncomplete) {
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
      setSelectedPartner(partner);
    }
  };

  return (
    <DashboardLayout>
      <div className="dash-container">
        {/* BANNER WHATSAPP */}
        <WhatsAppBanner />

        {/* SEÇÃO DASHBOARD (ESTATÍSTICAS) */}
        <div className="dashboard-stats-section">
          <h3 className="dashboard-stats-title">Dashboard</h3>

          <div className="dashboard-stats-grid">
            {/* Card 1: Conexões */}
            <div className="card card--stat dashboard-stat-card">
              <div className="dashboard-stat-header">
                <span className="dashboard-stat-label">Conexões</span>
                <Share2 size={20} className="dashboard-stat-icon" />
              </div>
              <div className="dashboard-stat-content">
                <span className="dashboard-stat-value">
                  {loadingStats ? "…" : connectionsCount}
                </span>
              </div>
            </div>

            {/* Card 2: Sessões registradas */}
            <div className="card card--stat dashboard-stat-card">
              <div className="dashboard-stat-header">
                <span className="dashboard-stat-label">
                  Sessões registradas
                </span>
                <ImageUp size={20} className="dashboard-stat-icon" />
              </div>
              <div className="dashboard-stat-content">
                <span className="dashboard-stat-value">
                  {loadingStats ? "…" : sessionsCount}
                </span>
              </div>
            </div>

            {/* Card 3: Horas praticadas */}
            <div className="card card--stat dashboard-stat-card">
              <div className="dashboard-stat-header">
                <span className="dashboard-stat-label">Horas praticadas</span>
                <Clock size={20} className="dashboard-stat-icon" />
              </div>
              <div className="dashboard-stat-content">
                <span className="dashboard-stat-value">
                  {loadingStats ? "…" : practicedTimeLabel}
                </span>
              </div>
            </div>

            {/* Card 4: Países alcançados */}
            <div className="card card--stat dashboard-stat-card">
              <div className="dashboard-stat-header">
                <span className="dashboard-stat-label">Países alcançados</span>
                <Globe size={20} className="dashboard-stat-icon" />
              </div>
              <div className="dashboard-stat-content">
                <span className="dashboard-stat-value">
                  {loadingStats ? "…" : countries.length}
                </span>
                {!loadingStats && countries.length > 0 && (
                  <div className="dashboard-country-flags">
                    {countries.map((code) => {
                      const flagUrl = getFlagUrl(code);
                      return flagUrl ? (
                        <img
                          key={code}
                          src={flagUrl}
                          alt={code}
                          className="dashboard-country-flag"
                        />
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Card CTA (Mantido conforme seu código original, mas adapte se não for usar) */}
            <div className="dashboard-cta-card">
              {/* Imagem decorativa adicionada aqui */}
              <img src={Camera} alt="" className="dashboard-cta-decor" />

              <div className="dashboard-cta-text">
                <p>Realizou uma sessão recentemente?</p>
              </div>

              <button
                className="btn dashboard-cta-btn"
                onClick={handleRegisterSession}
              >
                Registrar
              </button>
            </div>
          </div>
        </div>

        <div className="parceiros-dashboard-preview">
          {/* HEADER */}
          <div className="section-header-dashboard">
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
              <p style={{ color: "#666" }}>Nenhum parceiro encontrado.</p>
            ) : (
              matches
                .slice(0, 4)
                .map((partner) => (
                  <PartnerCard
                    key={partner.id}
                    partner={partner}
                    onConnect={() => handleConnectClick(partner)}
                  />
                ))
            )}
          </div>
        </div>
        {/* MODAL CONTATO */}
        {selectedPartner && (
          <PartnerModal
            partner={selectedPartner}
            onClose={() => setSelectedPartner(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
