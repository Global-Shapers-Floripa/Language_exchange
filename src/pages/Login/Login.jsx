import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  checkRateLimit,
  resetRateLimit,
  logSecurityEvent,
} from "../../utils/securityUtils";
import Brain from "../../assets/brain.png";
import Lupa from "../../assets/lupa.png";
import Megafone from "../../assets/megafone.png";
import Boca from "../../assets/boca.png";
import "./login.css";

const Login = () => {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetEmailModalOpen, setResetEmailModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // Verificar rate limiting
      const rateLimit = checkRateLimit(email);
      if (!rateLimit.allowed) {
        const minutes = Math.ceil(rateLimit.remainingTime / 60);
        throw new Error(
          t("login.errors.tooManyAttempts", { minutes }),
        );
      }

      // 1. Tentativa de Login no Auth do Supabase
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      // Erros comuns: senha errada ou usuário não existe
      if (authError) {
        logSecurityEvent("login_failed", {
          email,
          reason: authError.message,
        });

        if (authError.message === "Invalid login credentials") {
          throw new Error(
            t("login.errors.invalidCredentials"),
          );
        }
        throw authError;
      }

      // 2. Buscar o perfil para checar aprovação
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_approved")
        .eq("id", authData.user.id)
        .single();

      if (profileError) throw profileError;

      // 3. Bloqueio caso não esteja aprovado
      if (!profile.is_approved) {
        await supabase.auth.signOut();

        logSecurityEvent("login_pending_approval", { email });

        navigate("/pending-approval");
        return;
      }

      // Login bem-sucedido
      resetRateLimit(email);
      logSecurityEvent("login_success", { email });

      // Se passou por tudo, vai pro Dashboard
      navigate("/dashboard");
    } catch (err) {
      setErrorMsg(err.message);
      logSecurityEvent("login_error", {
        email,
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg(t("login.errors.emailRequired"));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      logSecurityEvent("password_reset_requested", { email });
      setErrorMsg(""); // Limpar erro anterior
      setResetEmailModalOpen(true);
    } catch (err) {
      logSecurityEvent("password_reset_failed", {
        email,
        error: err.message,
      });
      setErrorMsg(t("login.errors.resetLinkFailed", { message: err.message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page-inner">
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
          <div className="login-hero-text">
            <h1>
              Language <span>Exchange</span>
            </h1>
            <p>"From words to worlds"</p>
          </div>
        </div>
      </div>

      <div className="login-side-form">
        <div className="form-container">
          <h2>{t("login.title")}</h2>
          <p className="form-subtitle">
            {t("login.subtitle")}
          </p>

          {/* Banner de Erro */}
          {errorMsg && (
            <div className="error-banner">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>{t("fields.email")}</label>
              <div className="input-wrapper">
                <Mail size={18} />
                <input
                  className="input"
                  type="email"
                  placeholder={t("fields.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <div className="label-row">
                <label>{t("fields.password")}</label>
                <button
                  type="button"
                  className="forgot-password-btn"
                  onClick={handleForgotPassword}
                  disabled={loading}
                >
                  {t("login.forgotPassword")}
                </button>
              </div>
              <div className="input-wrapper">
                <Lock size={18} />
                <input
                  className="input"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("fields.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t("login.submitting") : t("login.submit")}
            </button>
          </form>

        <p className="signup-link">
  {t("login.noAccountPrefix")} <Link to="/signup">{t("login.createAccountLink")}</Link>
</p>
        </div>
      </div>
      </div>

      {resetEmailModalOpen && (
        <div className="info-modal-overlay">
          <div className="info-modal-box dotted-texture">
            <h3>{t("login.resetEmailModal.title")}</h3>
            <p>
              {t("login.resetEmailModal.text")}
            </p>
            <button onClick={() => setResetEmailModalOpen(false)}>
              {t("common.gotIt")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
