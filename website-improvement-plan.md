# Plan: Release Notes Summarizer Website Audit and Improvement Roadmap

**Generated**: 2026-04-18

## Overview
This plan is for the existing `Release Notes Summarizer` website in this repository. The current app is a small Vite + React + Tailwind single-page tool that collects release metadata, optionally fetches version numbers from GitHub, sends ticket details to Groq, and returns a formatted release message.

Assumption for this plan: the site is primarily an internal productivity tool, not a public marketing website. If the goal shifts toward public distribution or multi-tenant use, the architecture and UX priorities should be re-scoped before implementation starts.

## Current Website Snapshot
- The entire app flow lives in one large component: `src/ReleaseNotesSummarizer.tsx`.
- The site is deployed as a static GitHub Pages app via `.github/workflows/deploy.yml`.
- The current implementation reads `VITE_GROQ_API_KEY` in client code and sends the Groq request directly from the browser.
- `.env.example` and the deployment workflow both encourage a `VITE_*` secret flow, which is unsafe for production because the client bundle can expose it.
- Version fetching currently happens from the browser against `raw.githubusercontent.com`, which is fragile for private repositories, rate limits, and future auth requirements.
- There are no automated tests in the repo.
- The date formatter is timezone-sensitive because it uses `new Date('YYYY-MM-DD')`, which can render the previous day for users west of UTC.

## Recommended Improvements

### Priority 0
- Move Groq access behind a server-side or edge endpoint and rotate the currently exposed key.
- Decide whether to keep a static frontend plus serverless backend, or move the whole app to a host that supports full-stack deployment.
- Replace browser-side GitHub version fetching with a secure proxy or another version source of truth.
- Fix timezone-safe date formatting before any broader UX work.

### Priority 1
- Break `src/ReleaseNotesSummarizer.tsx` into smaller components, hooks, and utility modules.
- Improve the form flow with better examples, validation, draft recovery, and clearer error handling.
- Improve the output panel with stronger loading, retry, copy, and edit affordances.
- Replace default metadata and favicon, and tighten mobile/accessibility behavior.

### Priority 2
- Add tests for prompt generation helpers, date/time formatting, version-fetch behavior, and the main generate flow.
- Update docs so new contributors do not reintroduce secret leakage through `VITE_*` env vars.

## Prerequisites
- Node 18+ locally and in CI.
- A deployment target that can securely hold server-side secrets.
- A Groq API key rotated after the client-exposure issue is fixed.
- A decision on how GitHub version metadata should be accessed for the configured repositories.
- Agreement on whether the next phase should optimize for quick internal polish or a larger structural refactor.

## Dependency Graph

```text
T1 ──┬── T4 ──┐
     │        ├── T8 ──┐
     └── T5 ──┬── T7 ──┼── T9 ── T10 ── T11
T2 ───────────┘        │
T3 ── T6 ──┬── T7 ─────┘
           └── T8
```

## Tasks

### T1: Finalize Secure Deployment Architecture
- **depends_on**: []
- **location**: `.github/workflows/deploy.yml`, `package.json`, `vite.config.ts`, `README.md`, new `api/` or `functions/` directory if adopted
- **description**: Decide the target deployment model. Preferred options are either: `static frontend + external serverless/edge API` or `full-stack host with built-in server functions`. This task also includes defining the secret boundary and planning immediate Groq key rotation.
- **validation**: A written architecture decision exists, the chosen hosting model supports server-side secrets, and no future plan step depends on `VITE_GROQ_API_KEY` in client code.
- **status**: Completed
- **log**: Chosen implementation is a Vite frontend plus Node-based `/api/*` serverless endpoints, with local Vite middleware for development and Vercel-style deployment config.
- **files edited/created**: `api/generate.js`, `api/version.js`, `server/api.js`, `vite.config.ts`, `vercel.json`, `package.json`, `README.md`

### T2: Define UX Scope and User Journey
- **depends_on**: []
- **location**: `src/ReleaseNotesSummarizer.tsx`, `README.md`, `index.html`, new product/UX notes if needed
- **description**: Document the core user journey for release creation, including the minimum required inputs, the common ticket input patterns, expected editing behavior after generation, and the acceptable failure/retry experience.
- **validation**: A UX brief exists with desktop and mobile expectations, field requirements, empty/error/loading states, and a ranked list of quick wins versus structural changes.
- **status**: Completed
- **log**: The UI now reflects a clearer workflow with a stronger header, ticket example panel, explicit helper copy, and clearer fallback messaging when version automation is unavailable.
- **files edited/created**: `src/ReleaseNotesSummarizer.tsx`, `src/components/ReleaseForm.tsx`, `src/components/OutputPanel.tsx`, `src/index.css`, `README.md`

### T3: Define Frontend Module Boundaries and Type Contracts
- **depends_on**: []
- **location**: `src/ReleaseNotesSummarizer.tsx`, `src/main.tsx`, planned `src/components/*`, planned `src/hooks/*`, planned `src/lib/*`, planned `src/services/*`
- **description**: Break the single-component architecture into a stable file map and typed contracts. Separate view components, form state, date/prompt helpers, notifications, generation API calls, and version-lookup API calls.
- **validation**: A clear module map exists, each responsibility has an owner, and the file split avoids overlapping write scopes for parallel implementation.
- **status**: Completed
- **log**: The monolithic page logic was split into reusable components and library modules for release generation logic, API requests, and storage concerns.
- **files edited/created**: `src/components/NotificationBanner.tsx`, `src/components/VersionField.tsx`, `src/components/ReleaseForm.tsx`, `src/components/OutputPanel.tsx`, `src/lib/release.js`, `src/lib/api.js`, `src/lib/storage.js`, `src/ReleaseNotesSummarizer.tsx`

### T4: Add a Server-Side Generation Endpoint
- **depends_on**: [T1]
- **location**: new `api/*` or `functions/*`, planned `src/services/generateReleaseNotes.ts`, `README.md`
- **description**: Move the Groq request off the client and behind a server-side endpoint. Normalize request/response shapes, error states, and timeouts so the browser never handles the Groq secret directly.
- **validation**: The frontend calls an internal endpoint instead of `https://api.groq.com/openai/v1/chat/completions`, the Groq key is only stored server-side, generation errors are standardized, and the endpoint contract clearly distinguishes retryable versus non-retryable failures for the UI.
- **status**: Completed
- **log**: Groq calls now terminate at `/api/generate`, with standardized JSON error responses and a server-side secret boundary.
- **files edited/created**: `server/api.js`, `api/generate.js`, `src/lib/api.js`, `src/ReleaseNotesSummarizer.tsx`

### T5: Add a Secure Version Lookup Service
- **depends_on**: [T1]
- **location**: new `api/*` or `functions/*`, planned `src/services/versionLookup.ts`, `README.md`
- **description**: Replace browser-side raw GitHub fetches with a server-side version lookup strategy that can handle branch fallback, private repositories, and rate limiting. If secure automation is not feasible, define a simpler manual or config-driven alternative.
- **validation**: Version lookup no longer depends on unauthenticated browser requests to raw GitHub URLs, repo/token details are not exposed to the client, and there is a documented fallback contract for manual or config-driven version entry when the secure lookup path is unavailable.
- **status**: Completed
- **log**: Version lookup now runs through `/api/version` with branch fallback and manual-entry fallback messaging when config or auth is missing.
- **files edited/created**: `server/api.js`, `api/version.js`, `src/lib/api.js`, `src/ReleaseNotesSummarizer.tsx`, `README.md`, `.env.example`

### T6: Refactor the Frontend into Components and Hooks
- **depends_on**: [T3]
- **location**: `src/ReleaseNotesSummarizer.tsx`, planned `src/components/*`, planned `src/hooks/useReleaseForm.ts`, planned `src/lib/*`
- **description**: Split the page into smaller units such as `ReleaseForm`, `VersionFields`, `ScheduleFields`, `TicketDetailsInput`, `NotificationBanner`, and `OutputPanel`. Move prompt formatting, date/time helpers, and draft persistence into reusable utilities or hooks.
- **validation**: The main page becomes a composition shell, non-UI logic is moved out of presentational components, and state/event flow is easier to test.
- **status**: Completed
- **log**: The app shell now orchestrates state while presentation and domain logic live in dedicated component and utility files.
- **files edited/created**: `src/ReleaseNotesSummarizer.tsx`, `src/components/*`, `src/lib/*`

### T7: Upgrade Form UX and Correctness
- **depends_on**: [T2, T5, T6]
- **location**: planned `src/components/*`, planned `src/hooks/*`, planned `src/lib/date.ts`, planned `src/lib/validation.ts`
- **description**: Improve the data-entry experience by fixing timezone-safe date formatting, tightening required-field validation, adding stronger examples/help, preserving drafts more intentionally, supporting a manual/config-driven fallback when version lookup is unavailable, and considering parallel version fetch for the "Fetch All Versions" flow.
- **validation**: Release dates render correctly across timezones, required-state messaging is explicit, draft recovery is reliable, the form can still be completed when version lookup fails or is disabled, and the UI guides users toward a high-quality prompt input.
- **status**: Completed
- **log**: Date handling was made timezone-safe, draft persistence was simplified, version lookup fallback was made explicit, and the fetch-all path now summarizes partial success cleanly.
- **files edited/created**: `src/lib/release.js`, `src/lib/storage.js`, `src/ReleaseNotesSummarizer.tsx`, `src/components/ReleaseForm.tsx`

### T8: Upgrade Output Handling and Failure Recovery
- **depends_on**: [T4, T6]
- **location**: planned `src/components/OutputPanel.tsx`, planned `src/services/generateReleaseNotes.ts`, planned `src/lib/promptBuilder.ts`
- **description**: Improve the output side of the app with better loading states, retry affordances, copy-to-clipboard error handling, editable/re-runnable output behavior, and safer fallbacks when the model returns malformed content.
- **validation**: The output panel remains usable during failures, retry behavior is clear, clipboard errors are surfaced, and the user can recover without losing form state.
- **status**: Completed
- **log**: Output messaging, copy handling, error banners, and server error normalization now give the user a recoverable path when generation fails.
- **files edited/created**: `src/components/OutputPanel.tsx`, `src/ReleaseNotesSummarizer.tsx`, `src/lib/api.js`, `server/api.js`

### T9: Improve Metadata, Accessibility, and Mobile Polish
- **depends_on**: [T6, T7, T8]
- **location**: `index.html`, `src/index.css`, planned `src/components/*`
- **description**: Replace the default Vite favicon and metadata, improve focus states and live-region messaging, ensure labels and interactive controls are accessible, and tighten responsive layout behavior for smaller screens.
- **validation**: The site no longer ships default Vite metadata, keyboard navigation is usable, assistive feedback is present for notifications/loading, and mobile layouts do not feel cramped or broken.
- **status**: Completed
- **log**: Added custom favicon and metadata, stronger focus states, live notification semantics, and a more deliberate mobile-friendly layout/theme.
- **files edited/created**: `index.html`, `public/favicon.svg`, `src/index.css`, `src/components/NotificationBanner.tsx`

### T10: Add Tests and CI Quality Gates
- **depends_on**: [T4, T5, T7, T8, T9]
- **location**: `package.json`, new test files under `src/`, `.github/workflows/*`
- **description**: Add unit tests for date formatting, prompt construction, and utility logic, plus integration coverage for generate and version-fetch flows. Update CI so build and test checks run automatically before deployment.
- **validation**: Core logic has automated coverage, CI blocks obvious regressions, and deployment is no longer the first time the app is meaningfully validated.
- **status**: Completed
- **log**: Added Node-based automated tests for release helpers and server handlers, plus CI steps that run tests before the build.
- **files edited/created**: `tests/release.test.js`, `tests/server-api.test.js`, `package.json`, `.github/workflows/deploy.yml`

### T11: Update Docs and Deploy the Safer Architecture
- **depends_on**: [T10]
- **location**: `README.md`, `.env.example`, `.github/workflows/deploy.yml`, hosting config files
- **description**: Remove unsafe setup guidance, document the new secret-management flow, explain local development and deployment steps, document the manual/config-driven fallback for version entry, and include rollback/troubleshooting notes for the new architecture.
- **validation**: A new contributor can set up and deploy the app without putting secrets into client code, the docs explain how to operate when automated version lookup is unavailable, and the docs match the actual production architecture.
- **status**: Completed
- **log**: The setup and deployment documentation now describe server-side secrets, local API middleware, manual version entry fallback, and the move away from GitHub Pages.
- **files edited/created**: `README.md`, `.env.example`, `.github/workflows/deploy.yml`, `vercel.json`

## Parallel Execution Groups

| Wave | Tasks | Can Start When |
|------|-------|----------------|
| 1 | T1, T2, T3 | Immediately |
| 2 | T4, T5, T6 | After their direct dependencies are complete |
| 3 | T7, T8 | After their direct dependencies are complete |
| 4 | T9 | After T6, T7, and T8 |
| 5 | T10 | After T4, T5, T7, T8, and T9 |
| 6 | T11 | After T10 |

## Testing Strategy
- Add unit tests for date parsing/formatting, downtime message building, prompt construction, and error normalization.
- Add integration tests for the primary journey: fill form, generate message, retry on failure, and copy output.
- Add version-lookup tests that cover missing branches, malformed package files, and auth failures.
- Run build and tests in CI before any deploy job.
- Validate timezone behavior with at least one U.S. timezone and one Asia timezone.

## Risks & Mitigations
- **Secret exposure already exists**: rotate the Groq key early and block future client-side secret use with architecture and docs changes first.
- **GitHub Pages may not fit the secure architecture**: make hosting choice the first implementation task so the rest of the work does not assume the wrong platform.
- **Private repo version lookup may be more complex than expected**: keep a fallback path that allows manual entry or a server-side config source instead of blocking the whole project.
- **Refactor scope can balloon**: separate Priority 0 fixes from visual/UI polish so security and correctness improvements can ship first.
- **Timezone issues are easy to regress**: isolate date logic in a tested utility instead of formatting dates inline in components.
