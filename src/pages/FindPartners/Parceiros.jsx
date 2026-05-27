import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import PartnerCard from "../../components/common/PartnerCard";
import PartnerModal from "../../components/common/PartnerModal";
import { Search } from "lucide-react";

import { usePartners } from "../../hooks/usePartners";
import { supabase } from "../../services/supabaseClient";
import Swal from "sweetalert2";

import "./parceiros.css";

const FindPartners = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);

  // Controle de perfil incompleto
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  const { partners, loading, error } = usePartners();

  // =========================
  // VERIFICAR PERFIL DO USUÁRIO
  // =========================
  useEffect(() => {
    const checkUserProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("speaks, learns")
          .eq("id", user.id)
          .single();

        if (profile) {
          setIsProfileIncomplete(!profile.speaks || !profile.learns);
        }
      } catch (err) {
        console.error("Erro ao checar perfil:", err);
      }
    };

    checkUserProfile();
  }, []);

  // =========================
  // FILTRO
  // =========================
  const filteredPartners = useMemo(() => {
    if (!searchTerm.trim()) return partners;

    const term = searchTerm.toLowerCase();

    return partners.filter((partner) => {
      return (
        partner.full_name?.toLowerCase().includes(term) ||
        partner.hub?.toLowerCase().includes(term) ||
        partner.speaks?.toLowerCase().includes(term) ||
        partner.learns?.toLowerCase().includes(term)
      );
    });
  }, [partners, searchTerm]);

  // =========================
  // CONECTAR (COM TRAVA)
  // =========================
  const handleConnectClick = (partner) => {
    if (isProfileIncomplete) {
      Swal.fire({
        title: "Acesso restrito",
        text: "Você precisa preencher seus idiomas no perfil antes de ver os dados de contato de outros membros.",
        icon: "warning",
        confirmButtonText: "Completar Perfil",
        showCancelButton: true,
        cancelButtonText: "Agora não",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/profile");
        }
      });
    } else {
      setSelectedPartner(partner);
    }
  };

  return (
    <DashboardLayout>
      <div className="partners-page-header">
        <h2>Encontrar Parceiros</h2>

        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />

            <input
              type="text"
              placeholder="Buscar por nome, idioma ou hub..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="partners-grid">
        {loading && (
          <div className="loading-message">
            <p>Carregando parceiros...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>Erro ao carregar parceiros: {error}</p>
          </div>
        )}

        {!loading && !error && filteredPartners.length === 0 && (
          <div className="empty-message">
            <p>
              {searchTerm.trim()
                ? "Nenhum parceiro encontrado."
                : "Nenhum parceiro disponível."}
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          filteredPartners.map((partner) => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              onConnect={() => handleConnectClick(partner)}
            />
          ))}
      </div>

      <PartnerModal
        partner={selectedPartner}
        onClose={() => setSelectedPartner(null)}
      />
    </DashboardLayout>
  );
};

export default FindPartners;