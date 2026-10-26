import { score } from '../engine/score';

export interface Suggestion {
  word: string;
  /** Expected information from this guess, in bits */
  entropy: number;
  /** How many different colour patterns the guess could show */
  groups: number;
  /** The most remaining words that could be left after this guess */
  worstCase: number;
  /** Whether the guess is itself one of the remaining words */
  couldBeAnswer: boolean;
  reason: string;
}

/** A suggestion before its reason is written */
type RankedGuess = Omit<Suggestion, 'reason'>;

/**
 * Ranks every allowed guess by the entropy of the colour patterns it would
 * show across the remaining words, and returns the best `count`.
 */
export function suggest(
  remainingWords: readonly string[],
  allowedGuesses: Iterable<string>,
  count = 5,
): Suggestion[] {
  const remaining = new Set(remainingWords);
  const ranked: RankedGuess[] = [];

  for (const guess of allowedGuesses) {
    const sizes = groupSizes(guess, remainingWords);
    ranked.push({
      word: guess,
      entropy: entropy(sizes, remainingWords.length),
      groups: sizes.length,
      worstCase: Math.max(...sizes),
      couldBeAnswer: remaining.has(guess),
    });
  }

  ranked.sort(byBestFirst);
  return ranked.slice(0, count).map((guess) => ({
    ...guess,
    reason: reason(guess, remainingWords.length),
  }));
}

/** Sizes of the groups the remaining words fall into, by the colours `guess` would show. */
function groupSizes(
  guess: string,
  remainingWords: readonly string[],
): number[] {
  const sizes = new Map<string, number>();
  for (const word of remainingWords) {
    const pattern = score(guess, word).join();
    sizes.set(pattern, (sizes.get(pattern) ?? 0) + 1);
  }
  return [...sizes.values()];
}

function entropy(sizes: number[], total: number): number {
  let bits = 0;
  for (const size of sizes) {
    const p = size / total;
    bits -= p * Math.log2(p);
  }
  return bits;
}

// Higher entropy first. Entropies are rounded before comparing so two guesses
// that split the words identically tie, despite floating-point noise. Ties go
// to a word that could be the answer, then alphabetical order.
function byBestFirst(a: RankedGuess, b: RankedGuess): number {
  const diff = round(b.entropy) - round(a.entropy);
  if (diff !== 0) return diff;
  if (a.couldBeAnswer !== b.couldBeAnswer) return a.couldBeAnswer ? -1 : 1;
  return a.word.localeCompare(b.word);
}

function round(bits: number): number {
  return Math.round(bits * 1e9) / 1e9;
}

function reason(guess: RankedGuess, total: number): string {
  const words = total === 1 ? 'word' : 'words';
  let text = `Splits the ${total} remaining ${words} into ${guess.groups} groups; at worst ${guess.worstCase} would be left.`;
  if (guess.couldBeAnswer) text += ' Could be the answer.';
  return text;
}
