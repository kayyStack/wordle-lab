import { describe, expect, it } from 'vitest';
import { headlineFor } from './headline.ts';
import type { GameView, Guess } from './types.ts';

const gray: Guess['colours'] = ['gray', 'gray', 'gray', 'gray', 'gray'];

function game(
  remainingWords: number,
  words: string[] = [],
  status: GameView['status'] = 'playing',
  secret: string | null = null,
): GameView {
  return {
    id: 'g1',
    status,
    maxGuesses: 6,
    guesses: words.map((word) => ({ word, colours: gray })),
    remainingWords,
    secret,
  };
}

describe('headlineFor', () => {
  it('starts with every possible word', () => {
    expect(headlineFor(game(2315), null, null)).toEqual({
      title: 'Any of 2,315 words could be the secret word.',
      line: 'Each guess you make will rule some out.',
    });
  });

  it('counts the words left after a guess', () => {
    expect(headlineFor(game(8, ['CRANE', 'BLAST']), 44, null)?.title).toBe(
      'Only 8 words could still be the secret word.',
    );
  });

  it('says when a guess ruled nothing out', () => {
    expect(headlineFor(game(8, ['CRANE', 'BLAST', 'BLOCK']), 8, null)).toEqual({
      title: "That guess didn't rule any out.",
      line: '8 words could still be the secret word.',
    });
  });

  it('says when one word is left', () => {
    expect(headlineFor(game(1, ['CRANE']), 44, null)?.title).toBe(
      'Only one word could be the secret word.',
    );
  });

  it('keeps the count in the line under a refused word', () => {
    const notice = { kind: 'refused' as const, word: 'SHAEK' };
    expect(headlineFor(game(8, ['CRANE', 'BLAST']), 44, notice)).toEqual({
      refusedWord: 'SHAEK',
      title: "SHAEK isn't a word we know.",
      line: 'Only 8 words could still be the secret word.',
    });
  });

  it('asks for five letters', () => {
    const headline = headlineFor(game(2315), null, { kind: 'too-short' });
    expect(headline?.title).toBe('Five letters, please.');
    expect(headline?.line).toBe('Any of 2,315 words could be the secret word.');
  });

  it('says when the game cannot be reached, even before one has started', () => {
    expect(headlineFor(null, null, { kind: 'unreachable' })?.title).toBe(
      "We can't reach the game right now.",
    );
  });

  it('says when a hint could not be fetched', () => {
    expect(headlineFor(game(8), 44, { kind: 'hint-failed' })).toEqual({
      title: "We couldn't get a hint just now.",
      line: 'Try again in a moment, or keep playing without one.',
    });
  });

  it('says when the server no longer has the game', () => {
    expect(headlineFor(game(8), 44, { kind: 'ended' })).toEqual({
      title: 'That game has ended.',
      line: 'Press New game to start another.',
    });
  });

  it('names the guess count and the word on a win', () => {
    const won = game(1, ['CRANE', 'BLAST', 'SHAKE'], 'won', 'SHAKE');
    expect(headlineFor(won, 8, null)?.title).toBe('You got it in 3: SHAKE.');
  });

  it('explains a loss with one word left', () => {
    const words = ['MATCH', 'BATCH', 'LATCH', 'PATCH', 'HATCH', 'CATCH'];
    expect(headlineFor(game(1, words, 'lost', 'WATCH'), 2, null)).toEqual({
      title: 'So close. It was WATCH.',
      line: 'After CATCH, it was the only word left, but you were out of guesses.',
    });
  });

  it('explains a loss with several words left', () => {
    const words = ['CRANE', 'BLAST', 'DUMPY', 'FIGHT', 'WOVEN', 'JOKER'];
    expect(headlineFor(game(3, words, 'lost', 'WATCH'), 5, null)?.line).toBe(
      'It was one of 3 words that could still have been the secret word.',
    );
  });
});
