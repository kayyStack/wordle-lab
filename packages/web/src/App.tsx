import { useEffect, useState } from 'react';
import { Board } from './Board.tsx';
import { headlineFor } from './headline.ts';
import { Hint } from './Hint.tsx';
import { Keyboard } from './Keyboard.tsx';
import { Side } from './Side.tsx';
import { keyColours } from './typing.ts';
import { useGame } from './useGame.ts';

export function App() {
  const {
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
    closeHint,
    newGame,
  } = useGame();
  const [flash, setFlash] = useState<{ key: string; id: number } | null>(null);
  const guesses = game?.guesses ?? [];
  // A hint can help while the game is on and the last row has finished flipping
  const canHint =
    game?.status === 'playing' &&
    revealed?.guesses.length === guesses.length &&
    notice?.kind !== 'unreachable' &&
    notice?.kind !== 'ended';

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
        <nav className="top-actions">
          <a className="link" href="/help.html">
            How it works
          </a>
          <button className="pill primary" onClick={() => void newGame()}>
            New game
          </button>
        </nav>
      </header>
      <main className="split">
        {hint ? (
          <Hint hint={hint} onHide={closeHint} />
        ) : (
          <Side
            headline={headlineFor(revealed, previous, notice)}
            onRetry={
              notice?.kind === 'unreachable'
                ? retry
                : notice?.kind === 'hint-failed'
                  ? () => void openHint()
                  : null
            }
            onHint={canHint ? () => void openHint() : null}
          />
        )}
        <section
          className={`game ${notice?.kind === 'unreachable' || notice?.kind === 'ended' ? 'faded' : ''}`}
          aria-label="Game"
        >
          <Board
            guesses={guesses}
            typed={typed}
            rows={game?.maxGuesses ?? 6}
            refused={refused}
            refusedRow={notice?.kind === 'refused'}
            won={game?.status === 'won'}
          />
          <Keyboard
            colours={keyColours(revealed?.guesses ?? [])}
            disabled={over}
            flash={flash}
            onKey={pressAndFlash}
          />
        </section>
      </main>
    </div>
  );
}
