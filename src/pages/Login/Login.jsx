import React, { useState } from 'react';
import { Globe, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import './login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      // 1. Tentativa de Login no Auth do Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Erros comuns: senha errada ou usuário não existe
      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          throw new Error('E-mail ou senha incorretos. Verifique e tente novamente.');
        }
        throw authError;
      }

      // 2. Buscar o perfil para checar aprovação
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      // 3. Bloqueio caso não esteja aprovado
      if (!profile.is_approved) {
        await supabase.auth.signOut(); // Desloga pra não deixar sessão aberta
        throw new Error('Sua conta está em análise. Você receberá um aviso assim que for aprovado!');
      }

      // Se passou por tudo, vai pro Dashboard
      navigate('/dashboard');

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-side-blue">
        <div className="brand-wrapper">
          <div className="logo-placeholder">
             <span className="logo-text">GLOBAL SHAPERS</span>
          </div>
          <div className="login-hero-text">
            <h1>Language <span>Exchange</span></h1>
            <p>"From words to worlds"</p>
          </div>
        </div>
        <Globe size={300} className="globe-icon-bg" />
      </div>

      <div className="login-side-form">
        <div className="form-container">
          <h2>Bem-vindo</h2>
          <p className="form-subtitle">Acesse sua conta para começar a praticar.</p>

          {/* Banner de Erro */}
          {errorMsg && (
            <div className="error-banner">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>E-mail</label>
              <div className="input-wrapper">
                <Mail size={18} />
                <input 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <div className="label-row">
                <label>Senha</label>
                <button 
                  type="button" 
                  className="forgot-password-btn"
                  onClick={() => alert('Em breve: Fluxo de recuperação de senha')}
                >
                  Esqueceu?
                </button>
              </div>
              <div className="input-wrapper">
                <Lock size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
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

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="signup-link">Não tem conta? <a href="/signup">Crie uma aqui</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;