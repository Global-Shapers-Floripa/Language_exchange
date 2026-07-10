import { Clock3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./pending-approval.css";

const PendingApproval = () => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();

  return (
    <div className="pending-page dotted-texture">
      <div className="card card--pending pending-card">
        <div className="pending-title-row">
          <Clock3 size={26} className="pending-icon" />
          <h1>{t("pendingApproval.title")}</h1>
        </div>

        <p>
          {t("pendingApproval.text")}
        </p>

        <p className="pending-subtext">
          {t("pendingApproval.subtext")}
        </p>

        <button className="btn btn-primary" onClick={() => navigate("/login")}>
          {t("pendingApproval.backToLogin")}
        </button>
      </div>
    </div>
  );
};

export default PendingApproval;