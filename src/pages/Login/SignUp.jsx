import React, { useState } from "react";
import { User, Mail, MapPin, Lock } from "lucide-react";
import "./sign-up.css";
import { supabase } from "../../services/supabaseClient";
import {
  validatePasswordStrength,
  sanitizeInput,
  validateEmail,
  logSecurityEvent,
} from "../../utils/securityUtils";

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    hub: "",
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

    // Bloqueia números no campo de Nome usando Regex
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

    // Validar força de senha em tempo real
    if (name === "password") {
      const validation = validatePasswordStrength(value);
      setPasswordErrors(validation.errors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validação: senhas coincidem
    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem!");
      logSecurityEvent("signup_password_mismatch", { email: formData.email });
      return;
    }

    // Validação: força da senha
    const passwordValidation = validatePasswordStrength(formData.password);
    if (!passwordValidation.isValid) {
      setError(
        `Senha fraca. Requisitos: ${passwordValidation.errors.join(", ")}`,
      );
      logSecurityEvent("signup_weak_password", { email: formData.email });
      return;
    }

    // Validação: email válido
    if (!validateEmail(formData.email)) {
      setError("E-mail inválido. Verifique e tente novamente.");
      logSecurityEvent("signup_invalid_email", { email: formData.email });
      return;
    }

    // Validação dos termos
    {
      !acceptedTerms && (
        <p className="terms-warning">
          Você precisa aceitar os termos e condições para continuar.
        </p>
      );
    }

    // Sanitizar inputs antes de enviar
    const sanitizedData = {
      name: sanitizeInput(formData.name),
      email: formData.email.toLowerCase().trim(),
      hub: sanitizeInput(formData.hub),
      password: formData.password,
    };

    try {
      // 1. Criar o usuário no Auth do Supabase
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

      // 2. Se o usuário foi criado, salvar os dados extras na tabela profiles
      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: authData.user.id,
            full_name: sanitizedData.name,
            email: sanitizedData.email,
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

        logSecurityEvent("signup_success", { email: sanitizedData.email });
        setSuccessModalOpen(true);
      }
    } catch (err) {
      setError(err.message || "Ocorreu um erro ao criar a conta.");
      logSecurityEvent("signup_error", {
        email: sanitizedData.email,
        error: err.message,
      });
    }
  };

  return (
    <div className="signup-page">
      <div className="login-side-blue">
        <div className="brand-wrapper">
          <h1>
            Language <span>Exchange</span>
          </h1>
          <p>"From words to worlds"</p>
        </div>
      </div>

      <div className="login-side-form">
        <div className="form-container">
          <h2>Criar Conta</h2>
          <p className="form-subtitle">
            Preencha os dados para solicitar acesso.
          </p>

          {error && <p className="error-message">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Nome Completo</label>
              <div className="input-wrapper">
                <User size={18} />
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>E-mail Acadêmico / Profissional</label>
              <div className="input-wrapper">
                <Mail size={18} />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Seu Hub (Cidade)</label>
              <div className="input-wrapper">
                <MapPin size={18} />
                <input
                  name="hub"
                  type="text"
                  value={formData.hub}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Senha</label>
              <div className="input-wrapper">
                <Lock size={18} />
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              {passwordErrors.length > 0 && (
                <div className="password-requirements">
                  <p className="requirement-title">Requisitos de senha:</p>
                  <ul>
                    <li
                      className={
                        !passwordErrors.includes("Mínimo de 8 caracteres")
                          ? "met"
                          : ""
                      }
                    >
                      ✓ Mínimo de 8 caracteres
                    </li>

                    <li
                      className={
                        !passwordErrors.includes("Pelo menos uma letra")
                          ? "met"
                          : ""
                      }
                    >
                      ✓ Pelo menos uma letra
                    </li>

                    <li
                      className={
                        !passwordErrors.includes("Pelo menos um número")
                          ? "met"
                          : ""
                      }
                    >
                      ✓ Pelo menos um número
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="input-group">
              <label>Confirmar Senha</label>
              <div className="input-wrapper">
                <Lock size={18} />
                <input
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
                  Aceito os{" "}
                  <button
                    type="button"
                    className="terms-link"
                    onClick={() => setIsTermsOpen(true)}
                  >
                    termos e condições de privacidade
                  </button>
                </span>
              </label>
            </div>

            {!acceptedTerms && (
              <p className="terms-warning">
                Aceite os termos e condições para continuar.
              </p>
            )}

            <button
              type="submit"
              className={`btn-signup ${!acceptedTerms ? "disabled" : ""}`}
              disabled={!acceptedTerms}
            >
              Solicitar Acesso
            </button>
          </form>
          <p className="signup-prompt">
            Já tem conta? <a href="/login">Fazer Login</a>
          </p>
        </div>
      </div>

      {isTermsOpen && (
        <div className="terms-modal-overlay">
          <div className="terms-modal">
            <h3>Termos e Condições de Privacidade</h3>

            <div className="terms-content">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>

              <p>
                Ut enim ad minim veniam, quis nostrud exercitation ullamco
                laboris nisi ut aliquip ex ea commodo consequat.
              </p>

              <p>
                Duis aute irure dolor in reprehenderit in voluptate velit esse
                cillum dolore eu fugiat nulla pariatur.
              </p>
            </div>

            <button
              className="close-terms-btn"
              onClick={() => setIsTermsOpen(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {successModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Conta criada com sucesso 🎉</h3>

            <p>
              Sua solicitação foi enviada para o Hub. Você poderá acessar a
              plataforma assim que sua conta for aprovada.
            </p>

            <button onClick={() => setSuccessModalOpen(false)}>Entendi</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignUp;