import { Game, MAX_GUESSES } from './game';
import { matchingWords } from './remaining';
import { score, TileColour } from './score';
import { loadWords } from './words';

const { possibleAnswers, allowedGuesses } = loadWords();

describe('matchingWords', () => {
  it('keeps only the words that would give the guess its colours', () => {
    // CRANE against the secret SHAKE: only the A and the final E are green
    const colours: TileColour[] = ['gray', 'gray', 'green', 'gray', 'green'];
    const words = ['ABBEY', 'SNAKE', 'SHADE', 'SHAKE'];
    // ABBEY's A is in the wrong place; SNAKE has an N, which was gray
    expect(matchingWords(words, { word: 'CRANE', colours })).toEqual([
      'SHADE',
      'SHAKE',
    ]);
  });
});

// A game of the New York Times Wordle on 29 October 2026, with the colours NYT
// showed: G green, Y yellow, . gray
const NYT_SECRET = 'MOTOR';
const NYT_ROWS = [
  ['SOARE', '.G.Y.'],
  ['CLIMB', '...Y.'],
  ['GRUNT', '.Y..Y'],
  ['METRO', 'G.GYY'],
  ['MOTOR', 'GGGGG'],
];
const COLOUR: Record<string, TileColour> = {
  G: 'green',
  Y: 'yellow',
  '.': 'gray',
};

describe('a real New York Times game', () => {
  it('gets the same colours from the scorer', () => {
    for (const [word, pattern] of NYT_ROWS) {
      expect(score(word, NYT_SECRET)).toEqual(
        [...pattern].map((p) => COLOUR[p]),
      );
    }
  });

  it('keeps the secret among the remaining words after each guess', () => {
    let words = possibleAnswers;
    for (const [word, pattern] of NYT_ROWS) {
      const colours = [...pattern].map((p) => COLOUR[p]);
      words = matchingWords(words, { word, colours });
      expect(words).toContain(NYT_SECRET);
    }
  });
});

describe('Game.remainingWords', () => {
  it('starts as every possible answer', () => {
    const game = new Game('SHAKE', possibleAnswers, allowedGuesses);
    expect(game.remainingWords).toHaveLength(2315);
  });

  it('narrows after each guess', () => {
    const game = new Game('SHAKE', possibleAnswers, allowedGuesses);
    game.guess('CRANE');
    expect(game.remainingWords).toHaveLength(44);
    game.guess('BLAST');
    expect(game.remainingWords).toHaveLength(8);
    expect(game.remainingWords).toContain('SHADE');
    expect(game.remainingWords).not.toContain('SNAKE');
  });

  it('is just the secret once the game is won', () => {
    const game = new Game('SHAKE', possibleAnswers, allowedGuesses);
    game.guess('SHAKE');
    expect(game.remainingWords).toEqual(['SHAKE']);
  });

  // Plays random games on the real word lists. The random numbers come from a
  // fixed seed, so every run plays the same games and a failure can be replayed.
  it('always keeps the secret and matches a full re-filter, over 200 random games', () => {
    const random = seededRandom(2026);
    const guessList = [...allowedGuesses];
    const pick = <T>(list: readonly T[]) =>
      list[Math.floor(random() * list.length)];

    for (let n = 0; n < 200; n++) {
      const game = new Game(
        pick(possibleAnswers),
        possibleAnswers,
        allowedGuesses,
      );

      while (game.status === 'playing') {
        game.guess(pick(guessList));

        expect(game.remainingWords).toContain(game.secret);
        // Independent check: filter every possible answer by every guess so far
        const refiltered = possibleAnswers.filter((word) =>
          game.guesses.every(
            (g) => score(g.word, word).join() === g.colours.join(),
          ),
        );
        expect(game.remainingWords).toEqual(refiltered);
      }
      expect(game.guesses.length).toBeLessThanOrEqual(MAX_GUESSES);
    }
  });
});

/** Small seeded random number generator (mulberry32), returning 0 to 1. */
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
