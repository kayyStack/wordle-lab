import { loadWords } from '../engine/words';
import { Suggestion, suggest } from './suggest';

describe('the best first guesses', () => {
  const { possibleAnswers, allowedGuesses, firstHintWords } = loadWords();
  let computed: Suggestion[];

  // The full search of every allowed guess takes about 5 seconds, so both
  // tests share one run
  beforeAll(() => {
    computed = suggest(possibleAnswers, allowedGuesses);
  }, 30_000);

  // data/first-hint.txt holds the top suggestions before any guess, so games do
  // not repeat this search. This fails if the file no longer matches (for
  // example after a word list or ranking change). To fix it, copy the computed
  // words into data/first-hint.txt.
  it('match data/first-hint.txt', () => {
    expect(firstHintWords).toEqual(computed.map((s) => s.word));
  });

  // Published results on the same 2,315 answers: SOARE best at 5.89 bits
  // (Grant Sanderson, reported in HKUST Science Focus,
  // https://sciencefocus.hkust.edu.hk/node/202) and ROATE a close second
  // (Zébulon Goriely, reported by Cambridge's Department of Computer Science
  // and Technology, https://www.cst.cam.ac.uk/node/4163231)
  it('agree with published entropy results', () => {
    const [first, second] = computed;
    expect(first.word).toBe('SOARE');
    expect(first.entropy).toBeCloseTo(5.89, 2);
    expect(second.word).toBe('ROATE');
  });
});
