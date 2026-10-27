import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { GameError, GameErrorCode } from '../engine/game';
import { apiError } from './api-error';

const STATUS: Record<GameErrorCode, number> = {
  'not-five-letters': 400,
  'not-in-word-list': 400,
  'game-over': 409,
};

/** Turns a refused guess into an HTTP error response. */
@Catch(GameError)
export class GameErrorFilter extends BaseExceptionFilter {
  catch(error: GameError, host: ArgumentsHost) {
    super.catch(apiError(STATUS[error.code], error.code, error.message), host);
  }
}
