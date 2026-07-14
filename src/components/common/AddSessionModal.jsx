import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Upload, FilePlus } from 'lucide-react';
import { useAddSession } from '../../hooks/useAddSession';
import SearchableSelect from './SearchableSelect';
import { LANGUAGES, MAX_PHOTO_SIZE, ALLOWED_PHOTO_TYPES } from '../../constants/languages';
import './AddSessionModal.css';

// initialPartnerId: vindo do botão "Registrar sessão" em Conexões — o
// componente é remontado com uma `key` diferente pelo Sessoes.jsx sempre que
// esse valor muda, então basta usá-lo no estado inicial do formulário.
const AddSessionModal = ({ isOpen, onClose, partners, initialPartnerId, onSessionAdded }) => {
  const { t } = useTranslation("constants");
  const [formData, setFormData] = useState({
    partner_id: initialPartnerId || '',
    date: new Date().toISOString().split('T')[0],
    duration: 60,
    languages: [],
    notes: '',
    sessionPhoto: null,
    makePublic: false,
  });

  const { addSession, loading, error } = useAddSession();
  const [submitError, setSubmitError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);

  // Converter lista de Conexões para formato esperado pelo SearchableSelect
  const partnerOptions = partners.map(p => ({
    name: `${p.full_name} (${p.hub})`,
    code: p.id,
  }));

  // sessions.languages guarda CODE (não nome) — só o texto exibido no
  // SearchableSelect precisa ser traduzido, o valor selecionado continua
  // sendo o code de LANGUAGES.
  const languageOptions = LANGUAGES.map((lang) => ({
    ...lang,
    name: t(`languages.${lang.code}`),
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

  const handleMakePublicChange = (e) => {
    setFormData(prev => ({
      ...prev,
      makePublic: e.target.checked,
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
      setSubmitError('Por favor, selecione uma conexão');
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
        notes: '',
        sessionPhoto: null,
        makePublic: false,
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
    <div className="session-modal-overlay" onClick={onClose}>
      <div
        className="session-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="session-modal-header">
          <div className="header-title-group">
            <FilePlus size={24} className="header-title-icon" />
            <h2>Registrar Nova Sessão</h2>
          </div>
          <button type="button" className="session-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Parceiro com Busca - COM A NOVA CLASSE */}
          <div className="form-group force-vertical-dropdown">
            <label>Conexão *</label>
            {partners.length === 0 ? (
              <p className="no-partners-message">
                Você ainda não tem conexões aceitas. Conecte-se com alguém na
                aba Conexões para poder registrar uma sessão.
              </p>
            ) : (
              <SearchableSelect
                options={partnerOptions}
                value={formData.partner_id}
                onChange={handlePartnerChange}
                placeholder="Buscar conexão por nome ou hub..."
                displayKey="name"
                valueKey="code"
              />
            )}
          </div>

          {/* Data */}
          <div className="form-group">
            <label htmlFor="date">Data *</label>
            <input
              className="input"
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
              className="input"
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

          {/* Idiomas com Seletor Pré-definido - COM A NOVA CLASSE */}
          <div className="form-group force-vertical-dropdown">
            <label>Idiomas Praticados *</label>
            <SearchableSelect
              options={languageOptions}
              value={formData.languages}
              onChange={handleLanguageChange}
              placeholder="Selecione os idiomas..."
              displayKey="name"
              valueKey="code"
              multi={true}
            />
          </div>

          {/* Notas */}
          <div className="form-group">
            <label htmlFor="notes">Notas</label>
            <textarea
              className="input"
              id="notes"
              name="notes"
              placeholder="Adicione observações sobre a sessão (opcional)"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
            />
          </div>

          {/* Tornar Pública */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.makePublic}
                onChange={handleMakePublicChange}
              />
              Tornar esta sessão pública
            </label>
            <small>
              O parceiro vai receber um e-mail para aprovar antes dela
              aparecer no feed da Comunidade.
            </small>
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
                    className="photo-remove-btn"
                    onClick={removePhoto}
                    aria-label="Remover foto"
                  >
                    <X size={16} />
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
          <div className="session-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Registrar Sessão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSessionModal;