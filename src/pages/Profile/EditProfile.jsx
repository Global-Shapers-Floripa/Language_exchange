import React, {
  useEffect,
  useState,
  useCallback,
} from "react";

import Cropper from "react-easy-crop";

import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import TagSelect from "../../components/common/TagSelect";

import { LANGUAGES } from "../../constants/languages";
import { INTERESTS } from "../../constants/interests";

import { supabase } from "../../services/supabaseClient";

import Swal from "sweetalert2";

import "./edit-profile.css";

const EditProfile = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentUser, setCurrentUser] =
    useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    hub: "",
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
  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState(null);

  const [imageSrc, setImageSrc] =
    useState(null);

  const [showCropModal, setShowCropModal] =
    useState(false);

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

        const { data: profile, error } =
          await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (error) {
          console.error(error);
        }

        if (profile) {
          setFormData({
            full_name:
              profile.full_name || "",

            email: profile.email || "",

            hub: profile.hub || "",

            phone: profile.phone || "",

            description:
              profile.description || "",

            speaks: profile.speaks
              ? profile.speaks
                  .split(",")
                  .map((item) =>
                    item.trim()
                  )
              : [],

            learns: profile.learns
              ? profile.learns
                  .split(",")
                  .map((item) =>
                    item.trim()
                  )
              : [],

            interests: profile.interests
              ? profile.interests
                  .split(",")
                  .map((item) =>
                    item.trim()
                  )
              : [],

            photo_url:
              profile.photo_url || "",
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
  // CROPPER
  // =========================
  const onCropComplete = useCallback(
    (_, croppedPixels) => {
      setCroppedAreaPixels(
        croppedPixels
      );
    },
    []
  );

  // =========================
  // FOTO
  // =========================
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const imageUrl =
      URL.createObjectURL(file);

    setImageSrc(imageUrl);

    setShowCropModal(true);
  };

  // =========================
  // GERAR IMAGEM CORTADA
  // =========================
  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();

      image.addEventListener(
        "load",
        () => resolve(image)
      );

      image.addEventListener(
        "error",
        (error) => reject(error)
      );

      image.setAttribute(
        "crossOrigin",
        "anonymous"
      );

      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc,
    pixelCrop
  ) => {
    const image = await createImage(
      imageSrc
    );

    const canvas =
      document.createElement("canvas");

    const ctx =
      canvas.getContext("2d");

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
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg");
    });
  };

  // =========================
  // SALVAR FOTO CORTADA
  // =========================
  const handleSaveCroppedPhoto =
    async () => {
      try {
        if (
          !imageSrc ||
          !croppedAreaPixels
        )
          return;

        const croppedImage =
          await getCroppedImg(
            imageSrc,
            croppedAreaPixels
          );

        const fileName = `${currentUser.id}.jpg`;

        const filePath = `profiles/${fileName}`;

        const bucketName =
          "profile-photos";

        await supabase.storage
          .from(bucketName)
          .remove([filePath]);

        const { error: uploadError } =
          await supabase.storage
            .from(bucketName)
            .upload(
              filePath,
              croppedImage,
              {
                upsert: true,
                contentType:
                  "image/jpeg",
              }
            );

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

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
      Swal.fire(
        "Erro",
        "Digite seu nome",
        "warning"
      );

      return false;
    }

    if (!formData.email.trim()) {
      Swal.fire(
        "Erro",
        "Digite seu email",
        "warning"
      );

      return false;
    }

    if (
      formData.speaks.length === 0
    ) {
      Swal.fire(
        "Erro",
        "Selecione pelo menos um idioma que você fala",
        "warning"
      );

      return false;
    }

    if (
      formData.learns.length === 0
    ) {
      Swal.fire(
        "Erro",
        "Selecione pelo menos um idioma que deseja aprender",
        "warning"
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

      const { error } =
        await supabase
          .from("profiles")
          .update({
            full_name:
              formData.full_name,

            email: formData.email,

            hub: formData.hub,

            phone: formData.phone,

            description:
              formData.description,

            speaks:
              formData.speaks.join(
                ", "
              ),

            learns:
              formData.learns.join(
                ", "
              ),

            interests:
              formData.interests.join(
                ", "
              ),

            photo_url:
              formData.photo_url,

            updated_at:
              new Date().toISOString(),
          })
          .eq("id", currentUser.id);

      if (error) {
        throw error;
      }

      Swal.fire({
        icon: "success",
        title: "Perfil atualizado",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate("/profile");
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
  // CANCELAR
  // =========================
  const handleCancel = () => {
    navigate("/dashboard");
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

  // =========================
  // LABELS
  // =========================
  const languageLabels =
    LANGUAGES.map(
      (lang) =>
        lang.name || lang.label
    );

  return (
    <DashboardLayout>
      <div className="edit-profile-container">
        <div className="edit-profile-header">
          <h1>Meu Perfil</h1>

          <p>
            Visualize e atualize suas
            informações pessoais.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="edit-profile-form"
        >
          {/* TOPO */}
          <div className="profile-top-card">
            <div className="profile-avatar-area">
              <div className="photo-preview">
                {formData.photo_url ? (
                  <img
                    src={
                      formData.photo_url
                    }
                    alt="Foto"
                    className="preview-image"
                  />
                ) : (
                  <div className="no-photo">
                    👤
                  </div>
                )}
              </div>

              <label className="upload-btn">
                Alterar foto

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handlePhotoChange
                  }
                  className="file-input"
                />
              </label>
            </div>

            <div className="profile-main-info">
              <h2 className="profile-name">
                {formData.full_name ||
                  "Seu nome"}
              </h2>

              <span className="profile-hub">
                HUB{" "}
                {formData.hub ||
                  "NÃO DEFINIDO"}
              </span>
            </div>
          </div>

          {/* FORM */}
          <div className="form-card">
            <h2 className="section-title">
              Informações pessoais
            </h2>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  Nome completo
                </label>

                <input
                  type="text"
                  name="full_name"
                  value={
                    formData.full_name
                  }
                  onChange={
                    handleInputChange
                  }
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={
                    handleInputChange
                  }
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Telefone</label>

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={
                    handleInputChange
                  }
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Hub</label>

                <input
                  type="text"
                  name="hub"
                  value={formData.hub}
                  onChange={
                    handleInputChange
                  }
                  className="form-input"
                />
              </div>

              <div className="form-group full">
                <label>
                  Sobre você
                </label>

                <textarea
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={
                    handleInputChange
                  }
                  className="form-textarea"
                  placeholder="Conte um pouco sobre você..."
                />
              </div>

              {/* FALA */}
              <div className="form-group full">
                <label>
                  Idiomas que você
                  fala
                </label>

                <TagSelect
                  options={
                    languageLabels
                  }
                  selectedItems={
                    formData.speaks
                  }
                  onSelect={(item) =>
                    setFormData(
                      (prev) => ({
                        ...prev,
                        speaks: [
                          ...prev.speaks,
                          item,
                        ],
                      })
                    )
                  }
                  onRemove={(item) =>
                    setFormData(
                      (prev) => ({
                        ...prev,
                        speaks:
                          prev.speaks.filter(
                            (lang) =>
                              lang !==
                              item
                          ),
                      })
                    )
                  }
                  placeholder="Selecione idiomas..."
                />
              </div>

              {/* APRENDE */}
              <div className="form-group full">
                <label>
                  Idiomas que deseja
                  aprender
                </label>

                <TagSelect
                  options={
                    languageLabels
                  }
                  selectedItems={
                    formData.learns
                  }
                  onSelect={(item) =>
                    setFormData(
                      (prev) => ({
                        ...prev,
                        learns: [
                          ...prev.learns,
                          item,
                        ],
                      })
                    )
                  }
                  onRemove={(item) =>
                    setFormData(
                      (prev) => ({
                        ...prev,
                        learns:
                          prev.learns.filter(
                            (lang) =>
                              lang !==
                              item
                          ),
                      })
                    )
                  }
                  placeholder="Selecione idiomas..."
                />
              </div>

              {/* INTERESSES */}
              <div className="form-group full">
                <label>
                  Interesses
                </label>

                <TagSelect
                  options={INTERESTS}
                  selectedItems={
                    formData.interests
                  }
                  onSelect={(item) =>
                    setFormData(
                      (prev) => ({
                        ...prev,
                        interests: [
                          ...prev.interests,
                          item,
                        ],
                      })
                    )
                  }
                  onRemove={(item) =>
                    setFormData(
                      (prev) => ({
                        ...prev,
                        interests:
                          prev.interests.filter(
                            (
                              interest
                            ) =>
                              interest !==
                              item
                          ),
                      })
                    )
                  }
                  placeholder="Selecione interesses..."
                />
              </div>
            </div>

            {/* BOTÕES */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancel}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn-save"
                disabled={saving}
              >
                {saving
                  ? "Salvando..."
                  : "Salvar alterações"}
              </button>
            </div>
          </div>
        </form>

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
                  onCropComplete={
                    onCropComplete
                  }
                />
              </div>

              <div className="crop-actions">
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) =>
                    setZoom(
                      e.target.value
                    )
                  }
                />

                <div className="crop-buttons">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() =>
                      setShowCropModal(
                        false
                      )
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="btn-save"
                    onClick={
                      handleSaveCroppedPhoto
                    }
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