// Validação de força de senha
export const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Mínimo de 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Pelo menos uma letra minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Pelo menos um número');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Pelo menos um caractere especial (!@#$%^&*)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: 5 - errors.length
  };
};

// Sanitização básica de strings
export const sanitizeInput = (input) => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove tags HTML
    .slice(0, 255); // Limita tamanho
};

// Validação de email
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Rate limiting simples no cliente (armazenar tentativas)
const loginAttempts = {};

export const checkRateLimit = (email, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const now = Date.now();
  
  if (!loginAttempts[email]) {
    loginAttempts[email] = [];
  }
  
  // Remove tentativas fora da janela de tempo
  loginAttempts[email] = loginAttempts[email].filter(
    timestamp => now - timestamp < windowMs
  );
  
  if (loginAttempts[email].length >= maxAttempts) {
    return {
      allowed: false,
      remainingTime: Math.ceil((loginAttempts[email][0] + windowMs - now) / 1000)
    };
  }
  
  loginAttempts[email].push(now);
  
  return { allowed: true };
};

// Reset de rate limit (após login bem-sucedido)
export const resetRateLimit = (email) => {
  delete loginAttempts[email];
};

// Log de eventos de segurança
export const logSecurityEvent = (eventType, details) => {
  const timestamp = new Date().toISOString();
  const event = {
    type: eventType,
    timestamp,
    details,
    userAgent: navigator.userAgent,
  };
  
  // Em produção, enviar para um serviço de logging
  console.log('[SECURITY EVENT]', event);
  
  // Opcional: armazenar no localStorage para auditoria
  try {
    const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
    logs.push(event);
    // Manter apenas os últimos 100 eventos
    localStorage.setItem('securityLogs', JSON.stringify(logs.slice(-100)));
  } catch (err) {
    console.error('Erro ao registrar evento de segurança', err);
  }
};
