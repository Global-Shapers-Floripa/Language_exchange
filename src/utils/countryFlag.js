// Monta a URL da imagem de bandeira (flagcdn.com) a partir de um código de
// país ISO de 2 letras (ex: "BR"). Preferido a emoji de bandeira porque
// Windows não renderiza esses emojis (mostra as duas letras do código).
export const getFlagUrl = (code) => {
  if (!code || code.trim().length !== 2) return null;

  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
};
