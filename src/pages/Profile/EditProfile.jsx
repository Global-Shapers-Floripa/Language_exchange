import React, { useEffect, useState, useCallback } from "react";

import Cropper from "react-easy-crop";
import { useNavigate, useLocation } from "react-router-dom";
import { SquarePen, Eye, EyeOff } from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import TagSelect from "../../components/common/TagSelect";
import PersonAvatar from "../../components/common/PersonAvatar";

import { LANGUAGES } from "../../constants/languages";
import { INTERESTS } from "../../constants/interests";
import { COUNTRIES } from "../../constants/countries";
import {
  CEFR_LEVELS,
  parseLanguageString,
  formatLanguageString,
  formatLanguageLabel,
} from "../../utils/languageLevel";
import { getFlagUrl } from "../../utils/countryFlag";
import { useCountryProgress } from "../../hooks/useCountryProgress";

import { supabase } from "../../services/supabaseClient";

import Swal from "sweetalert2";

import "./edit-profile.css";

const EditProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Bloco "Informações pessoais" recolhido por padrão — só o cabeçalho
  // compacto (avatar, nome, hub) fica sempre visível
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    hub: "",
    country: "",
    phone: "",
    description: "",

    speaks: [],
    learns: [],

    interests: [],

    photo_url: "",
  });

  // =========================
  // CROPPER
  // =========================
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);

  // =========================
  // NÍVEL CEFR (mini seletor por tag)
  // =========================
  // { field: "speaks" | "learns", name: string } do idioma cujo mini
  // seletor de nível está aberto no momento, ou null se nenhum.
  const [levelPickerFor, setLevelPickerFor] = useState(null);

  // =========================
  // MAPA DE BANDEIRAS
  // =========================
  const { countries: countryProgress, loading: loadingCountryProgress } =
    useCountryProgress();

  // País selecionado (bandeira desbloqueada clicada) para exibir no modal
  const [selectedCountry, setSelectedCountry] = useState(null);

  // =========================
  // CARREGAR PERFIL
  // =========================
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate("/login");
          return;
        }

        setCurrentUser(user);

        const { data: profile, error } = await supabase
          .from("profiles")
          .select(
            "full_name, hub, country, description, speaks, learns, interests, photo_url",
          )
          .eq("id", user.id)
          .single();

        if (error) {
          console.error(error);
        }

        // Email/telefone vivem em profile_contacts (RLS restrita) — dono
        // sempre pode ler o próprio contato
        const { data: contact, error: contactError } = await supabase
          .from("profile_contacts")
          .select("email, phone")
          .eq("user_id", user.id)
          .single();

        if (contactError) {
          console.error(contactError);
        }

        if (profile) {
          setFormData({
            full_name: profile.full_name || "",
            email: contact?.email || "",
            hub: profile.hub || "",
            country: profile.country || "",
            phone: contact?.phone || "",
            description: profile.description || "",
            speaks: parseLanguageString(profile.speaks),
            learns: parseLanguageString(profile.learns),
            interests: profile.interests
              ? profile.interests.split(",").map((item) => item.trim())
              : [],
            photo_url: profile.photo_url || "",
          });
        }
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Erro ao carregar perfil",
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [navigate]);

  // =========================
  // ROLAGEM AUTOMÁTICA (vindo do "Ver todos" do Dashboard, ex:
  // /profile?scrollTo=mapa-bandeiras)
  // =========================
  useEffect(() => {
    if (loading) return;

    const scrollTo = new URLSearchParams(location.search).get("scrollTo");
    if (!scrollTo) return;

    const target = document.getElementById(scrollTo);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, location.search]);

  // =========================
  // INPUTS
  // =========================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // IDIOMAS (speaks/learns) + NÍVEL CEFR
  // =========================
  // Adiciona idioma sempre sem nível (level: null) — o usuário define o
  // nível depois, clicando na tag.
  const handleAddLanguage = (field, name) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], { name, level: null }],
    }));
  };

  const handleRemoveLanguage = (field, name) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((item) => item.name !== name),
    }));

    setLevelPickerFor((prev) =>
      prev && prev.field === field && prev.name === name ? null : prev,
    );
  };

  const handleTagClick = (field, name) => {
    setLevelPickerFor((prev) =>
      prev && prev.field === field && prev.name === name
        ? null
        : { field, name },
    );
  };

  const handleSetLevel = (field, name, level) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item) =>
        item.name === name ? { ...item, level } : item,
      ),
    }));
    setLevelPickerFor(null);
  };

  // =========================
  // CROPPER E FOTOS
  // =========================
  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setImageSrc(imageUrl);
    setShowCropModal(true);
  };

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg");
    });
  };

  const handleSaveCroppedPhoto = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;

      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      const fileName = `${currentUser.id}.jpg`;
      const filePath = `profiles/${fileName}`;
      const bucketName = "profile-photos";

      await supabase.storage.from(bucketName).remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, croppedImage, {
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      setFormData((prev) => ({
        ...prev,
        photo_url: `${publicUrl}?t=${Date.now()}`,
      }));

      setShowCropModal(false);

      Swal.fire({
        icon: "success",
        title: "Foto Adicionada!",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao salvar imagem",
      });
    }
  };

  // =========================
  // VALIDAR
  // =========================
  const validateForm = () => {
    if (!formData.full_name.trim()) {
      Swal.fire("Erro", "Digite seu nome", "warning");
      return false;
    }
    if (!formData.email.trim()) {
      Swal.fire("Erro", "Digite seu email", "warning");
      return false;
    }
    if (!formData.country) {
      Swal.fire("Erro", "Selecione seu país", "warning");
      return false;
    }
    if (formData.speaks.length === 0) {
      Swal.fire(
        "Erro",
        "Selecione pelo menos um idioma que você fala",
        "warning",
      );
      return false;
    }
    if (formData.learns.length === 0) {
      Swal.fire(
        "Erro",
        "Selecione pelo menos um idioma que deseja aprender",
        "warning",
      );
      return false;
    }
    return true;
  };

  // =========================
  // SALVAR
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          country: formData.country,
          description: formData.description,
          speaks: formatLanguageString(formData.speaks),
          learns: formatLanguageString(formData.learns),
          interests: formData.interests.join(", "),
          photo_url: formData.photo_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentUser.id);

      if (error) throw error;

      const { error: contactError } = await supabase
        .from("profile_contacts")
        .upsert({
          user_id: currentUser.id,
          email: formData.email,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        });

      if (contactError) throw contactError;

      Swal.fire({
        icon: "success",
        title: "Perfil atualizado",
        timer: 1500,
        showConfirmButton: false,
      });

      setIsEditing(false);
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível salvar",
      });
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando perfil...</p>
        </div>
      </DashboardLayout>
    );
  }

  const languageLabels = LANGUAGES.map((lang) => lang.name || lang.label);
  const countryName = COUNTRIES.find((c) => c.code === formData.country)?.name;

  // =========================
  // MAPA DE BANDEIRAS: ORDENAÇÃO
  // =========================
  // Desbloqueados primeiro (mais conexões -> menos), depois bloqueados
  // em ordem alfabética (já é a ordem de COUNTRIES)
  const countryProgressMap = new Map(
    countryProgress.map((country) => [country.code, country]),
  );

  const unlockedCountries = COUNTRIES.filter((country) =>
    countryProgressMap.has(country.code),
  ).sort(
    (a, b) =>
      countryProgressMap.get(b.code).count - countryProgressMap.get(a.code).count,
  );

  const lockedCountries = COUNTRIES.filter(
    (country) => !countryProgressMap.has(country.code),
  );

  const sortedCountries = [...unlockedCountries, ...lockedCountries];

  const handleFlagClick = (country) => {
    const progress = countryProgressMap.get(country.code);
    if (!progress) return;

    setSelectedCountry({ ...country, ...progress });
  };

  return (
    <DashboardLayout>
      <div className="edit-profile-container">
        <div className="edit-profile-header">
          <div>
            <h1>Meu Perfil</h1>
            <p>
              {isEditing
                ? "Atualize suas informações pessoais."
                : "Visualize suas informações pessoais."}
            </p>
          </div>
        </div>

        {/* CARD ÚNICO UNIFICADO */}
        <div className="card card--profile unified-card">
          {/* SEÇÃO DO TOPO (FOTO, NOME, HUB) */}
          <div className="profile-top-section">
            <div className="profile-avatar-area">
              <div className="photo-preview">
                <PersonAvatar
                  photoUrl={formData.photo_url}
                  seed={currentUser?.id}
                  name={formData.full_name}
                  className="preview-image"
                />
              </div>

              {isEditing && (
                <label className="upload-btn">
                  Alterar foto
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="file-input"
                  />
                </label>
              )}
            </div>

            <div className="profile-main-info">
              <h2 className="profile-name">
                {formData.full_name || "Nome pendente"}
              </h2>
              <span className="profile-hub">
                HUB {formData.hub || "NÃO DEFINIDO"}
              </span>
            </div>
          </div>

          {!isEditing && (
            <button
              className="btn btn-ghost--icon btn-edit-inside-card"
              onClick={() => {
                // Editar não faz sentido com o bloco escondido — expande junto
                setIsEditing(true);
                setDetailsExpanded(true);
              }}
              aria-label="Editar perfil"
            >
              <SquarePen size={18} />
            </button>
          )}

          {/* DIVISÓRIA SUTIL */}
          <div className="card-divider"></div>

          {/* SEÇÃO INFERIOR (VISUALIZAÇÃO VS EDIÇÃO) */}
          {!isEditing ? (
            <div className="profile-bottom-section view-mode">
              <button
                type="button"
                className="section-title-toggle"
                onClick={() => setDetailsExpanded((prev) => !prev)}
                aria-expanded={detailsExpanded}
                aria-controls="profile-details-panel"
              >
                <h2 className="section-title">Informações pessoais</h2>
                {detailsExpanded ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>

              {detailsExpanded && (
              <div id="profile-details-panel" className="info-grid">
                <div className="info-group">
                  <span className="info-label">Nome completo</span>
                  <span
                    className={`info-value ${!formData.full_name ? "empty-text" : ""}`}
                  >
                    {formData.full_name || "Nome não informado"}
                  </span>
                </div>

                <div className="info-group">
                  <span className="info-label">Email</span>
                  <span
                    className={`info-value ${!formData.email ? "empty-text" : ""}`}
                  >
                    {formData.email || "Email não informado"}
                  </span>
                </div>

                <div className="info-group">
                  <span className="info-label">Telefone</span>
                  <span
                    className={`info-value ${!formData.phone ? "empty-text" : ""}`}
                  >
                    {formData.phone || "Telefone pendente de preencher"}
                  </span>
                </div>

                <div className="info-group">
                  <span className="info-label">País</span>
                  <span
                    className={`info-value ${!countryName ? "empty-text" : ""}`}
                  >
                    {countryName || "País pendente de preencher"}
                  </span>
                </div>

                <div className="info-group full">
                  <span className="info-label">Sobre você</span>
                  <p
                    className={`info-value description-text ${!formData.description ? "empty-text" : ""}`}
                  >
                    {formData.description ||
                      "Descrição pendente de preencher. Adicione uma breve descrição sobre quem você é."}
                  </p>
                </div>

                <div className="info-group">
                  <span className="info-label">Idiomas que você fala</span>
                  <div className="tags-container">
                    {formData.speaks.length > 0 ? (
                      formData.speaks.map((lang) => (
                        <span key={lang.name} className="view-tag view-tag--orange">
                          {formatLanguageLabel(lang)}
                        </span>
                      ))
                    ) : (
                      <span className="empty-text">
                        Nenhum idioma de fala selecionado
                      </span>
                    )}
                  </div>
                </div>

                <div className="info-group">
                  <span className="info-label">
                    Idiomas que deseja aprender
                  </span>
                  <div className="tags-container">
                    {formData.learns.length > 0 ? (
                      formData.learns.map((lang) => (
                        <span key={lang.name} className="view-tag view-tag--blue">
                          {formatLanguageLabel(lang)}
                        </span>
                      ))
                    ) : (
                      <span className="empty-text">
                        Nenhum idioma de interesse selecionado
                      </span>
                    )}
                  </div>
                </div>

                <div className="info-group full">
                  <span className="info-label">Interesses</span>
                  <div className="tags-container">
                    {formData.interests.length > 0 ? (
                      formData.interests.map((interest, idx) => (
                        <span key={idx} className="view-tag view-tag--purple">
                          {interest}
                        </span>
                      ))
                    ) : (
                      <span className="empty-text">
                        Nenhum interesse selecionado
                      </span>
                    )}
                  </div>
                </div>
              </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="edit-profile-form">
              <div className="profile-bottom-section">
                <h2 className="section-title">Editar Informações</h2>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Nome completo</label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Telefone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Hub</label>
                    <p className="info-value">
                      {formData.hub || "Não definido"}
                    </p>
                    <span className="form-hint">
                      Hub definido na aprovação da conta, não pode ser
                      alterado.
                    </span>
                  </div>

                  <div className="form-group">
                    <label>País</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="">Selecione um país</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full">
                    <label>Sobre você</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="form-textarea"
                      placeholder="Conte um pouco sobre você..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Idiomas que você fala</label>
                    <TagSelect
                      options={languageLabels}
                      selectedItems={formData.speaks.map((item) => item.name)}
                      onSelect={(name) => handleAddLanguage("speaks", name)}
                      onRemove={(name) => handleRemoveLanguage("speaks", name)}
                      renderLabel={(name) =>
                        formatLanguageLabel(
                          formData.speaks.find((item) => item.name === name) || {
                            name,
                            level: null,
                          },
                        )
                      }
                      onTagClick={(name) => handleTagClick("speaks", name)}
                      placeholder="Selecione idiomas..."
                    />
                    {levelPickerFor?.field === "speaks" && (
                      <div className="level-picker">
                        <span className="level-picker-title">
                          Nível de {levelPickerFor.name}
                        </span>
                        <div className="level-picker-options">
                          <button
                            type="button"
                            className="level-picker-option"
                            onClick={() =>
                              handleSetLevel("speaks", levelPickerFor.name, null)
                            }
                          >
                            Não informado
                          </button>
                          {CEFR_LEVELS.map((level) => (
                            <button
                              key={level}
                              type="button"
                              className="level-picker-option"
                              onClick={() =>
                                handleSetLevel("speaks", levelPickerFor.name, level)
                              }
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Idiomas que deseja aprender</label>
                    <TagSelect
                      options={languageLabels}
                      selectedItems={formData.learns.map((item) => item.name)}
                      onSelect={(name) => handleAddLanguage("learns", name)}
                      onRemove={(name) => handleRemoveLanguage("learns", name)}
                      renderLabel={(name) =>
                        formatLanguageLabel(
                          formData.learns.find((item) => item.name === name) || {
                            name,
                            level: null,
                          },
                        )
                      }
                      onTagClick={(name) => handleTagClick("learns", name)}
                      placeholder="Selecione idiomas..."
                    />
                    {levelPickerFor?.field === "learns" && (
                      <div className="level-picker">
                        <span className="level-picker-title">
                          Nível de {levelPickerFor.name}
                        </span>
                        <div className="level-picker-options">
                          <button
                            type="button"
                            className="level-picker-option"
                            onClick={() =>
                              handleSetLevel("learns", levelPickerFor.name, null)
                            }
                          >
                            Não informado
                          </button>
                          {CEFR_LEVELS.map((level) => (
                            <button
                              key={level}
                              type="button"
                              className="level-picker-option"
                              onClick={() =>
                                handleSetLevel("learns", levelPickerFor.name, level)
                              }
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group full">
                    <label>Interesses</label>
                    <TagSelect
                      options={INTERESTS}
                      selectedItems={formData.interests}
                      onSelect={(item) =>
                        setFormData((prev) => ({
                          ...prev,
                          interests: [...prev.interests, item],
                        }))
                      }
                      onRemove={(item) =>
                        setFormData((prev) => ({
                          ...prev,
                          interests: prev.interests.filter(
                            (interest) => interest !== item,
                          ),
                        }))
                      }
                      placeholder="Selecione interesses..."
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsEditing(false);
                      setLevelPickerFor(null);
                    }}
                  >
                    Cancelar
                  </button>

                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Salvando..." : "Salvar alterações"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* MAPA DE BANDEIRAS — visível apenas no modo visualização */}
        {!isEditing && (
          <div id="mapa-bandeiras" className="card card--profile country-map-card">
            <h2 className="section-title">Mapa de Bandeiras</h2>
            <p className="country-map-subtitle">
              Países com quem você já praticou aparecem coloridos. Clique numa
              bandeira desbloqueada para ver com quem você já teve sessão.
            </p>

            {loadingCountryProgress ? (
              <p className="empty-text">Carregando mapa de países...</p>
            ) : (
              <div className="country-flags-grid">
                {sortedCountries.map((country) => {
                  const progress = countryProgressMap.get(country.code);
                  const unlocked = Boolean(progress);
                  const flagUrl = getFlagUrl(country.code);

                  if (!flagUrl) return null;

                  return (
                    <button
                      type="button"
                      key={country.code}
                      className={`country-flag-item ${unlocked ? "unlocked" : "locked"}`}
                      onClick={() => handleFlagClick(country)}
                      disabled={!unlocked}
                      title={country.name}
                      aria-label={
                        unlocked
                          ? `${country.name}: ${progress.count} conexão(ões), ver detalhes`
                          : `${country.name}: ainda sem sessões`
                      }
                    >
                      <img
                        src={flagUrl}
                        alt={country.name}
                        className="country-flag-img"
                      />
                      {unlocked && (
                        <span className="country-flag-badge">
                          {progress.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODAL: PESSOAS CONECTADAS DO PAÍS SELECIONADO */}
        {selectedCountry && (
          <div
            className="country-modal-overlay"
            onClick={() => setSelectedCountry(null)}
          >
            <div
              className="card country-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="country-modal-header">
                <img
                  src={getFlagUrl(selectedCountry.code)}
                  alt={selectedCountry.name}
                  className="country-modal-flag"
                />
                <h2>{selectedCountry.name}</h2>
              </div>

              <ul className="country-modal-people-list">
                {selectedCountry.people.map((person, index) => (
                  <li key={index}>
                    <span className="country-modal-person-name">
                      {person.name}
                    </span>
                    {person.hub && (
                      <span className="country-modal-person-hub">
                        {person.hub}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedCountry(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* MODAL CROPPER */}
        {showCropModal && (
          <div className="crop-modal">
            <div className="crop-container">
              <div className="cropper-wrapper">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              <div className="crop-actions">
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(e.target.value)}
                />

                <div className="crop-buttons">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCropModal(false)}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveCroppedPhoto}
                  >
                    Salvar foto
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EditProfile;
