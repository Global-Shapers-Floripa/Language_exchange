import React, { useEffect, useState } from "react"; // Adicione useEffect e useState
import { NavLink, useNavigate } from "react-router-dom";
import { Home, Users, Calendar, BookOpen, LogOut } from "lucide-react";
import { supabase } from "../../services/supabaseClient"; // Importe o seu client do supabase
import logoLE from "../../assets/logo-LanguageExchange.svg";
import "./styles.css";

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: "Carregando...",
    hub: "SHAPER",
  });

  useEffect(() => {
    const getUserProfile = async () => {
      // 1. Pega o usuário logado na sessão
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // 2. Busca os dados na tabela 'profiles' (ou o nome que você deu)
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, hub")
          .eq("id", user.id)
          .single();

        if (!error && data) {
          setUserData({
            name: data.full_name,
            hub: data.hub,
          });
        }
      } else {
        // Se não tem usuário, manda pro login
        navigate("/login");
      }
    };

    getUserProfile();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      {/* SIDEBAR ESQUERDA */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src={logoLE} alt="Logo" />
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <Home size={20} /> Início
          </NavLink>

          <NavLink
            to="/partners"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <Users size={20} /> Parceiros
          </NavLink>

          <NavLink
            to="/sessions"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <Calendar size={20} /> Sessões
          </NavLink>

          <NavLink
            to="/resources"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <BookOpen size={20} /> Recursos
          </NavLink>
        </nav>

        <button className="btn-logout" onClick={handleLogout}>
          <LogOut size={20} /> Sair
        </button>
      </aside>

      {/* CONTEÚDO DIREITA */}
      <main className="main-content">
        <header className="top-header">
          <span className="community-tag">GLOBAL SHAPERS COMMUNITY</span>
          <div className="user-profile">
            <div className="user-info">
              {/* NOME E HUB DINÂMICOS AQUI */}
              <p>{userData.name}</p>
              <span>HUB {userData.hub?.toUpperCase()}</span>
            </div>
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`}
              alt="Avatar"
              className="avatar"
            />
          </div>
        </header>

        <section className="page-body">{children}</section>
      </main>
    </div>
  );
};

export default DashboardLayout;
