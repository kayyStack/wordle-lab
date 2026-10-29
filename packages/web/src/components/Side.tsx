import type { Headline } from '../lib/headline.ts';

interface SideProps {
  headline: Headline | null;
  /** Shown while the server can't be reached, or after a hint failed */
  onRetry: (() => void) | null;
  /** Shown while a hint can help */
  onHint: (() => void) | null;
  /** True while a row is flipping: the button stays in place but waits */
  hintWaiting: boolean;
}

/** The left column: one headline and one line under it. */
export function Side({ headline, onRetry, onHint, hintWaiting }: SideProps) {
  if (!headline) return <section className="side" />;
  const word = headline.refusedWord;
  return (
    <section className="side" aria-live="polite">
      <h1 className="display headline">
        {word ? (
          <>
            <span className="refused">{word}</span>
            {headline.title.slice(word.length)}
          </>
        ) : (
          headline.title
        )}
      </h1>
      <p className="line">{headline.line}</p>
      {onRetry ? (
        <div>
          <button className="pill primary" onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : (
        onHint && (
          <div>
            <button
              className="pill secondary"
              disabled={hintWaiting}
              onClick={onHint}
            >
              Need a hint?
            </button>
          </div>
        )
      )}
    </section>
  );
}
