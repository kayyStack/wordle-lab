import { loadWords } from '../engine/words';
import { suggest } from './suggest';

// data/first-hint.txt holds the top suggestions before any guess, so games do
// not repeat this ~5 second search. This test runs the full search and fails if
// the file no longer matches (for example after a word list or ranking change).
// To fix it, copy the computed words into data/first-hint.txt.
it('data/first-hint.txt matches a full search of every allowed guess', () => {
  const { possibleAnswers, allowedGuesses, firstHintWords } = loadWords();
  const computed = suggest(possibleAnswers, allowedGuesses).map((s) => s.word);
  expect(firstHintWords).toEqual(computed);
}, 30_000);
