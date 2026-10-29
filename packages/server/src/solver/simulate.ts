import { matchingWords } from '../engine/remaining';
import { score } from '../engine/score';
import { suggest } from './suggest';

export interface SimulatedGame {
  secret: string;
  /** The solver's guesses, ending with the secret */
  guesses: string[];
}

export interface SimulationSummary {
  games: number;
  /** Average number of guesses per game */
  average: number;
  /** How many games took each number of guesses, e.g. { 3: 1200 } */
  byGuesses: Record<number, number>;
}

/**
 * Plays one game for each secret, always guessing the solver's top
 * suggestion, and records the guesses. Games are not stopped at six guesses,
 * so the result shows how many each one needed.
 */
export function simulate(
  possibleAnswers: readonly string[],
  allowedGuesses: Iterable<string>,
  // The stored first hint, so the first guess needs no full search
  firstHintWords: readonly string[],
  secrets: readonly string[] = possibleAnswers,
  onProgress?: (done: number, total: number) => void,
): SimulatedGame[] {
  const guessList = [...allowedGuesses];
  // Games whose boards look the same so far get the same next guess, so each
  // board is searched only once
  const bestGuess = new Map<string, string>();

  return secrets.map((secret, i) => {
    let remaining: readonly string[] = possibleAnswers;
    let board = '';
    const guesses: string[] = [];

    // Ends because a guess with more than one word left always rules some
    // out, and with one word left the top suggestion is that word
    while (guesses.at(-1) !== secret) {
      let guess = bestGuess.get(board);
      if (!guess) {
        const candidates = guesses.length === 0 ? firstHintWords : guessList;
        guess = suggest(remaining, candidates, 1)[0].word;
        bestGuess.set(board, guess);
      }
      const colours = score(guess, secret);
      remaining = matchingWords(remaining, { word: guess, colours });
      board += `${guess} ${colours.join()};`;
      guesses.push(guess);
    }

    onProgress?.(i + 1, secrets.length);
    return { secret, guesses };
  });
}

export function summarise(games: readonly SimulatedGame[]): SimulationSummary {
  const byGuesses: Record<number, number> = {};
  let total = 0;
  for (const { guesses } of games) {
    byGuesses[guesses.length] = (byGuesses[guesses.length] ?? 0) + 1;
    total += guesses.length;
  }
  return { games: games.length, average: total / games.length, byGuesses };
}
