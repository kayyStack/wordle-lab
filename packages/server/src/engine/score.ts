export type TileColour = 'green' | 'yellow' | 'gray';

export const WORD_LENGTH = 5;

const CODE_OF_A = 'A'.charCodeAt(0);

/** Transform the character code of a letter (65-90) to a (0-25) index range */
function letterIndex(word: string, position: number): number {
  return word.charCodeAt(position) - CODE_OF_A;
}

/**
 * Colours each letter of `guess` against `answer`. Greens are found first;
 * a letter is then yellow only while the answer still has an unmatched copy
 * of it. Both words must be five uppercase letters A-Z.
 */
export function score(guess: string, answer: string): TileColour[] {
  assertWord(guess, 'guess');
  assertWord(answer, 'answer');

  const colours: TileColour[] = ['gray', 'gray', 'gray', 'gray', 'gray'];
  // Occurence of each letter in the answer that are not green (Indexed on the 0-25 scale representing A to Z)
  const counts = new Array<number>(26).fill(0);

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) {
      colours[i] = 'green';
    } else {
      counts[letterIndex(answer, i)]++;
    }
  }

  /* Find letters in the guess that have occurence in the answer and paint them yellow */
  for (let i = 0; i < WORD_LENGTH; i++) {
    const index = letterIndex(guess, i);
    if (colours[i] !== 'green' && counts[index] > 0) {
      colours[i] = 'yellow';
      counts[index]--;
    }
  }

  return colours;
}

function assertWord(word: string, name: string): void {
  if (word.length !== WORD_LENGTH) {
    throw new Error(`${name} must be ${WORD_LENGTH} letters, got "${word}"`);
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    const index = letterIndex(word, i);
    if (index < 0 || index > 25) {
      throw new Error(`${name} must be uppercase letters A-Z, got "${word}"`);
    }
  }
}
