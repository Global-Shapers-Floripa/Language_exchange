import React, { useState, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PartnerCard from '../../components/common/PartnerCard';
import { Search, Filter } from 'lucide-react';
import { usePartners } from '../../hooks/usePartners';
import './parceiros.css';

const FindPartners = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { partners, loading, error } = usePartners();

  // Filtro de busca em tempo real
  const filteredPartners = useMemo(() => {
    if (!searchTerm.trim()) return partners;

    const term = searchTerm.toLowerCase();
    return partners.filter(partner => 
      partner.name.toLowerCase().includes(term) ||
      partner.hub.toLowerCase().includes(term) ||
      partner.speaks.toLowerCase().includes(term) ||
      partner.learns.toLowerCase().includes(term)
    );
  }, [partners, searchTerm]);

  return (
    <DashboardLayout>
      <div className="partners-page-header">
        <h2>Encontrar Parceiros</h2>
        
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Nome, idioma ou hub..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="filter-button">
            <Filter size={18} />
          </button>
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
                ? 'Nenhum parceiro encontrado com esse critério.' 
                : 'Nenhum parceiro disponível no momento.'}
            </p>
          </div>
        )}

        {!loading && !error && filteredPartners.map(partner => (
          <PartnerCard key={partner.id} {...partner} />
        ))}
      </div>
    </DashboardLayout>
  );
};

export default FindPartners;