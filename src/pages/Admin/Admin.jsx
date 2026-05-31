import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import DashboardLayout from "../../components/layout/DashboardLayout";
import "./admin.css";

// 🌍 Função auxiliar para bandeiras (adicione mais conforme a necessidade do seu Hub)
const getCountryFlag = (country) => {
  if (!country) return "";
  const map = {
    "brasil": "🇧🇷",
    "brazil": "🇧🇷",
    "portugal": "🇵🇹",
    "eua": "🇺🇸",
    "usa": "🇺🇸",
    "estados unidos": "🇺🇸",
    "inglaterra": "🇬🇧",
    "uk": "🇬🇧",
    "espanha": "🇪🇸",
    "frança": "🇫🇷",
    "argentina": "🇦🇷",
    "canadá": "🇨🇦",
    "canada": "🇨🇦",
    "itália": "🇮🇹",
    "italia": "🇮🇹",
    "alemanha": "🇩🇪",
    "rússia": "🇷🇺",
    "russia": "🇷🇺",
    "china": "🇨🇳"
  };
  return map[country.toLowerCase().trim()] || "🌐";
};

const Admin = () => {
  const navigate = useNavigate();
  
  // Estados de Dados
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, topHubs: [], topLanguages: [] });
  const [loading, setLoading] = useState(true);

  // Estados de Busca (Filtros)
  const [userSearch, setUserSearch] = useState("");
  const [sessionSearch, setSessionSearch] = useState("");

  // Estados dos Modais
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    const checkAccessAndFetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Verifica autenticação e permissão
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) {
          navigate("/login");
          return;
        }

        const { data: currentUser } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", auth.user.id)
          .single();

        if (!currentUser?.is_admin) {
          navigate("/");
          return;
        }

        // 2. Busca Usuários
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (profilesError) throw profilesError;

        // 3. Busca Sessões
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sessions")
          .select("*")
          .order("date", { ascending: false });

        if (sessionsError) throw sessionsError;

        // 4. Processa Estatísticas do DashboardAdmin antigo
        const total = profilesData.length;
        const approved = profilesData.filter(u => u.is_approved).length;
        const pending = total - approved;

        const hubCount = {};
        const langCount = {};

        profilesData.forEach(u => {
          if (u.hub) hubCount[u.hub] = (hubCount[u.hub] || 0) + 1;
          if (u.speaks) langCount[u.speaks] = (langCount[u.speaks] || 0) + 1;
          if (u.learns) langCount[u.learns] = (langCount[u.learns] || 0) + 1;
        });

        const topHubs = Object.entries(hubCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topLanguages = Object.entries(langCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

        setStats({ total, approved, pending, topHubs, topLanguages });
        setUsers(profilesData || []);
        
        // Mapeia os nomes para as sessões
        const mappedSessions = (sessionsData || []).map(session => {
          const host = profilesData.find(p => p.id === session.user_id);
          const partner = profilesData.find(p => p.id === session.partner_id);
          return {
            ...session,
            host_name: host ? host.full_name : "Usuário Desconhecido",
            partner_name: partner ? partner.full_name : "Parceiro Desconhecido"
          };
        });
        
        setSessions(mappedSessions);

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAccessAndFetchData();
  }, [navigate]);

  // ✅ Função de Aprovação Integrada (Com envio de Email)
  const approveUser = async (userToApprove) => {
    try {
      // 1. Atualiza no banco
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_approved: true })
        .eq("id", userToApprove.id)
        .select();

      if (error) throw error;
      console.log("Registro atualizado:", data);

      // 2. Dispara e-mail
      await fetch("https://ndiadfadpicgppzvlynk.supabase.co/functions/v1/send-approval-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userToApprove.email,
          name: userToApprove.full_name,
        }),
      });

      // 3. Atualiza estado local e estatísticas
      const updatedUsers = users.map(u => u.id === userToApprove.id ? { ...u, is_approved: true } : u);
      setUsers(updatedUsers);
      
      const approvedCount = updatedUsers.filter(u => u.is_approved).length;
      setStats(prev => ({
        ...prev,
        approved: approvedCount,
        pending: updatedUsers.length - approvedCount
      }));

      alert("Usuário aprovado com sucesso!");

    } catch (err) {
      console.error("Erro ao aprovar usuário:", err.message);
      alert("Ocorreu um erro ao tentar aprovar o usuário.");
    }
  };

  // Filtros de Busca
  const filteredUsers = users.filter(u => {
    const searchStr = userSearch.toLowerCase();
    return (
      (u.full_name || "").toLowerCase().includes(searchStr) ||
      (u.hub || "").toLowerCase().includes(searchStr) ||
      (u.speaks || "").toLowerCase().includes(searchStr) ||
      (u.learns || "").toLowerCase().includes(searchStr) ||
      (u.country || "").toLowerCase().includes(searchStr)
    );
  });

  const filteredSessions = sessions.filter(s => {
    const searchStr = sessionSearch.toLowerCase();
    return (
      (s.host_name || "").toLowerCase().includes(searchStr) ||
      (s.partner_name || "").toLowerCase().includes(searchStr) ||
      (s.languages || "").toLowerCase().includes(searchStr)
    );
  });

  return (
    <DashboardLayout>
      <div className="admin-container">
        
        {/* CABEÇALHO E ESTATÍSTICAS GERAIS */}
        <div className="admin-header">
          <h2>Painel Administrativo</h2>
          <p>Visão geral, usuários e sessões da plataforma.</p>
        </div>

        {loading ? (
          <div className="loading-message"><p>Carregando painel...</p></div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total de Usuários</h3>
                <span className="stat-value">{stats.total}</span>
                <div className="stat-sub">
                  <span className="text-green">{stats.approved} Aprovados</span> | <span className="text-orange">{stats.pending} Pendentes</span>
                </div>
              </div>
              
              <div className="stat-card list-card">
                <h3>Top Hubs</h3>
                <ul>
                  {stats.topHubs.map(([hub, count]) => (
                    <li key={hub}><strong>{hub}</strong> <span>{count} membros</span></li>
                  ))}
                </ul>
              </div>

              <div className="stat-card list-card">
                <h3>Top Idiomas</h3>
                <ul>
                  {stats.topLanguages.map(([lang, count]) => (
                    <li key={lang}><strong>{lang}</strong> <span>{count} pessoas</span></li>
                  ))}
                </ul>
              </div>
            </div>

            {/* SEÇÃO: USUÁRIOS */}
            <div className="admin-section">
              <div className="section-header">
                <h3>Gerenciamento de Usuários</h3>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Pesquisar por nome, idioma, hub..." 
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Usuário</th>
                      <th>Localização</th>
                      <th>Idiomas</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-cell">
                            <img
                              src={user.photo_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.full_name || "User")}
                              alt={user.full_name}
                              className="user-thumbnail"
                            />
                            <div>
                              <p className="user-name">
                                {user.full_name || "Sem nome"} {getCountryFlag(user.country)}
                              </p>
                              <p className="user-email">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className="table-text fw-bold">{user.hub || "N/A"}</p>
                          <p className="table-text-small">{user.country || "Não informado"}</p>
                        </td>
                        <td>
                          <div className="languages-cell">
                            {user.speaks && <span className="lang-badge speaks">🗣️ {user.speaks}</span>}
                            {user.learns && <span className="lang-badge learns">📚 {user.learns}</span>}
                          </div>
                        </td>
                        <td>
                          <div className="actions-cell">
                            {!user.is_approved && (
                              <button className="btn-approve" onClick={() => approveUser(user)}>
                                Aprovar
                              </button>
                            )}
                            <button className="btn-icon" onClick={() => setSelectedUser(user)} title="Ver Detalhes">
                              👁️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan="4" className="text-center py-4">Nenhum usuário encontrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEÇÃO: SESSÕES */}
            <div className="admin-section">
              <div className="section-header">
                <h3>Sessões Registradas</h3>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Pesquisar por participante, idioma..." 
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                />
              </div>

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Participantes</th>
                      <th>Data</th>
                      <th>Idioma da Sessão</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((session) => (
                      <tr key={session.id}>
                        <td>
                          <p className="table-text fw-bold">{session.host_name}</p>
                          <p className="table-text-small">com {session.partner_name}</p>
                        </td>
                        <td>
                          <p className="table-text">{new Date(session.date).toLocaleDateString("pt-BR")}</p>
                          <p className="table-text-small">{session.duration} min</p>
                        </td>
                        <td>
                          <span className="lang-badge neutral">{session.languages || "N/A"}</span>
                        </td>
                        
                        <td>
                          <button className="btn-icon" onClick={() => setSelectedSession(session)} title="Ver Sessão">
                            👁️
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredSessions.length === 0 && (
                      <tr><td colSpan="4" className="text-center py-4">Nenhuma sessão encontrada.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL: DETALHES DO USUÁRIO */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedUser(null)}>✕</button>
            <div className="modal-header">
              <img 
                src={selectedUser.photo_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(selectedUser.full_name)} 
                alt="Foto" 
                className="modal-photo" 
              />
              <div>
                <h2>{selectedUser.full_name} {getCountryFlag(selectedUser.country)}</h2>
                <p>{selectedUser.email} • {selectedUser.phone || "Sem telefone"}</p>
              </div>
            </div>
            <div className="modal-body">
              <div className="info-group">
                <label>Hub & Localização</label>
                <p>{selectedUser.hub || "Não preenchido"} - {selectedUser.country || "Não preenchido"}</p>
              </div>
              <div className="info-group">
                <label>Descrição</label>
                <p>{selectedUser.description || "Nenhuma descrição fornecida."}</p>
              </div>
              <div className="info-group">
                <label>Interesses</label>
                <p>{selectedUser.interests || "Nenhum interesse listado."}</p>
              </div>
              <div className="info-group">
                <label>Criado em</label>
                <p>{new Date(selectedUser.created_at).toLocaleString("pt-BR")}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETALHES DA SESSÃO */}
      {selectedSession && (
        <div className="modal-overlay" onClick={() => setSelectedSession(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedSession(null)}>✕</button>
            <h2>Detalhes da Sessão</h2>
            <div className="modal-body">
              <div className="info-group">
                <label>Participantes</label>
                <p><strong>{selectedSession.host_name}</strong> convidou <strong>{selectedSession.partner_name}</strong></p>
              </div>
              <div className="info-group">
                <label>Data e Duração</label>
                <p>{new Date(selectedSession.date).toLocaleString("pt-BR")} • {selectedSession.duration} minutos</p>
              </div>
              <div className="info-group">
                <label>Idiomas Praticados</label>
                <p>{selectedSession.languages || "Não especificado"}</p>
              </div>
              <div className="info-group">
                <label>Anotações</label>
                <p>{selectedSession.notes || "Nenhuma anotação."}</p>
              </div>
              {selectedSession.session_photo_url && (
                <div className="info-group">
                  <label>Comprovante (Foto)</label>
                  <img src={selectedSession.session_photo_url} alt="Sessão" className="session-proof-img" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Admin;