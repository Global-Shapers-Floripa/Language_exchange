// Parsing/formatação de speaks/learns no formato "Nome:Nível, Nome" —
// nível é opcional e segue a escala CEFR (A1 a C2).

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

// =========================
// PARSEAR STRING
// =========================
export const parseLanguageString = (str) => {
  if (!str) return [];

  return str
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [name, level] = item.split(":").map((part) => part.trim());
      return {
        name,
        level: level ? level.toUpperCase() : null,
      };
    });
};

// =========================
// FORMATAR STRING
// =========================
export const formatLanguageString = (items) => {
  if (!items || items.length === 0) return "";

  return items
    .map(({ name, level }) => (level ? `${name}:${level}` : name))
    .join(", ");
};

// =========================
// LABEL PARA BADGE
// =========================
// Usado por todo componente que exibe idioma+nível num único badge
// (PartnerCard, PartnerModal, EditProfile, Admin).
export const formatLanguageLabel = ({ name, level }) =>
  level ? `${name} · ${level}` : name;
