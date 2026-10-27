import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseFilters,
} from '@nestjs/common';
import { Game, MAX_GUESSES } from '../engine/game';
import { apiError } from './api-error';
import { GameErrorFilter } from './game-error.filter';
import { GamesService } from './games.service';

@Controller('games')
@UseFilters(GameErrorFilter)
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Post()
  create() {
    const { id, game } = this.games.create();
    return toView(id, game);
  }

  @Post(':id/guesses')
  @HttpCode(200)
  guess(
    @Param('id') id: string,
    // Undefined when the request has no JSON body
    @Body() body: { word?: unknown } | undefined,
  ) {
    if (typeof body?.word !== 'string') {
      throw apiError(
        400,
        'invalid-body',
        'Send a JSON body like {"word": "crane"}',
      );
    }
    const { guess, game } = this.games.guess(id, body.word);
    return { guess, game: toView(id, game) };
  }

  @Get(':id/hint')
  hint(@Param('id') id: string) {
    const game = this.games.find(id);
    return {
      remainingWords: game.remainingWords.length,
      suggestions: this.games.hint(game),
    };
  }
}

/** What the API shows of a game. The secret stays hidden until the game ends. */
function toView(id: string, game: Game) {
  return {
    id,
    status: game.status,
    maxGuesses: MAX_GUESSES,
    guesses: game.guesses,
    remainingWords: game.remainingWords.length,
    secret: game.status === 'playing' ? null : game.secret,
  };
}
