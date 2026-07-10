import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { supabase } from "../../services/supabaseClient";

import "./reset-password.css";

const ResetPassword = () => {
  const { t } = useTranslation("auth");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError(t("resetPassword.errors.mismatch"));
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setSuccessModalOpen(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <div className="form-container">
        <h2>{t("resetPassword.title")}</h2>
        <p className="form-subtitle">
          {t("resetPassword.subtitle")}
        </p>

        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleResetPassword}>
          <div className="input-group">
            <label>{t("resetPassword.newPasswordLabel")}</label>
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

          <div className="input-group">
            <label>{t("resetPassword.confirmPasswordLabel")}</label>
            <div className="input-wrapper">
              <Lock size={18} />
              <input
                className="input"
                type={showPassword ? "text" : "password"}
                placeholder={t("fields.passwordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t("resetPassword.submitting") : t("resetPassword.submit")}
          </button>
        </form>

        <p className="back-to-login">
          {t("resetPassword.rememberedPrefix")} <Link to="/login">{t("resetPassword.backToLoginLink")}</Link>
        </p>
      </div>

      {successModalOpen && (
        <div className="info-modal-overlay">
          <div className="info-modal-box dotted-texture">
            <h3>{t("resetPassword.successModal.title")}</h3>
            <p>{t("resetPassword.successModal.text")}</p>
            <button onClick={() => navigate("/login")}>{t("common.gotIt")}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetPassword;
