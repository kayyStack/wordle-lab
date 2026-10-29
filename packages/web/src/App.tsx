import { useEffect, useState } from 'react';
import { Board } from './Board.tsx';
import { Keyboard } from './Keyboard.tsx';
import { keyColours } from './typing.ts';
import { useGame } from './useGame.ts';

export function App() {
  const { game, typed, refused, keyGuesses, over, press, newGame } = useGame();
  const [flash, setFlash] = useState<{ key: string; id: number } | null>(null);
  const guesses = game?.guesses ?? [];

  function pressAndFlash(key: string) {
    const name = key.length === 1 ? key.toUpperCase() : key;
    if (!over) setFlash((last) => ({ key: name, id: (last?.id ?? 0) + 1 }));
    press(key);
  }

  // Subscribed again on each render so the handler always sees the latest state
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      // Stops Enter from also clicking an on-screen key that still has focus
      if (event.key === 'Enter') event.preventDefault();
      pressAndFlash(event.key);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div className="page">
      <header className="top">
        <span className="display brand">Wordle Lab</span>
        <button className="pill primary" onClick={() => void newGame()}>
          New game
        </button>
      </header>
      <main className="split">
        <section className="side" />
        <section className="game" aria-label="Game">
          <Board
            guesses={guesses}
            typed={typed}
            rows={game?.maxGuesses ?? 6}
            refused={refused}
            won={game?.status === 'won'}
          />
          <Keyboard
            colours={keyColours(keyGuesses)}
            disabled={over}
            flash={flash}
            onKey={pressAndFlash}
          />
        </section>
      </main>
    </div>
  );
}
