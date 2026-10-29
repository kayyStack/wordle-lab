import { useEffect, useState } from 'react';
import { simulationStatus, startSimulation } from './api.ts';
import { lastRunText, resultText, seconds } from './simulationText.ts';
import type { SimulationResults, SimulationStatus } from './types.ts';

// How often to ask for progress while a run is going
const POLL_MS = 1000;

/**
 * "How good are the hints?": the helper's results over every possible secret
 * word, and a button to play them all again. A run started by anyone shows
 * here as it goes, since everyone asks the same server.
 */
export function HintsTested() {
  const [status, setStatus] = useState<SimulationStatus | null>(null);
  const [unreachable, setUnreachable] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function load() {
    try {
      setStatus(await simulationStatus());
      setUnreachable(false);
    } catch {
      setUnreachable(true);
    }
  }

  async function start() {
    setConfirming(false);
    try {
      const run = await startSimulation();
      setStatus((s) => s && { ...s, run, failure: null });
      setUnreachable(false);
    } catch {
      setUnreachable(true);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  // Keep asking while a run is going; stop once it has finished
  const running = status?.run ?? null;
  useEffect(() => {
    if (!running || unreachable) return;
    const timer = setTimeout(() => void load(), POLL_MS);
    return () => clearTimeout(timer);
  }, [running, unreachable]);

  const results = status?.results ?? null;
  const failed = !running && status?.failure;

  return (
    <section className="help-section" id="hints-tested">
      <div className="help-copy">
        <h2 className="display">How good are the hints?</h2>
        <p>
          To find out, the helper {results ? 'played' : 'can play'} every one of
          the <strong>2,315 words</strong> the secret word can be, always
          guessing its own top hint, the same one you would see.
        </p>
        {results && !unreachable && <ResultLine summary={results.summary} />}

        {unreachable ? (
          <div className="run-message" role="alert">
            <strong>We can't reach the game right now.</strong>
            <span className="note">Try again in a moment.</span>
            <div>
              <button className="pill primary" onClick={() => void load()}>
                Try again
              </button>
            </div>
          </div>
        ) : running ? (
          <div className="run-message" aria-live="polite">
            <strong>
              {running.total > 0
                ? `Playing game ${running.done.toLocaleString('en-US')} of ${running.total.toLocaleString('en-US')}…`
                : 'Starting…'}
            </strong>
            <div className="bar progress">
              <span
                style={{
                  width: `${running.total ? (running.done / running.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        ) : confirming && results ? (
          <div className="run-message">
            <strong>Play all 2,315 games again?</strong>
            <span className="note">
              The last run took {seconds(results.durationMs)}. You'll get the
              same results unless the word lists or the way hints are chosen
              have changed since.
            </span>
            <div className="run-actions">
              <button className="pill secondary" onClick={() => void start()}>
                Play them
              </button>
              <button className="link" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : failed ? (
          <div className="run-message" role="alert">
            <strong>That run stopped before it finished.</strong>
            <span className="note">Try again later.</span>
            <div>
              <button className="pill primary" onClick={() => void start()}>
                Try again
              </button>
            </div>
          </div>
        ) : status && !results ? (
          <div className="run-message">
            <div>
              <button className="pill secondary" onClick={() => void start()}>
                Play all 2,315 games
              </button>
            </div>
            <span className="note">It can take up to a minute.</span>
          </div>
        ) : results ? (
          <div className="run-message">
            <div>
              <button
                className="pill secondary"
                onClick={() => setConfirming(true)}
              >
                Play them all again
              </button>
            </div>
            <span className="note">{lastRunText(results)}</span>
          </div>
        ) : null}
      </div>

      {!unreachable && status && <Distribution status={status} />}
    </section>
  );
}

/** Games by the number of guesses they took, as bars */
function Distribution({ status }: { status: SimulationStatus }) {
  const byGuesses = status.results?.summary.byGuesses ?? {};
  const longest = Math.max(6, ...Object.keys(byGuesses).map(Number));
  const rows = Array.from({ length: longest }, (_, i) => ({
    guesses: i + 1,
    games: byGuesses[i + 1] ?? 0,
  }));
  const most = Math.max(1, ...rows.map((r) => r.games));

  const note = !status.results
    ? 'No games played yet'
    : status.run
      ? 'From the last run, until this one finishes'
      : `${status.results.summary.average.toFixed(2)} guesses on average`;

  return (
    <figure className="help-visual distribution">
      <figcaption className="dist-head">
        <span>Guesses needed</span>
        <span>Games</span>
      </figcaption>
      <div className={`dist ${status.run ? 'dim' : ''}`}>
        {rows.map((r) => (
          <div className="dist-row" key={r.guesses}>
            <span className="display">{r.guesses}</span>
            <div className="dist-track">
              <span style={{ width: `${(r.games / most) * 100}%` }} />
            </div>
            <span>{status.results ? r.games.toLocaleString('en-US') : ''}</span>
          </div>
        ))}
      </div>
      <p className="caption dist-note">{note}</p>
    </figure>
  );
}

/** The result sentence, with the hardest word in the game's word style */
function ResultLine({ summary }: { summary: SimulationResults['summary'] }) {
  const word = summary.hardest.secret;
  const [before, after] = resultText(summary).split(word);
  return (
    <p>
      {before}
      <span className="word">{word}</span>
      {after}
    </p>
  );
}
