import { readFileSync } from 'fs';
import * as path from 'path';
import { loadWords } from '../engine/words';
import { SimulatedGame, simulate, summarise } from './simulate';

// data/simulation.json holds a full run of `node dist/simulate.js`, which
// takes about 15 seconds. These tests replay a spread of its games and fail
// if the file no longer matches the solver (for example after a word list or
// ranking change). To fix it, build and run the script again.
describe('data/simulation.json', () => {
  const file = path.join(__dirname, '../../../data/simulation.json');
  const saved = JSON.parse(readFileSync(file, 'utf8')) as {
    summary: ReturnType<typeof summarise>;
    games: SimulatedGame[];
  };
  const { possibleAnswers, allowedGuesses, firstHintWords } = loadWords();

  it('has one game for every possible answer', () => {
    expect(saved.games.map((g) => g.secret)).toEqual(possibleAnswers);
  });

  it('has a summary that matches its games', () => {
    expect(saved.summary).toEqual(summarise(saved.games));
  });

  it('matches the solver on every 100th answer', () => {
    const sample = saved.games.filter((_, i) => i % 100 === 0);
    const replayed = simulate(
      possibleAnswers,
      allowedGuesses,
      firstHintWords,
      sample.map((g) => g.secret),
    );
    expect(replayed).toEqual(sample);
  }, 60_000);
});
