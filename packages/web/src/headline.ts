import type { GameView } from './types.ts';

/** Something the page must tell the player before going back to the count. */
export type Notice =
  | { kind: 'refused'; word: string }
  | { kind: 'too-short' }
  | { kind: 'unreachable' }
  | { kind: 'hint-failed' };

export interface Headline {
  /** The refused word the title starts with; the page underlines it */
  refusedWord?: string;
  title: string;
  line: string;
}

const count = (n: number) => n.toLocaleString('en-US');

/** The count, as the base page says it. */
function countHeadline(game: GameView, previous: number | null): Headline {
  const n = game.remainingWords;
  if (game.guesses.length === 0) {
    return {
      title: `Any of ${count(n)} words could be the secret word.`,
      line: 'Each guess you make will rule some out.',
    };
  }
  if (n === 1) {
    return {
      title: 'Only one word could be the secret word.',
      line: 'Your guesses have ruled out all the others.',
    };
  }
  if (n === previous) {
    return {
      title: "That guess didn't rule any out.",
      line: `${count(n)} words could still be the secret word.`,
    };
  }
  return {
    title: `Only ${count(n)} words could still be the secret word.`,
    line: 'Your guesses have ruled out all the others.',
  };
}

/**
 * What the left column says. `previous` is the count before the last guess,
 * so the page can tell when a guess ruled nothing out.
 */
export function headlineFor(
  game: GameView | null,
  previous: number | null,
  notice: Notice | null,
): Headline | null {
  if (notice?.kind === 'unreachable') {
    return {
      title: "We can't reach the game right now.",
      line: 'Try again in a moment.',
    };
  }
  if (!game) return null;
  if (notice?.kind === 'hint-failed') {
    return {
      title: "We couldn't get a hint just now.",
      line: 'Try again in a moment, or keep playing without one.',
    };
  }

  if (game.status === 'won') {
    return {
      title: `You got it in ${game.guesses.length}: ${game.secret}.`,
      line: "Start a new game whenever you're ready.",
    };
  }
  if (game.status === 'lost') {
    const last = game.guesses[game.guesses.length - 1].word;
    return {
      title: `So close. It was ${game.secret}.`,
      line:
        game.remainingWords === 1
          ? `After ${last}, it was the only word left, but you were out of guesses.`
          : `It was one of ${count(game.remainingWords)} words that could still have been the secret word.`,
    };
  }

  const base = countHeadline(game, previous);
  if (notice?.kind === 'refused') {
    return {
      refusedWord: notice.word,
      title: `${notice.word} isn't a word we know.`,
      line: base.title,
    };
  }
  if (notice?.kind === 'too-short') {
    return { title: 'Five letters, please.', line: base.title };
  }
  return base;
}
