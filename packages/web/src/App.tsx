import { useEffect } from 'react';
import { Board } from './Board.tsx';
import { Keyboard } from './Keyboard.tsx';
import { keyColours } from './typing.ts';
import { useGame } from './useGame.ts';

export function App() {
  const { game, typed, over, press, newGame } = useGame();
  const guesses = game?.guesses ?? [];

  // Subscribed again on each render so the handler always sees the latest state
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      // Stops Enter from also clicking an on-screen key that still has focus
      if (event.key === 'Enter') event.preventDefault();
      press(event.key);
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
          <Board guesses={guesses} typed={typed} rows={game?.maxGuesses ?? 6} />
          <Keyboard
            colours={keyColours(guesses)}
            disabled={over}
            onKey={press}
          />
        </section>
      </main>
    </div>
  );
}
