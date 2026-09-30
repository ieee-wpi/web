# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Next.js 16 (App Router) site for the IEEE WPI Student Branch (https://ieee.wpi.edu). React 18 + TypeScript + Tailwind + shadcn/ui. Package manager is npm (`package-lock.json`); the repo previously carried both lockfiles and a `packageManager: yarn` field, which have been dropped in favor of the npm that `deploy.sh` and the README already use.

Migrated from Gatsby 5. Nothing Gatsby-specific remains.

## Commands

```bash
npm run dev         # next dev -> localhost:3000
npm run build       # next build
npm start           # next start -p 9000 (the port production proxies to)
npm run clean       # remove .next/
npm run typecheck   # tsc --noEmit for the site, then for game-server/

npm run quiz:dev    # build + run the quiz game server on :9001 (node --watch)
npm run quiz:watch  # tsc --watch for game-server/ (run beside quiz:dev)
npm run quiz:test   # node:test unit tests in game-server/*.test.ts
npm run quiz:bots -- --password <pw> --n 150   # load test: bot host + N bot players
npm run quiz:server # production: build + run on :9001 (what deploy.sh starts)
```

`npm run typecheck` is the static check for the site; there is no linter. The only tests are the quiz server's `quiz:test`. Both currently pass clean.

Node >= 20.9 is required (Next 16's `engines`). The production VM runs Node 22 via nvm in the `dev` user's home (no sudo).

`next-env.d.ts` is generated on first build and is gitignored; it supplies the module declarations for image imports. **In a fresh clone, before the first `next build`, typecheck reports ~29 "Cannot find module '@/images/...'" errors.** Run a build first — those are not real errors.

Next also rewrites `tsconfig.json` during a build (setting `jsx: react-jsx` and appending `.next/dev/types` to `include`). Let it; don't revert those.

## Deployment

Self-hosted, not a CI/CD platform. `./deploy.sh` kills only the tmux session `prod` and reruns `npm run deploy` (`next build && next start -p 9000`) in it. It also starts the quiz game server in a separate tmux session `quiz` if that isn't running, and never restarts it, so a site deploy can't kill a live game. `./deploy-quiz.sh` restarts the quiz server (asks first; ends live games). Apache (`apache/000-default.conf`, installed at `/etc/apache2`) terminates TLS and reverse-proxies to that process; when it is down Apache serves `maintenance/maintenance.html` (deployed to `/var/www/maintenance`) as the 503 document. Dev host is `ieee-dev.wpi.edu`.

The Node process on :9000 is what serves optimized images, so **don't switch to `output: 'export'`** without first deciding how to replace `next/image` optimization — a 1.9 MB hero JPEG currently ships as a ~75 KB WebP because of it.

`html/` is the pre-Gatsby static site, kept for reference only — it is not built or served.

## Architecture

### Page shape

`src/app/` with the App Router: one `page.tsx` per route. `src/app/layout.tsx` is the root layout and owns only `<html>`/`<body>`, global CSS and site metadata. Regular pages live in the `src/app/(site)/` route group, whose `layout.tsx` renders `<Navbar />` / `<Footer />`; the group doesn't appear in URLs. **Add new site pages under `(site)/`.** `src/app/quiz/` sits outside the group so the game screens are full-screen, and `src/app/not-found.tsx` (root level, for unmatched URLs) renders its own Navbar/Footer. Pages return only a fragment:

```tsx
export const metadata = { title: "About" };   // renders as "About | IEEE WPI Student Branch"

export default function AboutPage() {
  return (
    <>
      <Banner type={BannerType.About} />
      <main className="container-page">
        <ContentCard title="...">...</ContentCard>
      </main>
    </>
  );
}
```

The title template and site-wide metadata live in the root layout's `metadata` export; `viewport` there carries the theme color.

### Server vs client components

Most pages are server components. A page needing hooks keeps its `metadata` export by staying a server component and delegating the interactive part to a `"use client"` child — that is why `events` and `games` are thin wrappers:

- `app/(site)/events/page.tsx` -> `components/events-calendar.tsx` (the fetch + `react-big-calendar`)
- `app/(site)/games/page.tsx` -> `components/wordle.tsx` (all game state)
- `app/quiz/page.tsx` -> `components/quiz/player.tsx`; `app/quiz/host/page.tsx` -> `components/quiz/host.tsx`

Components currently marked `"use client"`: `navbar`, `past-officers`, `flagship-events-carousel`, `ui/carousel`, `ui/key`, `keyboard`, `letterBox`, `wordleGame`, `gameContent`, `events-calendar`, `wordle`, `quiz/player`, `quiz/host`, `quiz/host-screens`, `quiz/countdown`, `quiz/builder`, `quiz/question-editor`, plus the hooks in `lib/quiz/use-quiz-socket.ts`. Adding a hook, an event handler, or a context to any other component means adding the directive too.

### Adding a page with a hero

`src/components/banner.tsx` holds a `BannerType` enum and a `heroes` record mapping each member to an imported image. Both are exhaustive — add an enum member and TypeScript will require the matching `heroes` entry. Also add the route to the desktop and mobile link lists in `navbar.tsx` (two separate hardcoded lists in the same file) and, if relevant, `footer.tsx`.

`Alumni` and `Networking` intentionally share `events/networking.jpg`. `src/images/heroes/networking_hero.jpg` exists but is unused — that was already true under Gatsby.

### Content lives in typed const arrays, not a CMS

Most "content edits" are edits to a literal array:

- `src/app/(site)/people/page.tsx` -> `officers` (current board)
- `src/components/past-officers.tsx` -> `officerBoards` (year-by-year archive)
- `src/components/event-card.tsx` -> `eventData`, keyed by the `EventType` union; `flagship-events.tsx` picks which keys to render

### Images

Every image is a **static import** from `src/images/`, passed to `next/image`. Static imports give Next the intrinsic dimensions and let `placeholder="blur"` generate a blur data URL at build time.

Adding an officer = drop the photo in `src/images/people/`, import it at the top of `app/(site)/people/page.tsx`, and add a row to `officers`. A missing or misnamed file is a build error. (Under Gatsby this was a GraphQL glob joined by filename, where a typo silently produced a blank circle.)

Two conventions worth matching:

- Full-bleed images (heroes, in `banner.tsx`) use `fill` + `className="object-cover"` inside a `relative` parent.
- Fixed-width images (sponsor logos in `app/(site)/networking/page.tsx`) use `className="w-[200px] h-auto"` rather than `width`/`height` props, so intrinsic dimensions still come from the import.

### Events calendar

`components/events-calendar.tsx` renders `react-big-calendar` from data fetched **at runtime** (`fetch("/data/events.json")`), not at build time. The source is `public/data/events.json`; entries are `{ title, start, end, time, location }` with ISO date strings parsed client-side. Updating the calendar means editing that JSON file, and it takes effect without a rebuild.

`date-fns` is pinned to `^2.30.0` on purpose — `dateFnsLocalizer` breaks on v3/v4's changed import paths.

### Wordle game (`/games`)

All state lives in `components/wordle.tsx` and flows through `GameContext` (`components/gameContent.tsx`) to `WordleGame` -> `LetterBox` (a hardcoded 6x5 grid) and `Keyboard` -> `ui/key`. `boardCols` codes are `0` unset, `1` exact match, `2` present-elsewhere; `gameFunctions.tsx` supplies the blank 6x5 seeds.

The daily word is deterministic: `floor(days since epoch) % pool.length`. The word pool and a supplementary dictionary are fetched at runtime from a **published Google Sheets CSV** (two gids on one sheet), merged with `src/data/dictionary.json`. Officers update the word list by editing that spreadsheet with no redeploy — but the page depends on that external URL at load time, and shows an empty board if it fails.

`src/data/dictionary.json` is imported into the bundle, so it lives under `src/`, not `public/`. `public/data/wordPool.json` is vestigial — nothing imports it.

Known pre-existing bugs, carried over unchanged from the Gatsby version: there is no lockout after the 6th guess (a 7th Enter indexes `board[6]` and throws), `checkRow`'s `[...boardCols]` is a shallow copy that mutates the rows in place, and a repeated letter is marked present even when it is already placed.

### Styling

shadcn/ui, configured via `components.json` (default style, `neutral` base, CSS variables, lucide icons, `rsc: true`). Primitives in `src/components/ui/`; compose class names with `cn()` from `src/lib/utils.ts`.

`src/styles/global.css` is imported once, in the root layout. It defines the shadcn CSS variables plus `.container-page` (page max-width/padding, used on every `<main>`). `darkMode: ['class']` is configured but no toggle exists — don't assume dark variants are reachable.

Tailwind is v3. `@/*` -> `./src/*` resolves natively through `tsconfig.json`; no webpack config is involved.

Brand color is IEEE navy `#002855`.

### Live quiz (`/quiz`, `/quiz/host`, `game-server/`)

A Kahoot-style game. Design and rationale: `docs/quiz-game-plan.md`. Officer-facing instructions: `docs/quiz-runbook.md`.

- **`game-server/`** is a separate plain Node + `ws` process on :9001, not part of Next. It's compiled with its own `tsconfig.json` to `game-server/dist/` (gitignored); the root tsconfig excludes it. It holds all game state in memory, keeps the answer key, measures answer times, and scores. Config is in `game-server/.env` (gitignored; see `.env.example`). The host password is `QUIZ_HOST_PASSWORD`.
- **Apache** proxies `/quiz-ws/` to :9001 (`upgrade=websocket`), so production pages connect to `wss://<host>/quiz-ws/`. In dev, `.env.local` sets `NEXT_PUBLIC_QUIZ_WS_URL=ws://localhost:9001`, because Next dev doesn't proxy WebSockets.
- **Protocol:** `game-server/protocol.ts` is the single source of message types. The front end imports it with `import type` only. Phones never receive question or answer text, only "question N, K choices, T ms left".
- **Quizzes** come from a published Google Sheet (an Index tab listing title/gid, one tab per quiz; `QUIZ_SHEET_PUB_BASE`) and from `game-server/quizzes/*.csv` (same columns). Use a **different** spreadsheet from Wordle's, whose URL is public in the client bundle.
- **Quiz builder** (`components/quiz/builder.tsx`, `question-editor.tsx`, opened from the host's quiz list) creates, edits and deletes quizzes saved as CSVs in `game-server/saved-quizzes/` (gitignored; `QUIZ_SAVED_DIR`; ids `saved:<slug>`). It talks to the game server over HTTP JSON at `/quizzes/...` (`game-server/builder-http.ts`, `Authorization: Bearer <host password>`), not the socket, whose 1 KB message cap is far below a quiz. Drafts are converted to the same CSV format (`quiz-draft.ts`) and validated by the same `parseQuizCsv`, so there is one set of rules. Content limits live in `game-server/quiz-rules.ts`, the one game-server module the front end imports at runtime (constants only, no Node imports). Sheet and `quizzes/` quizzes are read-only in the builder and can be duplicated into it.
- **Results** are written to `game-server/results/` (gitignored) as JSON and CSV at the podium. They're downloadable from the host screen.
- **Sound** is host-only. Effects are synthesized with Web Audio. Optional music loops go in `public/quiz/sfx/` (CC0 only; record sources in `CREDITS.md` there).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
