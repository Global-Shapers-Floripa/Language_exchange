import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, Mail, MapPin, Lock, Link2 } from "lucide-react";
import "./sign-up.css";
import { supabase } from "../../services/supabaseClient";
import { clearListCaches } from "../../hooks/useCache";
import {
  validatePasswordStrength,
  sanitizeInput,
  validateEmail,
  logSecurityEvent,
} from "../../utils/securityUtils";

import Brain from "../../assets/brain.png";
import Lupa from "../../assets/lupa.png";
import Megafone from "../../assets/megafone.png";
import Boca from "../../assets/boca.png";
import PrivacyPolicyContent from "../../legal/PrivacyPolicyContent";

const SignUp = () => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    hub: "",
    weforumLink: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "name") {
      const onlyLetters = value.replace(/[0-9]/g, "");
      setFormData({ ...formData, [name]: onlyLetters });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "password") {
      const validation = validatePasswordStrength(value);
      setPasswordErrors(validation.errors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError(t("signup.errors.passwordMismatch"));
      logSecurityEvent("signup_password_mismatch", { email: formData.email });
      return;
    }

    const passwordValidation = validatePasswordStrength(formData.password);
    if (!passwordValidation.isValid) {
      const requirements = passwordValidation.errors
        .map((code) => t(`passwordRequirements.${code}`))
        .join(", ");
      setError(
        t("signup.errors.weakPassword", { requirements }),
      );
      logSecurityEvent("signup_weak_password", { email: formData.email });
      return;
    }

    if (!validateEmail(formData.email)) {
      setError(t("signup.errors.invalidEmail"));
      logSecurityEvent("signup_invalid_email", { email: formData.email });
      return;
    }

    if (!acceptedTerms) {
      return;
    }

    const sanitizedData = {
      name: sanitizeInput(formData.name),
      email: formData.email.toLowerCase().trim(),
      hub: sanitizeInput(formData.hub),
      weforumLink: sanitizeInput(formData.weforumLink),
      password: formData.password,
    };

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: sanitizedData.email,
        password: sanitizedData.password,
      });

      if (authError) {
        logSecurityEvent("signup_auth_failed", {
          email: sanitizedData.email,
          error: authError.message,
        });
        throw authError;
      }

      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: authData.user.id,
            full_name: sanitizedData.name,
            hub: sanitizedData.hub,
            is_approved: false,
          },
        ]);

        if (profileError) {
          logSecurityEvent("signup_profile_failed", {
            email: sanitizedData.email,
            error: profileError.message,
          });
          throw profileError;
        }

        // Email/link do WeForum vivem em profile_contacts (RLS restrita), não em profiles
        const { error: contactError } = await supabase
          .from("profile_contacts")
          .insert([
            {
              user_id: authData.user.id,
              email: sanitizedData.email,
              weforum_link: sanitizedData.weforumLink || null,
            },
          ]);

        if (contactError) {
          logSecurityEvent("signup_contact_failed", {
            email: sanitizedData.email,
            error: contactError.message,
          });
          throw contactError;
        }

        // Garante que o cadastro recém-criado não fique navegando com sessão
        // ativa antes da aprovação — só a tela de Login checa is_approved.
        clearListCaches();
        await supabase.auth.signOut();

        logSecurityEvent("signup_success", { email: sanitizedData.email });
        setSuccessModalOpen(true);
      }
    } catch (err) {
      setError(err.message || t("signup.errors.signupFailed"));
      logSecurityEvent("signup_error", {
        email: sanitizedData.email,
        error: err.message,
      });
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-page-inner">
      <div className="login-side-photo">
        <img
          src={Megafone}
          alt=""
          className="corner-decor corner-decor--top-left"
          data-placeholder="foto-canto"
        />
        <img
          src={Boca}
          alt=""
          className="corner-decor corner-decor--top-right"
          data-placeholder="foto-canto"
        />
        <img
          src={Brain}
          alt=""
          className="corner-decor corner-decor--bottom-left"
          data-placeholder="foto-canto"
        />
        <img
          src={Lupa}
          alt=""
          className="corner-decor corner-decor--bottom-right"
          data-placeholder="foto-canto"
        />

        <div className="brand-wrapper">
          <div className="logo-placeholder">
            <span className="logo-text">GLOBAL SHAPERS</span>
          </div>
          <h1>
            Language <span>Exchange</span>
          </h1>
          <p>"From words to worlds"</p>
        </div>
      </div>

      <div className="login-side-form">
        <div className="form-container">
          <h2>{t("signup.title")}</h2>
          <p className="form-subtitle">
            {t("signup.subtitle")}
          </p>

          {error && <p className="error-message">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>{t("signup.fullNameLabel")}</label>
              <div className="input-wrapper">
                <User size={18} />
                <input
                  className="input"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <p className="form-hint">{t("signup.fullNameHint")}</p>
            </div>

            <div className="input-group">
              <label>{t("signup.emailLabel")}</label>
              <div className="input-wrapper">
                <Mail size={18} />
                <input
                  className="input"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>{t("signup.hubLabel")}</label>
              <div className="input-wrapper">
                <MapPin size={18} />
                <input
                  className="input"
                  name="hub"
                  type="text"
                  value={formData.hub}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>{t("signup.weforumLinkLabel")}</label>
              <div className="input-wrapper">
                <Link2 size={18} />
                <input
                  className="input"
                  name="weforumLink"
                  type="text"
                  value={formData.weforumLink}
                  onChange={handleInputChange}
                />
              </div>
              <p className="form-hint">{t("signup.weforumLinkHint")}</p>
            </div>

            <div className="input-group">
              <label>{t("fields.password")}</label>
              <div className="input-wrapper">
                <Lock size={18} />
                <input
                  className="input"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              {passwordErrors.length > 0 && (
                <div className="password-requirements">
                  <p className="requirement-title">{t("signup.passwordRequirementsTitle")}</p>
                  <ul>
                    <li
                      className={
                        !passwordErrors.includes("minLength")
                          ? "met"
                          : ""
                      }
                    >
                      ✓ {t("passwordRequirements.minLength")}
                    </li>
                    <li
                      className={
                        !passwordErrors.includes("hasLetter")
                          ? "met"
                          : ""
                      }
                    >
                      ✓ {t("passwordRequirements.hasLetter")}
                    </li>
                    <li
                      className={
                        !passwordErrors.includes("hasNumber")
                          ? "met"
                          : ""
                      }
                    >
                      ✓ {t("passwordRequirements.hasNumber")}
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="input-group">
              <label>{t("fields.confirmPassword")}</label>
              <div className="input-wrapper">
                <Lock size={18} />
                <input
                  className="input"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="terms-container">
              <label className="terms-checkbox">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                <span>
                  {t("signup.acceptTermsPrefix")}{" "}
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setIsTermsOpen(true)}
                  >
                    {t("signup.termsLinkText")}
                  </button>
                </span>
              </label>
            </div>

            {!acceptedTerms && (
              <p className="terms-warning">
                {t("signup.termsRequired")}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!acceptedTerms}
            >
              {t("signup.submit")}
            </button>
          </form>
          <p className="signup-prompt">
            {t("signup.hasAccountPrefix")} <Link to="/login">{t("signup.loginLink")}</Link>
          </p>
        </div>
      </div>
      </div>

      {isTermsOpen && (
        <div className="terms-modal-overlay">
          <div className="terms-modal">
            <h3>{t("signup.termsModal.title")}</h3>

            {/* Termos de Uso: ainda hardcoded em PT — texto legal final
                dessa parte não foi entregue nesta fase (só a Política de
                Privacidade), fica pra uma fase futura. */}
            <div className="terms-content">
              <h4>TERMOS DE USO DA PLATAFORMA</h4>
              <p><strong>Versão 1.0 | Maio de 2026</strong></p>

              <h5>APRESENTAÇÃO DA PLATAFORMA</h5>
              <p>
                A Plataforma do Projeto Language Exchange é um ambiente digital colaborativo criado por membros da rede Global Shapers Community, mais especificamente o Hub Florianópolis com a finalidade de promover intercâmbio linguístico e cultural entre seus participantes. A Plataforma possui natureza voluntária, colaborativa, educacional, internacional e sem finalidade lucrativa. Seu objetivo é conectar participantes interessados em ensinar e aprender idiomas reciprocamente, promovendo troca cultural e desenvolvimento pessoal.
              </p>

              <h5>ACEITAÇÃO DOS TERMOS</h5>
              <p>
                Ao realizar cadastro e utilizar a Plataforma, o usuário declara que leu integralmente estes Termos de Uso, compreendeu suas disposições, concorda integralmente com suas regras, possui capacidade legal para utilizar a Plataforma e compromete-se a agir em conformidade com os valores da comunidade Global Shapers. Caso o usuário não concorde com estes Termos, deverá se abster de utilizar a Plataforma.
              </p>

              <h5>ELEGIBILIDADE</h5>
              <p>
                A utilização da Plataforma é restrita a membros ativos da Global Shapers Community, alumnis e participantes autorizados pela equipe gestora do projeto.
              </p>

              <h5>REGRAS DE CONDUTA</h5>
              <p>
                Os usuários comprometem-se a agir com respeito, cordialidade e boa-fé, respeitar diferenças culturais, linguísticas, religiosas, étnicas, políticas e sociais e utilizar a Plataforma exclusivamente para fins compatíveis com sua proposta educacional e comunitária. É expressamente proibido praticar assédio, discriminação ou violência, sob qualquer forma; divulgar conteúdo ofensivo, ilegal ou abusivo; utilizar a Plataforma para fins comerciais; solicitar pagamentos ou vantagens financeiras; compartilhar dados pessoais de terceiros sem autorização; realizar gravações sem consentimento expresso; utilizar a Plataforma para perseguição, spam ou captação indevida de informações.
              </p>

              <hr style={{ margin: "20px 0", borderTop: "1px solid #ddd" }} />

              {/* Política de Privacidade: texto legal final (LGPD), carregado
                  de src/legal/privacy-policy.{lang}.md conforme o idioma
                  atual — ver PrivacyPolicyContent.jsx. Não é mais um resumo
                  hardcoded aqui. */}
              <PrivacyPolicyContent />
            </div>

            <button
              className="close-terms-btn"
              onClick={() => setIsTermsOpen(false)}
            >
              {t("signup.termsModal.close")}
            </button>
          </div>
        </div>
      )}

      {successModalOpen && (
        <div className="info-modal-overlay">
          <div className="info-modal-box dotted-texture">
            <h3>{t("signup.successModal.title")}</h3>
            <p>
              {t("signup.successModal.text")}
            </p>
            <button onClick={() => navigate("/")}>{t("common.gotIt")}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignUp;