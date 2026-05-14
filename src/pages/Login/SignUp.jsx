import React, { useState } from "react";
import {
  User,
  Mail,
  MapPin,
  Languages,
  Lock,
  MessageSquare,
} from "lucide-react";
import "./sign-up.css";
import { supabase } from "../../services/supabaseClient";
import { 
  validatePasswordStrength, 
  sanitizeInput, 
  validateEmail,
  logSecurityEvent 
} from "../../utils/securityUtils";

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    hub: "",
    speaks: "",
    learns: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Bloqueia números nos campos de Nome e Idiomas usando Regex
    if (name === "name" || name === "speaks" || name === "learns") {
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
      setError(`Senha fraca. Requisitos: ${passwordValidation.errors.join(", ")}`);
      logSecurityEvent("signup_weak_password", { email: formData.email });
      return;
    }

    // Validação: email válido
    if (!validateEmail(formData.email)) {
      setError("E-mail inválido. Verifique e tente novamente.");
      logSecurityEvent("signup_invalid_email", { email: formData.email });
      return;
    }

    // Sanitizar inputs antes de enviar
    const sanitizedData = {
      name: sanitizeInput(formData.name),
      email: formData.email.toLowerCase().trim(),
      hub: sanitizeInput(formData.hub),
      speaks: sanitizeInput(formData.speaks),
      learns: sanitizeInput(formData.learns),
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
          error: authError.message 
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
            speaks: sanitizedData.speaks,
            learns: sanitizedData.learns,
            is_approved: false,
          },
        ]);

        if (profileError) {
          logSecurityEvent("signup_profile_failed", { 
            email: sanitizedData.email, 
            error: profileError.message 
          });
          throw profileError;
        }

        logSecurityEvent("signup_success", { email: sanitizedData.email });
        alert(
          "Solicitação enviada! Verifique o seu e-mail para confirmar a conta (se habilitado) ou aguarde a aprovação do Hub.",
        );
      }
    } catch (err) {
      setError(err.message || "Ocorreu um erro ao criar a conta.");
      logSecurityEvent("signup_error", { 
        email: sanitizedData.email, 
        error: err.message 
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

            <div className="languages-row">
              <div className="input-group">
                <label>Idiomas que fala</label>
                <div className="input-wrapper">
                  <Languages size={18} />
                  <input
                    name="speaks"
                    type="text"
                    value={formData.speaks}
                    onChange={handleInputChange}
                    placeholder="Ex: Português"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Idiomas que quer aprender</label>
                <div className="input-wrapper">
                  <MessageSquare size={18} />
                  <input
                    name="learns"
                    type="text"
                    value={formData.learns}
                    onChange={handleInputChange}
                    placeholder="Ex: Inglês"
                    required
                  />
                </div>
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
                    <li className={!passwordErrors.includes('Mínimo de 8 caracteres') ? 'met' : ''}>
                      ✓ Mínimo de 8 caracteres
                    </li>
                    <li className={!passwordErrors.includes('Pelo menos uma letra maiúscula') ? 'met' : ''}>
                      ✓ Pelo menos uma letra maiúscula
                    </li>
                    <li className={!passwordErrors.includes('Pelo menos uma letra minúscula') ? 'met' : ''}>
                      ✓ Pelo menos uma letra minúscula
                    </li>
                    <li className={!passwordErrors.includes('Pelo menos um número') ? 'met' : ''}>
                      ✓ Pelo menos um número
                    </li>
                    <li className={!passwordErrors.includes('Pelo menos um caractere especial (!@#$%^&*)') ? 'met' : ''}>
                      ✓ Pelo menos um caractere especial (!@#$%^&*)
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

            <button type="submit" className="btn-signup">
              Solicitar Acesso
            </button>
          </form>
          <p className="signup-prompt">
            Já tem conta? <a href="/login">Fazer Login</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
