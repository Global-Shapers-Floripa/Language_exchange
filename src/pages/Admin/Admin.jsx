import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import DashboardLayout from "../../components/layout/DashboardLayout";
import PersonAvatar from "../../components/common/PersonAvatar";
import { COUNTRIES } from "../../constants/countries";
import { LANGUAGES } from "../../constants/languages";
import { Users, MapPin, Languages, GraduationCap } from "lucide-react";
import "./admin.css";

// Função para buscar nome e bandeira do país
const getCountryInfo = (code) => {
  if (!code) return { name: "Não informado", flag: "" };
  const upperCode = code.toUpperCase().trim();
  const countryObj = COUNTRIES.find((c) => c.code === upperCode);

  return {
    name: countryObj ? countryObj.name : code,
    flag: `https://flagcdn.com/w20/${upperCode.toLowerCase()}.png`,
  };
};

const formatLanguages = (languages) => {
  if (!languages) return "";

  return languages
    .split(",")
    .map((code) => {
      const language = LANGUAGES.find((lang) => lang.code === code.trim());

      return language ? language.name : code;
    })
    .join(", ");
};

const Admin = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    topHubs: [],
    topSpeaks: [],
    topLearns: [],
    maxHub: 0,
    maxSpeak: 0,
    maxLearn: 0,
  });
  const [loading, setLoading] = useState(true);

  const [userSearch, setUserSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const checkAccessAndFetchData = async () => {
      try {
        setLoading(true);

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

        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*");

        if (profilesError) throw profilesError;

        // Email/telefone vivem em profile_contacts (RLS restrita) — a policy
        // de admin libera ver o contato de todo mundo aqui
        const { data: contactsData, error: contactsError } = await supabase
          .from("profile_contacts")
          .select("user_id, email, phone");

        if (contactsError) throw contactsError;

        const contactsByUserId = new Map(
          (contactsData || []).map((c) => [c.user_id, c]),
        );

        const profilesWithContact = profilesData.map((p) => ({
          ...p,
          email: contactsByUserId.get(p.id)?.email,
          phone: contactsByUserId.get(p.id)?.phone,
        }));

        const sortedProfiles = profilesWithContact.sort((a, b) =>
          (a.full_name || "").localeCompare(b.full_name || ""),
        );

        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sessions")
          .select("*")
          .order("date", { ascending: false });

        if (sessionsError) throw sessionsError;

        const totalSessions = sessionsData.length;

        const totalMinutes = sessionsData.reduce(
          (acc, s) => acc + (s.duration || 0),
          0,
        );

        const averageDuration =
          totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

        const total = sortedProfiles.length;
        const approved = sortedProfiles.filter((u) => u.is_approved).length;
        const pending = total - approved;

        const hubCount = {};
        const speaksCount = {};
        const learnsCount = {};

        sortedProfiles.forEach((u) => {
          if (u.hub) hubCount[u.hub] = (hubCount[u.hub] || 0) + 1;
          if (u.speaks)
            speaksCount[u.speaks] = (speaksCount[u.speaks] || 0) + 1;
          if (u.learns)
            learnsCount[u.learns] = (learnsCount[u.learns] || 0) + 1;
        });

        const topHubs = Object.entries(hubCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        const topSpeaks = Object.entries(speaksCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        const topLearns = Object.entries(learnsCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        // Pega o valor máximo para as barras de progresso
        const maxHub = topHubs.length ? topHubs[0][1] : 1;
        const maxSpeak = topSpeaks.length ? topSpeaks[0][1] : 1;
        const maxLearn = topLearns.length ? topLearns[0][1] : 1;

        setStats({
          total,
          approved,
          pending,

          totalSessions,
          totalMinutes,
          averageDuration,

          topHubs,
          topSpeaks,
          topLearns,
          maxHub,
          maxSpeak,
          maxLearn,
        });
        setUsers(sortedProfiles);

        const mappedSessions = (sessionsData || []).map((session) => {
          const host = sortedProfiles.find((p) => p.id === session.user_id);
          const partner = sortedProfiles.find(
            (p) => p.id === session.partner_id,
          );
          return {
            ...session,
            host_name: host ? host.full_name : "Usuário Desconhecido",
            partner_name: partner ? partner.full_name : "Parceiro Desconhecido",
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

  const approveUser = async (userToApprove, e) => {
    e.stopPropagation(); // Evita abrir o modal ao clicar em aprovar
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: true })
        .eq("id", userToApprove.id);

      if (error) throw error;

      await fetch(
        "https://ndiadfadpicgppzvlynk.supabase.co/functions/v1/send-approval-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userToApprove.email,
            name: userToApprove.full_name,
          }),
        },
      );

      const updatedUsers = users.map((u) =>
        u.id === userToApprove.id ? { ...u, is_approved: true } : u,
      );
      setUsers(updatedUsers);

      const approvedCount = updatedUsers.filter((u) => u.is_approved).length;
      setStats((prev) => ({
        ...prev,
        approved: approvedCount,
        pending: updatedUsers.length - approvedCount,
      }));
    } catch (err) {
      console.error("Erro ao aprovar usuário:", err.message);
      alert("Ocorreu um erro ao tentar aprovar o usuário.");
    }
  };

  const filteredUsers = users.filter((u) => {
    const searchStr = userSearch.toLowerCase();
    return (
      (u.full_name || "").toLowerCase().includes(searchStr) ||
      (u.email || "").toLowerCase().includes(searchStr) ||
      (u.hub || "").toLowerCase().includes(searchStr) ||
      (u.country || "").toLowerCase().includes(searchStr)
    );
  });

  return (
    <DashboardLayout>
      <div className="admin-container">
        {loading ? (
          <div className="loading-message">
            <p>Carregando painel...</p>
          </div>
        ) : (
          <>
            {/* GRID 4 COLUNAS - CARDS DE STATUS */}
            <div className="stats-grid">
              {/* Card 1: Total */}
              <div className="total-card">
                <div className="card-header">
                  <div className="stat-column">
                    <div className="stat-label">
                      <Users size={20} />
                      <span>Total de usuários</span>
                    </div>

                    <div className="stat-number">{stats.total}</div>
                  </div>

                  <div className="stat-column">
                    <span className="stat-label">Aprovados</span>

                    <div className="stat-number approved">{stats.approved}</div>
                  </div>

                  <div className="stat-column">
                    <span className="stat-label">Pendentes</span>

                    <div className="stat-number pending">{stats.pending}</div>
                  </div>

                  <div className="stat-column">
                    <span className="stat-label">Total Sessões</span>

                    <div className="stat-number sessions">
                      {sessions.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Hubs */}
              <div className="stat-card list-card">
                <div className="card-top">
                  <h3>TOP HUBS</h3>
                  <MapPin size={20} color="#64748b" />
                </div>
                <ul>
                  {stats.topHubs.map(([hub, count], index) => (
                    <li key={hub}>
                      <div className="list-item-content">
                        <span className="item-rank">0{index + 1}</span>
                        <span className="item-name">{hub}</span>
                        <span className="item-count">{count}</span>
                      </div>
                      <div className="list-bar">
                        <div
                          className="list-bar-fill dark"
                          style={{ width: `${(count / stats.maxHub) * 100}%` }}
                        ></div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card 3: Idiomas Falados */}
              <div className="stat-card list-card">
                <div className="card-top">
                  <h3>IDIOMAS FALADOS</h3>
                  <Languages size={20} color="#64748b" />
                </div>
                <ul>
                  {stats.topSpeaks.map(([lang, count]) => (
                    <li key={lang}>
                      <div className="list-item-content">
                        <span className="item-name">{lang}</span>
                        <span className="item-count">{count} pessoas</span>
                      </div>
                      <div className="list-bar">
                        <div
                          className="list-bar-fill orange"
                          style={{
                            width: `${(count / stats.maxSpeak) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card 4: Idiomas a Aprender */}
              <div className="stat-card list-card">
                <div className="card-top">
                  <h3>IDIOMAS A APRENDER</h3>
                  <GraduationCap size={20} color="#64748b" />
                </div>
                <ul>
                  {stats.topLearns.map(([lang, count]) => (
                    <li key={lang}>
                      <div className="list-item-content">
                        <span className="item-name">{lang}</span>
                        <span className="item-count">{count} interessados</span>
                      </div>
                      <div className="list-bar">
                        <div
                          className="list-bar-fill yellow"
                          style={{
                            width: `${(count / stats.maxLearn) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* HEADER DA TABELA */}
            <div className="admin-section">
              <div className="management-header">
                <div>
                  <span className="sub-heading">GESTÃO</span>
                  <h2 className="main-heading">Usuários da plataforma</h2>
                  <p className="results-count">
                    {filteredUsers.length} • RESULTADOS
                  </p>
                </div>
                <div className="search-wrapper">
                  <svg
                    className="search-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Buscar por nome, e-mail ou local..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* TABELA */}
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>USUÁRIO</th>
                      <th>LOCALIZAÇÃO</th>
                      <th>IDIOMAS</th>
                      <th>STATUS</th>
                      <th>AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const countryInfo = getCountryInfo(user.country);
                      return (
                        <tr key={user.id}>
                          <td>
                            <div className="user-cell">
                              <PersonAvatar
                                photoUrl={user.photo_url}
                                seed={user.id}
                                name={user.full_name}
                                className="user-avatar"
                              />
                              <div>
                                <p className="user-name">
                                  {user.full_name || "Sem nome"}
                                </p>
                                <p className="user-email">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="location-cell">
                              {countryInfo.flag ? (
                                <img
                                  src={countryInfo.flag}
                                  alt="Flag"
                                  className="flag-icon"
                                />
                              ) : (
                                <span className="flag-placeholder">FLAG</span>
                              )}
                              <div>
                                <p className="table-text fw-medium">
                                  {user.hub || "N/A"}
                                </p>
                                <p className="table-text-small">
                                  {countryInfo.name}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="languages-cell">
                              {user.speaks && (
                                <div className="lang-group">
                                  <span className="lang-label">DOMINA</span>
                                  <div className="lang-chips">
                                    {user.speaks.split(",").map((lang) => (
                                      <span key={lang} className="chip outline">
                                        {lang.trim()}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {user.learns && (
                                <div className="lang-group mt-1">
                                  <span className="lang-label">APRENDE</span>
                                  <div className="lang-chips">
                                    {user.learns.split(",").map((lang) => (
                                      <span key={lang} className="chip orange">
                                        {lang.trim()}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            {user.is_approved ? (
                              <span className="status-badge approved">
                                <span className="dot"></span> APROVADO
                              </span>
                            ) : (
                              <span className="status-badge pending">
                                <span className="dot"></span> PENDENTE
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="actions-cell">
                              {!user.is_approved && (
                                <button
                                  className="btn-approve-text"
                                  onClick={(e) => approveUser(user, e)}
                                >
                                  Aprovar
                                </button>
                              )}
                              <button
                                className="btn-details"
                                onClick={() => setSelectedUser(user)}
                              >
                                Visualizar Detalhes ↗
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center py-4 empty-state"
                        >
                          Nenhum usuário encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="sessions-section">
        <div className="card-top">
          <h3>ÚLTIMAS SESSÕES</h3>
        </div>

        <div className="sessions-list">
          {sessions.length === 0 ? (
            <p className="empty-sessions">Nenhuma sessão registrada.</p>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="session-item">
                <div className="session-info">
                  <h4>
                    {session.host_name} ↔ {session.partner_name}
                  </h4>

                  <p>📅 {new Date(session.date).toLocaleDateString("pt-BR")}</p>

                  <p>⏱️ {session.duration} minutos</p>

                  {session.languages && (
                    <p>🌎 {formatLanguages(session.languages)}</p>
                  )}

                  {session.notes && <p>📝 {session.notes}</p>}
                </div>

                {session.session_photo_url && (
                  <img
                    src={session.session_photo_url}
                    alt="Comprovante"
                    className="session-proof"
                    onClick={() => setSelectedImage(session.session_photo_url)}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL MANTIDO COMO ESTAVA, APENAS ESTILOS ATUALIZADOS VIA CSS */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedUser(null)}>
              ✕
            </button>
            <div className="modal-header">
              <PersonAvatar
                photoUrl={selectedUser.photo_url}
                seed={selectedUser.id}
                name={selectedUser.full_name}
                className="modal-photo"
              />
              <div>
                <h2 className="modal-title">
                  {selectedUser.full_name}
                  {getCountryInfo(selectedUser.country).flag && (
                    <img
                      src={getCountryInfo(selectedUser.country).flag}
                      alt="Bandeira"
                      className="flag-icon ml-2"
                    />
                  )}
                </h2>
                <p>{selectedUser.email}</p>
              </div>
            </div>
            <div className="modal-body">
              <div className="info-group">
                <label>Hub & País</label>
                <p>
                  {selectedUser.hub || "N/A"} -{" "}
                  {getCountryInfo(selectedUser.country).name}
                </p>
              </div>
              <div className="info-group">
                <label>Descrição</label>
                <p>{selectedUser.description || "Sem descrição."}</p>
              </div>
              <div className="info-group">
                <label>Interesses</label>
                <p>{selectedUser.interests || "Sem interesses."}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div
          className="image-modal-overlay"
          onClick={() => setSelectedImage(null)}
        >
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-image-btn"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>

            <img
              src={selectedImage}
              alt="Comprovante"
              className="modal-session-image"
            />

            <a
              href={selectedImage}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="download-btn"
            >
              Baixar imagem
            </a>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Admin;
