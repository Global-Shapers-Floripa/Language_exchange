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
  const { t: td } = useTranslation("dashboard");
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
      setSubmitError(td('sessions.addModal.errors.fileType'));
      return;
    }

    // Validar tamanho
    if (file.size > MAX_PHOTO_SIZE) {
      setSubmitError(td('sessions.addModal.errors.fileSize', { mb: Math.round(MAX_PHOTO_SIZE / 1024 / 1024) }));
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
      setSubmitError(td('sessions.addModal.errors.partnerRequired'));
      return;
    }

    if (!formData.languages || formData.languages.length === 0) {
      setSubmitError(td('sessions.addModal.errors.languageRequired'));
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
            <h2>{td('sessions.addModal.title')}</h2>
          </div>
          <button type="button" className="session-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Parceiro com Busca - COM A NOVA CLASSE */}
          <div className="form-group force-vertical-dropdown">
            <label>{td('sessions.addModal.connectionLabel')}</label>
            {partners.length === 0 ? (
              <p className="no-partners-message">
                {td('sessions.addModal.noPartners')}
              </p>
            ) : (
              <SearchableSelect
                options={partnerOptions}
                value={formData.partner_id}
                onChange={handlePartnerChange}
                placeholder={td('sessions.addModal.partnerSearchPlaceholder')}
                displayKey="name"
                valueKey="code"
              />
            )}
          </div>

          {/* Data */}
          <div className="form-group">
            <label htmlFor="date">{td('sessions.addModal.dateLabel')}</label>
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
            <label htmlFor="duration">{td('sessions.addModal.durationLabel')}</label>
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
            <label>{td('sessions.addModal.languagesLabel')}</label>
            <SearchableSelect
              options={languageOptions}
              value={formData.languages}
              onChange={handleLanguageChange}
              placeholder={td('sessions.addModal.languagesPlaceholder')}
              displayKey="name"
              valueKey="code"
              multi={true}
            />
          </div>

          {/* Notas */}
          <div className="form-group">
            <label htmlFor="notes">{td('sessions.notes.label')}</label>
            <textarea
              className="input"
              id="notes"
              name="notes"
              placeholder={td('sessions.notes.placeholder')}
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
              {td('sessions.addModal.makePublicCheckbox')}
            </label>
            <small>
              {td('sessions.addModal.makePublicHint')}
            </small>
          </div>

          {/* Upload de Foto */}
          <div className="form-group">
            <label>{td('sessions.addModal.photoLabel')}</label>
            <div className="photo-upload-container">
              {photoPreview ? (
                <div className="photo-preview">
                  <img src={photoPreview} alt={td('sessions.addModal.photoPreviewAlt')} />
                  <button
                    type="button"
                    className="photo-remove-btn"
                    onClick={removePhoto}
                    aria-label={td('sessions.addModal.removePhoto')}
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
                  <span>{td('sessions.addModal.uploadPrompt')}</span>
                  <small>{td('sessions.addModal.uploadHint')}</small>
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
              {td('confirmModal.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? td('sessions.addModal.saving') : td('sessions.addModal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSessionModal;