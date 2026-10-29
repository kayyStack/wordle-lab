import type { Guess } from './game';
import { score, TileColour } from './score';

/** The words that, if they were the answer, would give `guess` the colours it got. */
export function matchingWords(
  words: readonly string[],
  guess: Guess,
): string[] {
  return words.filter((word) =>
    sameColours(score(guess.word, word), guess.colours),
  );
}

function sameColours(a: TileColour[], b: TileColour[]): boolean {
  return a.every((colour, i) => colour === b[i]);
}
