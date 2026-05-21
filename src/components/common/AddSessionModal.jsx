import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAddSession } from '../../hooks/useAddSession';
import './AddSessionModal.css';

const AddSessionModal = ({ isOpen, onClose, partners, onSessionAdded }) => {
  const [formData, setFormData] = useState({
    partner_id: '',
    date: new Date().toISOString().split('T')[0],
    duration: 60,
    languages: '',
    status: 'pendente',
    notes: '',
  });

  const { addSession, loading, error } = useAddSession();
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!formData.partner_id) {
      setSubmitError('Por favor, selecione um parceiro');
      return;
    }

    if (!formData.languages.trim()) {
      setSubmitError('Por favor, informe os idiomas praticados');
      return;
    }

    const result = await addSession(formData);

    if (result.success) {
      // Reset form
      setFormData({
        partner_id: '',
        date: new Date().toISOString().split('T')[0],
        duration: 60,
        languages: '',
        status: 'pendente',
        notes: '',
      });
      
      // Callback para atualizar lista
      if (onSessionAdded) {
        onSessionAdded();
      }
      
      onClose();
    } else {
      setSubmitError(result.error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Registrar Nova Sessão</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Parceiro */}
          <div className="form-group">
            <label htmlFor="partner_id">Parceiro *</label>
            <select
              id="partner_id"
              name="partner_id"
              value={formData.partner_id}
              onChange={handleChange}
              required
            >
              <option value="">Selecione um parceiro...</option>
              {partners.map(partner => (
                <option key={partner.id} value={partner.id}>
                  {partner.name} ({partner.hub})
                </option>
              ))}
            </select>
          </div>

          {/* Data */}
          <div className="form-group">
            <label htmlFor="date">Data *</label>
            <input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Duração */}
          <div className="form-group">
            <label htmlFor="duration">Duração (minutos) *</label>
            <input
              id="duration"
              name="duration"
              type="number"
              min="1"
              max="300"
              value={formData.duration}
              onChange={handleChange}
              required
            />
          </div>

          {/* Idiomas */}
          <div className="form-group">
            <label htmlFor="languages">Idiomas Praticados *</label>
            <input
              id="languages"
              name="languages"
              type="text"
              placeholder="Ex: Inglês, Português"
              value={formData.languages}
              onChange={handleChange}
              required
            />
          </div>

          {/* Status */}
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="pendente">Pendente</option>
              <option value="registrada">Registrada</option>
            </select>
          </div>

          {/* Notas */}
          <div className="form-group">
            <label htmlFor="notes">Notas</label>
            <textarea
              id="notes"
              name="notes"
              placeholder="Adicione observações sobre a sessão (opcional)"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
            />
          </div>

          {/* Erros */}
          {(submitError || error) && (
            <div className="error-message">
              {submitError || error}
            </div>
          )}

          {/* Botões */}
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Registrar Sessão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSessionModal;
