# Wordle Lab

Wordle in the browser, with a helper that suggests your next guess. It picks
the guess whose colours you can least predict (the highest entropy), shows
that entropy, and says in plain words how many words it will rule out. All
game logic runs on a NestJS server; the React page only displays what the
server sends back.

## Run it

You need Node 26 and Yarn 1. Install once:

```
yarn install --frozen-lockfile
```

Then either:

- **Play the built app:** `yarn build`, then `yarn start`.
- **Work on the code, with live reload:** `yarn dev`.

Both open the game at http://localhost:5173, with the API on port 3000, so run
one at a time. `yarn test` runs every test.

To change the ports, copy the `.env.example` files in `packages/server` and
`packages/web` to `.env`. The page's API address is read at build time, so
rebuild after changing it.

## The brief, and where it is

Server paths are under `packages/server/src/`, page paths under
`packages/web/src/`.

| The brief asks for                       | Where it is                                       |
| ---------------------------------------- | ------------------------------------------------- |
| Score a guess                            | `core/engine/score.ts`                            |
| Game state, win or lose, allowed words   | `core/engine/game.ts`                             |
| Load the word list from a file           | `core/engine/words.ts`, reading `data/`           |
| Which words are still possible           | `core/engine/remaining.ts`                        |
| Rank guesses by entropy, top with scores | `core/solver/suggest.ts`                          |
| Start a game, guess, hint, clear errors  | `modules/games/` ([API](#api))                    |
| Board, keyboard, coloured tiles          | `components/Board.tsx`, `components/Keyboard.tsx` |
| Hint panel                               | `components/Hint.tsx`                             |
| "Words remaining" counter                | `components/Side.tsx`                             |
| Errors without breaking the page         | `hooks/useGame.ts`                                |
| Simulate (optional)                      | [Simulation](#simulation)                         |

**Choices worth knowing**

- **Every guess is scored in two passes.** First, each letter is compared with
  the secret word's letter in the same spot: matches turn green, and the
  secret's other letters are counted. Then each remaining letter of the guess
  turns yellow only if one of those counted letters is still unused, and uses
  it up. That is why a letter you type twice only lights up as many times as
  the secret word has it.
- **The solver tries all 12,972 words you may type**, not only the 2,315 that
  can be the secret: a word that can't win often splits the rest better.
- **The first hint is stored** in `data/first-hint.txt`. Before any guess every
  game has the same words left, so its best guesses never change, and ranking
  only those takes milliseconds instead of about 5 seconds.
- **The counter is a sentence**, "Only 8 words could still be the secret
  word.", because a bare "8" means nothing to a new player.
- **The page holds only the game's id.** Coming back from How it works, or
  reloading, fetches the game again (`GET /api/games/:id`), so the two pages
  are plain HTML pages joined by links, with no router.
- **`core/` never imports Nest**, so the simulate command uses the solver
  directly; `separation.spec.ts` fails if that changes.
- **Word lists:** the original Wordle lists, not the New York Times' later
  edits:
  [answers](https://gist.github.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b)
  (2,315) and
  [other allowed guesses](https://gist.github.com/cfreshman/cdcdf777450c5b5301e439061d29694c)
  (10,657).

**Caveats**

- **Looking two guesses ahead.** The solver only picks the best single next guess; looking further finds a better opener, increases complexity and is deliberately left out of scope (SLANE, as reported
  in [1] under [The solver](#the-solver)).

## API

All routes are under `/api`.

| Request                                            | Returns                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `POST /games`                                      | A new game: id, status, guesses, words remaining                                            |
| `GET /games/:id`                                   | The game as it stands, so the page can pick it up again after a reload                      |
| `POST /games/:id/guesses` with `{"word": "crane"}` | The guess's colours and the updated game                                                    |
| `GET /games/:id/hint`                              | Words remaining and the top five suggestions with their entropy                             |
| `GET /simulation`                                  | The last simulation's totals, date and time taken, and the run going on or the last failure |
| `POST /simulation/runs`                            | Starts the simulate command, or joins the run already going (202)                           |

Errors have the body `{ statusCode, code, message }`:

| Status | Code                    | When                                        |
| ------ | ----------------------- | ------------------------------------------- |
| 400    | `not-five-letters`      | The guess isn't five letters                |
| 400    | `not-in-word-list`      | The guess isn't a word we accept            |
| 400    | `invalid-body`          | The body has no `word` string               |
| 404    | `game-not-found`        | Unknown id, or the game has expired         |
| 409    | `game-over`             | A guess or hint after the game has ended    |
| 500    | `simulation-unreadable` | The saved simulation file is not valid JSON |

## The solver

**Entropy.** For each allowed guess, the solver scores it against every word
that could still be the secret and groups those words by the colours they
would show. If a group holds `n` of the `N` remaining words, `p = n / N`, and
the guess's entropy in bits is

```
H = −Σ p · log₂ p
```

Higher entropy means the colours are harder to predict, so on average they rule
out more words; each bit roughly halves them. The most possible is `log₂ N`,
when every remaining word would show different colours.

**Tie-break.** Guesses are sorted by entropy, highest first, rounded to 9
decimal places so floating-point noise doesn't split real ties. Equal
entropies go to a guess that could itself be the secret word, then to
alphabetical order. Entropy stays the ranking; the tie-break only orders exact
ties.

**Explanation.** Each suggestion carries the number of groups, the worst case
(the largest group: the most words that could be left) and whether it could be
the answer. The page turns these into a sentence such as "It can't be the
secret word, but it will rule out at least 6 of the 8 remaining possible secret
words." How it works (`/help.html`) explains the colours, the count and entropy
to a player through one example game.

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

## Simulation

The solver plays one game for every possible secret word, always guessing its
own top suggestion, and counts the guesses each game needed. The last full run
won all 2,315 games, averaging 3.46 guesses:

| Guesses | 2   | 3     | 4   | 5   | 6   |
| ------- | --- | ----- | --- | --- | --- |
| Games   | 44  | 1,217 | 990 | 63  | 1   |

Run it from the terminal after `yarn build`:

```
node packages/server/dist/simulate.js            # all 2,315 games, about 15 s
node packages/server/dist/simulate.js --limit 50 # a quick check, not saved
```

Or on the page: "How good are the hints?" at the end of How it works
(`/help.html#hints-tested`), reached from the hint panel. Its "Play them all
again" button runs the same command on the server as a separate process,
capped at 64 MB of memory, so a run that fails stops only itself. One run at a
time; pressing again while one is going joins it.

A full run saves `packages/server/data/simulation.json`. The solver has no
randomness, so the games come out the same every time; only the date and the
time taken change. That still shows the file as modified in `git status`;
`git checkout packages/server/data/simulation.json` puts it back.
`simulation-file.spec.ts` replays every 100th saved game and fails if the file
no longer matches the solver.

## Tests

`yarn test` runs both packages.

- Server (Jest): scoring, including repeated letters (`SPEED` against
  `ABIDE`); word loading; game state and its errors; remaining words always
  equal a full re-filter; scoring and remaining words against a real New York
  Times game; the solver's ranking, tie-break and explanations on small word
  lists; the first guesses against published results; the simulation and its
  saved file; the API over real HTTP, including every error and CORS; the
  separation check.
- Web (Vitest): typing and key colours, the headline and messages, hint and
  simulation wording, the saved game id, reduced motion.

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
  tests check the code against answers that come from outside it:
  - the scorer and the remaining words against a real New York Times Wordle
    game (`packages/server/src/core/engine/remaining.spec.ts`);
  - the entropy against published first-guess results: SOARE best at 5.89
    bits, ROATE second (`packages/server/src/core/solver/first-hint.spec.ts`;
    see "Checked against published figures" above).

  The page was designed and signed off before any page code was written, then
  the built game was played live and refined.
