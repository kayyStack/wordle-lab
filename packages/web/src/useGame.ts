import { useEffect, useRef, useState } from 'react';
import { createGame, guess } from './api.ts';
import type { GameView } from './types.ts';
import { pressKey } from './typing.ts';

/** The current game, the letters typed so far, and the actions the page can take. */
export function useGame() {
  const [game, setGame] = useState<GameView | null>(null);
  const [typed, setTypedState] = useState('');
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
    } catch {
      // A refused word stays in the row; its message comes in step 13
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
    else setTyped(result.typed);
  }

  useEffect(() => {
    void newGame();
  }, []);

  const over = game !== null && game.status !== 'playing';
  return { game, typed, over, press, newGame };
}
