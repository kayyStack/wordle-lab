import { matchingWords } from './remaining';
import { score, TileColour, WORD_LENGTH } from './score';

export const MAX_GUESSES = 6;

export type GameStatus = 'playing' | 'won' | 'lost';

export interface Guess {
  word: string;
  colours: TileColour[];
}

export type GameErrorCode =
  | 'not-five-letters'
  | 'not-in-word-list'
  | 'game-over';

/** A guess the game refused. It does not use up a turn. */
export class GameError extends Error {
  constructor(
    readonly code: GameErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'GameError';
  }
}

export class Game {
  private readonly history: Guess[] = [];
  private remaining: readonly string[];

  constructor(
    readonly secret: string,
    possibleAnswers: readonly string[],
    private readonly allowedGuesses: Set<string>,
  ) {
    if (!possibleAnswers.includes(secret)) {
      throw new Error(`secret "${secret}" is not one of the possible answers`);
    }
    if (!allowedGuesses.has(secret)) {
      throw new Error(`secret "${secret}" is not in the allowed guesses`);
    }
    this.remaining = [...possibleAnswers];
  }

  get guesses(): readonly Guess[] {
    return this.history;
  }

  /** Possible answers that still fit every guess so far */
  get remainingWords(): readonly string[] {
    return this.remaining;
  }

  get status(): GameStatus {
    const last = this.history[this.history.length - 1];
    if (last?.word === this.secret) return 'won';
    if (this.history.length >= MAX_GUESSES) return 'lost';
    return 'playing';
  }

  guess(input: string): Guess {
    if (this.status !== 'playing') {
      throw new GameError('game-over', 'This game is already over');
    }

    const word = input.trim().toUpperCase();
    if (word.length !== WORD_LENGTH) {
      throw new GameError(
        'not-five-letters',
        `Guesses must be ${WORD_LENGTH} letters`,
      );
    }
    if (!this.allowedGuesses.has(word)) {
      throw new GameError(
        'not-in-word-list',
        `${word} is not in the word list`,
      );
    }

    const result = { word, colours: score(word, this.secret) };
    this.history.push(result);
    this.remaining = matchingWords(this.remaining, result);
    return result;
  }
}
