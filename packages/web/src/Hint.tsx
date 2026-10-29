import { formatBits, hintReason, maxBits } from './hintText.ts';
import type { HintResponse } from './types.ts';

interface HintProps {
  hint: HintResponse;
  onHide: () => void;
}

/** "Try DUMPS." with its reason, its entropy, and the next best guesses. */
export function Hint({ hint, onHide }: HintProps) {
  const [best, ...others] = hint.suggestions;
  const max = maxBits(hint.remainingWords);
  const width = (bits: number) =>
    max > 0 ? `${Math.min(100, (bits / max) * 100)}%` : '100%';

  return (
    <section className="side hint" aria-label="Hint">
      <header className="hint-top">
        <span className="display brand">Wordle Lab</span>
        <button className="link" onClick={onHide}>
          Hide hint
        </button>
      </header>
      <p className="remaining">
        <span className="display">
          {hint.remainingWords.toLocaleString('en-US')}
        </span>{' '}
        words remaining
      </p>
      <h1 className="display headline">
        Try <span className="word">{best.word}</span>.
      </h1>
      <p className="line">{hintReason(best, hint.remainingWords)}</p>

      <div className="meter">
        <p className="meter-label">
          <strong>Entropy</strong>
          <strong>
            {formatBits(best.entropy)} bits out of a possible {formatBits(max)}
          </strong>
        </p>
        <div className="bar">
          <span style={{ width: width(best.entropy) }} />
        </div>
        <p className="meter-note">
          How much this guess narrows things down.{' '}
          <a className="link" href="/help.html#entropy">
            What's entropy?
          </a>
        </p>
      </div>

      {others.length > 0 && (
        <div className="others">
          <p className="others-head">
            <span>Other good guesses</span>
            <span>Entropy (bits)</span>
          </p>
          {others.map((s) => (
            <div className="other" key={s.word}>
              <span className="word">{s.word}</span>
              <div className="bar">
                <span style={{ width: width(s.entropy) }} />
              </div>
              <span>{formatBits(s.entropy)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="hide-pill">
        <button className="pill secondary" onClick={onHide}>
          Hide hint
        </button>
      </div>
    </section>
  );
}
