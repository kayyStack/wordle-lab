import { score } from './score';

describe('score', () => {
  it('colours every letter green when the guess is the answer', () => {
    expect(score('CRANE', 'CRANE')).toEqual([
      'green', 'green', 'green', 'green', 'green',
    ]);
  });

  it('colours every letter gray when no letters are shared', () => {
    expect(score('SPLIT', 'CRANE')).toEqual([
      'gray', 'gray', 'gray', 'gray', 'gray',
    ]);
  });

  it('colours a letter yellow when it is in the answer at another position', () => {
    // T and C are both in CRATE, but swapped
    expect(score('TRACE', 'CRATE')).toEqual([
      'yellow', 'green', 'green', 'yellow', 'green',
    ]);
  });

  describe('repeated letters', () => {
    it('colours only as many copies as the answer has', () => {
      // ABIDE has one E: the first E in the guess takes it, the second is gray
      expect(score('SPEED', 'ABIDE')).toEqual([
        'gray', 'gray', 'yellow', 'gray', 'yellow',
      ]);
    });

    it('lets a green claim its letter before any yellow does', () => {
      // CRANE's only E is matched by the final E, so the earlier Es are gray.
      // A single left-to-right pass would wrongly colour the first E yellow.
      expect(score('EERIE', 'CRANE')).toEqual([
        'gray', 'gray', 'yellow', 'gray', 'green',
      ]);
    });

    it('colours two copies when the answer has two', () => {
      // SPEED has two Es: the first two Es in the guess are yellow, the third gray
      expect(score('EERIE', 'SPEED')).toEqual([
        'yellow', 'yellow', 'gray', 'gray', 'gray',
      ]);
    });

    it('handles repeats in both words at once', () => {
      // HELLO has two Ls and one E; the E is green, so the second E is gray
      expect(score('LEVEL', 'HELLO')).toEqual([
        'yellow', 'green', 'gray', 'gray', 'yellow',
      ]);
    });
  });

  describe('invalid input', () => {
    it('rejects a word that is not five letters', () => {
      expect(() => score('CRAN', 'CRANE')).toThrow('guess must be 5 letters');
    });

    it('rejects lowercase letters instead of scoring them wrongly', () => {
      expect(() => score('CRANE', 'crane')).toThrow(
        'answer must be uppercase letters A-Z',
      );
    });
  });
});
