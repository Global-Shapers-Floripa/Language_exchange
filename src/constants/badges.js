import {
  Languages,
  Camera,
  CalendarCheck,
  Hourglass,
  MapPin,
  Globe2,
  Users,
  Heart,
  Sparkles,
} from "lucide-react";

// Lista central de definições de insígnias (badges) — cada um descreve só o
// "shape" estático (ícone, cores, se tem níveis, thresholds); o CÁLCULO de
// quem conquistou vive em src/services/badgeService.js, mesma separação de
// src/constants/languages.js (dado) vs. src/services/matchService.js
// (regra). Badges são calculados em cima do estado atual do banco, sem
// tabela de "conquista permanente" — se a condição deixar de ser verdade, o
// badge some.
//
// 'colors' (base/light/dark) alimenta o efeito de broche 3D do medalhão
// (gradiente diagonal + sombra dupla, ver BadgeGrid.css/BadgeWall.css) —
// documentado para os 9 badges da lista completa da plataforma, mesmo os 7
// ainda não implementados, pra não precisar retrabalhar a paleta quando
// entrarem.
//
// Backlog (não implementado ainda, mas a lista completa que a plataforma
// pretende ter): sessionsCount, hoursPracticed, countriesReached,
// continentsReached, connectionsCount, loyalPartner, icebreaker. Cada um vai
// seguir um dos dois formatos abaixo:
// - "levels": true — como Poliglota, com múltiplos thresholds numéricos.
// - "levels": false — binário (tem ou não tem), como Photo Memory; pode ou
//   não ter uma métrica de progresso numérica (ver evaluate*() em
//   badgeService.js: progressCurrent/progressTarget ficam null quando não
//   há fração fazer sentido, e a UI cai pro texto descritivo do badge).
export const BADGES = [
  {
    id: "polyglot",
    icon: Languages,
    hasLevels: true,
    // Thresholds de idiomas distintos praticados em sessões públicas
    // próprias (user_id) — ver badge_polyglot_holders.
    levels: [3, 4, 6],
    colors: { base: "#2E8B8B", light: "#45B5B0", dark: "#1F6B6B" },
  },
  {
    id: "photoMemory",
    icon: Camera,
    hasLevels: false,
    colors: { base: "#E0622F", light: "#f8631e", dark: "#ff4800" },
  },

  // Backlog — não implementados nesta rodada, só documentados (ver acima).
  {
    id: "sessionsCount",
    icon: CalendarCheck,
    hasLevels: true,
    colors: { base: "#C9962B", light: "#E0B54D", dark: "#A3771F" },
  },
  {
    id: "hoursPracticed",
    icon: Hourglass,
    hasLevels: true,
    colors: { base: "#6B4C9A", light: "#8B6BC0", dark: "#523A78" },
  },
  {
    id: "countriesReached",
    icon: MapPin,
    hasLevels: true,
    colors: { base: "#4E7A3E", light: "#6FA858", dark: "#375829" },
  },
  {
    id: "continentsReached",
    icon: Globe2,
    hasLevels: true,
    colors: { base: "#3B5BA5", light: "#5A7DD0", dark: "#2C4380" },
  },
  {
    id: "connectionsCount",
    icon: Users,
    hasLevels: true,
    colors: { base: "#C24B72", light: "#DA6E92", dark: "#983A59" },
  },
  {
    id: "loyalPartner",
    icon: Heart,
    hasLevels: false,
    colors: { base: "#A33636", light: "#C15252", dark: "#7A2828" },
  },
  {
    id: "icebreaker",
    icon: Sparkles,
    hasLevels: false,
    colors: { base: "#2E93B5", light: "#4FB5D6", dark: "#227089" },
  },
];

export const getBadgeDefinition = (id) => BADGES.find((badge) => badge.id === id);
