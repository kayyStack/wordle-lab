import { describe, expect, it } from 'vitest';
import { formatBits, hintReason, maxBits } from './hintText.ts';
import type { Suggestion } from '../api/types.ts';

function suggestion(worstCase: number, couldBeAnswer: boolean): Suggestion {
  return {
    word: 'DUMPS',
    entropy: 2.75,
    groups: 7,
    worstCase,
    couldBeAnswer,
    reason: '',
  };
}

describe('hint wording', () => {
  it('gives the most possible bits for the words left', () => {
    expect(formatBits(maxBits(8))).toBe('3');
    expect(formatBits(maxBits(2315))).toBe('11.18');
  });

  it('shows entropy with up to two decimals', () => {
    expect(formatBits(2.75)).toBe('2.75');
    expect(formatBits(5.885960110718398)).toBe('5.89');
  });

  it('explains a guess that cannot be the secret word', () => {
    expect(hintReason(suggestion(2, false), 8)).toBe(
      "It can't be the secret word, but it will rule out at least 6 of the 8 remaining possible secret words.",
    );
  });

  it('explains a guess that could be the secret word', () => {
    expect(hintReason(suggestion(1, true), 3)).toBe(
      "It could be the secret word. If it isn't, it will rule out at least 2 of the 3 remaining possible secret words.",
    );
  });

  it('writes large counts with commas', () => {
    expect(hintReason(suggestion(183, false), 2315)).toBe(
      "It can't be the secret word, but it will rule out at least 2,132 of the 2,315 remaining possible secret words.",
    );
  });

  it('says so when only one word is left', () => {
    expect(hintReason(suggestion(1, true), 1)).toBe(
      "It's the only word left, so it must be the secret word.",
    );
  });
});
