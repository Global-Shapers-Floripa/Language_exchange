// 'name' é o valor armazenado em profiles.interests (string separada por
// vírgula, sem tradução) — 'code' existe só pra servir de chave de tradução
// em src/i18n/locales/*/constants.json (ver getInterestCodeByName).
export const INTERESTS = [
  { code: "technology", name: "Tecnologia" },
  { code: "design", name: "Design" },
  { code: "programming", name: "Programação" },
  { code: "uxUi", name: "UX/UI" },
  { code: "ai", name: "IA" },
  { code: "business", name: "Negócios" },
  { code: "startups", name: "Startups" },
  { code: "marketing", name: "Marketing" },
  { code: "languages", name: "Idiomas" },
  { code: "travel", name: "Viagens" },
  { code: "music", name: "Música" },
  { code: "movies", name: "Cinema" },
  { code: "photography", name: "Fotografia" },
  { code: "reading", name: "Leitura" },
  { code: "sports", name: "Esportes" },
  { code: "games", name: "Games" },
];

export const getInterestCodeByName = (name) =>
  INTERESTS.find((interest) => interest.name === name)?.code;