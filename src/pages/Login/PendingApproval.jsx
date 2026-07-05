import { Clock3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./pending-approval.css";

const PendingApproval = () => {
  const navigate = useNavigate();

  return (
    <div className="pending-page">
      <div className="card card--pending pending-card">
        <div className="pending-icon">
          <Clock3 size={70} />
        </div>

        <h1>Solicitação em análise</h1>

        <p>
          Sua conta foi criada com sucesso e está aguardando aprovação
          dos administradores da plataforma.
        </p>

        <p className="pending-subtext">
          Você receberá um email de aprovação quando sua solicitação for revisada.
        </p>

        <button className="btn btn-primary" onClick={() => navigate("/login")}>
          Voltar para login
        </button>
      </div>
    </div>
  );
};

export default PendingApproval;