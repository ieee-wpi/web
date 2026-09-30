# IEEE Live Quiz: officer runbook

Players join at **ieee.wpi.edu/quiz**. The host screen is **ieee.wpi.edu/quiz/host**, which needs the host password.

---

## One-time setup (webmaster)

### 1. Node

Next 16 needs Node ≥ 20.9. The VM uses nvm in the `dev` user's home, so no sudo is needed:

```bash
nvm install 22 && nvm alias default 22
cd ~/web && rm -rf node_modules && npm ci
```

### 2. Game server config

```bash
cp game-server/.env.example game-server/.env
nano game-server/.env
```

Set these values:
- `QUIZ_HOST_PASSWORD`: pick something long and share it only with officers.
- `QUIZ_SHEET_PUB_BASE`: see "Quiz spreadsheet" below.

### 3. Apache (needs sudo)

The repo's `apache/000-default.conf` has the `/quiz-ws/` block. It must sit **above** the `ProxyPass /` line. Install it with:

```bash
apache2 -v                          # must be >= 2.4.47
sudo a2enmod proxy_wstunnel
sudo cp apache/000-default.conf /etc/apache2/sites-available/000-default.conf   # (or merge by hand; the repo copy has a {PATH} placeholder for certs)
sudo apache2ctl configtest && sudo systemctl reload apache2
```

### 4. Start it

`./deploy.sh` starts the quiz server (tmux session `quiz`) if it isn't running, then redeploys the site as before. To check it:

```bash
tmux ls                              # should list "prod" and "quiz"
curl -s localhost:9001/health        # {"ok":true,"games":0,"players":0,"rssMb":~50}
curl -s https://ieee.wpi.edu/quiz-ws/health   # same, through Apache
```

- **Restarting the quiz server:** use `./deploy-quiz.sh`. It asks first, because it ends any live game.
- **Site deploys:** `./deploy.sh` never touches the quiz server.

On the first deploy, run `chmod +x deploy-quiz.sh` if git didn't keep the executable bit.

---

## Build a quiz on the site

The easiest way to make a quiz. No spreadsheet needed.

1. Open the host screen and enter the host password.
2. Click **New quiz**. To start from an existing Sheet or local quiz, click its copy icon instead, which puts an editable copy in the builder.
3. Give the quiz a title, then fill in each question: the text, the time limit, points, an optional image URL, and the answers. Tick the check mark on every correct answer (any ticked answer scores).
4. Problems show up under the question as you type, and questions with problems get a red dot in the list. **Save** works even with problems, so you can finish later. **Save & host** needs a clean quiz and takes you back to the quiz list with it selected. Then click **Create game** as usual.

Quizzes built here show as **Built here** in the list, with **Edit** (pencil) and **Delete** (bin) buttons. Sheet and local quizzes can't be edited on the site; copy them instead.

- Unsaved work is kept in this browser, and the builder offers to restore it if the tab closes.
- If two officers save the same quiz, the second one is asked whether to overwrite or load the other version.
- Editing a quiz doesn't affect a game that's already running it.
- Files live on the VM in `game-server/saved-quizzes/` (not in git). Each save keeps the previous version as `<name>.csv.bak`, and deleted quizzes go to `saved-quizzes/.trash/`, where the webmaster can recover them.

## Quiz spreadsheet

Use a **new** Google Sheet, not the Wordle one. The Wordle sheet's link is visible to anyone who views the site's source.

1. **Index tab.** The first tab is named `Index` and has these columns:

   | title | gid | enabled |
   |---|---|---|
   | GBM Trivia, Oct 2026 | 123456789 | TRUE |

   `gid` is the number after `#gid=` in the URL when that quiz's tab is open. Set `enabled` to FALSE to hide a quiz from the host list.

2. **One tab per quiz.** Row 1 must be exactly this header:

   ```
   type | question | image | time | points | a1 | a2 | a3 | a4 | correct
   ```

   | column | values |
   |---|---|
   | `type` | `quiz` (2–4 answers) or `tf` (true/false) |
   | `question` | up to 120 characters |
   | `image` | optional. An `https://` image URL, or `/quiz/img/name.png` for a file committed to `public/quiz/img/`. **Don't use Google Drive links**; they don't load reliably. |
   | `time` | seconds: 5, 10, 20, 30, 45, 60, 90, 120 or 240 |
   | `points` | `standard` (1000 max), `double` (2000 max) or `none` (warm-up, not scored) |
   | `a1`–`a4` | answer text, up to 75 characters, filled from a1 with no gaps. Leave these blank for `tf`. |
   | `correct` | the answer number(s): `2`, or `1,3` if several are right. For `tf`: `true` or `false`. |

   Blank rows are skipped. A row whose first cell starts with `#` is a comment.

3. **Publish.** Go to File → Share → **Publish to web** → Entire document → **CSV** → Publish. Copy the link, drop everything after `/pub`, and put it in `QUIZ_SHEET_PUB_BASE`. The link looks like `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub`.

Edits to the sheet show up within about a minute, with no redeploy. A game that is already running keeps the version it started with.

`game-server/quizzes/Sample_Quiz.csv` shows the same format. Any CSV in that folder also appears in the host list as a "Local file", which is a good backup if Google is down.

### Scoring (same as Kahoot)

- **Correct answer:** between 1000 points (instant) and 500 points (at the buzzer). Double-points questions score twice that.
- **Wrong or no answer:** 0 points.
- **Answer streak:** +100 per consecutive correct answer, up to +500.
- **Ties:** go to whoever was faster across their correct answers.

---

## Event day

**The day before:**
- Open `/quiz/host`, pick the quiz and click it. The check must say "ready to play"; if it lists row problems, fix them in the sheet and click the quiz again.
- Optional smoke test from any laptop with the repo: `npm run quiz:build && npm run quiz:bots -- --url wss://ieee.wpi.edu/quiz-ws/ --origin https://ieee.wpi.edu --password <pw> --n 50`.

**At the event:**
1. On the projector laptop, open `ieee.wpi.edu/quiz/host` and enter the password.
2. Pick the quiz and choose the settings:
   - **Nickname generator:** players get random names like "Turbo Otter" and can't type their own. Recommended for big or unfamiliar crowds.
   - **Autoplay:** screens advance on their own after 5 seconds. Leave it off if an MC is talking.
3. Click **Create game**. This click also enables sound. Then press **F** for fullscreen, and turn off the laptop's sleep and screensaver.
4. Players scan the QR code or go to ieee.wpi.edu/quiz and type the PIN. Click a name to remove a player. Press **Lock** once everyone is in, so a leaked PIN can't be used to join.
5. **Start**, then drive the game with the keyboard or a presentation clicker:

   | key | action |
   |---|---|
   | Space / → / PageDown | next (start, show answers, scoreboard, next question) |
   | S | end the current question now |
   | M | mute or unmute |
   | F | fullscreen |

6. At the podium, click **Download results (CSV)** for prizes. Past results are listed under "Past results" on the quiz picker.

**If something goes wrong:**
- **Projector tab closed or refreshed:** reopen `/quiz/host` in the same browser tab/window and it picks up where it left off. The game keeps running on the server either way.
- **A player's phone locked or they refreshed:** they reopen `/quiz` and rejoin automatically with their score intact.
- **"Game server unreachable":** run `tmux ls` on the VM. If `quiz` is missing, run `./deploy.sh` (safe) or `./deploy-quiz.sh`.
- **Don't run `./deploy-quiz.sh` during a game.** `./deploy.sh` is safe to run.
