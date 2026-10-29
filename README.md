# Wordle Lab

Play Wordle in the browser and ask for a hint: the solver suggests the next
guess that tells you the most about the secret word, shows its entropy, and
explains why.

## Run it

Developed and tested on Node 26 with Yarn 1.

```
yarn install --frozen-lockfile
yarn build
yarn start
```

Then open http://localhost:5173. `yarn start` runs the API on port 3000 and
serves the built page on port 5173; Ctrl+C stops both.

| Command      | What it does                                                                    |
| ------------ | ------------------------------------------------------------------------------- |
| `yarn dev`   | API and page with live reload, same ports                                       |
| `yarn build` | Builds the server to `packages/server/dist` and the page to `packages/web/dist` |
| `yarn start` | Runs what `yarn build` made                                                     |
| `yarn test`  | Server tests (Jest), then web tests (Vitest)                                    |

`yarn dev` and `yarn start` use the same ports, so run one at a time.

Settings are optional; the defaults match the ports above. Copy
`packages/server/.env.example` to `packages/server/.env` to change `PORT` or
`CORS_ORIGINS`. The page calls the API at `VITE_API_BASE_URL`
(`packages/web/.env.example`), which is read at build time, so rebuild after
changing it.

## How it is put together

```
packages/server/            NestJS API
  data/                     word lists, first hint, simulation results
  src/main.ts               starts the server
  src/app.module.ts         lists the feature modules for the server
  src/app.setup.ts          server settings shared with the HTTP tests
  src/simulate.ts           the simulate command
  src/core/                 pure logic: no Nest, no HTTP
    engine/                 scoring, game state, remaining words, word loading
    solver/                 entropy ranking, explanations, playing every game
  src/modules/              Nest: one folder per feature
    games/                  the game over HTTP: controller, service, errors
    simulation/             Rerun over HTTP: starts the simulate command
packages/web/               React + Vite page
```

All game logic lives in the server. The page only calls the API and paints
what comes back; it never works out a tile's colour or which words remain.

Inside the server, `core/` is plain TypeScript with no Nest, Express or HTTP
imports, so a script or another server could use it as it is (the simulate
command does). `src/separation.spec.ts` fails the tests if that changes.

## Word lists

The original Wordle lists, from cfreshman's gists, not the New York Times'
later edits:

- `data/answers.txt`: 2,315 words the secret word is picked from
  ([wordle-answers-alphabetical.txt](https://gist.github.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b))
- `data/extra-guesses.txt`: 10,657 more words a player may type but that are
  never the secret word
  ([wordle-allowed-guesses.txt](https://gist.github.com/cfreshman/cdcdf777450c5b5301e439061d29694c))

A player may type any of the 12,972 words in both files. The loader rejects a
file with a word that isn't five letters or a word listed twice.

## API

All routes are under `/api`.

| Request                                            | Returns                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `POST /games`                                      | A new game: id, status, guesses, words remaining                                            |
| `POST /games/:id/guesses` with `{"word": "crane"}` | The guess's colours and the updated game                                                    |
| `GET /games/:id/hint`                              | Words remaining and the top five suggestions with their entropy                             |
| `GET /simulation`                                  | The last simulation's totals, date and time taken, and the run going on or the last failure |
| `POST /simulation/runs`                            | Starts the simulate command, or joins the run already going (202)                           |

The secret word is only included once the game is won or lost.

Errors have the body `{ statusCode, code, message }`:

| Status | Code                    | When                                        |
| ------ | ----------------------- | ------------------------------------------- |
| 400    | `not-five-letters`      | The guess isn't five letters                |
| 400    | `not-in-word-list`      | The guess isn't a word we accept            |
| 400    | `invalid-body`          | The body has no `word` string               |
| 404    | `game-not-found`        | Unknown id, or the game has expired         |
| 409    | `game-over`             | A guess or hint after the game has ended    |
| 500    | `simulation-unreadable` | The saved simulation file is not valid JSON |

Games are kept in memory: removed after an hour without a guess or hint, two
minutes after they end, or when more than 1,000 exist (least recently used
first).

## The solver

**Remaining words.** A word is still possible if, had it been the secret, every
guess so far would have shown exactly the colours it did. The game starts with
all 2,315 answers and narrows the list after each guess.

**Entropy.** For each of the 12,972 allowed guesses, the solver scores it
against every remaining word and groups those words by the colour pattern they
would produce. If a group holds `n` of the `N` remaining words, `p = n / N`, and
the guess's entropy in bits is

```
H = −Σ p · log₂ p
```

Higher entropy means the colours are harder to predict, so on average they
rule out more words. Each bit roughly halves the words left. The best possible
value is `log₂ N`, when every remaining word would give a different pattern.

**Tie-break.** Guesses are sorted by entropy, highest first, rounded to 9
decimal places so floating-point noise doesn't split real ties. Equal entropies
go to a guess that could itself be the secret word, then alphabetical order.
Entropy stays the ranking; the tie-break only orders exact ties.

**Explanation.** Each suggestion carries the number of groups, the worst case
(the largest group, so the most words that could be left), and whether it
could be the answer. The page turns these into a sentence such as "It can't be
the secret word, but it will rule out at least 6 of the 8 remaining possible
secret words."

**First hint.** Before any guess every game has the same remaining words, so
the first hint is always the same. Its five words are stored in
`data/first-hint.txt`, and only those are ranked for a game with no guesses,
which takes milliseconds instead of about 5 seconds. `first-hint.spec.ts` runs
the full search and fails if the file is out of date.

**Checked against published figures.** On the same 2,315-word answer list, the
full search ranks SOARE first at 5.886 bits and ROATE second at 5.883. Grant
Sanderson (3Blue1Brown) found SOARE best at 5.89 bits on that list, as reported
by HKUST's Science Focus [1], and Zébulon Goriely found SOARE best by entropy
with ROATE a close second, as reported by Cambridge's Department of Computer
Science and Technology [2]. `first-hint.spec.ts` fails if the search stops
agreeing with these.

1. Sonia Choy, "Demystifying Wordle: A Crash Course in Information Theory",
   _Science Focus_, HKUST. https://sciencefocus.hkust.edu.hk/node/202
2. Rachel Gardner, "The science behind that viral Wordle video…", Department
   of Computer Science and Technology, University of Cambridge, 21 February 2022. https://www.cst.cam.ac.uk/node/4163231

The page has a "How it works" page (`/help.html`) that explains the colours,
the count and entropy to a player through one example game.

## Tests

`yarn test` runs both packages.

- Server (Jest): scoring, including repeated letters (`SPEED` against `ABIDE`);
  word loading and counts; game state and its errors; remaining words always
  equal a full re-filter; scoring and remaining words against a real New York
  Times game; the solver's ranking, tie-break and explanations on small word
  lists; the first guesses against published results; the API over real HTTP,
  including every error and CORS; the separation check; the stored first hint.
- Web (Vitest): typing and key colours, the headline and messages, hint
  wording and bit formatting, reduced motion.

## Simulate

The solver plays one game for every possible answer, always guessing its own
top suggestion, and counts the guesses each game needed:

```
yarn build
node packages/server/dist/simulate.js            # all 2,315 games, about 15 s
node packages/server/dist/simulate.js --limit 50 # a quick check, not saved
```

A full run saves `packages/server/data/simulation.json`: the date, how long
it took, the totals, and every game's guesses. The results never vary between
runs: the solver has no randomness, so they change only when the word lists or
the solver change. `simulation-file.spec.ts` replays every 100th game and
fails if the saved file no longer matches.

`POST /api/simulation/runs` runs the same command from the server, as a
separate process capped at 64 MB of memory, so a run that fails or runs out of
memory stops only itself. Only one runs at a time; asking again while one is
going joins it. `GET /api/simulation` shows its progress, then the new
results. This works in both `yarn dev` and `yarn start`, since both compile
the command to `dist/simulate.js`.

The last full run won all 2,315 games, averaging 3.46 guesses:

| Guesses | 2   | 3     | 4   | 5   | 6   |
| ------- | --- | ----- | --- | --- | --- |
| Games   | 44  | 1,217 | 990 | 63  | 1   |

## Use of AI

Built with the help of Claude Code (Anthropic), working one small step at a
time; each step was reviewed and committed on its own. `git log` shows each
step in order.

- **Decided and written by me:** The build plan and its order, the stack, the
  visual design of every screen, and much of the player-facing wording,
  including how the help page explains entropy.
- **Written by the AI:** Most of the code and tests in both packages, the
  build and run scripts, and the earlier drafts of the page's wording and the
  "How it works" page.
- **How it was checked:** I read every diff before it was committed. The key
  tests check the code against answers that come from outside it, not from
  the AI:
  - the scorer and the remaining words against a real New York Times Wordle
    game (`packages/server/src/engine/remaining.spec.ts`);
  - the entropy against published first-guess results: SOARE best at 5.89
    bits, ROATE second (`packages/server/src/solver/first-hint.spec.ts`; see
    "Checked against published figures" above).

  The page was designed and signed off before any page code was written, then
  the built game was played live and refined.
