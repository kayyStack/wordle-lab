import { useEffect, useRef, useState } from 'react';
import {
  ApiError,
  createGame,
  getGame,
  guess,
  hint as fetchHint,
} from '../api/client.ts';
import type { Notice } from '../lib/headline.ts';
import { prefersReducedMotion, revealMs } from '../lib/motion.ts';
import type { GameView, HintResponse } from '../api/types.ts';
import { saveGameId, savedGameId } from '../lib/savedGame.ts';
import { pressKey, WORD_LENGTH } from '../lib/typing.ts';

const REFUSED = ['not-in-word-list', 'not-five-letters'];

const isGone = (error: unknown) =>
  error instanceof ApiError && error.code === 'game-not-found';

/**
 * The current game, the letters typed so far, and the actions the page can take.
 *
 * The game is held three ways:
 * - `game`: the latest from the server. The board shows it, so a new row
 *   starts flipping as soon as the guess comes back.
 * - `revealed`: the game as of the last row that finished flipping. The
 *   headline and keys follow it, so they don't give a guess away early.
 * - `gameRef`: the same as `game`, but readable before the next render.
 */
export function useGame() {
  const [game, setGame] = useState<GameView | null>(null);
  const [revealed, setRevealed] = useState<GameView | null>(null);
  const [typed, setTypedState] = useState('');
  // The count before the last guess, to tell when a guess ruled nothing out
  const [countBefore, setCountBefore] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  // The hint the player asked for. A new guess makes it stale, but it stays
  // open until that guess's row has flipped, so the page changes only once.
  const [hint, setHint] = useState<HintResponse | null>(null);
  // Refusals in a row; each one makes the typed row wobble again
  const [refusals, setRefusals] = useState(0);

  // Refs see every change at once, so key presses that arrive before the
  // next render still build on each other and Enter can't send twice.
  const typedRef = useRef('');
  const busyRef = useRef(false);
  const gameRef = useRef<GameView | null>(null);
  // Set while the server can't be reached: what "Try again" repeats
  const retryRef = useRef<(() => Promise<void>) | null>(null);
  // Set once the server no longer has this game (it expired or restarted)
  const endedRef = useRef(false);

  function setTyped(value: string) {
    typedRef.current = value;
    setTypedState(value);
  }

  function showGame(value: GameView) {
    gameRef.current = value;
    setGame(value);
  }

  // Clears a message once the player moves on; "can't reach" stays until a
  // request gets through
  function clearNotice() {
    setNotice((n) => (n?.kind === 'unreachable' ? n : null));
  }

  function unreachable(retry: () => Promise<void>) {
    retryRef.current = retry;
    setNotice({ kind: 'unreachable' });
  }

  function reached() {
    retryRef.current = null;
    setNotice(null);
  }

  function ended() {
    endedRef.current = true;
    retryRef.current = null;
    setHint(null);
    setNotice({ kind: 'ended' });
  }

  async function newGame() {
    busyRef.current = true;
    try {
      const created = await createGame();
      saveGameId(created.id);
      showGame(created);
      setRevealed(created);
      endedRef.current = false;
      setHint(null);
      reached();
      setTyped('');
      setCountBefore(null);
      setRefusals(0);
    } catch {
      unreachable(newGame);
    } finally {
      busyRef.current = false;
    }
  }

  async function submit(gameId: string, word: string) {
    busyRef.current = true;
    try {
      const response = await guess(gameId, word);
      const before = gameRef.current?.remainingWords ?? null;
      showGame(response.game);
      reached();
      setTyped('');
      setRefusals(0);
      const delay = prefersReducedMotion() ? 0 : revealMs(WORD_LENGTH);
      setTimeout(() => {
        // Skip it if New game was pressed while the row was flipping
        if (gameRef.current?.id === gameId) {
          setCountBefore(before);
          setRevealed(response.game);
          setHint(null);
        }
      }, delay);
    } catch (error) {
      if (error instanceof ApiError && REFUSED.includes(error.code)) {
        setNotice({ kind: 'refused', word });
        setRefusals((n) => n + 1);
      } else if (isGone(error)) {
        ended();
      } else {
        unreachable(() => submit(gameId, word));
      }
    } finally {
      busyRef.current = false;
    }
  }

  function press(key: string) {
    const current = gameRef.current;
    const locked =
      busyRef.current ||
      retryRef.current !== null ||
      endedRef.current ||
      current === null ||
      current.status !== 'playing';
    const result = pressKey(typedRef.current, key, locked);
    if ('submit' in result) {
      void submit(current!.id, result.submit);
    } else if (result.tooShort) {
      setNotice({ kind: 'too-short' });
      setRefusals((n) => n + 1);
    } else if (result.typed !== typedRef.current) {
      setTyped(result.typed);
      clearNotice();
    }
  }

  async function openHint() {
    const current = gameRef.current;
    if (!current || busyRef.current) return;
    try {
      setHint(await fetchHint(current.id));
      clearNotice();
    } catch (error) {
      if (isGone(error)) ended();
      else setNotice({ kind: 'hint-failed' });
    }
  }

  function retry() {
    if (retryRef.current && !busyRef.current) void retryRef.current();
  }

  // Picks up this tab's game if the server still has it, else starts one
  async function start() {
    const id = savedGameId();
    if (!id) return newGame();
    busyRef.current = true;
    let gone = false;
    try {
      const found = await getGame(id);
      showGame(found);
      setRevealed(found);
      reached();
    } catch (error) {
      if (isGone(error)) gone = true;
      else unreachable(start);
    } finally {
      busyRef.current = false;
    }
    if (gone) await newGame();
  }

  useEffect(() => {
    void start();
  }, []);

  const over = game !== null && game.status !== 'playing';
  return {
    game,
    revealed,
    typed,
    countBefore,
    notice,
    refusals,
    over,
    hint,
    press,
    retry,
    openHint,
    closeHint: () => setHint(null),
    newGame,
  };
}
