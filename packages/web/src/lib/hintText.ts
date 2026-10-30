import type { Suggestion } from '../api/types.ts';
import { count } from './format.ts';

/** The most entropy any guess can have with this many words left: log2 of the count. */
export function maxBits(remainingWords: number): number {
  return Math.log2(remainingWords);
}

/** Bits as the hint shows them: two decimals, without trailing zeros ("3", "2.75"). */
export function formatBits(bits: number): string {
  return String(Number(bits.toFixed(2)));
}

/** The sentence under "Try DUMPS.": what the guess does for the player. */
export function hintReason(
  suggestion: Suggestion,
  remainingWords: number,
): string {
  if (remainingWords === 1) {
    return "It's the only word left, so it must be the secret word.";
  }
  const ruledOut = remainingWords - suggestion.worstCase;
  const rest = `it will rule out at least ${count(ruledOut)} of the ${count(remainingWords)} remaining possible secret words.`;
  return suggestion.couldBeAnswer
    ? `It could be the secret word. If it isn't, ${rest}`
    : `It can't be the secret word, but ${rest}`;
}
