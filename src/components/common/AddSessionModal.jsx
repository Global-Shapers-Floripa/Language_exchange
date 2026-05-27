import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { useAddSession } from '../../hooks/useAddSession';
import SearchableSelect from './SearchableSelect';
import { LANGUAGES, MAX_PHOTO_SIZE, ALLOWED_PHOTO_TYPES } from '../../constants/languages';
import './AddSessionModal.css';

const AddSessionModal = ({ isOpen, onClose, partners, onSessionAdded }) => {
  const [formData, setFormData] = useState({
    partner_id: '',
    date: new Date().toISOString().split('T')[0],
    duration: 60,
    languages: [],
    status: 'pendente',
    notes: '',
    sessionPhoto: null,
  });

  const { addSession, loading, error } = useAddSession();
  const [submitError, setSubmitError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);

  // Converter lista de parceiros para formato esperado pelo SearchableSelect
  const partnerOptions = partners.map(p => ({
    name: `${p.full_name} (${p.hub})`,
    code: p.id,
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) : value,
    }));
  };

  const handleLanguageChange = (selectedLanguages) => {
    setFormData(prev => ({
      ...prev,
      languages: selectedLanguages,
    }));
  };

  const handlePartnerChange = (partnerId) => {
    setFormData(prev => ({
      ...prev,
      partner_id: partnerId,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    processPhotoFile(file);
  };

  const processPhotoFile = (file) => {
    if (!file) return;

    // Validar tipo
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setSubmitError('Tipo de arquivo não permitido. Use PNG, JPEG, GIF ou WebP.');
      return;
    }

    // Validar tamanho
    if (file.size > MAX_PHOTO_SIZE) {
      setSubmitError(`Arquivo muito grande. Máximo de ${Math.round(MAX_PHOTO_SIZE / 1024 / 1024)}MB.`);
      return;
    }

    setFormData(prev => ({
      ...prev,
      sessionPhoto: file,
    }));

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setSubmitError('');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    processPhotoFile(file);
  };

  const removePhoto = () => {
    setFormData(prev => ({
      ...prev,
      sessionPhoto: null,
    }));
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!formData.partner_id) {
      setSubmitError('Por favor, selecione um parceiro');
      return;
    }

    if (!formData.languages || formData.languages.length === 0) {
      setSubmitError('Por favor, selecione pelo menos um idioma');
      return;
    }

    const result = await addSession(formData);

    if (result.success) {
      // Reset form
      setFormData({
        partner_id: '',
        date: new Date().toISOString().split('T')[0],
        duration: 60,
        languages: [],
        status: 'pendente',
        notes: '',
        sessionPhoto: null,
      });
      setPhotoPreview(null);
      
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
          {/* Parceiro com Busca */}
          <div className="form-group">
            <label>Parceiro *</label>
            <SearchableSelect
              options={partnerOptions}
              value={formData.partner_id}
              onChange={handlePartnerChange}
              placeholder="Buscar parceiro por nome ou hub..."
              displayKey="name"
              valueKey="code"
            />
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

          {/* Idiomas com Seletor Pré-definido */}
          <div className="form-group">
            <label>Idiomas Praticados *</label>
            <SearchableSelect
              options={LANGUAGES}
              value={formData.languages}
              onChange={handleLanguageChange}
              placeholder="Selecione os idiomas..."
              displayKey="name"
              valueKey="code"
              multi={true}
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

          {/* Upload de Foto */}
          <div className="form-group">
            <label>Foto/Print da Sessão (Opcional)</label>
            <div className="photo-upload-container">
              {photoPreview ? (
                <div className="photo-preview">
                  <img src={photoPreview} alt="Preview da sessão" />
                  <button 
                    type="button" 
                    className="btn-remove-photo"
                    onClick={removePhoto}
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <label 
                  className="photo-upload-label"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <Upload size={24} />
                  <span>Clique para selecionar ou arraste uma imagem</span>
                  <small>PNG, JPEG, GIF ou WebP até 5MB</small>
                  <input
                    type="file"
                    accept={ALLOWED_PHOTO_TYPES.join(',')}
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
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
