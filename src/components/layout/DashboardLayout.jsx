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
} from "lucide-react";

import { supabase } from "../../services/supabaseClient";

import logoLE from "../../assets/logo-LanguageExchange.svg";

import "./styles.css";

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    name: "Carregando...",
    hub: "SHAPER",
    photo_url: "",
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
          navigate("/login");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, hub, photo_url")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error(error);
          return;
        }

        if (data) {
          setUserData({
            name: data.full_name || "Usuário",
            hub: data.hub || "SHAPER",
            photo_url: data.photo_url || "",
          });
        }
      } catch (err) {
        console.error(
          "Erro ao carregar usuário:",
          err
        );
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
  // FOTO
  // =========================
  const avatarUrl =
    userData.photo_url &&
    userData.photo_url !== ""
      ? userData.photo_url
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`;

  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src={logoLE} alt="Logo" />
          <p>Language Exchange</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            <Home size={20} />
            Início
          </NavLink>

          <NavLink
            to="/partners"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            <Users size={20} />
            Conexões
          </NavLink>

          <NavLink
            to="/sessions"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            <Calendar size={20} />
            Sessões
          </NavLink>

          <NavLink
            to="/resources"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            <BookOpen size={20} />
            Recursos
          </NavLink>

          <NavLink
            to="/project-partners"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            <Handshake size={20} />
             Parceiros
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            <User size={20} />
            Meu Perfil
          </NavLink>

           <NavLink
            to="/help"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            <HelpCircle size={20} />
            Ajuda
          </NavLink>

          <NavLink
            to="/admin"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            <UserStar size={20} />
            Admin
          </NavLink>
        </nav>

        <button
          className="btn-logout"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          Sair
        </button>
      </aside>

      {/* CONTEÚDO */}
      <main className="main-content">
  <header className="top-header">
    <span className="community-tag">
      GLOBAL SHAPERS COMMUNITY
    </span>

    <div
      className="user-profile clickable-profile"
      onClick={() => navigate("/profile")}
    >
      <div className="user-info">
        <p>{userData.name}</p>

        <span>
          HUB{" "}
          {userData.hub?.toUpperCase()}
        </span>
      </div>

      <div className="avatar-wrapper">
        <img
          src={avatarUrl}
          alt="Avatar"
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

          <span>Editar perfil</span>
        </div>
      </div>
    </div>
  </header>

  <section className="page-body">
    {children}
  </section>
</main>
    </div>
  );
};

export default DashboardLayout;