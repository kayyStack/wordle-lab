import { suggest } from './suggest';

describe('suggest', () => {
  describe('the FIGHT / LIGHT example', () => {
    const remaining = ['FIGHT', 'LIGHT', 'MIGHT', 'NIGHT', 'RIGHT', 'SIGHT'];
    const result = suggest(remaining, ['LIGHT', 'FLAME', 'FIRMS']);

    it('ranks guesses by entropy, best first', () => {
      expect(result.map((s) => s.word)).toEqual(['FIRMS', 'FLAME', 'LIGHT']);
      expect(result[0].entropy).toBeCloseTo(2.252, 3);
      expect(result[1].entropy).toBeCloseTo(1.792, 3);
      expect(result[2].entropy).toBeCloseTo(0.65, 3);
    });

    it('reports groups and the worst case for each guess', () => {
      expect(result.map((s) => [s.groups, s.worstCase])).toEqual([
        [5, 2],
        [4, 3],
        [2, 5],
      ]);
    });

    it('explains each suggestion', () => {
      expect(result[0].reason).toBe(
        'Splits the 6 remaining words into 5 groups; at worst 2 would be left.',
      );
      expect(result[2].reason).toBe(
        'Splits the 6 remaining words into 2 groups; at worst 5 would be left. Could be the answer.',
      );
    });
  });

  describe('ties', () => {
    // With CRANE and CRATE left, all three guesses tell them apart: 1 bit each
    const result = suggest(['CRANE', 'CRATE'], ['SNORT', 'CRATE', 'CRANE']);

    it('scores equal splits equally', () => {
      expect(result.map((s) => s.entropy)).toEqual([1, 1, 1]);
    });

    it('prefers words that could be the answer, then alphabetical order', () => {
      expect(result.map((s) => s.word)).toEqual(['CRANE', 'CRATE', 'SNORT']);
    });
  });

  it('suggests the last remaining word', () => {
    const [best] = suggest(['SHAKE'], ['CRANE', 'SHAKE', 'BLAST']);
    expect(best.word).toBe('SHAKE');
    expect(best.entropy).toBe(0);
  });

  it('returns at most `count` suggestions', () => {
    const remaining = ['FIGHT', 'LIGHT', 'MIGHT', 'NIGHT', 'RIGHT', 'SIGHT'];
    expect(suggest(remaining, remaining, 2)).toHaveLength(2);
  });
});
