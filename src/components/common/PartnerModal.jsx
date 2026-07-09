import React, { useState, useEffect } from "react";
import { MapPin, Globe, Mail, Phone, Lock, UserPlus, Clock, Check, X, Info } from "lucide-react";
import { COUNTRIES } from "../../constants/countries"; // Ajuste o caminho se necessário
import { supabase } from "../../services/supabaseClient"; // Adicionado para buscar/inserir a conexão
import PersonAvatar from "./PersonAvatar";
import CopyButton from "./CopyButton";
import Swal from "sweetalert2";
import "./PartnerModal.css";

// mode="connect" (padrão): fluxo de solicitar/cancelar conexão ao navegar pela rede.
// mode="review": fluxo de aceitar/rejeitar uma solicitação já recebida (prop `request`).
const PartnerModal = ({
  partner,
  currentUser,
  onClose,
  onConnectionChange,
  mode = "connect",
  request,
}) => {
  const [connectionData, setConnectionData] = useState(null);
  const [loadingConnection, setLoadingConnection] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);

  // =========================
  // BUSCAR STATUS DA CONEXÃO
  // =========================
  useEffect(() => {
    // No modo de revisão a solicitação já é conhecida (veio da lista de recebidas
    // via prop `request`) — não há nada pra buscar, então nem entramos no efeito.
    if (mode === "review") return;

    const fetchConnectionStatus = async () => {
      if (!partner || !currentUser) return;

      setLoadingConnection(true);
      try {
        // Busca se existe alguma requisição entre os dois usuários (ida ou volta)
        const { data } = await supabase
          .from("connection_requests")
          .select("*")
          .or(
            `and(sender_id.eq.${currentUser.id},receiver_id.eq.${partner.id}),and(sender_id.eq.${partner.id},receiver_id.eq.${currentUser.id})`
          )
          .single();

        // Sempre reflete o resultado desta busca (mesmo quando não há conexão),
        // para não manter o status de um parceiro anterior exibido na tela.
        setConnectionData(data ?? null);
      } catch (err) {
        // .single() lança erro quando não encontra nenhuma linha — nesse caso não há conexão
        console.log("Nenhuma conexão prévia encontrada.", err);
        setConnectionData(null);
      } finally {
        setLoadingConnection(false);
      }
    };

    fetchConnectionStatus();
  }, [partner, currentUser, mode]);

  // No modo de revisão, os dados vêm prontos via prop — derivados direto no
  // render (sem passar por state/efeito) pra nunca ficar desatualizado quando
  // o usuário abre a revisão de uma solicitação diferente.
  const effectiveConnectionData = mode === "review" ? (request ?? null) : connectionData;
  const effectiveLoadingConnection = mode === "review" ? false : loadingConnection;

  // =========================
  // BUSCAR CONTATO (só quando a conexão está aceita)
  // =========================
  // Email/telefone não vêm mais junto com o perfil (ver profile_contacts) —
  // são buscados sob demanda aqui, e a RLS da tabela garante que só retornam
  // dado de verdade se existir conexão aceita entre os dois usuários.
  const [contactInfo, setContactInfo] = useState(null);
  const [loadingContact, setLoadingContact] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const syncContact = async () => {
      const isAccepted = effectiveConnectionData?.status === "aceito";

      if (!isAccepted || !partner) {
        setContactInfo(null);
        return;
      }

      setLoadingContact(true);
      try {
        const { data } = await supabase
          .from("profile_contacts")
          .select("email, phone")
          .eq("user_id", partner.id)
          .single();

        if (!cancelled) setContactInfo(data ?? null);
      } finally {
        if (!cancelled) setLoadingContact(false);
      }
    };

    syncContact();
    return () => {
      cancelled = true;
    };
  }, [effectiveConnectionData, partner]);

  // =========================
  // ENVIAR SOLICITAÇÃO
  // =========================
  const handleRequestConnection = async () => {
    setIsRequesting(true);
    try {
      // Verifica se o outro usuário já tem uma solicitação pendente para mim
      const { data: reverseRequest } = await supabase
        .from("connection_requests")
        .select("*")
        .eq("sender_id", partner.id)
        .eq("receiver_id", currentUser.id)
        .eq("status", "pendente")
        .single();

      if (reverseRequest) {
        // Match mútuo: aceita a solicitação existente em vez de criar uma segunda
        const { data: updated, error: updateError } = await supabase
          .from("connection_requests")
          .update({ status: "aceito" })
          .eq("id", reverseRequest.id)
          .select()
          .single();

        if (updateError) throw updateError;

        // .single() já lançaria erro se o UPDATE não afetasse nenhuma linha (ex: bloqueado por RLS),
        // mas checamos explicitamente para deixar a intenção clara e não confiar em efeito colateral.
        if (!updated) {
          throw new Error(
            "Não foi possível confirmar a conexão (permissão negada).",
          );
        }

        setConnectionData(updated);
        onConnectionChange?.(updated);

        Swal.fire({
          title: "Vocês estão conectados!",
          text: `${partner.full_name} já tinha enviado uma solicitação para você. Agora vocês podem trocar contatos.`,
          icon: "success",
          confirmButtonColor: "#0A3251",
        });
        return;
      }

      const { data: created, error } = await supabase
        .from("connection_requests")
        .insert([
          {
            sender_id: currentUser.id,
            receiver_id: partner.id,
            status: "pendente",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Atualiza o estado local para refletir a nova requisição
      setConnectionData(created);
      onConnectionChange?.(created);

      // E-mail de notificação é best-effort: a solicitação já foi criada com
      // sucesso, então uma falha aqui não deve virar erro pro usuário. A
      // Edge Function busca o contato do destinatário com service role,
      // porque a RLS de profile_contacts não libera essa leitura pra quem
      // enviou (conexão ainda está pendente, não aceita).
      supabase.functions
        .invoke("notify-connection-request", {
          body: {
            request_id: created.id,
            app_url: `${window.location.origin}/partners`,
          },
        })
        .then(({ error: notifyError }) => {
          if (notifyError) {
            console.error(
              "Erro ao notificar solicitação de conexão:",
              notifyError,
            );
          }
        });

      Swal.fire({
        title: "Enviado!",
        text: `Sua solicitação de conexão foi enviada para ${partner.full_name}.`,
        icon: "success",
        confirmButtonColor: "#0A3251",
      });
    } catch (error) {
      console.error(error);
      Swal.fire("Erro", "Não foi possível enviar a solicitação.", "error");
    } finally {
      setIsRequesting(false);
    }
  };

  // =========================
  // CANCELAR SOLICITAÇÃO
  // =========================
  const handleCancelRequest = async () => {
    if (!connectionData) return;

    setIsCancelling(true);
    try {
      // .select() faz o Postgres devolver as linhas de fato apagadas: se o RLS
      // bloquear silenciosamente o delete, "deleted" vem vazio e não há erro —
      // por isso checamos o resultado em vez de confiar só em "error".
      const { data: deleted, error } = await supabase
        .from("connection_requests")
        .delete()
        .eq("id", connectionData.id)
        .select();

      if (error) throw error;

      if (!deleted || deleted.length === 0) {
        throw new Error(
          "Não foi possível cancelar a solicitação (permissão negada).",
        );
      }

      const removedId = connectionData.id;
      setConnectionData(null);
      onConnectionChange?.({ id: removedId, _removed: true });

      Swal.fire({
        title: "Solicitação cancelada",
        text: `Sua solicitação para ${partner.full_name} foi cancelada.`,
        icon: "success",
        confirmButtonColor: "#0A3251",
      });
    } catch (error) {
      console.error(error);
      Swal.fire("Erro", "Não foi possível cancelar a solicitação.", "error");
    } finally {
      setIsCancelling(false);
    }
  };

  // =========================
  // ACEITAR SOLICITAÇÃO RECEBIDA
  // =========================
  const handleAcceptRequest = async () => {
    if (!request) return;

    setIsReviewing(true);
    try {
      const { data: updated, error } = await supabase
        .from("connection_requests")
        .update({ status: "aceito" })
        .eq("id", request.id)
        .select()
        .single();

      if (error) throw error;
      if (!updated) {
        throw new Error(
          "Não foi possível aceitar a solicitação (permissão negada).",
        );
      }

      setConnectionData(updated);
      onConnectionChange?.(updated);

      Swal.fire({
        title: "Conexão aceita!",
        text: `Agora você e ${partner.full_name} podem trocar contatos.`,
        icon: "success",
        confirmButtonColor: "#0A3251",
      });

      onClose();
    } catch (error) {
      console.error(error);
      Swal.fire("Erro", "Não foi possível aceitar a solicitação.", "error");
    } finally {
      setIsReviewing(false);
    }
  };

  // =========================
  // REJEITAR SOLICITAÇÃO RECEBIDA
  // =========================
  const handleRejectRequest = async () => {
    if (!request) return;

    setIsReviewing(true);
    try {
      // Mesma blindagem usada no cancelamento: confere se a linha foi
      // realmente apagada antes de atualizar a UI como sucesso.
      const { data: deleted, error } = await supabase
        .from("connection_requests")
        .delete()
        .eq("id", request.id)
        .select();

      if (error) throw error;
      if (!deleted || deleted.length === 0) {
        throw new Error(
          "Não foi possível rejeitar a solicitação (permissão negada).",
        );
      }

      onConnectionChange?.({ id: request.id, _removed: true });

      Swal.fire({
        title: "Solicitação rejeitada",
        text: `A solicitação de ${partner.full_name} foi rejeitada.`,
        icon: "success",
        confirmButtonColor: "#0A3251",
      });

      onClose();
    } catch (error) {
      console.error(error);
      Swal.fire("Erro", "Não foi possível rejeitar a solicitação.", "error");
    } finally {
      setIsReviewing(false);
    }
  };

  // =========================
  // DESFAZER CONEXÃO ACEITA
  // =========================
  // Ação deliberadamente discreta: só existe aqui dentro do modal de
  // detalhes (não no card), pra evitar clique acidental na listagem.
  const handleUndoConnection = async () => {
    if (!connectionData) return;

    const confirmResult = await Swal.fire({
      title: "Desfazer conexão?",
      text: `Tem certeza que deseja desfazer a conexão com ${partner.full_name}? Isso removerá a conexão para os dois lados.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, desfazer",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });

    if (!confirmResult.isConfirmed) return;

    setIsUndoing(true);
    try {
      // Mesma blindagem usada nas outras mutações: reconsulta via .select()
      // e só considera sucesso se a linha realmente veio apagada — RLS pode
      // bloquear silenciosamente sem gerar "error".
      const { data: deleted, error } = await supabase
        .from("connection_requests")
        .delete()
        .eq("id", connectionData.id)
        .select();

      if (error) throw error;

      if (!deleted || deleted.length === 0) {
        throw new Error(
          "Não foi possível desfazer a conexão (permissão negada).",
        );
      }

      const removedId = connectionData.id;
      setConnectionData(null);
      onConnectionChange?.({ id: removedId, _removed: true });

      Swal.fire({
        title: "Conexão desfeita",
        text: `A conexão com ${partner.full_name} foi removida.`,
        icon: "success",
        confirmButtonColor: "#0A3251",
      });

      onClose();
    } catch (error) {
      console.error(error);
      Swal.fire("Erro", "Não foi possível desfazer a conexão.", "error");
    } finally {
      setIsUndoing(false);
    }
  };

  if (!partner) return null;

  const isPerfectMatch = partner.compatibility === "Match Perfeito";
  const countryObj = COUNTRIES?.find((c) => c.code === partner.country);
  const countryName = countryObj ? countryObj.name : "";
  const flagUrl = partner.country
    ? `https://flagcdn.com/w640/${partner.country.toLowerCase()}.png`
    : "";

  const speaksList = partner.speaksArray || (partner.speaks ? partner.speaks.split(',').map(s => s.trim()) : []);
  const learnsList = partner.learnsArray || (partner.learns ? partner.learns.split(',').map(l => l.trim()) : []);
  const interestsList = partner.interestsArray || (partner.interests ? partner.interests.split(',').map(i => i.trim()) : []);

  // Variável para facilitar a checagem se o contato deve ser mostrado
  const showContactInfo = effectiveConnectionData?.status === "aceito";

  return (
    <div className="partner-modal-overlay" onClick={onClose}>
      <div className="partner-modal" onClick={(e) => e.stopPropagation()}>
        
        <button className="btn btn-ghost--icon close-modal-btn" onClick={onClose}>✕</button>

        {isPerfectMatch && (
          <div className="perfect-match-modal-badge">
            ✨ Match Perfeito
          </div>
        )}

        {/* BANNER COM BANDEIRA */}
        <div
          className="modal-flag-banner"
          style={{
            backgroundImage: flagUrl
              ? `url(${flagUrl})`
              : "linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)",
          }}
        ></div>

        <div className="partner-modal-header">
          <PersonAvatar
            photoUrl={partner.photo_url}
            seed={partner.id}
            name={partner.full_name}
            className="partner-modal-avatar"
          />

          <h2>{partner.full_name}</h2>
          
          <div className="modal-location-info">
            <span className="hub-info"><MapPin size={14} color="#FF5A5F" /> HUB {partner.hub}</span>
            {countryName && (
              <span className="country-info"><Globe size={14} color="#4A90E2" /> {countryName}</span>
            )}
          </div>
        </div>

        <div className="modal-scrollable-content">
          
          {partner.description && partner.description.trim() !== "" && (
            <div className="partner-modal-section">
              <h3>Sobre</h3>
              <p className="description-text">{partner.description}</p>
            </div>
          )}

          <div className="modal-grid-sections">
            <div className="partner-modal-section">
              <h3>Idiomas que fala</h3>
              <div className="tags-container">
                {speaksList.length > 0 ? (
                  speaksList.map((lang) => (
                    <span key={lang} className="tag tag-orange">{lang}</span>
                  ))
                ) : (
                  <span className="empty-info">Não informado</span>
                )}
              </div>
            </div>

            <div className="partner-modal-section">
              <h3>Idiomas que aprende</h3>
              <div className="tags-container">
                {learnsList.length > 0 ? (
                  learnsList.map((lang) => (
                    <span key={lang} className="tag tag-green">{lang}</span>
                  ))
                ) : (
                  <span className="empty-info">Não informado</span>
                )}
              </div>
            </div>
          </div>

          {interestsList.length > 0 && (
            <div className="partner-modal-section">
              <h3>Interesses</h3>
              <div className="tags-container">
                {interestsList.map((interest) => (
                  <span key={interest} className="tag tag-purple">{interest}</span>
                ))}
              </div>
            </div>
          )}

          {/* ========================= */}
          {/* LÓGICA DE CONEXÃO/CONTATO */}
          {/* ========================= */}
          {!effectiveLoadingConnection && mode === "review" && (
            <div className="partner-modal-section connection-action-wrapper">
              <div className="request-connection-box review-request-box">
                <h3>Solicitação de Conexão</h3>
                <p>
                  {partner.full_name} quer se conectar com você. Aceite para
                  liberar os dados de contato ou rejeite a solicitação.
                </p>
                <div className="review-actions">
                  <button
                    className="btn btn-danger"
                    onClick={handleRejectRequest}
                    disabled={isReviewing}
                  >
                    <X size={18} />
                    Rejeitar
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleAcceptRequest}
                    disabled={isReviewing}
                  >
                    <Check size={18} />
                    {isReviewing ? "Processando..." : "Aceitar"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!effectiveLoadingConnection && mode !== "review" && (
            <div className={`partner-modal-section connection-action-wrapper ${showContactInfo ? 'partner-modal-contact-section' : ''}`}>

              {/* CASO 1: NÃO HÁ CONEXÃO AINDA */}
              {!connectionData && (
                <div className="request-connection-box">
                  <Lock size={24} className="lock-icon" />
                  <h3>Dados Privados</h3>
                  <p>Solicite uma conexão para trocar contatos e mensagens com {partner.full_name}.</p>
                  <button
                    className="btn btn-primary btn-request-connect"
                    onClick={handleRequestConnection}
                    disabled={isRequesting}
                  >
                    <UserPlus size={18} />
                    {isRequesting ? "Enviando..." : "Solicitar Conexão"}
                  </button>
                </div>
              )}

              {/* CASO 2: CONEXÃO PENDENTE */}
              {connectionData?.status === "pendente" && (
                <div className="request-connection-box pending-box">
                  <Clock size={24} className="clock-icon" />
                  <h3>Solicitação Pendente</h3>
                  <p>
                    {connectionData.sender_id === currentUser.id
                      ? `Você já enviou uma solicitação para ${partner.full_name}. Aguarde a aprovação!`
                      : `${partner.full_name} enviou uma solicitação para você. Acesse o painel de Conexões para aceitar.`}
                  </p>
                  {connectionData.sender_id === currentUser.id && (
                    <button
                      className="btn btn-danger"
                      onClick={handleCancelRequest}
                      disabled={isCancelling}
                    >
                      {isCancelling ? "Cancelando..." : "Cancelar Solicitação"}
                    </button>
                  )}
                </div>
              )}

              {/* CASO 3: CONEXÃO REJEITADA */}
              {connectionData?.status === "rejeitado" && (
                <div className="request-connection-box rejected-box">
                  <h3>Conexão Indisponível</h3>
                  <p>Não é possível visualizar os dados de contato no momento.</p>
                </div>
              )}

              {/* CASO 4: CONEXÃO ACEITA (Mostra os contatos!) */}
              {showContactInfo && (
                <>
                  <h3>Contato</h3>
                  <div className="contact-info-list">
                    {loadingContact ? (
                      <p>Carregando contato...</p>
                    ) : (
                      <>
                        <p>
                          <Mail size={16} />
                          <strong>Email:</strong>{" "}
                          <span className="contact-value">
                            {contactInfo?.email || "Não informado"}
                          </span>
                          {contactInfo?.email && (
                            <CopyButton value={contactInfo.email} label="e-mail" />
                          )}
                        </p>
                        {contactInfo?.phone && contactInfo.phone.trim() !== "" && (
                          <p>
                            <Phone size={16} />
                            <strong>Telefone:</strong>{" "}
                            <span className="contact-value">{contactInfo.phone}</span>
                            <CopyButton value={contactInfo.phone} label="telefone" />
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* ========================= */}
                  {/* PRÓXIMOS PASSOS DA CONEXÃO */}
                  {/* ========================= */}
                  <div className="session-instructions-box">
                    <Info size={20} className="session-instructions-icon" />
                    <p>
                      Chame {partner.full_name}, combinem um horário e realizem
                      a sessão de prática. Depois, volte na plataforma para
                      registrar essa sessão na tela de <strong>Sessões</strong>.
                    </p>
                  </div>

                  {/* ========================= */}
                  {/* DESFAZER CONEXÃO (discreto, de propósito) */}
                  {/* ========================= */}
                  <div className="undo-connection-wrapper">
                    <button
                      type="button"
                      className="undo-connection-btn"
                      onClick={handleUndoConnection}
                      disabled={isUndoing}
                    >
                      {isUndoing ? "Desfazendo..." : "Desfazer conexão"}
                    </button>
                  </div>
                </>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PartnerModal;