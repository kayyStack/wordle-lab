import type { Headline } from './headline.ts';

interface SideProps {
  headline: Headline | null;
  /** Shown while the server can't be reached, or after a hint failed */
  onRetry: (() => void) | null;
  /** Shown while a hint can help */
  onHint: (() => void) | null;
}

/** The left column: one headline and one line under it. */
export function Side({ headline, onRetry, onHint }: SideProps) {
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
            <button className="pill secondary" onClick={onHint}>
              Need a hint?
            </button>
          </div>
        )
      )}
    </section>
  );
}
