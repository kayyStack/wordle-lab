import { score, TileColour, WORD_LENGTH } from './score';

export const MAX_GUESSES = 6;

export type GameStatus = 'playing' | 'won' | 'lost';

export interface Guess {
  word: string;
  colours: TileColour[];
}

export type GameErrorCode = 'not-five-letters' | 'not-in-word-list' | 'game-over';

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

  constructor(
    readonly answer: string,
    private readonly allowed: Set<string>,
  ) {
    if (!allowed.has(answer)) {
      throw new Error(`answer "${answer}" is not in the allowed words`);
    }
  }

  get guesses(): readonly Guess[] {
    return this.history;
  }

  get status(): GameStatus {
    const last = this.history[this.history.length - 1];
    if (last?.word === this.answer) return 'won';
    if (this.history.length >= MAX_GUESSES) return 'lost';
    return 'playing';
  }

  guess(input: string): Guess {
    if (this.status !== 'playing') {
      throw new GameError('game-over', 'This game is already over');
    }

    const word = input.trim().toUpperCase();
    if (word.length !== WORD_LENGTH) {
      throw new GameError('not-five-letters', `Guesses must be ${WORD_LENGTH} letters`);
    }
    if (!this.allowed.has(word)) {
      throw new GameError('not-in-word-list', `${word} is not in the word list`);
    }

    const result = { word, colours: score(word, this.answer) };
    this.history.push(result);
    return result;
  }
}
