import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { COLOUR_NAMES } from '../../components/Board.tsx';
import { HintsTested } from '../../components/HintsTested.tsx';
import type { TileColour } from '../../api/types.ts';

// Every example follows one game whose secret word is SHAKE. Patterns are
// real engine output: G green, Y yellow, . dark.
const COLOUR: Record<string, TileColour> = {
  G: 'green',
  Y: 'yellow',
  '.': 'gray',
};

function Row({ word, pattern }: { word: string; pattern?: string }) {
  return (
    <div className="help-row">
      {[...word].map((letter, i) => (
        <span className={`tile ${pattern ? COLOUR[pattern[i]] : ''}`} key={i}>
          {letter}
        </span>
      ))}
    </div>
  );
}

/** A guess's colours as five small squares, for the lists of results */
function Mini({ pattern }: { pattern: string }) {
  const colours = [...pattern].map((p) => COLOUR[p]);
  return (
    <span
      className="mini"
      aria-label={colours.map((c) => COLOUR_NAMES[c]).join(', ')}
    >
      {colours.map((c, i) => (
        <span className={c} key={i} />
      ))}
    </span>
  );
}

const Word = ({ children }: { children: ReactNode }) => (
  <span className="word">{children}</span>
);

// With the 8 words left: each colour pattern a guess can get, and what it leaves
const DUMPS_OUTCOMES: [string, string, string?][] = [
  ['....Y', 'SHAKE', 'SHAVE'],
  ['Y...Y', 'SHADE'],
  ['..Y.Y', 'SHAME'],
  ['...GY', 'SHAPE'],
  ['Y..YY', 'SPADE'],
  ['.G..Y', 'SUAVE'],
  ['.Y..Y', 'USAGE'],
];

const SHAKE_OUTCOMES: [string, string][] = [
  ['GGGGG', 'You win.'],
  ['GGG.G', '4 words left: SHADE, SHAME, SHAPE, SHAVE'],
  ['G.G.G', '2 words left: SPADE, SUAVE'],
  ['Y.G.G', '1 word left: USAGE'],
];

function Section({
  id,
  title,
  copy,
  visual,
}: {
  id?: string;
  title: string;
  copy: ReactNode;
  visual: ReactNode;
}) {
  return (
    <section className="help-section" id={id}>
      <div className="help-copy">
        <h2 className="display">{title}</h2>
        {copy}
      </div>
      <div className="help-visual">{visual}</div>
    </section>
  );
}

const HOLD_MS = 1500;

export function Help() {
  const hash = location.hash.slice(1);
  // Opened at "How good are the hints?", the page stays hidden (just the
  // ground colour) until that section has its results, then shows already
  // scrolled there, so it never flashes the top or a half-filled section.
  // It shows anyway after HOLD_MS if the server is slow.
  const [ready, setReady] = useState(hash !== 'hints-tested');
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), HOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  // The browser looks for the #section before this page is drawn, so scroll
  // here instead; a layout effect runs before the browser paints
  useLayoutEffect(() => {
    if (ready && hash) document.getElementById(hash)?.scrollIntoView();
  }, [ready, hash]);

  return (
    <div className="help" style={ready ? undefined : { visibility: 'hidden' }}>
      <header className="top">
        <span className="display brand">Wordle Lab</span>
        <a className="pill primary" href="/">
          Back to the game
        </a>
      </header>

      <main className="help-wrap">
        <section className="help-section help-intro">
          <div className="help-copy">
            <h1 className="display">How Wordle Lab works</h1>
            <p>
              It's Wordle, with a helper that can suggest your next guess and
              show you why it's a good one.
            </p>
          </div>
        </section>

        <Section
          title="How to play"
          copy={
            <>
              <p>
                There's a secret five-letter word. You have{' '}
                <strong>six guesses</strong> to find it.
              </p>
              <p>
                Type any real five-letter word and press Enter. Each letter then
                changes colour to tell you how close you are. Use what the
                colours tell you to make your next guess better.
              </p>
              <p>
                Stuck? <strong>Need a hint?</strong> suggests a guess.
              </p>
            </>
          }
          visual={
            <>
              <div className="help-board" aria-label="An empty board">
                {Array.from({ length: 6 }, (_, i) => (
                  <Row word="     " key={i} />
                ))}
              </div>
              <p className="caption">Six guesses, five letters each.</p>
            </>
          }
        />

        <Section
          title="What the colours mean"
          copy={
            <>
              <p>
                To show what the colours tell you, the rest of this page follows{' '}
                <strong>one game</strong>. Its secret word is <Word>SHAKE</Word>
                ; the player can't see it.
              </p>
              <p>
                After each guess, every letter changes colour to tell you
                something about the secret word.
              </p>
              <p>
                When a letter appears twice in your guess but only once in the
                secret word, <strong>only one of them lights up</strong>. The
                other turns dark.
              </p>
            </>
          }
          visual={
            <>
              <Row word="SHAKE" />
              <p className="caption">
                The secret word in our game. The player never sees this.
              </p>
              <p className="label">The player's first two guesses</p>
              <Row word="CRANE" pattern="..G.G" />
              <Row word="BLAST" pattern="..GY." />
              <div className="legend">
                <Row word="A" pattern="G" /> Green: SHAKE has an A in that spot.
              </div>
              <div className="legend">
                <Row word="S" pattern="Y" /> Yellow: SHAKE has an S, but in a
                different spot.
              </div>
              <div className="legend">
                <Row word="B" pattern="." /> Dark: SHAKE has no B.
              </div>
              <Row word="SHEEP" pattern="GGY.." />
              <p className="caption">
                If the player had guessed <Word>SHEEP</Word> instead:{' '}
                <Word>SHAKE</Word> has one E, so only one of SHEEP's two E's
                turns yellow.
              </p>
            </>
          }
        />

        <Section
          title="The count on your screen"
          copy={
            <>
              <p>
                Before your first guess, the secret word could be any of{' '}
                <strong>2,315 words</strong>. Every colour you see rules some of
                them out, because the secret word has to agree with every colour
                on your board.
              </p>
              <p>
                That's what the count on your screen tells you. It never means
                the secret word changed, only that given the colours on your
                board there are that number of words that could work as the
                secret word.
              </p>
            </>
          }
          visual={
            <>
              <div className="steps">
                {[
                  ['2,315', 'before any guess'],
                  ['44', 'after CRANE'],
                  ['8', 'after BLAST'],
                ].map(([n, label]) => (
                  <div key={n}>
                    <span className="display big">{n}</span>
                    <span className="caption">{label}</span>
                  </div>
                ))}
              </div>
              <p className="caption">
                After <Word>CRANE</Word> and <Word>BLAST</Word>, only these
                could work as the secret word:{' '}
                <Word>
                  SHADE, SHAKE, SHAME, SHAPE, SHAVE, SPADE, SUAVE, USAGE
                </Word>
                . SHAKE is one of them, but the player can't tell which.
              </p>
            </>
          }
        />

        <Section
          id="entropy"
          title="What entropy means"
          copy={
            <>
              <p>
                <strong>
                  Entropy measures how unpredictable something is.
                </strong>{' '}
                In this game, it tells you how unpredictable the colours you get
                back from a guess are.
              </p>
              <p>
                At every stage, there are only so many words that could still be
                the secret word. The colours you get back rule some of them out.
                The goal is to rule out as many as possible and close in on the
                secret word.
              </p>
              <p>
                The more predictable the colours, the less you learn by seeing
                them: you learn nothing by asking a question you already know
                the answer to. The less predictable the colours, the more words
                they rule out: in a guessing game, an answer you don't already
                know rules out more possibilities.
              </p>
              <p>
                <strong>
                  Entropy measures how much a guess usually narrows down the
                  words.
                </strong>{' '}
                It's counted in <strong>bits</strong>: each bit means the
                colours usually halve the number of words that could still be
                the secret word.
              </p>
            </>
          }
          visual={
            <>
              <Row word="TRACE" pattern="..G.G" />
              <p className="caption">
                Given <Word>CRANE</Word>, <Word>BLAST</Word> and their colours,{' '}
                <Word>TRACE</Word> can't be the secret word: T, R and C have
                already come back dark. You also know exactly what colours it
                would get: A and E green, in the same spots as before, and the
                rest dark. The answer is predictable and you learn nothing new,
                so it rules out no other words: <strong>0 bits</strong>.
              </p>
              <Row word="BEACH" pattern=".YG.Y" />
              <p className="caption">
                <Word>BEACH</Word>, on the other hand, asks a question you can't
                answer yet. From your board, you already know B and C aren't in
                the secret word and the A goes in the middle. What you don't
                know is whether it has an H. You can't predict that, so whatever
                colour the H gets teaches you something new.
              </p>
              <p className="caption">
                In our game, five of the 8 words that could work as the secret
                word have an H: <Word>SHADE, SHAKE, SHAME, SHAPE, SHAVE</Word>.
                Three don't: <Word>SPADE, SUAVE, USAGE</Word>. So whichever
                colour the H gets, about half the words are ruled out. Halving
                the words is <strong>1 bit</strong>. BEACH gets 0.95, just under
                1, because 5 and 3 isn't quite half.
              </p>
              <p className="caption">
                If a guess could cut the words in half again, down to a quarter,
                that would be <strong>2 bits</strong>. One more halving leaves a
                single word: <strong>3 bits</strong>, the most any guess can
                have with 8 words.
              </p>
            </>
          }
        />

        <Section
          title="How a hint is chosen"
          copy={
            <>
              <p>
                A hint is the guess whose colours are hardest to predict: the
                one with the <strong>highest entropy</strong>.
              </p>
              <p>
                The helper doesn't know the secret word either. It only sees the
                colours on your board, just like you.
              </p>
              <p>
                To find the hint, the helper does what you just did with{' '}
                <Word>TRACE</Word> and <Word>BEACH</Word>, but for every one of
                the <strong>12,972 words</strong> you're allowed to type. For
                each word, it looks at the 8 words that still agree with the
                colours on your board and works out how many of them that word
                would usually rule out. The word that usually rules out the most
                becomes the top suggestion, shown with its entropy.
              </p>
              <p>
                In our game, that's <Word>DUMPS</Word>:{' '}
                <strong>2.75 bits out of a possible 3</strong>. Whatever colours
                it gets back, it rules out at least 6 of the 8.
              </p>
            </>
          }
          visual={
            <>
              <p className="label">
                If you guess <Word>DUMPS</Word> and you see…
              </p>
              {DUMPS_OUTCOMES.map(([pattern, first, second]) => (
                <p className="result" key={pattern}>
                  <Mini pattern={pattern} /> it must be <Word>{first}</Word>
                  {second && (
                    <>
                      {' '}
                      or <Word>{second}</Word>
                    </>
                  )}
                </p>
              ))}
            </>
          }
        />

        <Section
          title="Why not just guess one of the 8?"
          copy={
            <>
              <p>
                You can, and sometimes it's the right move. In our game,{' '}
                <Word>SHAKE</Word> is the secret word, but you don't know that.
                Guessing it gives you a 1 in 8 chance of winning straight away.
              </p>
              <p>
                If it's wrong, though, you may not learn much. If{' '}
                <Word>SHAKE</Word> comes back with every letter green except the
                K, the secret word must be <Word>SHADE</Word>,{' '}
                <Word>SHAME</Word>, <Word>SHAPE</Word> or <Word>SHAVE</Word>.
                They differ only in their fourth letter, and SHAKE's fourth
                letter is a K, which none of them has. So all SHAKE tells you is
                that the fourth letter isn't K, with no clue to what it is, and
                you still have <strong>4 words</strong> left. Finding the right
                one could take several more guesses and some luck.
              </p>
              <p>
                <Word>DUMPS</Word> isn't one of the possible words left, so it
                can't win this turn. But whatever colours it gets back, you're
                left with at most 2 words, and 6 times out of 8 with just one,
                so you'd win on your next guess. With these 8 words, that's the
                better bet.
              </p>
            </>
          }
          visual={
            <>
              <p className="label">
                If you guess <Word>SHAKE</Word> and you see…
              </p>
              {SHAKE_OUTCOMES.map(([pattern, text]) => (
                <p className="result" key={pattern}>
                  <Mini pattern={pattern} /> {text}
                </p>
              ))}
            </>
          }
        />

        <Section
          title="Where the words come from"
          copy={
            <>
              <p>
                The 2,315 words the secret word can be come from the original
                Wordle answer list.
              </p>
              <p>
                You can type any of <strong>12,972 words</strong>: those answers
                plus 10,657 other real words that Wordle accepts but never
                picks. That's how a hint can be a word that could never be the
                secret word.
              </p>
            </>
          }
          visual={
            <div className="steps">
              <div>
                <span className="display big">12,972</span>
                <span className="caption">words you can type</span>
              </div>
            </div>
          }
        />

        <HintsTested onSettled={() => setReady(true)} />

        <p className="help-back">
          <a className="pill primary" href="/">
            Back to the game
          </a>
        </p>
      </main>
    </div>
  );
}
