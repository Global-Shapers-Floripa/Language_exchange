import { useNavigate } from "react-router-dom";
import { NavLink, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import "./admin.css";

const Admin = () => {
  const navigate = useNavigate();

  // 🔐 proteção de rota
  useEffect(() => {
    const checkAccess = async () => {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth?.user) {
        navigate("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", auth.user.id)
        .single();

      if (!data?.is_admin) {
        navigate("/");
      }
    };

    checkAccess();
  }, []);

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <h2>Admin</h2>

        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          Aprovar Usuários
        </NavLink>

        <button onClick={() => navigate("/dashboard")}>
          Voltar App
        </button>
      </aside>

      {/* CONTEÚDO DINÂMICO */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Admin;