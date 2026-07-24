import React, { useEffect, useState, useCallback } from "react";

import Cropper from "react-easy-crop";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SquarePen, Eye, EyeOff, AlertTriangle } from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import TagSelect from "../../components/common/TagSelect";
import PersonAvatar from "../../components/common/PersonAvatar";
import BadgeGrid from "../../components/common/BadgeGrid";

import { LANGUAGES, getLanguageCodeByName } from "../../constants/languages";
import { INTERESTS, getInterestCodeByName } from "../../constants/interests";
import { COUNTRIES } from "../../constants/countries";
import { getBadgeDefinition } from "../../constants/badges";
import {
  CEFR_LEVELS,
  parseLanguageString,
  formatLanguageString,
  formatLanguageLabel,
} from "../../utils/languageLevel";
import { getFlagUrl } from "../../utils/countryFlag";
import { drawToResizedBlob } from "../../utils/imageResize";
import { useCountryProgress } from "../../hooks/useCountryProgress";
import {
  getPolyglotCounts,
  evaluatePolyglot,
  evaluatePhotoMemory,
  getPhotoMemoryHolders,
} from "../../services/badgeService";

// Avatar é sempre um recorte quadrado (Cropper aspect={1}) exibido pequeno
// (40-88px pela plataforma) — 500px de lado já é resolução de sobra, evita
// enviar recortes de fotos de celular com vários MB desnecessariamente.
const AVATAR_MAX_DIMENSION = 500;
const AVATAR_JPEG_QUALITY = 0.85;

// Teto de segurança pós-compressão: um recorte 500x500 em qualidade 0.85
// fica bem abaixo disso (avatares reais do bucket ficam quase todos sob
// 200KB). Uploads de antes desse pipeline existir chegaram a subir vários
// MB sem redimensionar — se o blob comprimido ainda vier assim tão grande
// (ou nulo), algo falhou na compressão e não deve subir sem mais checagem.
const AVATAR_MAX_COMPRESSED_SIZE = 400 * 1024;

import { supabase } from "../../services/supabaseClient";

import Swal from "sweetalert2";

import "./edit-profile.css";

const DESCRIPTION_MAX_LENGTH = 500;

// Mesma fonte (EF) já usada e validada no ProficiencyTestBanner — aqui aponta
// para a página que explica a escala CEFR A1-C2, não para o teste em si.
const CEFR_INFO_LINK = "https://www.efset.org/cefr/";

const EditProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation("constants");
  const { t: tp } = useTranslation("profile");

  // =========================
  // TRADUÇÃO DE LANGUAGES/INTERESTS
  // =========================
  // profiles.speaks/learns/interests armazenam o NOME em português (não o
  // code) — ver CLAUDE.md. Essas funções acham o code a partir do nome já
  // salvo/selecionado, pra traduzir só a exibição sem tocar no valor
  // armazenado nem na lógica de matchService.
  const translateLanguageName = (name) => {
    const code = getLanguageCodeByName(name);
    return code ? t(`languages.${code}`) : name;
  };

  const translatedLanguageLabel = (item) =>
    formatLanguageLabel({ ...item, name: translateLanguageName(item.name) });

  const translateInterestName = (name) => {
    const code = getInterestCodeByName(name);
    return code ? t(`interests.${code}`) : name;
  };

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
    weforum_link: "",
    description: "",

    speaks: [],
    learns: [],

    interests: [],

    photo_url: "",
  });

  // =========================
  // BADGES (insígnias)
  // =========================
  // Calculados em cima do estado atual (perfil + sessões públicas), sem
  // tabela de "conquista permanente" — ver badgeService.js.
  const [badges, setBadges] = useState([]);

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
          navigate("/login", { replace: true });
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
          .select("email, phone, weforum_link")
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
            weforum_link: contact?.weforum_link || "",
            description: profile.description || "",
            speaks: parseLanguageString(profile.speaks),
            learns: parseLanguageString(profile.learns),
            interests: profile.interests
              ? profile.interests.split(",").map((item) => item.trim())
              : [],
            photo_url: profile.photo_url || "",
          });

          // Poliglota e Photo Memory dependem cada um da sua view
          // (badge_polyglot_holders / badge_photo_memory_holders) — nenhum
          // dos dois vem mais de profiles.speaks/learns. Ver badgeService.js.
          const [polyglotCounts, photoMemoryHolders] = await Promise.all([
            getPolyglotCounts([user.id]),
            getPhotoMemoryHolders([user.id]),
          ]);

          const polyglotDef = getBadgeDefinition("polyglot");
          const photoMemoryDef = getBadgeDefinition("photoMemory");

          setBadges([
            {
              id: "polyglot",
              icon: polyglotDef.icon,
              levelsTotal: polyglotDef.levels.length,
              ...evaluatePolyglot(user.id, polyglotCounts),
            },
            {
              id: "photoMemory",
              icon: photoMemoryDef.icon,
              ...evaluatePhotoMemory(user.id, photoMemoryHolders),
            },
          ]);
        }
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: tp("errors.genericTitle"),
          text: tp("errors.loadProfile"),
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [navigate, tp]);

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

    return drawToResizedBlob({
      image,
      sx: pixelCrop.x,
      sy: pixelCrop.y,
      sWidth: pixelCrop.width,
      sHeight: pixelCrop.height,
      maxDimension: AVATAR_MAX_DIMENSION,
      quality: AVATAR_JPEG_QUALITY,
    });
  };

  const handleSaveCroppedPhoto = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;

      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);

      if (!croppedImage || croppedImage.size > AVATAR_MAX_COMPRESSED_SIZE) {
        const sizeError = new Error(tp("errors.photoTooLarge"));
        sizeError.isPhotoTooLarge = true;
        throw sizeError;
      }

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
        title: tp("success.photoAdded"),
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: tp("errors.genericTitle"),
        text: error.isPhotoTooLarge ? error.message : tp("errors.savePhoto"),
      });
    }
  };

  // =========================
  // VALIDAR
  // =========================
  const validateForm = () => {
    if (!formData.full_name.trim()) {
      Swal.fire(tp("errors.genericTitle"), tp("errors.nameRequired"), "warning");
      return false;
    }
    if (!formData.email.trim()) {
      Swal.fire(tp("errors.genericTitle"), tp("errors.emailRequired"), "warning");
      return false;
    }
    if (!formData.country) {
      Swal.fire(tp("errors.genericTitle"), tp("errors.countryRequired"), "warning");
      return false;
    }
    if (formData.speaks.length === 0) {
      Swal.fire(
        tp("errors.genericTitle"),
        tp("errors.speaksRequired"),
        "warning",
      );
      return false;
    }
    if (formData.learns.length === 0) {
      Swal.fire(
        tp("errors.genericTitle"),
        tp("errors.learnsRequired"),
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
          weforum_link: formData.weforum_link,
          updated_at: new Date().toISOString(),
        });

      if (contactError) throw contactError;

      Swal.fire({
        icon: "success",
        title: tp("success.profileUpdated"),
        timer: 1500,
        showConfirmButton: false,
      });

      setIsEditing(false);
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: tp("errors.genericTitle"),
        text: tp("errors.saveProfile"),
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
          <p>{tp("loading")}</p>
        </div>
      </DashboardLayout>
    );
  }

  const languageLabels = LANGUAGES.map((lang) => lang.name || lang.label);
  const countryName = COUNTRIES.find((c) => c.code === formData.country)
    ? t(`countries.${formData.country}`)
    : undefined;

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
            <h1>{tp("title")}</h1>
            <p>
              {isEditing
                ? tp("subtitleEditing")
                : tp("subtitleViewing")}
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
                  {tp("changePhoto")}
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
                {formData.full_name || tp("namePending")}
              </h2>
              <span className="profile-hub">
                {tp("hubPrefix")} {formData.hub || tp("hubNotSetCaps")}
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
              aria-label={tp("editProfileAria")}
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
                <h2 className="section-title">{tp("sectionTitles.personalInfo")}</h2>
                {detailsExpanded ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>

              {detailsExpanded && (
              <div id="profile-details-panel" className="info-grid">
                <div className="info-group">
                  <span className="info-label">{tp("fields.fullName")}</span>
                  <span
                    className={`info-value ${!formData.full_name ? "empty-text" : ""}`}
                  >
                    {formData.full_name || tp("fields.fullNameNotInformed")}
                  </span>
                </div>

                <div className="info-group">
                  <span className="info-label">{tp("fields.email")}</span>
                  <span
                    className={`info-value ${!formData.email ? "empty-text" : ""}`}
                  >
                    {formData.email || tp("fields.emailNotInformed")}
                  </span>
                </div>

                <div className="info-group">
                  <span className="info-label">{tp("fields.phone")}</span>
                  <span
                    className={`info-value ${!formData.phone ? "empty-text" : ""}`}
                  >
                    {formData.phone || tp("fields.phonePending")}
                  </span>
                </div>

                <div className="info-group">
                  <span className="info-label">{tp("fields.weforumLink")}</span>
                  <span
                    className={`info-value ${!formData.weforum_link ? "empty-text" : ""}`}
                  >
                    {formData.weforum_link || tp("fields.weforumLinkPending")}
                  </span>
                </div>

                <div className="info-group">
                  <span className="info-label">{tp("fields.country")}</span>
                  <span
                    className={`info-value ${!countryName ? "empty-text" : ""}`}
                  >
                    {countryName || tp("fields.countryPending")}
                  </span>
                </div>

                <div className="info-group full">
                  <span className="info-label">{tp("fields.about")}</span>
                  <p
                    className={`info-value description-text ${!formData.description ? "empty-text" : ""}`}
                  >
                    {formData.description || tp("fields.aboutPending")}
                  </p>
                </div>

                <div className="info-group">
                  <span className="info-label">{tp("fields.speaks")}</span>
                  <div className="tags-container">
                    {formData.speaks.length > 0 ? (
                      formData.speaks.map((lang) => (
                        <span key={lang.name} className="view-tag view-tag--orange">
                          {translatedLanguageLabel(lang)}
                        </span>
                      ))
                    ) : (
                      <span className="empty-text">
                        {tp("fields.speaksEmpty")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="info-group">
                  <span className="info-label">
                    {tp("fields.learns")}
                  </span>
                  <div className="tags-container">
                    {formData.learns.length > 0 ? (
                      formData.learns.map((lang) => (
                        <span key={lang.name} className="view-tag view-tag--blue">
                          {translatedLanguageLabel(lang)}
                        </span>
                      ))
                    ) : (
                      <span className="empty-text">
                        {tp("fields.learnsEmpty")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="info-group full">
                  <span className="info-label">{tp("fields.interests")}</span>
                  <div className="tags-container">
                    {formData.interests.length > 0 ? (
                      formData.interests.map((interest, idx) => (
                        <span key={idx} className="view-tag view-tag--purple">
                          {translateInterestName(interest)}
                        </span>
                      ))
                    ) : (
                      <span className="empty-text">
                        {tp("fields.interestsEmpty")}
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
                <h2 className="section-title">{tp("sectionTitles.editInfo")}</h2>

                <div className="form-grid">
                  <div className="form-group">
                    <label>{tp("fields.fullName")}</label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>{tp("fields.email")}</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>{tp("fields.phone")}</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                    <span className="form-hint warning-banner">
                      <AlertTriangle size={14} className="warning-banner-icon" aria-hidden="true" />
                      {tp("fields.phoneDddHint")}
                    </span>
                  </div>

                  <div className="form-group">
                    <label>{tp("fields.weforumLink")}</label>
                    <input
                      type="text"
                      name="weforum_link"
                      value={formData.weforum_link}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>{tp("fields.hub")}</label>
                    <p className="info-value">
                      {formData.hub || tp("fields.hubNotSet")}
                    </p>
                    <span className="form-hint">
                      {tp("fields.hubHint")}
                    </span>
                  </div>

                  <div className="form-group">
                    <label>{tp("fields.country")}</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="">{tp("fields.selectCountry")}</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {t(`countries.${country.code}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full">
                    <label>{tp("fields.about")}</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="form-textarea"
                      placeholder={tp("fields.aboutPlaceholder")}
                      maxLength={DESCRIPTION_MAX_LENGTH}
                    />
                    <span className="form-hint char-count">
                      {tp("fields.aboutCharCount", {
                        count: formData.description.length,
                        max: DESCRIPTION_MAX_LENGTH,
                      })}
                    </span>
                  </div>

                  <div className="form-group">
                    <label>{tp("fields.speaks")}</label>
                    <span className="form-hint language-select-hint warning-banner">
                      <AlertTriangle size={14} className="warning-banner-icon" aria-hidden="true" />
                      {tp("languageSelect.hint")}
                    </span>
                    <TagSelect
                      options={languageLabels}
                      selectedItems={formData.speaks.map((item) => item.name)}
                      onSelect={(name) => handleAddLanguage("speaks", name)}
                      onRemove={(name) => handleRemoveLanguage("speaks", name)}
                      renderLabel={(name) =>
                        translatedLanguageLabel(
                          formData.speaks.find((item) => item.name === name) || {
                            name,
                            level: null,
                          },
                        )
                      }
                      onTagClick={(name) => handleTagClick("speaks", name)}
                      placeholder={tp("languageSelect.placeholder")}
                    />
                    {levelPickerFor?.field === "speaks" && (
                      <div className="level-picker">
                        <span className="level-picker-title">
                          {tp("languageSelect.levelOf", { name: translateLanguageName(levelPickerFor.name) })}
                        </span>
                        <div className="level-picker-options">
                          <button
                            type="button"
                            className="level-picker-option"
                            onClick={() =>
                              handleSetLevel("speaks", levelPickerFor.name, null)
                            }
                          >
                            {tp("languageSelect.noLevel")}
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
                        <a
                          href={CEFR_INFO_LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="level-picker-help-link"
                        >
                          {tp("languageSelect.cefrInfoLink")}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>{tp("fields.learns")}</label>
                    <span className="form-hint language-select-hint warning-banner">
                      <AlertTriangle size={14} className="warning-banner-icon" aria-hidden="true" />
                      {tp("languageSelect.hint")}
                    </span>
                    <TagSelect
                      options={languageLabels}
                      selectedItems={formData.learns.map((item) => item.name)}
                      onSelect={(name) => handleAddLanguage("learns", name)}
                      onRemove={(name) => handleRemoveLanguage("learns", name)}
                      renderLabel={(name) =>
                        translatedLanguageLabel(
                          formData.learns.find((item) => item.name === name) || {
                            name,
                            level: null,
                          },
                        )
                      }
                      onTagClick={(name) => handleTagClick("learns", name)}
                      placeholder={tp("languageSelect.placeholder")}
                    />
                    {levelPickerFor?.field === "learns" && (
                      <div className="level-picker">
                        <span className="level-picker-title">
                          {tp("languageSelect.levelOf", { name: translateLanguageName(levelPickerFor.name) })}
                        </span>
                        <div className="level-picker-options">
                          <button
                            type="button"
                            className="level-picker-option"
                            onClick={() =>
                              handleSetLevel("learns", levelPickerFor.name, null)
                            }
                          >
                            {tp("languageSelect.noLevel")}
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
                        <a
                          href={CEFR_INFO_LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="level-picker-help-link"
                        >
                          {tp("languageSelect.cefrInfoLink")}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="form-group full">
                    <label>{tp("fields.interests")}</label>
                    <TagSelect
                      options={INTERESTS.map((interest) => interest.name)}
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
                      renderLabel={translateInterestName}
                      placeholder={tp("interestSelect.placeholder")}
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
                    {tp("actions.cancel")}
                  </button>

                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? tp("actions.saving") : tp("actions.save")}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* BADGES (insígnias) — visível apenas no modo visualização */}
        {!isEditing && (
          <div className="card card--profile badges-card">
            <h2 className="badge-grid-title">{tp("sectionTitles.badges")}</h2>
            <p className="card-section-subtitle">{tp("badges.subtitle")}</p>

            <BadgeGrid
              badges={badges}
              person={{
                id: currentUser?.id,
                name: formData.full_name,
                photoUrl: formData.photo_url,
              }}
            />
          </div>
        )}

        {/* MAPA DE BANDEIRAS — visível apenas no modo visualização */}
        {!isEditing && (
          <div id="mapa-bandeiras" className="card card--profile country-map-card">
            <h2 className="section-title">{tp("sectionTitles.flagMap")}</h2>
            <p className="card-section-subtitle">
              {tp("flagMap.subtitle")}
            </p>

            {loadingCountryProgress ? (
              <p className="empty-text">{tp("flagMap.loading")}</p>
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
                      title={t(`countries.${country.code}`)}
                      aria-label={
                        unlocked
                          ? tp("flagMap.unlockedAria", {
                              country: t(`countries.${country.code}`),
                              count: progress.people.length,
                            })
                          : tp("flagMap.lockedAria", {
                              country: t(`countries.${country.code}`),
                            })
                      }
                    >
                      <img
                        src={flagUrl}
                        alt={t(`countries.${country.code}`)}
                        className="country-flag-img"
                      />
                      {unlocked && (
                        <span className="country-flag-badge">
                          {progress.people.length}
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
                  alt={t(`countries.${selectedCountry.code}`)}
                  className="country-modal-flag"
                />
                <h2>{t(`countries.${selectedCountry.code}`)}</h2>
              </div>

              <ul className="country-modal-people-list">
                {selectedCountry.people.map((person, index) => (
                  <li key={index}>
                    <div className="country-modal-person-info">
                      <span className="country-modal-person-name">
                        {person.name}
                      </span>
                      {person.hub && (
                        <span className="country-modal-person-hub">
                          {person.hub}
                        </span>
                      )}
                    </div>
                    {person.sessionCount > 1 && (
                      <span
                        className="country-modal-person-session-badge"
                        title={tp("flagMap.sessionCountTitle", {
                          count: person.sessionCount,
                        })}
                      >
                        {person.sessionCount}
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
                {tp("actions.close")}
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
                    {tp("actions.cancel")}
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveCroppedPhoto}
                  >
                    {tp("actions.savePhoto")}
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
