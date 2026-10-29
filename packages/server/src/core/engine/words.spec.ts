import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { loadWordList, loadWords } from './words';

describe('loadWords', () => {
  const { possibleAnswers, allowedGuesses } = loadWords();

  it('loads the 2,315 original answers, uppercased', () => {
    expect(possibleAnswers).toHaveLength(2315);
    expect(possibleAnswers.slice(0, 3)).toEqual(['ABACK', 'ABASE', 'ABATE']);
  });

  it('allows 12,972 guesses: the answers plus 10,657 extra guesses', () => {
    expect(allowedGuesses.size).toBe(12972);
  });

  it('allows an extra guess that can never be the answer', () => {
    expect(allowedGuesses.has('AAHED')).toBe(true);
    expect(possibleAnswers).not.toContain('AAHED');
  });
});

describe('loadWordList', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'wordle-words-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function writeList(contents: string): string {
    const file = path.join(dir, 'list.txt');
    writeFileSync(file, contents);
    return file;
  }

  it('skips blank lines and handles Windows line endings', () => {
    expect(loadWordList(writeList('crane\r\n\r\nslate\r\n'))).toEqual([
      'CRANE',
      'SLATE',
    ]);
  });

  it('names the line of a word that is not five letters', () => {
    expect(() => loadWordList(writeList('crane\ncran\n'))).toThrow(
      'line 2: "cran" is not a 5-letter word',
    );
  });

  it('rejects a word listed twice, ignoring case', () => {
    expect(() => loadWordList(writeList('crane\nCRANE\n'))).toThrow(
      'line 2: "CRANE" is listed twice',
    );
  });
});
