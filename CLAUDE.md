# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Language Exchange — a web platform (in Portuguese) connecting people who want to practice languages with each other. Users sign up, get approved by an admin, build a profile (languages spoken/learned, country, hub), get matched with compatible partners, and log practice sessions. There's a public marketing landing page plus an authenticated dashboard area.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint (flat config, `eslint.config.js`)

No test suite is configured in this repo.

Supabase Edge Functions live under `supabase/functions/` (Deno runtime) and are deployed independently via the Supabase CLI — they are not built/bundled by Vite.

## Architecture

**Stack:** React 19 + Vite, `react-router-dom` for routing, Supabase (Postgres + Auth + Edge Functions) as the sole backend, plain CSS per component/page (no CSS framework), `lucide-react` for icons, `sweetalert2` for alert dialogs, `react-globe.gl` for the landing page globe visual.

**No global state library / no Context for auth.** Every page/component that needs the current user calls `supabase.auth.getUser()` directly and fetches its own profile row from the `profiles` table. `src/hooks/useCache.js` provides a very small in-memory (non-reactive) cache for the last fetched user/profile to avoid redundant fetches — it's a module-level variable, not a hook with state.

**Routing** is defined directly in `src/App.jsx` (flat list of `<Route>`s), not in `src/routes/index.jsx` (that file is currently unused/empty). There is no client-side route guard component — auth/approval checks happen ad hoc inside each page (e.g. `DashboardLayout` redirects to `/login` if `supabase.auth.getUser()` returns no user; `Login.jsx` redirects to `/pending-approval` if `profiles.is_approved` is false).

**Data access pattern:** no API/service layer abstraction beyond `src/services/supabaseClient.js` (the Supabase client singleton) and `src/services/matchService.js` (match-scoring logic). Most pages and hooks query Supabase tables directly with `supabase.from(...)`. When adding data fetching, follow the existing convention rather than introducing a new repository/service pattern.

**Matching logic** lives in `src/services/matchService.js` (`calculateMatch`, `getMatches`) and is duplicated inline in `src/hooks/usePartners.js`. Both compare comma-separated `speaks`/`learns` strings on the `profiles` table. If you change the matching algorithm, update both places (or take the opportunity to de-duplicate into one).

**Database:** Supabase Postgres. `profiles` is the core table (joined to `auth.users`), gated by an `is_approved` boolean that controls login. `sessions` (practice session logs) is defined in `DATABASE_SETUP.sql` with RLS policies scoping rows to `auth.uid() = user_id`. `connection_requests` (`sender_id`/`receiver_id`/`status`: `pendente`/`aceito`/`rejeitado`) and `profile_contacts` (`email`/`phone`, keyed by `user_id` referencing `profiles.id`) exist in the DB but, like `profiles` itself, were never created via a tracked migration — their RLS policies are captured after the fact in `CONNECTION_REQUESTS_POLICIES.sql` and `PROFILE_CONTACTS_MIGRATION.sql` at the repo root. There's no migrations folder — schema changes are tracked as ad hoc SQL files at the repo root and applied manually via the Supabase SQL editor. Language/country/interest lookup data is hardcoded in `src/constants/`, not stored in the DB.

**Connection requests & contact privacy:** `email`/`phone` used to live directly on `profiles`, which has a public-read RLS policy (needed so the partner grid/search works) — that accidentally exposed contact info to any direct Supabase API call. They now live in a separate `profile_contacts` table (see `PROFILE_CONTACTS_MIGRATION.sql`) with RLS limiting `SELECT` to: the row's own owner, an admin (`profiles.is_admin = true`), or a user with an `aceito` row in `connection_requests` linking the two ids (checked in both directions). `PartnerModal.jsx` fetches `profile_contacts` on demand only once a connection is accepted, rather than the partner grid prefetching everyone's contact info. The modal has two modes sharing the same profile-display markup: default (`mode="connect"`, browsing a partner — send/cancel a request) and `mode="review"` (reviewing an incoming request — accept/reject). Sending a request auto-accepts as a mutual match instead of creating a second row if the other person already has a pending request to you. Every `.delete()`/`.update()` in this flow re-requests the affected rows via `.select()` and checks the array isn't empty before treating it as success — Supabase/RLS returns an empty result (no error) when a write is silently blocked by policy, so checking `error` alone isn't reliable.

**FindPartners page** (`src/pages/FindPartners/Parceiros.jsx`) tracks three pieces of connection state client-side — `sentRequests`, `receivedRequests` (both exclude `aceito` rows), and `connections` (accepted rows from either direction, each carrying an `otherProfile` field) — kept in sync via a shared `handleConnectionChange` callback instead of refetching after every action. The page renders pending "Enviadas"/"Recebidas" lists below a full-width "Minhas Conexões" grid.

**Edge Functions:** `supabase/functions/send-approval-email` (Deno) is meant to email users when an admin approves them; the actual email-sending code is currently commented out (returns success without sending). Config lives in `supabase/config.toml`.

**Environment variables:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`, read via `import.meta.env` in `supabaseClient.js`. The client throws at import time if either is missing.

## Structure

- `src/pages/<Feature>/` — one folder per route/feature, each with a JSX component and a matching lowercase `.css` file (e.g. `Login/Login.jsx` + `Login/login.css`)
- `src/components/common/` — reusable widgets shared across pages (modals, selects)
- `src/components/common/PersonAvatar.jsx` — the only place a person's photo should be rendered: shows `photo_url` if set, otherwise a deterministic DiceBear "thumbs" placeholder seeded by user id. Every avatar in the app (partner cards/modal, dashboard header, admin table/modal, profile editor, connections lists) goes through this component, so a future style change touches one file instead of six.
- `src/components/layout/DashboardLayout.jsx` — sidebar + header shell wrapping all authenticated pages; pages pass their content as `children`
- `src/hooks/` — data-fetching hooks (`usePartners`, `useSessions`, `useAddSession`) that encapsulate a Supabase query + loading/error state
- `src/constants/` — static lookup data (countries, languages, interests)
- `src/utils/securityUtils.js` — client-side password validation, input sanitization, a client-only login rate limiter (keyed in memory, not persisted server-side), and a security event logger that writes to `console` and `localStorage`
- `src/utils/countryFlag.js` — `getFlagUrl(code)` builds a flagcdn.com image URL from a 2-letter country code; flags are rendered as `<img>`, not emoji, because Windows doesn't render flag emoji (shows the raw letters instead)

## Conventions

- Comments and UI copy are in Portuguese; code identifiers (variables, functions) are in English.
- Async Supabase calls consistently use `try/catch/finally` with `loading`/`error` state and `console.error` on failure — no thrown errors bubble to a global error boundary.
- Section dividers like `// =========================` / `// LABEL` / `// =========================` are used throughout hooks/services/components to break up logical blocks (data fetch, formatting, handlers, etc.). Match this style when adding sizeable new blocks in similar files.
- `speaks`/`learns`/`interests` are stored as comma-separated strings on `profiles`, not arrays or join tables — parsed with `.split(",").map(s => s.trim())` wherever needed.
- Each page/component imports its own CSS file directly (`import "./thing.css"`); there's no CSS-in-JS or shared design-token file beyond `src/index.css`/`src/App.css`.

## Preferências de trabalho

- Não usar Playwright nem tirar screenshots para conferir mudanças visuais/CSS. 
  Fazer ajustes de estilo direto no código, sem verificação visual automatizada.
- Se precisar confirmar algo visualmente, perguntar antes em vez de instalar 
  ferramentas de screenshot/automação de navegador.