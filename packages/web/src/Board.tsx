import type { Guess } from './types.ts';
import { WORD_LENGTH } from './typing.ts';

const COLOUR_NAMES = {
  green: 'right spot',
  yellow: 'wrong spot',
  gray: 'not in word',
};

interface BoardProps {
  guesses: Guess[];
  typed: string;
  rows: number;
}

export function Board({ guesses, typed, rows }: BoardProps) {
  return (
    <div className="board" aria-label="Board">
      {Array.from({ length: rows }, (_, row) => {
        const guess = guesses[row];
        const letters = guess?.word ?? (row === guesses.length ? typed : '');
        return (
          <div className="board-row" key={row}>
            {Array.from({ length: WORD_LENGTH }, (_, i) => {
              const letter = letters[i] ?? '';
              const colour = guess?.colours[i];
              const state = colour ?? (letter ? 'typed' : '');
              return (
                <span
                  className={`tile ${state}`}
                  key={i}
                  aria-label={
                    colour
                      ? `${letter}, ${COLOUR_NAMES[colour]}`
                      : letter || 'empty'
                  }
                >
                  {letter}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
