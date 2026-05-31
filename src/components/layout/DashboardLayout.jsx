import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getCachedUser, setCachedUser } from "../../hooks/useCache";
import {
  Home,
  Users,
  User,
  Calendar,
  BookOpen,
  Globe,
  LogOut,
  Handshake,
  CircleQuestionMark
} from "lucide-react";

import { supabase } from "../../services/supabaseClient";
import logoLE from "../../assets/logo-LanguageExchange.svg";
import "./styles.css";

const DashboardLayout = ({ children, isLoading = false }) => {
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(false);

  const [userData, setUserData] = useState({
    name: "",
    hub: "",
    photo_url: "",
  });

  // =========================
  // CARREGAR PERFIL (SEM TRAVAR LAYOUT)
  // =========================
  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      // 1. pega cache PRIMEIRO
      const cached = getCachedUser();

      // 2. aplica cache APÓS render (não no corpo do effect)
      if (cached?.profile && isMounted) {
        setUserData({
          name: cached.profile.full_name || "Usuário",
          hub: cached.profile.hub || "SHAPER",
          photo_url: cached.profile.photo_url || "",
        });

        setIsAdmin(!!cached.profile.is_admin);
      }

      // 3. busca no Supabase em background
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        navigate("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, hub, photo_url, is_admin")
        .eq("id", user.id)
        .single();

      if (data && isMounted) {
        setUserData({
          name: data.full_name || "Usuário",
          hub: data.hub || "SHAPER",
          photo_url: data.photo_url || "",
        });

        setIsAdmin(!!data.is_admin);

        setCachedUser(user, data);
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (isLoading) {
    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#fcf8f8",
          color: "#666",
          fontSize: "16px",
        }}
      >
        <div className="loader"></div>
      </div>
    );
  }

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // =========================
  // AVATAR (SEM FLICKER)
  // =========================
  const avatarUrl = userData.photo_url?.trim()
    ? userData.photo_url
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name || "user"}`;

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
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <Home size={20} />
            Início
          </NavLink>

          <NavLink
            to="/partners"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <Users size={20} />
            Conexões
          </NavLink>

          <NavLink
            to="/sessions"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <Calendar size={20} />
            Sessões
          </NavLink>

          <NavLink
            to="/resources"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <BookOpen size={20} />
            Recursos
          </NavLink>

          <NavLink
            to="/project-partners"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <Handshake size={20} />
            Parceiros
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <User size={20} />
            Perfil
          </NavLink>

          <NavLink
            to="/help"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <CircleQuestionMark size={20} />
            Ajuda
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <Users size={20} />
              Admin 
            </NavLink>
          )}
        </nav>

        <button className="btn-logout" onClick={handleLogout}>
          <LogOut size={20} />
          Sair
        </button>
      </aside>

      {/* CONTEÚDO */}
      <main className="main-content">
        <header className="top-header">
          <span className="community-tag">
            <Globe size={16} />
            <p>GLOBAL SHAPERS COMMUNITY</p>
          </span>
          <div
            className="user-profile clickable-profile"
            onClick={() => navigate("/profile")}
          >
            <div className="user-info">
              <p>{userData.name || "..."}</p>
              <span>
                HUB {userData.hub ? userData.hub.toUpperCase() : "..."}
              </span>
            </div>

            <div className="avatar-wrapper">
              {userData.name && (
                <img src={avatarUrl} alt="Avatar" className="avatar" />
              )}

              <div className="avatar-edit-overlay">
                <span>Editar perfil</span>
              </div>
            </div>
          </div>
        </header>

        <section className="page-body">{children}</section>
      </main>
    </div>
  );
};

export default DashboardLayout;
