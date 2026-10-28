import { useEffect, useState } from 'react';
import { Board } from './Board.tsx';
import { Keyboard } from './Keyboard.tsx';
import type { Guess } from './types.ts';
import { keyColours, nextTyped } from './typing.ts';

const MAX_GUESSES = 6;

export function App() {
  const [guesses] = useState<Guess[]>([]);
  const [typed, setTyped] = useState('');

  function press(key: string) {
    // Enter sends the guess once the API is wired up
    if (key !== 'Enter') setTyped((current) => nextTyped(current, key));
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      // Stops Enter from also clicking an on-screen key that still has focus
      if (event.key === 'Enter') event.preventDefault();
      press(event.key);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="page">
      <header className="top">
        <span className="display brand">Wordle Lab</span>
      </header>
      <main className="split">
        <section className="side" />
        <section className="game" aria-label="Game">
          <Board guesses={guesses} typed={typed} rows={MAX_GUESSES} />
          <Keyboard colours={keyColours(guesses)} onKey={press} />
        </section>
      </main>
    </div>
  );
}
