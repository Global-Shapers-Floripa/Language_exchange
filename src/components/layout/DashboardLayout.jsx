import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Home,
  Users,
  User,
  Calendar,
  BookOpen,
  LogOut,
  Handshake,
  UserStar,
  HelpCircle,
  ArrowUpRight,
  Globe2,
} from "lucide-react";
import { supabase } from "../../services/supabaseClient";
import PersonAvatar from "../common/PersonAvatar";
import LanguageSwitcher from "../common/LanguageSwitcher";
import logoLE from "../../assets/logo-azul-claro.png";
import BannerSidebar from "../../assets/banner-sidebar.png";
import "./styles.css";

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const { t } = useTranslation("dashboard");

  const [userData, setUserData] = useState({
    id: null,
    name: "Carregando...",
    hub: "SHAPER",
    photo_url: "",
    is_admin: false,
  });

  // =========================
  // CARREGAR PERFIL
  // =========================
  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate("/login", { replace: true });
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, hub, photo_url, is_admin, is_approved")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error(error);
          return;
        }

        if (data && data.is_approved !== true) {
          navigate("/pending-approval", { replace: true });
          return;
        }

        if (data) {
          setUserData({
            id: user.id,
            name: data.full_name || t("defaultUserName"),
            hub: data.hub || "SHAPER",
            photo_url: data.photo_url || "",
            is_admin: data.is_admin === true,
          });
        }
      } catch (err) {
        console.error("Erro ao carregar usuário:", err);
      }
    };

    getUserProfile();
  }, [navigate, t]);

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // =========================
  // IDIOMA PREFERIDO
  // =========================
  // Best-effort: não bloqueia nem afeta a troca de idioma na UI (que já
  // aconteceu via i18n.changeLanguage dentro do LanguageSwitcher) se o
  // update falhar — só persiste a preferência para os e-mails transacionais
  // lerem depois.
  const handleLanguageChange = async (lng) => {
    if (!userData.id) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ preferred_language: lng })
        .eq("id", userData.id);

      if (error) {
        console.error("Erro ao salvar idioma preferido:", error);
      }
    } catch (err) {
      console.error("Erro ao salvar idioma preferido:", err);
    }
  };

  // =========================
  // FOTO & NOME
  // =========================
  const firstName =
    userData.name !== "Carregando..."
      ? userData.name.split(" ")[0]
      : t("defaultUserName");

  return (
    <div className="dashboard-root">
      <div className="dashboard-container">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <img src={logoLE} alt="Logo Language Exchange" />
            <p>
              <span className="text-cream">LANGUAGE</span>
              <br />
              EXCHANGE
            </p>
          </div>

          <nav className="sidebar-nav">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <div className="icon-wrapper">
                <Home size={18} />
              </div>
              {t("sidebar.home")}
            </NavLink>

            <NavLink
              to="/partners"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <div className="icon-wrapper">
                <Users size={18} />
              </div>
              {t("sidebar.connections")}
            </NavLink>

            <NavLink
              to="/sessions"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <div className="icon-wrapper">
                <Calendar size={18} />
              </div>
              {t("sidebar.sessions")}
            </NavLink>

            <NavLink
              to="/comunidade"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <div className="icon-wrapper">
                <Globe2 size={18} />
              </div>
              {t("sidebar.community")}
            </NavLink>

            <NavLink
              to="/resources"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <div className="icon-wrapper">
                <BookOpen size={18} />
              </div>
              {t("sidebar.resources")}
            </NavLink>

            <NavLink
              to="/project-partners"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <div className="icon-wrapper">
                <Handshake size={18} />
              </div>
              {t("sidebar.projectPartners")}
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <div className="icon-wrapper">
                <User size={18} />
              </div>
              {t("sidebar.profile")}
            </NavLink>

            {userData.is_admin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
              >
                <div className="icon-wrapper">
                  <UserStar size={18} />
                </div>
                {t("sidebar.admin")}
              </NavLink>
            )}

            {/* Duplicam Ajuda/Sair de .sidebar-bottom — só aparecem no
                mobile/tablet (ver .nav-item-mobile-extra em styles.css),
                já que ali o .sidebar-bottom fica escondido */}
            <NavLink
              to="/help"
              className={({ isActive }) =>
                isActive
                  ? "nav-item nav-item-mobile-extra active"
                  : "nav-item nav-item-mobile-extra"
              }
            >
              <div className="icon-wrapper">
                <HelpCircle size={20} />
              </div>
              {t("sidebar.help")}
            </NavLink>

            <button
              type="button"
              className="nav-item nav-item-mobile-extra"
              onClick={handleLogout}
            >
              <div className="icon-wrapper">
                <LogOut size={20} />
              </div>
              {t("sidebar.logout")}
            </button>
          </nav>

          {/* SIDEBAR BOTTOM (Banner + Links) */}
          <div className="sidebar-bottom">
            <a
              href="https://www.globalshapersflorianopolis.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="sidebar-banner"
              style={{ "--banner-img": `url(${BannerSidebar})` }} // Passando a imagem para a variável CSS
            >
              <span className="btn btn-ghost--icon banner-btn">
                <ArrowUpRight size={18} />
              </span>
              <p>{t("sidebar.banner")}</p>
            </a>

            <div className="sidebar-footer-links">
              <button
                className="btn btn-ghost btn-footer"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                {t("sidebar.logout")}
              </button>
              <NavLink to="/help" className="btn btn-ghost btn-footer">
                <HelpCircle size={18} />
                {t("sidebar.help")}
              </NavLink>
            </div>
          </div>
        </aside>

        {/* CONTEÚDO PRINCIPAL (Cartão Branco) */}
        <main className="main-content">
          <header className="top-header">
            <h1 className="greeting-text">
              <span>{t("header.greetingPrefix")}</span> {firstName}!
            </h1>

            <div className="header-actions">
              {/* Notificações: desativado por enquanto, sem funcionalidade ainda
              <button className="btn btn-ghost--icon notification-btn">
                <Bell size={24} />
              </button>
              */}

              <LanguageSwitcher onLanguageChange={handleLanguageChange} />

              <div
                className="user-profile clickable-profile"
                onClick={() => navigate("/profile")}
              >
                <div className="avatar-wrapper">
                  <PersonAvatar
                    photoUrl={userData.photo_url}
                    seed={userData.id}
                    name={userData.name}
                    className="avatar"
                    clickable={false}
                  />
                  <div className="avatar-edit-overlay">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="edit-icon"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487a2.25 2.25 0 113.182 3.182L7.5 20.213 3 21l.787-4.5 13.075-12.013z"
                      />
                    </svg>
                    <span>{t("header.editPhoto")}</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <section className="page-body">{children}</section>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
