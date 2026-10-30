import { useEffect, useState } from 'react';
import { Board } from '../../components/Board.tsx';
import { headlineFor } from '../../lib/headline.ts';
import { HeadlinePanel } from '../../components/HeadlinePanel.tsx';
import { Hint } from '../../components/Hint.tsx';
import { Keyboard } from '../../components/Keyboard.tsx';
import { keyColours } from '../../lib/typing.ts';
import { useGame } from '../../hooks/useGame.ts';

export function App() {
  const {
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
    closeHint,
    newGame,
  } = useGame();
  const [flash, setFlash] = useState<{ key: string; id: number } | null>(null);
  const guesses = game?.guesses ?? [];
  // Nothing can be sent: the server is down or no longer has this game
  const cutOff = notice?.kind === 'unreachable' || notice?.kind === 'ended';
  // While a row is flipping the hint button stays put (so the headline
  // doesn't move) but waits, so the hint can't show the new count before
  // the tiles do.
  const canHint = game?.status === 'playing' && !cutOff;
  const flipping = revealed?.guesses.length !== guesses.length;

  let onRetry: (() => void) | null = null;
  if (notice?.kind === 'unreachable') onRetry = retry;
  if (notice?.kind === 'hint-failed') onRetry = () => void openHint();

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
          <HeadlinePanel
            headline={headlineFor(revealed, countBefore, notice)}
            onRetry={onRetry}
            onHint={canHint ? () => void openHint() : null}
            hintWaiting={flipping}
          />
        )}
        <section className={`game ${cutOff ? 'faded' : ''}`} aria-label="Game">
          <Board
            guesses={guesses}
            typed={typed}
            rows={game?.maxGuesses ?? 6}
            refusals={refusals}
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
