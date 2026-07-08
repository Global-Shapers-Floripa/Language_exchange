import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import DashboardLayout from "../../components/layout/DashboardLayout";
import PersonAvatar from "../../components/common/PersonAvatar";
import ConfirmModal from "../../components/common/ConfirmModal";
import { COUNTRIES } from "../../constants/countries";
import { LANGUAGES } from "../../constants/languages";
import { Users, MapPin, Languages, GraduationCap, Trash2, Monitor } from "lucide-react";
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
  const [userPendingDelete, setUserPendingDelete] = useState(null);

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

        // Contas de teste E2E (hub "E2E-TEST") ficam ocultas do painel de
        // Admin para qualquer admin exceto o e-mail dono do projeto — que
        // continua vendo/gerenciando essas contas normalmente.
        const isTestDataVisible = auth.user.email === "laysegabrielly13@gmail.com";

        let profilesQuery = supabase.from("profiles").select("*");
        if (!isTestDataVisible) {
          profilesQuery = profilesQuery.neq("hub", "E2E-TEST");
        }

        const { data: profilesData, error: profilesError } = await profilesQuery;

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

        // Sessões registradas entre contas de teste (ambas as pontas viram
        // "não encontrado" quando o perfil some da lista filtrada acima)
        // não devem contar nas estatísticas nem aparecer na lista para quem
        // não pode ver contas de teste.
        const visibleProfileIds = new Set(profilesData.map((p) => p.id));
        const visibleSessionsData = isTestDataVisible
          ? sessionsData
          : sessionsData.filter(
              (s) =>
                visibleProfileIds.has(s.user_id) &&
                visibleProfileIds.has(s.partner_id),
            );

        const totalSessions = visibleSessionsData.length;

        const totalMinutes = visibleSessionsData.reduce(
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

        // speaks/learns guardam múltiplos idiomas numa única string separada
        // por vírgula (ex: "Português, Espanhol, Inglês") — precisa dar split
        // e contar cada idioma individualmente, não a string inteira como
        // se fosse uma categoria própria.
        sortedProfiles.forEach((u) => {
          if (u.hub) hubCount[u.hub] = (hubCount[u.hub] || 0) + 1;

          if (u.speaks) {
            u.speaks
              .split(",")
              .map((lang) => lang.trim())
              .filter(Boolean)
              .forEach((lang) => {
                speaksCount[lang] = (speaksCount[lang] || 0) + 1;
              });
          }

          if (u.learns) {
            u.learns
              .split(",")
              .map((lang) => lang.trim())
              .filter(Boolean)
              .forEach((lang) => {
                learnsCount[lang] = (learnsCount[lang] || 0) + 1;
              });
          }
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

        const mappedSessions = visibleSessionsData.map((session) => {
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
      const { error } = await supabase.rpc("approve_profile", {
        target_id: userToApprove.id,
      });

      if (error) throw error;

      // userToApprove.email já vem de profile_contacts (join feito no
      // carregamento da lista via checkAccessAndFetchData) — a RLS de admin
      // já libera essa leitura, não precisa buscar de novo aqui.
      const { error: emailError } = await supabase.functions.invoke(
        "send-email",
        {
          body: {
            template: "approval",
            to: userToApprove.email,
            data: {
              recipientName: userToApprove.full_name,
              appUrl: window.location.origin,
            },
          },
        },
      );

      if (emailError) {
        console.error("Erro ao enviar e-mail de aprovação:", emailError);
      }

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
      alert(err.message || "Ocorreu um erro ao tentar aprovar o usuário.");
    }
  };

  // supabase.functions.invoke() não expõe o corpo JSON do erro em
  // `error.message` quando a function retorna status >= 400 — o texto que a
  // gente mandou (ex: "Apenas admins podem excluir usuários") fica em
  // `error.context`, que é a Response crua.
  const extractFunctionErrorMessage = async (error) => {
    if (error?.context && typeof error.context.json === "function") {
      try {
        const body = await error.context.json();
        if (body?.error) return body.error;
      } catch {
        // corpo não era JSON, cai no fallback abaixo
      }
    }
    return error?.message || "Ocorreu um erro ao tentar excluir o usuário.";
  };

  const requestDeleteUser = (userToDelete, e) => {
    e.stopPropagation(); // Evita abrir o modal de detalhes ao clicar em excluir
    setUserPendingDelete(userToDelete);
  };

  const confirmDeleteUser = async () => {
    const userToDelete = userPendingDelete;
    if (!userToDelete) return;

    try {
      const { data, error } = await supabase.functions.invoke(
        "admin-delete-user",
        { body: { target_id: userToDelete.id } },
      );

      if (error) throw new Error(await extractFunctionErrorMessage(error));
      if (data?.error) throw new Error(data.error);

      const updatedUsers = users.filter((u) => u.id !== userToDelete.id);
      setUsers(updatedUsers);

      const approvedCount = updatedUsers.filter((u) => u.is_approved).length;
      setStats((prev) => ({
        ...prev,
        total: updatedUsers.length,
        approved: approvedCount,
        pending: updatedUsers.length - approvedCount,
      }));

      if (selectedUser?.id === userToDelete.id) {
        setSelectedUser(null);
      }
    } catch (err) {
      console.error("Erro ao excluir usuário:", err.message);
      // Caso o perfil tenha sido removido mas a conta de auth não (erro do
      // passo 2 na Edge Function), a mensagem já vem explicando isso — o
      // admin precisa ver esse texto específico, não um genérico.
      alert(err.message);
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
      {/* MENSAGEM EXIBIDA NO MOBILE (o painel completo só faz sentido no desktop) */}
      <div className="admin-mobile-lock dotted-texture">
        <Monitor size={40} />
        <h2>Acesse pelo computador</h2>
        <p>Para acessar os dados de administração, abra a plataforma no computador.</p>
      </div>

      <div className="admin-desktop-view">
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
              <div className="card card--stat total-card">
                <div className="admin-stats-row">
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
              <div className="card card--stat stat-card list-card">
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
              <div className="card card--stat stat-card list-card">
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
              <div className="card card--stat stat-card list-card">
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
                    className="input search-input"
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
                            <div className="admin-languages-cell">
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
                                <div className="lang-group">
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
                              <span className="admin-status-badge approved">
                                <span className="dot"></span> APROVADO
                              </span>
                            ) : (
                              <span className="admin-status-badge pending">
                                <span className="dot"></span> PENDENTE
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="actions-cell">
                              {!user.is_approved && (
                                <button
                                  className="btn btn-ghost"
                                  onClick={(e) => approveUser(user, e)}
                                >
                                  Aprovar
                                </button>
                              )}
                              <button
                                className="btn btn-secondary btn-details"
                                onClick={() => setSelectedUser(user)}
                              >
                                Visualizar
                              </button>
                              <button
                                className="btn btn-danger btn-delete-user"
                                onClick={(e) => requestDeleteUser(user, e)}
                                aria-label={`Excluir ${user.full_name || "usuário"}`}
                              >
                                <Trash2 size={16} />
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
              <div key={session.id} className="session-item dotted-texture">
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
      </div>

      {/* MODAL MANTIDO COMO ESTAVA, APENAS ESTILOS ATUALIZADOS VIA CSS */}
      {selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-ghost--icon close-btn" onClick={() => setSelectedUser(null)}>
              ✕
            </button>
            <div className="admin-modal-header">
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
              <div className="admin-info-group">
                <label>Hub & País</label>
                <p>
                  {selectedUser.hub || "N/A"} -{" "}
                  {getCountryInfo(selectedUser.country).name}
                </p>
              </div>
              <div className="admin-info-group">
                <label>Descrição</label>
                <p>{selectedUser.description || "Sem descrição."}</p>
              </div>
              <div className="admin-info-group">
                <label>Interesses</label>
                <p>{selectedUser.interests || "Sem interesses."}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div
          className="admin-image-modal-overlay"
          onClick={() => setSelectedImage(null)}
        >
          <div className="admin-image-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="btn btn-ghost--icon admin-close-image-btn"
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

      {userPendingDelete && (
        <ConfirmModal
          title="Excluir usuário?"
          message={`Essa ação não pode ser desfeita. ${userPendingDelete.full_name || "Este usuário"} perderá acesso à plataforma permanentemente.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          onConfirm={confirmDeleteUser}
          onClose={() => setUserPendingDelete(null)}
        />
      )}
    </DashboardLayout>
  );
};

export default Admin;
