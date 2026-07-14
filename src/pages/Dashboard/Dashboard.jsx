import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { supabase } from "../../services/supabaseClient";
import { getMatches } from "../../services/matchService";
import Swal from "sweetalert2";
import PartnerCard from "../../components/common/PartnerCard";
import WhatsAppBanner from "../../components/common/WhatsAppBanner";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { getFlagUrl } from "../../utils/countryFlag";
import { COUNTRIES } from "../../constants/countries";
import { Share2, ImageUp, Clock, Globe, Book, MessageCircle, Calendar } from "lucide-react";
import Camera from "../../assets/camera.png";

import "./dashboard.css";
import "../Resources/recursos.css";

// Preview dos 4 recursos "balão" da página /resources — mantido em sincronia
// manual com resourceList em Recursos.jsx (mesma lógica de duplicação já
// usada em matchService/usePartners neste projeto).
// Recebe `td` (useTranslation "dashboard") porque é definida fora do
// componente, sem acesso direto ao hook.
const getResourcePreview = (td) => [
  {
    title: td("dashboardPage.resourcesPreview.items.feedback.title"),
    desc: td("dashboardPage.resourcesPreview.items.feedback.desc"),
    icon: <Book size={24} className="icon-blue" />,
    themeClass: "card-orange",
  },
  {
    title: td("dashboardPage.resourcesPreview.items.icebreakers.title"),
    desc: td("dashboardPage.resourcesPreview.items.icebreakers.desc"),
    icon: <MessageCircle size={24} className="icon-purple" />,
    themeClass: "card-navy",
  },
  {
    title: td("dashboardPage.resourcesPreview.items.translationToolkit.title"),
    desc: td("dashboardPage.resourcesPreview.items.translationToolkit.desc"),
    icon: <Globe size={24} className="icon-green" />,
    themeClass: "card-blue",
  },
  {
    title: td("dashboardPage.resourcesPreview.items.scheduling.title"),
    desc: td("dashboardPage.resourcesPreview.items.scheduling.desc"),
    icon: <Calendar size={24} className="icon-orange" />,
    themeClass: "card-yellow",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("constants");
  const { t: td } = useTranslation("dashboard");

  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  // NOVO loading geral
  const [loadingData, setLoadingData] = useState(true);

  const {
    connectionsCount,
    sessionsCount,
    practicedTimeLabel,
    countries,
    countryProgress,
    loading: loadingStats,
  } = useDashboardStats();

  // =========================
  // PRÉVIA DO MAPA DE BANDEIRAS
  // =========================
  // Mesma ordenação da versão completa (Perfil): desbloqueados primeiro
  // (mais conexões -> menos), depois bloqueados — mas só uma amostra, sem
  // precisar mostrar os ~67 países aqui.
  const countryProgressMap = new Map(
    (countryProgress || []).map((country) => [country.code, country]),
  );

  const unlockedPreview = COUNTRIES.filter((country) =>
    countryProgressMap.has(country.code),
  ).sort(
    (a, b) =>
      countryProgressMap.get(b.code).count - countryProgressMap.get(a.code).count,
  );

  const lockedPreview = COUNTRIES.filter(
    (country) => !countryProgressMap.has(country.code),
  );

  const flagsPreview = [...unlockedPreview, ...lockedPreview].slice(0, 12);

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
            title: td("dashboardPage.welcomeSwal.title"),
            text: td("dashboardPage.welcomeSwal.text"),
            icon: "info",
            iconColor: "var(--brand-orange, #FF8400)",
            confirmButtonText: td("dashboardPage.welcomeSwal.confirmText"),
            allowOutsideClick: true,
            allowEscapeKey: false,
            customClass: {
              title: "swal-title-brand",
            },
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
  }, [navigate, td]);

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
          {td("dashboardPage.loading")}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="dash-container">
        {/* BANNER WHATSAPP */}
        <WhatsAppBanner />

        {/* SEÇÃO DASHBOARD (ESTATÍSTICAS) */}
        <div className="dashboard-stats-section">
          <h3 className="dashboard-stats-title">{td("dashboardPage.stats.title")}</h3>

          <div className="dashboard-stats-grid">
            {/* Card 1: Conexões */}
            <div className="card card--stat dashboard-stat-card">
              <div className="dashboard-stat-header">
                <span className="dashboard-stat-label">{td("dashboardPage.stats.connections")}</span>
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
                  {td("dashboardPage.stats.sessionsLogged")}
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
                <span className="dashboard-stat-label">{td("dashboardPage.stats.hoursPracticed")}</span>
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
                <span className="dashboard-stat-label">{td("dashboardPage.stats.countriesReached")}</span>
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
                <p>{td("dashboardPage.cta.text")}</p>
              </div>

              <button
                className="btn dashboard-cta-btn"
                onClick={handleRegisterSession}
              >
                {td("dashboardPage.cta.button")}
              </button>
            </div>
          </div>
        </div>

        <div className="parceiros-dashboard-preview">
          {/* HEADER */}
          <div className="section-header-dashboard">
            <h3>{td("dashboardPage.suggestedConnections.title")}</h3>
            <a href="/partners">{td("dashboardPage.suggestedConnections.viewAll")}</a>
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
              <p style={{ color: "#666" }}>{td("dashboardPage.suggestedConnections.noneFound")}</p>
            ) : (
              matches
                .slice(0, 4)
                .map((partner) => (
                  <PartnerCard key={partner.id} partner={partner} exploreOnly />
                ))
            )}
          </div>
        </div>

        <div className="parceiros-dashboard-preview">
          {/* HEADER */}
          <div className="section-header-dashboard">
            <h3>{td("dashboardPage.flagMap.title")}</h3>
            <a href="/profile?scrollTo=mapa-bandeiras">{td("dashboardPage.flagMap.viewAll")}</a>
          </div>
          {/* PRÉVIA (só decorativa — detalhe completo e clique ficam no Perfil) */}
          <div className="country-flags-preview-row">
            {loadingStats ? (
              <p style={{ color: "#666" }}>{td("dashboardPage.flagMap.loading")}</p>
            ) : flagsPreview.length === 0 ? (
              <p style={{ color: "#666" }}>
                {td("dashboardPage.flagMap.empty")}
              </p>
            ) : (
              flagsPreview.map((country) => {
                const unlocked = countryProgressMap.has(country.code);
                const flagUrl = getFlagUrl(country.code);

                return flagUrl ? (
                  <img
                    key={country.code}
                    src={flagUrl}
                    alt={t(`countries.${country.code}`)}
                    title={t(`countries.${country.code}`)}
                    className={`country-flags-preview-flag ${unlocked ? "unlocked" : "locked"}`}
                  />
                ) : null;
              })
            )}
          </div>
        </div>

        <div className="parceiros-dashboard-preview">
          {/* HEADER */}
          <div className="section-header-dashboard">
            <h3>{td("dashboardPage.resourcesPreview.title")}</h3>
            <a href="/resources">{td("dashboardPage.resourcesPreview.viewAll")}</a>
          </div>
          {/* PREVIEW (sem ações — só leva para /resources) */}
          <div className="resources-grid dashboard-resources-grid">
            {getResourcePreview(td).map((item, index) => (
              <div className={`resource-card ${item.themeClass}`} key={index}>
                <div className="resource-icon-wrapper">
                  {item.icon}
                  <h3>{item.title}</h3>
                </div>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
