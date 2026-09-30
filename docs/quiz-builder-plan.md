# Quiz builder on `/quiz/host` — plan

Status: implemented (2026-09-29). Where the build differs from this plan: the etag travels in the JSON bodies rather than `ETag`/`If-Match` headers (so no CORS header exposure is needed); saved CSVs get no Excel-formula guard, because nothing offers them for download and the guard would change answers that legitimately start with `'`; there is no **Download CSV** button (declined); a builder session gets a loose rate limit, and wrong builder passwords get a strict separate one; **Save & host** returns to the quiz list with the quiz selected, rather than creating the game, so the Nickname generator and Autoplay settings are still chosen there. Companion to `quiz-game-plan.md`, which listed an "in-app quiz editor" as out of scope for v1 (§2). This plan adds it without changing the game protocol or the Google Sheet workflow.

## 1. Goal

After an officer logs in on `/quiz/host`, they can create, edit, duplicate and delete quizzes in a form, check them against the same rules the game enforces, and click **Play** to go straight into the lobby. They don't need a spreadsheet, a CSV, or SSH.

Non-goals: writing back to Google Sheets (that needs Google API credentials and an OAuth or service account; the Sheet stays a read-only source), image uploads (still https URLs or `/quiz/img/...`), per-officer accounts, and version history beyond one backup.

## 2. Key decisions

| Decision | Choice | Why |
|---|---|---|
| Where builder quizzes live | CSV files in a new **gitignored** dir `game-server/saved-quizzes/` (`QUIZ_SAVED_DIR`), listed with a new `source: "saved"` | The existing `local:` loader already reads CSVs, so the builder writes the same format and there's still one parser. The folder is gitignored so that `git pull` on the VM never collides with officer edits, and `game-server/quizzes/` keeps its role of holding committed samples. |
| Transport for save/load | **HTTP** on the game server (`/quizzes/...`), not WebSocket | The WebSocket `maxPayload` is 1 KB (`index.ts` `MAX_PAYLOAD`), and a quiz is up to ~50 KB. HTTP is already served on :9001 and proxied through `/quiz-ws/`, as `/results` is, so Apache doesn't change. |
| Auth | Host password in an `Authorization: Bearer` header, using the same `checkPassword` and `passwordLimiter` | `/results?key=` puts the password in Apache access logs. New write endpoints shouldn't. |
| Validation | Server-side, with the existing `parseQuizCsv` | There is one set of rules, and the "problems" the builder shows are exactly the ones that would block **Create game**. The client only adds cheap guards (`maxLength`, a `<select>` for time). |
| Shared limits | Move `TIME_OPTIONS`, `MAX_QUESTIONS`, `MAX_QUESTION_LEN` and `MAX_ANSWER_LEN` into a new constants-only `game-server/quiz-rules.ts` | Both sides need them. `protocol.ts` must stay type-only, so they go in a separate file with no Node imports that the front end can import at runtime. |
| Title | Stored in the CSV as a first-line comment `# title: IEEE Trivia: Fall '26` | Local quizzes currently get their title from the filename, which drops punctuation. The parser already skips `#` rows, so old CSVs and the Sheet are unaffected. |
| Concurrency | Optimistic: `GET` returns an `ETag` (file mtime plus size), and `PUT` sends `If-Match`, getting **409** on a mismatch | Two officers editing the same quiz at once is rare, but silent overwrites are worse than a "reload?" prompt. |
| Live games | Unaffected | `Game` holds its own parsed `Quiz` from `host:create`, so saving mid-game changes nothing on screen. |

## 3. Game server changes (`game-server/`)

1. **`quiz-rules.ts`** (new): the constants above. `quiz-source.ts` imports them from here.
2. **`quiz-source.ts`**
   - `serializeQuizCsv(title, questions: DraftQuestion[]): string`, the inverse of `parseQuizCsv`. It writes the header, a `# title:` line, then one row per question, and quotes with the same RFC 4180 rules. T/F questions write `true`/`false` in `correct`, and quiz questions write `1,3`.
   - `parseQuizCsv` reads an optional `# title:` line and uses it instead of the filename-derived title.
   - `listSavedQuizzes()`, and `loadQuiz` accepts `saved:<slug>`.
   - A `DraftQuestion` type (the builder's JSON shape) goes in `protocol.ts`, since it's type-only.
3. **`saved-quizzes.ts`** (new): file operations for the saved directory.
   - `slugify(title)` gives `[\w-]+`, max 60 chars, with a numeric suffix on collision. The slug is fixed at creation, so renaming a title never moves the file.
   - `readSaved(slug)` returns `{ title, questions, etag }`.
   - `writeSaved(slug, csv, ifMatch)` writes atomically (to `<slug>.csv.tmp`, then `rename`), copies the previous version to `<slug>.csv.bak`, and returns the new etag or a `conflict` result.
   - `deleteSaved(slug)` moves the file to `saved-quizzes/.trash/` rather than unlinking it, so it can be recovered by SSH.
   - Every slug is checked against `^[\w-]+$` before it touches the filesystem, with the same guard as `RESULTS_FILE_RE`.
4. **`index.ts`**: new routes. All of them require a Bearer password and share `passwordLimiter`.

   | Method & path | Body → response |
   |---|---|
   | `GET /quizzes` | → `QuizSummary[]` (same as `host:listQuizzes`, so the builder can refresh without the socket) |
   | `GET /quizzes/:id` | `saved:`, `local:` or `sheet:` → `{ title, questions: DraftQuestion[], editable, etag }`. Sheet and local quizzes load read-only; the UI offers **Duplicate to editor**. |
   | `POST /quizzes` | `{ title, questions }` → `201 { id, etag, problems }` |
   | `PUT /quizzes/saved:<slug>` | `If-Match` + `{ title, questions }` → `{ etag, problems }`, or `409` |
   | `DELETE /quizzes/saved:<slug>` | → `204` |
   | `POST /quizzes/check` | `{ title, questions }` → `{ problems }` without saving (live validation, debounced) |

   - Read the body with a hard cap (256 KB, then `413`) and parse it as JSON. Reject non-JSON `Content-Type`.
   - Save always succeeds if the JSON is well-formed, even when there are problems. It returns the problems so officers can save half-finished drafts, and `host:create` still refuses a quiz with problems.
   - Problems come back with `question` (a 0-based index) as well as `row`. Derive it from the row number: header, then title, so it's `row - 3`.
   - CORS for dev: answer `OPTIONS` preflights for allowed origins with `Access-Control-Allow-Methods: GET, POST, PUT, DELETE` and `-Headers: Authorization, Content-Type, If-Match`, and expose `ETag`.
5. **Config**: add `QUIZ_SAVED_DIR` (default `saved-quizzes`) to `config.ts` and `.env.example`, and `game-server/saved-quizzes/` to `.gitignore`.
6. **Tests** (`node:test`, alongside the existing ones):
   - `serializeQuizCsv` → `parseQuizCsv` round-trip, covering commas, quotes, newlines, a leading `=`, multi-correct answers, T/F, and images.
   - `# title:` parsing, plus the case where an old CSV without it is unchanged.
   - Slug validation rejects `..`, `/`, `%2F` and empty strings.
   - Atomic write, `.bak` and `409` on a stale etag, against a temp dir set through `test-env.ts`.

## 4. Front end changes

### Flow in `components/quiz/host.tsx`

Add a `view: "pick" | "build"` state to the authed pre-game panel.

- The **Choose a quiz** list gets a **+ New quiz** button, **Edit** and **Delete** actions on `saved` quizzes, and a **Duplicate** action on sheet and local quizzes. **Delete** asks for confirmation in an inline bar (the host page has no dialogs), then calls `DELETE /quizzes/saved:<slug>`. Each row gets a source badge: "Google Sheet", "Local file" or "Built here".
- Opening the builder hides the picker. **Back** returns to it and re-sends `host:listQuizzes`.
- **Save & play** in the builder saves, then calls the existing `validate(id)` and `create()` path, so there's no new game-creation code.

`host.tsx` is already 420 lines, so the builder lives in its own files.

### New files

- `components/quiz/builder.tsx` (`"use client"`): state, loading, saving and the layout.
  - **Left rail:** a numbered list of questions with each question's text truncated, a red dot on questions with problems, drag or ↑↓ buttons to reorder, and duplicate and delete per question. **+ Add question** is at the bottom.
  - **Main pane:** an editor for the selected question.
  - **Header:** the title input, save status ("Saved", "Unsaved changes", "Saving..."), **Save**, **Save & play**, and **Back**.
- `components/quiz/question-editor.tsx`: one question's form.
  - Type toggle: Quiz or True/False. Switching to T/F keeps a copy of the quiz answers, so switching back doesn't lose them.
  - Question text: a textarea with a live `n/120` counter.
  - Answers: four inputs styled with the `SHAPES` colors and `ShapeIcon`, each with a "correct" checkbox. The inputs have `maxLength=75`. For T/F, show two fixed tiles and a radio button.
  - Time: a `<select>` using `TIME_OPTIONS`. Points: Standard, Double or None.
  - Image: a URL field with a live `<img>` preview and a "couldn't load" state.
- `lib/quiz/builder-api.ts`: typed `fetch` wrappers over `quizHttpUrl(...)` that add the Bearer header and turn `409`, `413` and `403` into user-facing messages.

### Behavior details

- **Validation:** call `POST /quizzes/check` 600 ms after the last edit. Show problems inline on the question and as a count on **Save & play**, which is disabled while there are problems. Just like **Create game** today.
- **Drafts:** autosave the working copy to `localStorage` (`quiz:draft:<id|new>`) on every change, and offer "Restore unsaved changes?" when the builder opens. This follows the host page's try/catch storage pattern.
- **Leaving with unsaved changes:** add a `beforeunload` prompt, and have **Back** ask using an inline confirm bar, not `confirm()`.
- **Keyboard:** the host page's global key handler (Space/→/S/M/F) already ignores inputs and textareas. Make sure it also ignores `<select>` and is inactive while `view === "build"`, so typing "s" in a field never sends `host:skip`.
- **Styling:** match the existing host screens (navy background, white panels, Tailwind, no new dependencies). Reordering uses ↑↓ buttons first; drag-and-drop is optional and uses the native HTML5 API, not a library, which keeps the `/quiz/host` bundle lean. It isn't on the phones' path, but it shouldn't grow either.

## 5. Security and abuse

- The password is required on every builder route and rate-limited per IP by the existing `passwordLimiter`, whose budget of 10 per minute may need raising or splitting for the builder's debounced `check` calls. **Decision needed:** give the builder a separate, looser limiter (say 60 per minute) keyed on IP and applied only *after* a correct password, while wrong passwords still go through the strict one.
- Cap the body at 256 KB, questions at 100 (already enforced by the parser), and the saved directory at 200 files (return `507` beyond that).
- Path safety: the slug regex is checked before any `path.join`, and nothing from the client is ever used as a directory.
- CSV injection: builder text lands in a CSV that officers may open in Excel. `serializeQuizCsv` should apply the same leading `=+-@` guard as `results.ts` `csvCell`, and `parseQuizCsv` should strip that guard's `'` prefix when reading back.
- Origin: HTTP routes check `Origin` against `allowedOrigins` for state-changing methods, as the WebSocket upgrade already does.

## 6. Build order

| # | Step | Done when |
|---|---|---|
| 1 | `quiz-rules.ts`, `serializeQuizCsv`, `# title:` support, round-trip tests | `npm run quiz:test` passes, and the existing CSVs parse identically |
| 2 | `saved-quizzes.ts` + HTTP routes + CORS preflight + config/gitignore | `curl` can create, read, update (and get a 409 on a stale etag) and delete a quiz; the new quiz appears in `host:listQuizzes` and is playable |
| 3 | `builder-api.ts` + `builder.tsx` shell: list, add, delete, reorder, title, save | You can build a 3-question quiz in the browser, save it, and see it in the picker |
| 4 | `question-editor.tsx` with all fields, live `check`, inline problems | Every rule in `parseQuizCsv` shows up inline before saving |
| 5 | Picker integration: New, Edit, Delete, Duplicate (from sheet/local), **Save & play** | Duplicating a Sheet quiz, editing it and clicking **Save & play** reaches the lobby; deleting a saved quiz removes it from the list and puts the file in `.trash/` |
| 6 | Drafts, unsaved-changes guards, key-handler isolation | Refreshing mid-edit offers a restore, and typing "s" or "m" in the builder does nothing global |
| 7 | Docs | `quiz-runbook.md` has a "Build a quiz on the site" section; CLAUDE.md's quiz section mentions `saved-quizzes/` and the `/quizzes` HTTP API |

Steps 1–2 ship independently (server only, no UI change). Steps 3–6 can ship together behind the existing host login.

## 7. Verification

- `npm run typecheck` and `npm run quiz:test` pass.
- Manual run with `npm run quiz:dev` and `npm run dev`: build a quiz with a multi-correct question, a T/F question, an image and double points. Play it with a phone plus `quiz:bots -- --n 20`, and check that the results CSV matches.
- Open the same quiz in two tabs, save in both, and confirm the second save gets the conflict prompt.
- On `ieee-dev.wpi.edu`, confirm that the PUT and DELETE methods pass through Apache's `/quiz-ws/` proxy with no config change, and that `saved-quizzes/` survives `./deploy.sh` and `./deploy-quiz.sh`.

## 8. Open questions

1. Should a builder-saved quiz be exportable to the Google Sheet format? A **Download CSV** button is cheap (the serializer already exists) and lets officers paste it into a Sheet tab. That's recommended as a small add-on to step 5.
2. Are hosts and editors the same people? This plan uses one password for both. A separate `QUIZ_EDITOR_PASSWORD` would be a small change if the club wants members to draft quizzes without being able to host.
3. Is the backup policy enough? This plan keeps one `.bak` per quiz plus `.trash/`. The alternative is to also copy the whole directory to the results folder daily.
