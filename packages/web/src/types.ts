// The API's response shapes. Kept here rather than imported, so the web
// package stays independent of the server code.

export type TileColour = 'green' | 'yellow' | 'gray';

export interface Guess {
  word: string;
  colours: TileColour[];
}

export interface GameView {
  id: string;
  status: 'playing' | 'won' | 'lost';
  maxGuesses: number;
  guesses: Guess[];
  /** How many words could still be the secret word */
  remainingWords: number;
  /** Only set once the game is over */
  secret: string | null;
}

export interface GuessResponse {
  guess: Guess;
  game: GameView;
}

export interface Suggestion {
  word: string;
  /** In bits */
  entropy: number;
  groups: number;
  /** The most words that could be left after this guess */
  worstCase: number;
  couldBeAnswer: boolean;
  reason: string;
}

export interface HintResponse {
  remainingWords: number;
  suggestions: Suggestion[];
}

export interface SimulatedGame {
  secret: string;
  guesses: string[];
}

export interface SimulationResults {
  ranAt: string;
  durationMs: number;
  summary: {
    games: number;
    average: number;
    /** How many games took each number of guesses, e.g. { 3: 1217 } */
    byGuesses: Record<string, number>;
    hardest: SimulatedGame;
  };
}

export interface SimulationRun {
  startedAt: string;
  done: number;
  total: number;
}

export interface SimulationStatus {
  /** null until the first run has been saved */
  results: SimulationResults | null;
  /** The run going on now, if any */
  run: SimulationRun | null;
  /** Set when the last run failed */
  failure: { at: string; message: string } | null;
}

export interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string;
}
