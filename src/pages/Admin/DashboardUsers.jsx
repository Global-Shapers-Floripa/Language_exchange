import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";

import "./dashboard-users.css";

const DashboardUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Declaramos o fetchUsers primeiro
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_approved", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return [];
    }

    return data || [];
  };

  // ✅ aprovar usuário
  const approveUser = async (user) => {
    try {
      // 1. atualizar status no banco
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_approved: true })
        .eq("id", user.id)
        .select(); // <--- O .select() faz o Supabase devolver a linha alterada

      console.log("Registos atualizados:", data); // <--- Vai imprimir no console

      if (error) throw error;

      // 2. enviar e-mail de aprovação
      await fetch("https://ndiadfadpicgppzvlynk.supabase.co/functions/v1/send-approval-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          name: user.full_name,
        }),
      });

      // 3. atualizar lista na tela
      const updatedUsers = await fetchUsers();
      setUsers(updatedUsers);
      
    } catch (err) {
      console.error("Erro ao aprovar usuário:", err.message);
    }
  };
  // ❌ 3. rejeitar usuário (opcional)
  const rejectUser = async (user) => {
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", user.id);

      if (error) throw error;

      // Atualiza a lista na tela
      const updatedUsers = await fetchUsers();
      setUsers(updatedUsers);
    } catch (err) {
      console.error("Erro ao rejeitar usuário:", err.message);
    }
  };

  // 4. useEffect para carregar inicialmente
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const data = await fetchUsers();
      setUsers(data);

      setLoading(false);
    };

    load();
  }, []);

  return (
    <div className="users-admin">
      <h1>Usuários Pendentes</h1>
      <p>Gerencie solicitações de acesso à plataforma</p>

      {loading ? (
        <p>Carregando usuários...</p>
      ) : users.length === 0 ? (
        <p>Nenhum usuário pendente 🎉</p>
      ) : (
        <div className="users-grid">
          {users.map((user) => (
            <div className="user-card" key={user.id}>
              <div className="user-info">
                <h3>{user.full_name}</h3>
                <p>{user.email}</p>
                <span>{user.hub}</span>
              </div>

              <div className="actions">
                <button className="approve" onClick={() => approveUser(user)}>
                  Aprovar
                </button>

                <button className="reject" onClick={() => rejectUser(user)}>
                  Rejeitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardUsers;