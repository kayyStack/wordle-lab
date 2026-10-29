import { useEffect, useRef, useState } from 'react';
import { ApiError, createGame, guess, hint as fetchHint } from './api.ts';
import type { Notice } from './headline.ts';
import { prefersReducedMotion, revealMs } from './motion.ts';
import type { GameView, HintResponse } from './types.ts';
import { pressKey, WORD_LENGTH } from './typing.ts';

const REFUSED = ['not-in-word-list', 'not-five-letters'];

/** The current game, the letters typed so far, and the actions the page can take. */
export function useGame() {
  const [game, setGame] = useState<GameView | null>(null);
  const [typed, setTypedState] = useState('');
  // The count before the last guess, to tell when a guess ruled nothing out
  const [previous, setPrevious] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  // The hint the player asked for. A new guess makes it stale, but it stays
  // open until that guess's row has flipped, so the page changes only once.
  const [hint, setHint] = useState<HintResponse | null>(null);
  // Counts refusals in a row, so the row wobbles again each time
  const [refused, setRefused] = useState(0);
  // The game as of the last row that finished flipping. The keys and the
  // headline follow this one, so they don't give a guess away early.
  const [revealed, setRevealed] = useState<GameView | null>(null);
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

  function unreachable(retry: () => Promise<void>) {
    retryRef.current = retry;
    setNotice({ kind: 'unreachable' });
  }

  function ended() {
    endedRef.current = true;
    retryRef.current = null;
    setHint(null);
    setNotice({ kind: 'ended' });
  }

  const isGone = (error: unknown) =>
    error instanceof ApiError && error.code === 'game-not-found';

  function reached() {
    retryRef.current = null;
    setNotice(null);
  }

  async function newGame() {
    busyRef.current = true;
    try {
      const created = await createGame();
      showGame(created);
      setRevealed(created);
      endedRef.current = false;
      setHint(null);
      reached();
      setTyped('');
      setPrevious(null);
      setRefused(0);
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
      setRefused(0);
      const delay = prefersReducedMotion() ? 0 : revealMs(WORD_LENGTH);
      setTimeout(() => {
        // Skip it if New game was pressed while the row was flipping
        if (gameRef.current?.id === gameId) {
          setPrevious(before);
          setRevealed(response.game);
          setHint(null);
        }
      }, delay);
    } catch (error) {
      if (error instanceof ApiError && REFUSED.includes(error.code)) {
        setNotice({ kind: 'refused', word });
        setRefused((n) => n + 1);
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
      setRefused((n) => n + 1);
    } else if (result.typed !== typedRef.current) {
      setTyped(result.typed);
      // Typing again puts the count back in the headline
      setNotice((n) => (n?.kind === 'unreachable' ? n : null));
    }
  }

  async function openHint() {
    const current = gameRef.current;
    if (!current || busyRef.current) return;
    try {
      setHint(await fetchHint(current.id));
      setNotice((n) => (n?.kind === 'unreachable' ? n : null));
    } catch (error) {
      if (isGone(error)) ended();
      else setNotice({ kind: 'hint-failed' });
    }
  }

  function retry() {
    if (retryRef.current && !busyRef.current) void retryRef.current();
  }

  useEffect(() => {
    void newGame();
  }, []);

  const over = game !== null && game.status !== 'playing';
  return {
    game,
    typed,
    previous,
    notice,
    refused,
    revealed,
    over,
    hint,
    press,
    retry,
    openHint,
    closeHint: () => setHint(null),
    newGame,
  };
}
