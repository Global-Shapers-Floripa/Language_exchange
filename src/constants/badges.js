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
// (gradiente diagonal + sombra dupla, ver BadgeGrid.css/BadgeWall.css).
//
// Dois formatos de badge:
// - "hasLevels: true" — como Poliglota/Praticante/Dedicação, com múltiplos
//   thresholds numéricos em 'levels' (array).
// - "hasLevels: false" — binário (tem ou não tem). Photo Memory não tem
//   métrica de progresso (progressCurrent/progressTarget ficam null, a UI
//   cai pro texto descritivo do badge — ver evaluate*() em badgeService.js);
//   Parceiro Fiel/Quebra-Gelo TÊM uma métrica numérica de progresso mesmo
//   sendo binários (um só 'threshold', não um array de níveis).
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
  {
    id: "sessionsCount",
    icon: CalendarCheck,
    hasLevels: true,
    // Thresholds de sessões públicas próprias (user_id) — ver
    // badge_sessions_count_holders.
    levels: [1, 5, 10, 25],
    colors: { base: "#C9962B", light: "#E0B54D", dark: "#A3771F" },
  },
  {
    id: "hoursPracticed",
    icon: Hourglass,
    hasLevels: true,
    // Thresholds em HORAS (badge_hours_practiced_holders devolve minutos —
    // a conversão é feita em badgeService.js/evaluateHoursPracticed).
    levels: [10, 25, 50],
    colors: { base: "#6B4C9A", light: "#8B6BC0", dark: "#523A78" },
  },
  {
    id: "loyalPartner",
    icon: Heart,
    hasLevels: false,
    // Threshold único (não é um array de níveis): sessões públicas com a
    // MESMA pessoa (dono OU parceiro, nas duas direções) — ver
    // badge_partner_stats.
    threshold: 5,
    colors: { base: "#A33636", light: "#C15252", dark: "#7A2828" },
  },
  {
    id: "icebreaker",
    icon: Sparkles,
    hasLevels: false,
    // Threshold único: parceiros distintos (dono OU parceiro, nas duas
    // direções) — ver badge_partner_stats.
    threshold: 10,
    colors: { base: "#2E93B5", light: "#4FB5D6", dark: "#227089" },
  },

  // Backlog — não implementados ainda, só documentados (mesmo raciocínio
  // de paleta pronta de antemão).
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
];

export const getBadgeDefinition = (id) => BADGES.find((badge) => badge.id === id);
