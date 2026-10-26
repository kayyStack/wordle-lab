import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Game } from '../engine/game';
import { loadWords } from '../engine/words';
import { suggest, Suggestion } from '../solver/suggest';

@Injectable()
export class GamesService {
  private readonly words = loadWords();
  private readonly games = new Map<string, Game>();

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
    const game = this.games.get(id);
    if (!game) throw new NotFoundException();
    return game;
  }

  hint(game: Game): Suggestion[] {
    return suggest(game.remainingWords, this.words.allowedGuesses);
  }

  private randomSecret(): string {
    const answers = this.words.possibleAnswers;
    return answers[Math.floor(Math.random() * answers.length)];
  }
}
