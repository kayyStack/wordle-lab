import { loadWords } from '../engine/words';
import { simulate, summarise } from './simulate';

describe('simulate', () => {
  describe('the FIGHT / LIGHT example', () => {
    const remaining = ['FIGHT', 'LIGHT', 'MIGHT', 'NIGHT', 'RIGHT', 'SIGHT'];
    const allowed = [...remaining, 'FIRMS', 'FLAME'];
    // FIRMS opens: it singles out FIGHT, MIGHT, RIGHT and SIGHT and leaves
    // LIGHT and NIGHT together
    const games = simulate(remaining, allowed, ['FIRMS']);
    const played = Object.fromEntries(games.map((g) => [g.secret, g.guesses]));

    it('wins next turn when the opener leaves one word', () => {
      expect(played.FIGHT).toEqual(['FIRMS', 'FIGHT']);
      expect(played.SIGHT).toEqual(['FIRMS', 'SIGHT']);
    });

    it('guesses one of two words left, so the other takes a turn more', () => {
      // LIGHT, NIGHT and FLAME all tell the two apart; LIGHT could be the
      // answer and comes first alphabetically
      expect(played.LIGHT).toEqual(['FIRMS', 'LIGHT']);
      expect(played.NIGHT).toEqual(['FIRMS', 'LIGHT', 'NIGHT']);
    });

    it('summarises the guesses', () => {
      expect(summarise(games)).toEqual({
        games: 6,
        average: 13 / 6,
        byGuesses: { 2: 5, 3: 1 },
      });
    });
  });

  it('plays only the secrets it is given, reporting progress', () => {
    const { possibleAnswers, allowedGuesses, firstHintWords } = loadWords();
    const progress: number[] = [];
    const games = simulate(
      possibleAnswers,
      allowedGuesses,
      firstHintWords,
      ['MOTOR', 'SHAKE'],
      (done) => progress.push(done),
    );
    expect(games.map((g) => g.secret)).toEqual(['MOTOR', 'SHAKE']);
    for (const { secret, guesses } of games) {
      expect(guesses[0]).toBe('SOARE');
      expect(guesses.at(-1)).toBe(secret);
    }
    expect(progress).toEqual([1, 2]);
  }, 30_000);
});
