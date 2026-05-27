import { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

import './reset-password.css';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    try {
      setLoading(true);

      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) throw error;

      alert('Senha alterada com sucesso!');

      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <form onSubmit={handleResetPassword}>
        <h2>Nova senha</h2>

        {error && <p>{error}</p>}

        <input
          type="password"
          placeholder="Nova senha"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <input
          type="password"
          placeholder="Confirmar senha"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(
              e.target.value,
            )
          }
        />

        <button type="submit">
          {loading
            ? 'Alterando...'
            : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;