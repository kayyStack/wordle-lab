import { Game, GameError, MAX_GUESSES } from './game';

const possibleAnswers = ['CRANE', 'SLATE', 'TRACE', 'BRAVE'];
const allowedGuesses = new Set(possibleAnswers);

function errorCode(guess: () => unknown): string {
  try {
    guess();
  } catch (e) {
    return e instanceof GameError ? e.code : `not a GameError: ${e}`;
  }
  return 'no error thrown';
}

describe('Game', () => {
  it('starts with no guesses and is being played', () => {
    const game = new Game('CRANE', possibleAnswers, allowedGuesses);
    expect(game.guesses).toEqual([]);
    expect(game.status).toBe('playing');
  });

  it('records each guess with its colours', () => {
    const game = new Game('CRANE', possibleAnswers, allowedGuesses);
    game.guess('TRACE');
    expect(game.guesses).toEqual([
      { word: 'TRACE', colours: ['gray', 'green', 'green', 'yellow', 'green'] },
    ]);
    expect(game.status).toBe('playing');
  });

  it('is won when the answer is guessed', () => {
    const game = new Game('CRANE', possibleAnswers, allowedGuesses);
    game.guess('CRANE');
    expect(game.status).toBe('won');
  });

  it('can be won on the last guess', () => {
    const game = new Game('CRANE', possibleAnswers, allowedGuesses);
    for (let i = 0; i < MAX_GUESSES - 1; i++) game.guess('SLATE');
    game.guess('CRANE');
    expect(game.status).toBe('won');
  });

  it('is lost after six wrong guesses', () => {
    const game = new Game('CRANE', possibleAnswers, allowedGuesses);
    for (let i = 0; i < MAX_GUESSES; i++) game.guess('SLATE');
    expect(game.status).toBe('lost');
  });

  it('accepts lowercase and surrounding spaces', () => {
    const game = new Game('CRANE', possibleAnswers, allowedGuesses);
    game.guess('  crane ');
    expect(game.status).toBe('won');
  });

  it('counts a repeated guess as a turn, as Wordle does', () => {
    const game = new Game('CRANE', possibleAnswers, allowedGuesses);
    game.guess('SLATE');
    game.guess('SLATE');
    expect(game.guesses).toHaveLength(2);
  });

  describe('refused guesses', () => {
    it('refuses a guess that is not five letters', () => {
      const game = new Game('CRANE', possibleAnswers, allowedGuesses);
      expect(errorCode(() => game.guess('CRAN'))).toBe('not-five-letters');
    });

    it('refuses a word that is not in the word list', () => {
      const game = new Game('CRANE', possibleAnswers, allowedGuesses);
      expect(errorCode(() => game.guess('ZZZZZ'))).toBe('not-in-word-list');
    });

    it('refuses any guess once the game is won or lost', () => {
      const won = new Game('CRANE', possibleAnswers, allowedGuesses);
      won.guess('CRANE');
      expect(errorCode(() => won.guess('SLATE'))).toBe('game-over');

      const lost = new Game('CRANE', possibleAnswers, allowedGuesses);
      for (let i = 0; i < MAX_GUESSES; i++) lost.guess('SLATE');
      expect(errorCode(() => lost.guess('CRANE'))).toBe('game-over');
    });

    it('does not use up a turn', () => {
      const game = new Game('CRANE', possibleAnswers, allowedGuesses);
      errorCode(() => game.guess('CRAN'));
      errorCode(() => game.guess('ZZZZZ'));
      expect(game.guesses).toEqual([]);
    });
  });

  it('refuses to start with a secret that is not a possible answer', () => {
    expect(() => new Game('ZZZZZ', possibleAnswers, allowedGuesses)).toThrow(
      'not one of the possible answers',
    );
  });

  it('refuses to start with a secret that cannot be guessed', () => {
    expect(() => new Game('CRANE', possibleAnswers, new Set(['SLATE']))).toThrow(
      'not in the allowed guesses',
    );
  });
});
