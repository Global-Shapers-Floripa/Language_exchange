// Lista de idiomas pré-definidos para o sistema
export const LANGUAGES = [
  { code: 'pt', name: 'Português' },
  { code: 'en', name: 'Inglês' },
  { code: 'es', name: 'Espanhol' },
  { code: 'fr', name: 'Francês' },
  { code: 'de', name: 'Alemão' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: 'Japonês' },
  { code: 'zh', name: 'Chinês' },
  { code: 'ko', name: 'Coreano' },
  { code: 'ru', name: 'Russo' },
  { code: 'ar', name: 'Árabe' },
  { code: 'nl', name: 'Holandês' },
  { code: 'pl', name: 'Polonês' },
  { code: 'tr', name: 'Turco' },
  { code: 'sv', name: 'Sueco' },
  { code: 'no', name: 'Norueguês' },
  { code: 'dk', name: 'Dinamarquês' },
  { code: 'fi', name: 'Finlandês' },
  { code: 'hu', name: 'Húngaro' },
  { code: 'cz', name: 'Tcheco' },
  { code: 'gr', name: 'Grego' },
  { code: 'he', name: 'Hebraico' },
  { code: 'hi', name: 'Hindi' },
  { code: 'th', name: 'Tailandês' },
  { code: 'vi', name: 'Vietnamita' },

  // Novos idiomas
  { code: 'uk', name: 'Ucraniano' },
  { code: 'ro', name: 'Romeno' },
  { code: 'bg', name: 'Búlgaro' },
  { code: 'sr', name: 'Sérvio' },
  { code: 'hr', name: 'Croata' },
  { code: 'sk', name: 'Eslovaco' },
  { code: 'sl', name: 'Esloveno' },
  { code: 'et', name: 'Estoniano' },
  { code: 'lv', name: 'Letão' },
  { code: 'lt', name: 'Lituano' },

  { code: 'id', name: 'Indonésio' },
  { code: 'ms', name: 'Malaio' },
  { code: 'tl', name: 'Tagalo' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ur', name: 'Urdu' },
  { code: 'fa', name: 'Persa' },
  { code: 'ps', name: 'Pashto' },

  { code: 'sw', name: 'Suaíli' },
  { code: 'am', name: 'Amárico' },
  { code: 'zu', name: 'Zulu' },
  { code: 'af', name: 'Africâner' },

  { code: 'ca', name: 'Catalão' },
  { code: 'eu', name: 'Basco' },
  { code: 'gl', name: 'Galego' },
  { code: 'ga', name: 'Irlandês' },
  { code: 'cy', name: 'Galês' },
  { code: 'is', name: 'Islandês' },
  { code: 'mt', name: 'Maltês' },
  { code: 'sq', name: 'Albanês' },
  { code: 'mk', name: 'Macedônio' },

  { code: 'hy', name: 'Armênio' },
  { code: 'ka', name: 'Georgiano' },
  { code: 'az', name: 'Azerbaijano' },
  { code: 'kk', name: 'Cazaque' },
  { code: 'uz', name: 'Uzbeque' },
  { code: 'mn', name: 'Mongol' },

  { code: 'ta', name: 'Tâmil' },
  { code: 'te', name: 'Telugu' },
  { code: 'ml', name: 'Malaiala' },
  { code: 'kn', name: 'Canarês' },
  { code: 'mr', name: 'Marata' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'pa', name: 'Punjabi' },

  { code: 'ne', name: 'Nepalês' },
  { code: 'si', name: 'Cingalês' },
  { code: 'km', name: 'Khmer' },
  { code: 'lo', name: 'Lao' },
  { code: 'my', name: 'Birmanês' },

  { code: 'eo', name: 'Esperanto' },
  { code: 'la', name: 'Latim' },
  { code: 'zh-cn', name: 'Mandarim' },
];

export const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// profiles.speaks/profiles.learns armazenam o NOME em português (não o
// code) — ver CLAUDE.md. Esse helper acha o code a partir do nome já salvo,
// pra poder traduzir a exibição sem tocar no valor armazenado/comparado
// pelo matchService.
export const getLanguageCodeByName = (name) =>
  LANGUAGES.find((lang) => lang.name === name)?.code;
