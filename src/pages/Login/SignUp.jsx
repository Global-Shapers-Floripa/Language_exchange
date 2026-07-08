import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, MapPin, Lock } from "lucide-react";
import "./sign-up.css";
import { supabase } from "../../services/supabaseClient";
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

const SignUp = () => {
  const navigate = useNavigate();
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
      setError("As senhas não coincidem!");
      logSecurityEvent("signup_password_mismatch", { email: formData.email });
      return;
    }

    const passwordValidation = validatePasswordStrength(formData.password);
    if (!passwordValidation.isValid) {
      setError(
        `Senha fraca. Requisitos: ${passwordValidation.errors.join(", ")}`,
      );
      logSecurityEvent("signup_weak_password", { email: formData.email });
      return;
    }

    if (!validateEmail(formData.email)) {
      setError("E-mail inválido. Verifique e tente novamente.");
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

        // Email vive em profile_contacts (RLS restrita), não em profiles
        const { error: contactError } = await supabase
          .from("profile_contacts")
          .insert([
            {
              user_id: authData.user.id,
              email: sanitizedData.email,
            },
          ]);

        if (contactError) {
          logSecurityEvent("signup_contact_failed", {
            email: sanitizedData.email,
            error: contactError.message,
          });
          throw contactError;
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
                  className="input"
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
              <label>Seu Hub (Cidade)</label>
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
              <label>Senha</label>
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
                  Aceito os{" "}
                  <button
                    type="button"
                    className="btn btn-ghost"
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
              className="btn btn-primary"
              disabled={!acceptedTerms}
            >
              Solicitar Acesso
            </button>
          </form>
          <p className="signup-prompt">
            Já tem conta? <Link to="/login">Fazer Login</Link>
          </p>
        </div>
      </div>
      </div>

      {isTermsOpen && (
        <div className="terms-modal-overlay">
          <div className="terms-modal">
            <h3>Termos e Condições de Privacidade</h3>

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

              <h4>POLÍTICA DE PRIVACIDADE E TRATAMENTO DE DADOS PESSOAIS</h4>
              <p><strong>Versão 1.0 | Maio de 2026</strong></p>

              <h5>PREÂMBULO</h5>
              <p>
                Esta Política de Privacidade e Tratamento de Dados Pessoais descreve como o Global Shapers Florianópolis (Hub Florianópolis), responsável pelo Projeto Language Exchange, coleta, utiliza, armazena, compartilha e protege os dados pessoais dos usuários da Plataforma. O Hub Florianópolis atua como Controlador dos Dados Pessoais nos termos da Lei Geral de Proteção de Dados Pessoais (LGPD - Lei no 13.709/2018).
              </p>

              <h5>DADOS PESSOAIS COLETADOS</h5>
              <p>O Hub Florianópolis coleta as seguintes categorias de dados pessoais:</p>
              <ul>
                <li><strong>Dados para fins de Identificação e Cadastro:</strong> Nome completo; Endereço de e-mail; País e cidade de residência; Foto de perfil; Data de nascimento (para verificação de elegibilidade etária); Informações de perfil relacionadas à comunidade Global Shapers (Hub do qual participa).</li>
                <li><strong>Dados para fins Linguísticos e Educacionais:</strong> Idiomas falados (nativos ou fluentes) e respectivos níveis de proficiência; Idiomas que o Usuário deseja aprender; Disponibilidade de horários; Histórico de sessões realizadas (datas, duração, Par Linguístico).</li>
              </ul>

              <h5>COMPARTILHAMENTO DE DADOS</h5>
              <p>
                O Hub Florianópolis poderá compartilhar dados pessoais dos usuários nas seguintes hipóteses: Com outros usuários (Para fins de formação de pares linguísticos); Com Prestadores de Serviço (Operadores); Com a Rede Global Shapers/Fórum Econômico Mundial; e Por Determinação Legal ou Judicial.
              </p>

              <h5>DIREITOS DOS TITULARES DE DADOS</h5>
              <p>
                O Usuário poderá exercer seus direitos gratuitamente, a qualquer momento, por meio do e-mail globalshapersflorianopolis@gmail.com. Dúvidas, solicitações ou denúncias poderão ser encaminhadas à equipe administradora da Plataforma pelos canais oficiais do projeto.
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
        <div className="info-modal-overlay">
          <div className="info-modal-box dotted-texture">
            <h3>Conta criada com sucesso 🎉</h3>
            <p>
              Sua solicitação foi enviada para o Hub. Agora é só aguardar a
              aprovação: você vai receber um e-mail avisando assim que sua
              conta for aprovada e liberada para acesso à plataforma.
            </p>
            <button onClick={() => navigate("/")}>Entendi</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignUp;