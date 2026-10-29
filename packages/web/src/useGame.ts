import { useEffect, useRef, useState } from 'react';
import { ApiError, createGame, guess } from './api.ts';
import { prefersReducedMotion, revealMs } from './motion.ts';
import type { GameView, Guess } from './types.ts';
import { pressKey, WORD_LENGTH } from './typing.ts';

const REFUSED = ['not-in-word-list', 'not-five-letters'];

/** The current game, the letters typed so far, and the actions the page can take. */
export function useGame() {
  const [game, setGame] = useState<GameView | null>(null);
  const [typed, setTypedState] = useState('');
  // Counts refusals in a row, so the row wobbles again each time
  const [refused, setRefused] = useState(0);
  // The keys take a guess's colours only once its tiles have flipped
  const [keyGuesses, setKeyGuesses] = useState<Guess[]>([]);
  // Refs see every change at once, so key presses that arrive before the
  // next render still build on each other and Enter can't send twice.
  const typedRef = useRef('');
  const busyRef = useRef(false);
  const gameRef = useRef<GameView | null>(null);

  function setTyped(value: string) {
    typedRef.current = value;
    setTypedState(value);
  }

  function showGame(value: GameView) {
    gameRef.current = value;
    setGame(value);
  }

  async function newGame() {
    busyRef.current = true;
    try {
      showGame(await createGame());
      setTyped('');
      setRefused(0);
      setKeyGuesses([]);
    } catch {
      // Shown to the player in step 13
    } finally {
      busyRef.current = false;
    }
  }

  async function submit(gameId: string, word: string) {
    busyRef.current = true;
    try {
      const response = await guess(gameId, word);
      showGame(response.game);
      setTyped('');
      setRefused(0);
      const delay = prefersReducedMotion() ? 0 : revealMs(WORD_LENGTH);
      setTimeout(() => {
        // Skip it if New game was pressed while the row was flipping
        if (gameRef.current?.id === gameId) {
          setKeyGuesses(response.game.guesses);
        }
      }, delay);
    } catch (error) {
      // A refused word stays in the row; its message comes in step 13
      if (error instanceof ApiError && REFUSED.includes(error.code)) {
        setRefused((n) => n + 1);
      }
    } finally {
      busyRef.current = false;
    }
  }

  function press(key: string) {
    const current = gameRef.current;
    const locked =
      busyRef.current || current === null || current.status !== 'playing';
    const result = pressKey(typedRef.current, key, locked);
    if ('submit' in result) void submit(current!.id, result.submit);
    else if (result.tooShort) setRefused((n) => n + 1);
    else setTyped(result.typed);
  }

  useEffect(() => {
    void newGame();
  }, []);

  const over = game !== null && game.status !== 'playing';
  return { game, typed, refused, keyGuesses, over, press, newGame };
}
