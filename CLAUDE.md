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

**Database:** Supabase Postgres. `profiles` is the core table (joined to `auth.users`), gated by an `is_approved` boolean that controls login. `sessions` (practice session logs) is defined in `DATABASE_SETUP.sql` with RLS policies scoping rows to `auth.uid() = user_id`. There's no migrations folder — schema changes are tracked as ad hoc SQL files at the repo root and applied manually via the Supabase SQL editor. Language/country/interest lookup data is hardcoded in `src/constants/`, not stored in the DB.

**Edge Functions:** `supabase/functions/send-approval-email` (Deno) is meant to email users when an admin approves them; the actual email-sending code is currently commented out (returns success without sending). Config lives in `supabase/config.toml`.

**Environment variables:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`, read via `import.meta.env` in `supabaseClient.js`. The client throws at import time if either is missing.

## Structure

- `src/pages/<Feature>/` — one folder per route/feature, each with a JSX component and a matching lowercase `.css` file (e.g. `Login/Login.jsx` + `Login/login.css`)
- `src/components/common/` — reusable widgets shared across pages (modals, selects)
- `src/components/layout/DashboardLayout.jsx` — sidebar + header shell wrapping all authenticated pages; pages pass their content as `children`
- `src/hooks/` — data-fetching hooks (`usePartners`, `useSessions`, `useAddSession`) that encapsulate a Supabase query + loading/error state
- `src/constants/` — static lookup data (countries, languages, interests)
- `src/utils/securityUtils.js` — client-side password validation, input sanitization, a client-only login rate limiter (keyed in memory, not persisted server-side), and a security event logger that writes to `console` and `localStorage`

## Conventions

- Comments and UI copy are in Portuguese; code identifiers (variables, functions) are in English.
- Async Supabase calls consistently use `try/catch/finally` with `loading`/`error` state and `console.error` on failure — no thrown errors bubble to a global error boundary.
- Section dividers like `// =========================` / `// LABEL` / `// =========================` are used throughout hooks/services/components to break up logical blocks (data fetch, formatting, handlers, etc.). Match this style when adding sizeable new blocks in similar files.
- `speaks`/`learns`/`interests` are stored as comma-separated strings on `profiles`, not arrays or join tables — parsed with `.split(",").map(s => s.trim())` wherever needed.
- Each page/component imports its own CSS file directly (`import "./thing.css"`); there's no CSS-in-JS or shared design-token file beyond `src/index.css`/`src/App.css`.
