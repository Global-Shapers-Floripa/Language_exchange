import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
            name: data.full_name || "Usuário",
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
  }, [navigate]);

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // =========================
  // FOTO & NOME
  // =========================
  const firstName =
    userData.name !== "Carregando..." ? userData.name.split(" ")[0] : "Usuário";

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
              Início
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
              Conexões
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
              Sessões
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
              Comunidade
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
              Recursos
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
              Parceiros
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
              Perfil
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
                Admin
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
              Ajuda
            </NavLink>

            <button
              type="button"
              className="nav-item nav-item-mobile-extra"
              onClick={handleLogout}
            >
              <div className="icon-wrapper">
                <LogOut size={20} />
              </div>
              Sair
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
              <p>Saiba mais sobre o HUB idealizador do projeto</p>
            </a>

            <div className="sidebar-footer-links">
              <button
                className="btn btn-ghost btn-footer"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Sair
              </button>
              <NavLink to="/help" className="btn btn-ghost btn-footer">
                <HelpCircle size={18} />
                Ajuda
              </NavLink>
            </div>
          </div>
        </aside>

        {/* CONTEÚDO PRINCIPAL (Cartão Branco) */}
        <main className="main-content">
          <header className="top-header">
            <h1 className="greeting-text">
              <span>Olá,</span> {firstName}!
            </h1>

            <div className="header-actions">
              {/* Notificações: desativado por enquanto, sem funcionalidade ainda
              <button className="btn btn-ghost--icon notification-btn">
                <Bell size={24} />
              </button>
              */}

              <LanguageSwitcher />

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
                    <span>Editar</span>
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
