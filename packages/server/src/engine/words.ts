import { readFileSync } from 'fs';
import * as path from 'path';
import { WORD_LENGTH } from './score';

const DATA_DIR = path.join(__dirname, '../../data');

export interface WordLists {
  /** Words that can be the secret */
  possibleAnswers: string[];
  /** Words accepted as a guess: the possible answers plus the extra guesses */
  allowedGuesses: Set<string>;
}

export function loadWords(dataDir: string = DATA_DIR): WordLists {
  const possibleAnswers = loadWordList(path.join(dataDir, 'answers.txt'));
  const extraGuesses = loadWordList(path.join(dataDir, 'extra-guesses.txt'));
  return {
    possibleAnswers,
    allowedGuesses: new Set([...possibleAnswers, ...extraGuesses]),
  };
}

/** Reads one word per line, uppercased. Blank lines are skipped. */
export function loadWordList(file: string): string[] {
  const lines = readFileSync(file, 'utf8').split('\n');
  const words: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const word = lines[i].trim().toUpperCase();
    if (word === '') continue;

    const where = `${file} line ${i + 1}`;
    const allLetters = [...word].every((c) => c >= 'A' && c <= 'Z');
    if (word.length !== WORD_LENGTH || !allLetters) {
      throw new Error(`${where}: "${lines[i].trim()}" is not a ${WORD_LENGTH}-letter word`);
    }
    if (seen.has(word)) {
      throw new Error(`${where}: "${word}" is listed twice`);
    }

    seen.add(word);
    words.push(word);
  }

  return words;
}
