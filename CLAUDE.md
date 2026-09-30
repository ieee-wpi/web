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
npm run typecheck   # tsc --noEmit
```

`npm run typecheck` is the only static check — there is no test suite and no linter. It currently passes clean.

`next-env.d.ts` is generated on first build and is gitignored; it supplies the module declarations for image imports. **In a fresh clone, before the first `next build`, typecheck reports ~29 "Cannot find module '@/images/...'" errors.** Run a build first — those are not real errors.

Next also rewrites `tsconfig.json` during a build (setting `jsx: react-jsx` and appending `.next/dev/types` to `include`). Let it; don't revert those.

## Deployment

Self-hosted, not a CI/CD platform. `./deploy.sh` kills the tmux server and runs `npm run deploy` (`next build && next start -p 9000`) inside a tmux session named `prod`. Apache (`apache/000-default.conf`, installed at `/etc/apache2`) terminates TLS and reverse-proxies to that process; when it is down Apache serves `maintenance/maintenance.html` (deployed to `/var/www/maintenance`) as the 503 document. Dev host is `ieee-dev.wpi.edu`.

The Node process on :9000 is what serves optimized images, so **don't switch to `output: 'export'`** without first deciding how to replace `next/image` optimization — a 1.9 MB hero JPEG currently ships as a ~75 KB WebP because of it.

`html/` is the pre-Gatsby static site, kept for reference only — it is not built or served.

## Architecture

### Page shape

`src/app/` with the App Router: one `page.tsx` per route. `src/app/layout.tsx` is the root layout — it owns `<html>`/`<body>` and renders `<Navbar />` / `<Footer />` around every page, so pages themselves return only a fragment:

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

- `app/events/page.tsx` -> `components/events-calendar.tsx` (the fetch + `react-big-calendar`)
- `app/games/page.tsx` -> `components/wordle.tsx` (all game state)

Components currently marked `"use client"`: `navbar`, `past-officers`, `flagship-events-carousel`, `ui/carousel`, `ui/key`, `keyboard`, `letterBox`, `wordleGame`, `gameContent`, `events-calendar`, `wordle`. Adding a hook, an event handler, or a context to any other component means adding the directive too.

### Adding a page with a hero

`src/components/banner.tsx` holds a `BannerType` enum and a `heroes` record mapping each member to an imported image. Both are exhaustive — add an enum member and TypeScript will require the matching `heroes` entry. Also add the route to the desktop and mobile link lists in `navbar.tsx` (two separate hardcoded lists in the same file) and, if relevant, `footer.tsx`.

`Alumni` and `Networking` intentionally share `events/networking.jpg`. `src/images/heroes/networking_hero.jpg` exists but is unused — that was already true under Gatsby.

### Content lives in typed const arrays, not a CMS

Most "content edits" are edits to a literal array:

- `src/app/people/page.tsx` -> `officers` (current board)
- `src/components/past-officers.tsx` -> `officerBoards` (year-by-year archive)
- `src/components/event-card.tsx` -> `eventData`, keyed by the `EventType` union; `flagship-events.tsx` picks which keys to render

### Images

Every image is a **static import** from `src/images/`, passed to `next/image`. Static imports give Next the intrinsic dimensions and let `placeholder="blur"` generate a blur data URL at build time.

Adding an officer = drop the photo in `src/images/people/`, import it at the top of `app/people/page.tsx`, and add a row to `officers`. A missing or misnamed file is a build error. (Under Gatsby this was a GraphQL glob joined by filename, where a typo silently produced a blank circle.)

Two conventions worth matching:

- Full-bleed images (heroes, in `banner.tsx`) use `fill` + `className="object-cover"` inside a `relative` parent.
- Fixed-width images (sponsor logos in `app/networking/page.tsx`) use `className="w-[200px] h-auto"` rather than `width`/`height` props, so intrinsic dimensions still come from the import.

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
