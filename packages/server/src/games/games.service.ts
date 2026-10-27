import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LRUCache } from 'lru-cache';
import { Game, GameError, Guess } from '../engine/game';
import { loadWords } from '../engine/words';
import { suggest, Suggestion } from '../solver/suggest';
import { apiError } from './api-error';

const MAX_GAMES = 1000;
const IDLE_TTL_MS = 60 * 60_000;
const FINISHED_TTL_MS = 2 * 60_000;

@Injectable()
export class GamesService {
  private readonly words = loadWords();
  // Games expire after an hour without a guess or hint, two minutes after
  // they end, or when more than MAX_GAMES exist (least recently used goes).
  private readonly games = new LRUCache<string, Game>({
    max: MAX_GAMES,
    ttl: IDLE_TTL_MS,
    updateAgeOnGet: true,
    // Read the time through Date.now() on every call, so tests can fake it
    perf: Date,
  });

  create(secret = this.randomSecret()): { id: string; game: Game } {
    const game = new Game(
      secret,
      this.words.possibleAnswers,
      this.words.allowedGuesses,
    );
    const id = randomUUID();
    this.games.set(id, game);
    return { id, game };
  }

  find(id: string): Game {
    // peek does not count as use. Only a game still being played has its idle
    // hour restarted; a finished game expires two minutes after it ended.
    const game = this.games.peek(id);
    if (game?.status === 'playing') this.games.get(id);
    if (!game) {
      throw apiError(
        404,
        'game-not-found',
        'No game with this id. It may have finished or expired.',
      );
    }
    return game;
  }

  guess(id: string, word: string): { guess: Guess; game: Game } {
    const game = this.find(id);
    const guess = game.guess(word);
    if (game.status !== 'playing') {
      this.games.set(id, game, { ttl: FINISHED_TTL_MS });
    }
    return { guess, game };
  }

  hint(game: Game): Suggestion[] {
    if (game.status !== 'playing') {
      throw new GameError('game-over', 'This game is already over');
    }
    return suggest(game.remainingWords, this.words.allowedGuesses);
  }

  private randomSecret(): string {
    const answers = this.words.possibleAnswers;
    return answers[Math.floor(Math.random() * answers.length)];
  }
}
