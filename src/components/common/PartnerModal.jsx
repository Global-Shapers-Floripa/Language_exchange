import React, { useState, useEffect } from "react";
import { MapPin, Globe, Mail, Phone, Lock, UserPlus, Clock } from "lucide-react";
import { COUNTRIES } from "../../constants/countries"; // Ajuste o caminho se necessário
import { supabase } from "../../services/supabaseClient"; // Adicionado para buscar/inserir a conexão
import Swal from "sweetalert2";
import "./PartnerModal.css";

const PartnerModal = ({ partner, currentUser, onClose }) => {
  const [connectionData, setConnectionData] = useState(null);
  const [loadingConnection, setLoadingConnection] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  // =========================
  // BUSCAR STATUS DA CONEXÃO
  // =========================
  useEffect(() => {
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

        if (data) {
          setConnectionData(data);
        }
      } catch (err) {
        // Se der erro (ex: não encontrar nenhuma linha), apenas ignoramos pois não há conexão
        console.log("Nenhuma conexão prévia encontrada.", err);
      } finally {
        setLoadingConnection(false);
      }
    };

    fetchConnectionStatus();
  }, [partner, currentUser]);

  // =========================
  // ENVIAR SOLICITAÇÃO
  // =========================
  const handleRequestConnection = async () => {
    setIsRequesting(true);
    try {
      const { error } = await supabase.from("connection_requests").insert([
        {
          sender_id: currentUser.id,
          receiver_id: partner.id,
          status: "pendente",
        },
      ]);

      if (error) throw error;

      // Atualiza o estado local para refletir a nova requisição
      setConnectionData({
        sender_id: currentUser.id,
        receiver_id: partner.id,
        status: "pendente",
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
  const showContactInfo = connectionData?.status === "aceito";

  return (
    <div className="partner-modal-overlay" onClick={onClose}>
      <div className="partner-modal" onClick={(e) => e.stopPropagation()}>
        
        <button className="close-modal-btn" onClick={onClose}>✕</button>

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
          <img
            src={
              partner.photo_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.full_name}`
            }
            alt={partner.full_name}
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
          {!loadingConnection && (
            <div className={`partner-modal-section connection-action-wrapper ${showContactInfo ? 'contact-section' : ''}`}>
              
              {/* CASO 1: NÃO HÁ CONEXÃO AINDA */}
              {!connectionData && (
                <div className="request-connection-box">
                  <Lock size={24} className="lock-icon" />
                  <h3>Dados Privados</h3>
                  <p>Solicite uma conexão para trocar contatos e mensagens com {partner.full_name}.</p>
                  <button 
                    className="btn-request-connect" 
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
                    <p>
                      <Mail size={16} />
                      <strong>Email:</strong> {partner.email || "Não informado"}
                    </p>
                    {partner.phone && partner.phone.trim() !== "" && (
                      <p>
                        <Phone size={16} />
                        <strong>Telefone:</strong> {partner.phone}
                      </p>
                    )}
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