import type { Guess, TileColour } from './types.ts';

export const WORD_LENGTH = 5;

const RANK: Record<TileColour, number> = { gray: 0, yellow: 1, green: 2 };

/** The letters typed so far after one key press. Keys that don't apply leave it unchanged. */
export function nextTyped(current: string, key: string): string {
  if (key === 'Backspace') return current.slice(0, -1);
  if (/^[a-z]$/i.test(key) && current.length < WORD_LENGTH) {
    return current + key.toUpperCase();
  }
  return current;
}

/** The best colour each letter has shown in any guess: green over yellow over gray. */
export function keyColours(guesses: Guess[]): Record<string, TileColour> {
  const colours: Record<string, TileColour> = {};
  for (const { word, colours: tiles } of guesses) {
    tiles.forEach((colour, i) => {
      const letter = word[i];
      const seen = colours[letter];
      if (seen === undefined || RANK[colour] > RANK[seen]) {
        colours[letter] = colour;
      }
    });
  }
  return colours;
}
