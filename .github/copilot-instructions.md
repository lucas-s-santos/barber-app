# Copilot / AI Agent Instructions for barber-app-main

This document gives focused, actionable guidance for AI coding agents editing this repository.

**Big Picture**

- **Stack**: Expo (React Native) app using the Expo Router (`app/` file-based routes), TypeScript/JS mix, and Supabase for backend (`supabaseClient.ts`).
- **Entry points**: app-level routing and layout are in `app/_layout.tsx` and `app/index.tsx`. Routes live under `app/(auth)/` and `app/(tabs)/`.
- **Data flow**: UI components call helpers in `supabaseClient.ts` for auth and DB operations. Persistent session storage uses `AsyncStorage` via a custom storage adapter in `supabaseClient.ts`.

**Where to look first (quick tour)**

- `package.json`: scripts for dev (`npm run start` -> `expo start`), platform-specific runs (`npm run android|ios|web`), linting and formatting.
- `supabaseClient.ts`: central supabase client, env var resolution (via `process.env` or `Constants.expoConfig.extra`), and auth helpers (`getUser`, `getSession`, `signInWithEmail`, `signOut`). Always check this file when touching auth or DB logic.
- `supabase.sql`: DB schema / migrations reference.
- `components/` and `components/ui/`: reusable UI and `themed-*` wrappers used across screens (`themed-text.tsx`, `themed-view.tsx`).
- `contexts/AlertContext.js` and `contexts/ThemeContext.js`: app-wide state patterns (use these instead of adding ad-hoc globals).
- `txt/`: contains screen text and notes for many screens — useful when translating UI copy or checking original copy.

**Project-specific patterns & conventions**

- **Expo Router groups**: folders wrapped in parentheses like `(auth)` or `(tabs)` are route groups — preserve these when adding routes.
- **Mixed files**: repo mixes `.ts/.tsx` and `.js` files. When editing a `.js` file, maintain CommonJS/ESM usage style and avoid introducing types unless migrating the file.
- **Env management**: `supabaseClient.ts` expects `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to be present either in environment or `app.config.js` (`expo.extra`). If missing, the file throws an error — ensure env settings are present before running.
- **Auth/session handling**: `supabase.auth` is configured to `persistSession` and uses an AsyncStorage adapter. Avoid replacing storage without understanding server vs client checks (`typeof window === 'undefined'` guards exist).
- **UI theming**: Use `themed-*` components and `ThemeContext.js` for colors and spacing; don't hardcode theme values in new components.

**Common tasks & commands**

- Install deps: `npm install`
- Start dev server: `npm run start` (runs `expo start`) — from output choose Android/iOS/web or Expo Go.
- Platform runs: `npm run android`, `npm run ios`, `npm run web`.
- Reset starter content: `npm run reset-project` (script at `scripts/reset-project.js`).
- Lint & format: `npm run lint`, `npm run format`, `npm run lint:fix`.

**Editing guidance & examples**

- To add a new screen in the tabbed area, create a file under `app/(tabs)/` — e.g. `app/(tabs)/new-screen.tsx`. Follow existing screens like `app/(tabs)/servicos.js` for patterns.
- When changing auth flows, update `supabaseClient.ts` helpers and ensure any UI that consumes `getUser()` or `onAuthStateChanged` reflects the session lifecycle.
- To change DB schema, edit `supabase.sql` and coordinate migrations with the deployed Supabase project.

**PR & commit expectations**

- Run `npm run lint:fix` and `npm run format` before committing.
- Husky + lint-staged are configured; commits will auto-run linters for staged files.

**What not to change without explicit review**

- `supabaseClient.ts` initialization logic (env resolution and storage adapter). Small auth tweaks are OK, but structural changes require verification on device/emulator.
- Route group folders (parentheses) as they affect routing behavior in Expo Router.

If anything is unclear or you need additional conventions (naming, branching, or deployment details), ask the repo owner for answers and sample env values (don't commit secrets).

---

Please review — I can shrink or expand any section and add exact code snippets if you'd like sample PR descriptions or automated tests guidance.
