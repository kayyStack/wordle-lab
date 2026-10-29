import { describe, expect, it } from 'vitest';
import { lastRunText, resultText, seconds } from './simulationText.ts';

// The saved run: 2,315 games, WAVER the only one that took 6
const SUMMARY = {
  games: 2315,
  average: 3.464,
  byGuesses: { 2: 44, 3: 1217, 4: 990, 5: 63, 6: 1 },
  hardest: {
    secret: 'WAVER',
    guesses: ['SOARE', 'TALAR', 'PIGMY', 'ARROW', 'WAFER', 'WAVER'],
  },
};

describe('resultText', () => {
  it('describes the saved run', () => {
    expect(resultText(SUMMARY)).toBe(
      'It won every game. Most took 3 or 4 guesses, and only one, WAVER, needed all 6.',
    );
  });

  it('counts games that took more than six guesses as lost', () => {
    const summary = {
      ...SUMMARY,
      byGuesses: { 3: 2000, 4: 300, 7: 15 },
      hardest: { secret: 'JAZZY', guesses: Array(7).fill('XXXXX') },
    };
    expect(resultText(summary)).toBe(
      'It won 2,300 of the 2,315 games. Most took 3 or 4 guesses, and the hardest, like JAZZY, needed 7.',
    );
  });
});

describe('lastRunText', () => {
  it('gives the date and how long the run took', () => {
    expect(
      lastRunText({
        ranAt: '2026-10-29T12:39:24.217Z',
        durationMs: 14948,
        summary: SUMMARY,
      }),
    ).toBe('Last played 29 October 2026, in 15 seconds.');
  });

  it('never says 0 seconds', () => {
    expect(seconds(300)).toBe('1 second');
  });
});
